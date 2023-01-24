import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Label, TextInput, Tooltip } from "flowbite-react";
import React, { createRef, useRef, useState } from "react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorStr, UserContext } from "..";
import ReCAPTCHA from "react-google-recaptcha";
import Layout from "../Layout";

const useFocus = () => {
  const htmlElRef = useRef(null);
  const setFocus = () => {
    htmlElRef.current && htmlElRef.current.focus();
  };

  return [htmlElRef, setFocus];
};

const Signup = () => {
  const [callsign, setCallsign] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const captchaRef = createRef();

  const { setUser } = useContext(UserContext);

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  // qrz lookup
  const [qrzLookups, setQrzLookups] = useState([]);

  const [inputRef, setInputFocus] = useFocus();

  async function fetchQrz() {
    if (
      name ||
      qrzLookups.includes(callsign.trim().toUpperCase()) ||
      callsign.length < 1 ||
      callsign.length > 10
    )
      return;

    setDisabled(true);
    setQrzLookups(arr => [...arr, callsign.trim().toUpperCase()]);

    try {
      const { data } = await axios.get("/api/qrz/" + callsign);
      console.log("QRZ data", data);
      if (!name) {
        setName(
          toTitleCase(
            (data?.qrz?.firstName || "") + " " + (data?.qrz?.lastName || "")
          )
        );
      }
    } catch (err) {
      console.log(
        "QRZ callsign fetch failed:",
        err?.response?.data?.err || err
      );
    } finally {
      setDisabled(false);
      setTimeout(setInputFocus, 100);
    }
  }

  async function signup(e) {
    e.preventDefault();

    if (!captchaRef.current.getValue()) {
      return setAlert("Verifica di non essere un robot");
    }

    setDisabled(true);
    try {
      await axios.post("/api/auth/signup", {
        callsign,
        name,
        password,
        email,
        token: captchaRef.current.getValue()
      });
      const { data } = await axios.post("/api/auth/login", {
        callsign,
        password
      });
      setUser(data);
      navigate("/");
    } catch (err) {
      console.log("signup error", err);
      setAlert(getErrorStr(err.response?.data?.err));
      setDisabled(false);
    }
  }

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  return (
    <Layout>
      <div className="mx-auto px-2 w-full md:w-2/3 mt-12 mb-24">
        <Typography variant="h1" className="mb-2">
          Registrazione
        </Typography>

        <Typography variant="small" className="mb-6 flex">
          <span className="mr-1">Hai già un account? </span>
          <Tooltip content="Naviga alla pagina di login">
            <Link to="/login" className="underline">
              Fai il login qui
            </Link>
          </Tooltip>
        </Typography>

        {alert && (
          <Alert
            className="mb-6"
            color="failure"
            onDismiss={() => setAlert(null)}
          >
            <span>{alert}</span>
          </Alert>
        )}

        <form action="#" method="post" onSubmit={signup}>
          <div className="mb-2 block">
            <Label
              htmlFor="callsign"
              value="Nominativo (senza prefissi o suffissi)"
            />
          </div>
          <TextInput
            type="text"
            name="callsign"
            id="callsign"
            label="Nominativo"
            autoComplete="callsign"
            minLength={1}
            maxLength={10}
            onBlur={fetchQrz}
            value={callsign}
            onChange={e => setCallsign(e.target.value.toUpperCase())}
            disabled={disabled}
            autoFocus
          />
          <div className="my-4" />
          <div className="mb-2 block">
            <Label htmlFor="name" value="Nome pubblico" />
          </div>
          <TextInput
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            label="Nome"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={disabled}
            ref={inputRef}
          />
          <div className="my-4" />
          <div className="mb-2 block">
            <Label htmlFor="email" value="Email" />
          </div>
          <TextInput
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={disabled}
          />
          <div className="my-4" />
          <div className="mb-2 block">
            <Label htmlFor="password" value="Password" />
          </div>
          <TextInput
            type="password"
            name="password"
            id="password"
            autoComplete="new-password"
            label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            helperText="Minimo 8 caratteri, almeno un numero e un carattere speciale"
            disabled={disabled}
          />
          <div className="my-4" />
          <ReCAPTCHA
            sitekey="6LfdByQkAAAAALGExGRPnH8i16IyKNaUXurnW1rm"
            ref={captchaRef}
          />
          <div className="my-4" />
          <Button type="submit">Registrati</Button>
        </form>
      </div>
    </Layout>
  );
};

export default Signup;

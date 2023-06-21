import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Label, TextInput, Tooltip } from "flowbite-react";
import React, { createRef, useEffect, useRef, useState } from "react";
import { useContext } from "react";
import {
  Link,
  createSearchParams,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { getErrorStr, UserContext } from "..";
import { useCookies } from "react-cookie";
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
  const [cookies, setCookie, removeCookie] = useCookies(["signupcache"]);

  const [callsign, setCallsign] = useState(cookies.callsign || "");
  const [name, setName] = useState(cookies.name || "");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(cookies.phoneNumber || "+39");
  const [email, setEmail] = useState(cookies.email || "");

  useEffect(() => {
    window.addEventListener("beforeunload", event => {
      const e = event || window.event;
      e.preventDefault();
      if (e) {
        e.returnValue = ""; // Legacy method for cross browser support
      }
      return ""; // Legacy method for cross browser support
    });
  }, []);

  useEffect(() => {
    console.log("set cookie", {
      callsign,
      name,
      phoneNumber,
      email
    });
    setCookie("callsign", callsign, { path: "/signup", maxAge: 60 * 5 });
    setCookie("name", name, { path: "/signup", maxAge: 60 * 5 });
    setCookie("phoneNumber", phoneNumber, { path: "/signup", maxAge: 60 * 5 });
    setCookie("email", email, { path: "/signup", maxAge: 60 * 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsign, name, phoneNumber, email]);

  const captchaRef = createRef();

  const { setUser } = useContext(UserContext);

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  // qrz lookup
  const [qrzLookups, setQrzLookups] = useState([]);

  const [inputRef, setInputFocus] = useFocus();

  const [searchParams] = useSearchParams();

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

    try {
      if (!captchaRef.current.getValue()) {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
        return setAlert("Verifica di non essere un robot");
      }
    } catch (err) {
      console.log("ReCAPTCHA error", err);
      return setAlert(
        "Errore nel caricamento del ReCAPTCHA, per favore ricarica la pagina"
      );
    }

    if (password !== repeatPassword) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return setAlert("Le password non corrispondono");
    }

    setDisabled(true);
    try {
      await axios.post("/api/auth/signup", {
        callsign,
        name,
        password,
        phoneNumber,
        email,
        token: captchaRef.current.getValue()
      });
      removeCookie("callsign", { path: "/signup" });
      removeCookie("name", { path: "/signup" });
      removeCookie("phoneNumber", { path: "/signup" });
      removeCookie("email", { path: "/signup" });
      const { data } = await axios.post("/api/auth/login", {
        callsign,
        password
      });
      setUser(data);
      navigate({
        pathname: searchParams.get("to") || "/",
        search: createSearchParams({
          toconfirm: true
        }).toString()
      });
    } catch (err) {
      console.log("signup error", err);
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
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
      <div className="w-full h-full dark:bg-gray-900 dark:text-white">
        <div className="mx-auto px-8 w-full md:w-2/3 pt-12 pb-20">
          <Typography variant="h1" className="mb-2">
            Registrazione
          </Typography>

          <Typography variant="small" className="mb-6 flex">
            <span className="mr-1">Hai già un account? </span>
            <Tooltip content="Naviga alla pagina di login">
              <Link
                to="/login"
                className="underline decoration-dotted hover:text-black transition-colors"
              >
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
              {/* DEBUG in traduzione estera, specifica di inserire il prefisso */}
              <Label
                htmlFor="phoneNumber"
                value="Numero di telefono (con prefisso nazionale)"
              />
            </div>
            <TextInput
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              autoComplete="tel"
              label="Numero di telefono"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              helperText="In caso di candidatura ad un Radio Flash Mob, verrai ricontattato qui"
              disabled={disabled}
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
              helperText="Minimo 8 caratteri, almeno un numero, una maiuscola e un carattere speciale"
              disabled={disabled}
              maxLength={100}
            />
            <div className="my-4" />
            <div className="mb-2 block">
              <Label htmlFor="password" value="Ripeti password" />
            </div>
            <TextInput
              type="password"
              name="password"
              id="password"
              autoComplete="new-password"
              label="Password"
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
              disabled={disabled}
              maxLength={100}
            />
            <div className="my-4" />
            <ReCAPTCHA
              sitekey="6LfdByQkAAAAALGExGRPnH8i16IyKNaUXurnW1rm"
              ref={captchaRef}
            />
            <div className="my-4" />
            <Button type="submit" disabled={disabled}>
              Registrati
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;

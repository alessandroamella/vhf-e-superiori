import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Label, TextInput, Tooltip } from "flowbite-react";
import React, { createRef, useRef, useState } from "react";
import { useEffect } from "react";
import { useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorStr, UserContext } from "..";
import ReCAPTCHA from "react-google-recaptcha";
import Layout from "../Layout";
import { Helmet } from "react-helmet";

const Login = () => {
  const [callsign, setCallsign] = useState("");
  const [password, setPassword] = useState("");

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const [resetPw, setResetPw] = useState(false);
  const [email, setEmail] = useState("");

  const { user, setUser } = useContext(UserContext);

  const captchaRef = createRef();

  async function sendResetPw(e) {
    e.preventDefault();

    let token;

    try {
      token = captchaRef.current.getValue();
    } catch (err) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return setAlert({
        color: "failure",
        msg: "Errore nel caricamento del ReCAPTCHA, per favore ricarica la pagina"
      });
    }

    if (!token) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return setAlert({
        color: "failure",
        msg: "Verifica di non essere un robot"
      });
    }

    setDisabled(true);
    try {
      await axios.post("/api/auth/sendresetpw", {
        email,
        token
      });
      setAlert({
        color: "success",
        msg: "Se l'indirizzo email fornito è associato a un account registrato, riceverai a breve un'email per reimpostare la password. Controlla la tua casella di posta!"
      });
    } catch (err) {
      console.log("pw send reset error", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setDisabled(false);
    } finally {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }

  const navigate = useNavigate();

  useEffect(() => {
    if (alert) loginInput.current?.focus();
  }, [alert]);

  async function login(e) {
    e.preventDefault();
    setDisabled(true);
    try {
      const { data } = await axios.post("/api/auth/login", {
        callsign,
        password
      });
      console.log(data);
      setUser(data);
      navigate(searchParams.get("to") || "/", { replace: true });
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setUser(null);
      setDisabled(false);
    }
  }
  const [searchParams] = useSearchParams();

  const loginInput = useRef(null);

  return (
    <Layout>
      <Helmet>
        <title>Login - VHF e superiori</title>
      </Helmet>
      {user &&
        navigate(searchParams.get("to") || "/profile", { replace: true })}
      <div className="w-full h-full min-h-[70vh] dark:bg-gray-900 dark:text-white">
        <div className="mx-auto px-8 w-full md:w-2/3 pt-12 pb-20">
          <Typography variant="h1" className="mb-2">
            Login
          </Typography>

          <Typography variant="small" className="mb-6 flex">
            <span className="mr-1">Non hai un account? </span>
            <Tooltip content="Naviga alla pagina di registrazione">
              <Link
                to="/signup"
                className="underline decoration-dotted hover:text-black transition-colors"
              >
                Registrati qui
              </Link>
            </Tooltip>
          </Typography>

          {alert && (
            <Alert
              className="mb-6"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          <form action="#" method="post" onSubmit={login}>
            <div className="mb-2 block">
              <Label htmlFor="callsign" value="Nominativo" />
            </div>
            <TextInput
              type="text"
              id="callsign"
              name="callsign"
              label="Nominativo"
              minLength={1}
              maxLength={10}
              value={callsign}
              onChange={e => setCallsign(e.target.value.toUpperCase())}
              disabled={disabled}
              ref={loginInput}
              autoComplete="callsign"
              autoFocus
              required
            />
            <div className="my-4" />

            <div className="mb-2 block">
              <Label htmlFor="password" value="Password" />
            </div>
            <TextInput
              type="password"
              id="password"
              name="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={disabled}
              maxLength={100}
              required
            />
            <div className="my-4" />
            <Button type="submit" disabled={disabled}>
              Login
            </Button>
          </form>

          <div className="mt-4">
            <small>
              Ti sei scordato la password?{" "}
              <Link
                to="#"
                className="underline decoration-dotted text-center hover:text-black transition-colors"
                onClick={() => setResetPw(true)}
              >
                Clicca qui
              </Link>
              .
            </small>

            <div className={`${resetPw ? "block" : "hidden"} mt-4`}>
              <form action="#" method="post" onSubmit={sendResetPw}>
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
                  required
                />
                <div className="my-4" />
                <ReCAPTCHA
                  sitekey="6LfdByQkAAAAALGExGRPnH8i16IyKNaUXurnW1rm"
                  ref={captchaRef}
                />
                <div className="my-4" />
                <Button type="submit" disabled={disabled}>
                  Invia richiesta
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

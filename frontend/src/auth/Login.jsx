import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Label, TextInput, Tooltip } from "flowbite-react";
import { useContext, useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { UserContext } from "../App";
import { recaptchaSiteKey } from "../constants/recaptchaSiteKey";
import { getErrorStr } from "../shared";

const Login = () => {
  const [callsign, setCallsign] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();

  const loginFormRef = useRef();
  const emailRef = useRef();

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const [resetPw, setResetPw] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setTimeout(() => {
      if (resetPw) {
        emailRef.current?.focus();
        emailRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      } else {
        window.scrollTo({
          top: 200,
          behavior: "smooth",
        });
      }
    }, 100);
  }, [resetPw]);

  const { user, setUser } = useContext(UserContext);

  const captchaRef = useRef();

  async function sendResetPw(e) {
    e.preventDefault();

    let token;

    try {
      token = captchaRef.current.getValue();
    } catch (err) {
      console.log("captcha error", err);
      loginFormRef.current?.scrollIntoView({
        behavior: "smooth",
      });

      return setAlert({
        color: "failure",
        msg: t("recaptchaError"),
      });
    }

    if (!token) {
      loginFormRef.current?.scrollIntoView({
        behavior: "smooth",
      });

      return setAlert({
        color: "failure",
        msg: t("notARobot"),
      });
    }

    setDisabled(true);
    try {
      await axios.post("/api/auth/sendresetpw", {
        email,
        token,
      });
      setAlert({
        color: "success",
        msg: t("resetPasswordEmail"),
      });
    } catch (err) {
      console.log("pw send reset error", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      setDisabled(false);
    } finally {
      loginFormRef.current?.scrollIntoView({
        behavior: "smooth",
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
        password,
      });
      console.log(data);
      setUser(data);
      navigate(searchParams.get("to") || "/", { replace: true });
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      setUser(null);
      setDisabled(false);
    }
  }
  const [searchParams, setSearchParams] = useSearchParams();

  const hasAlert = searchParams.get("alert");
  useEffect(() => {
    if (hasAlert) {
      setAlert({
        color: "success",
        msg: t("resetPasswordSuccess"),
      });
      searchParams.delete("alert");
      setSearchParams(searchParams);
    }
  }, [hasAlert, searchParams, setSearchParams, t]);

  const loginInput = useRef(null);

  return (
    <>
      <Helmet>
        <title>{t("loginVhf" || "Login")} - VHF e Superiori</title>
      </Helmet>
      {user &&
        navigate(searchParams.get("to") || "/profile", { replace: true })}
      <div
        ref={loginFormRef}
        className="w-full h-full min-h-[70vh] dark:bg-gray-900 dark:text-white"
      >
        <div className="mx-auto px-8 w-full md:w-2/3 pt-12 pb-20">
          <Typography variant="h1" className="dark:text-white mb-2">
            {t("login")}
          </Typography>

          <Typography variant="small" className="mb-6 flex">
            <span className="mr-1">{t("noAccountYet")}</span>
            <Tooltip content="Naviga alla pagina di registrazione">
              <Link
                to="/signup"
                className="underline decoration-dotted hover:text-black dark:hover:text-red-400 transition-colors"
              >
                {t("registerHere")}
              </Link>
            </Tooltip>
          </Typography>

          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          <form action="#" method="post" onSubmit={login}>
            <div className="mb-2 block">
              <Label htmlFor="callsign" value={t("callsign")} />
            </div>
            <TextInput
              type="text"
              id="username"
              name="username"
              label="Nominativo"
              minLength={1}
              maxLength={10}
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
              disabled={disabled}
              ref={loginInput}
              autoComplete="username"
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
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled}
              maxLength={100}
              required
            />
            <div className="my-4" />
            <Button color="blue" type="submit" disabled={disabled}>
              {t("login")}
            </Button>
          </form>

          <div className="mt-4">
            <small>
              {t("forgotPassword")}{" "}
              <Link
                to="#"
                className="underline decoration-dotted text-center hover:text-black dark:hover:text-red-400 transition-colors"
                onClick={() => setResetPw(true)}
              >
                {t("clickHereLowercase")}
              </Link>
              .
            </small>

            <div className={`${resetPw ? "block" : "hidden"} mt-4`}>
              <hr className="my-8" />
              <Typography variant="h2" className="dark:text-white">
                {t("resetPassword")}
              </Typography>
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
                  ref={emailRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={disabled}
                  required
                  autoFocus
                />
                <div className="my-4" />
                <ReCAPTCHA sitekey={recaptchaSiteKey} ref={captchaRef} />
                <div className="my-4" />
                <div className="flex justify-center gap-4">
                  <Button
                    type="button"
                    variant="outlined"
                    className="dark:text-gray-200 dark:border-gray-200"
                    disabled={disabled}
                    onClick={() => setResetPw(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" color="yellow" disabled={disabled}>
                    {t("sendRequest")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

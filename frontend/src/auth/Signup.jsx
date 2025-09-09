import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Avatar, Card, Label, TextInput, Tooltip } from "flowbite-react";
import PropTypes from "prop-types";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCookies } from "react-cookie";
import { usePlacesWidget } from "react-google-autocomplete";
import ReCAPTCHA from "react-google-recaptcha";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { FaArrowAltCircleRight, FaExternalLinkAlt } from "react-icons/fa";
import Markdown from "react-markdown";
import ReactPlaceholder from "react-placeholder";
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";
import { UserContext } from "../App";
import { mapsApiKey } from "../constants/mapsApiKey";
import { recaptchaSiteKey } from "../constants/recaptchaSiteKey";
import { getErrorStr } from "../shared";

const useFocus = () => {
  const htmlElRef = useRef(null);
  const setFocus = () => {
    htmlElRef.current?.focus();
  };

  return [htmlElRef, setFocus];
};

const OpenExternally = ({ doc }) => {
  return (
    <Link
      to={`/document/${doc}`}
      className="text-red-500 hover:text-red-600 transition-colors"
    >
      <FaExternalLinkAlt className="inline mr-1" />
      Apri
      {doc === "tos" ? " i Termini e Condizioni" : " la Privacy Policy"}{" "}
      esternamente
    </Link>
  );
};

OpenExternally.propTypes = {
  doc: PropTypes.string.isRequired,
};

const Signup = () => {
  const [cookies, setCookie, removeCookie] = useCookies(["signupcache"]);
  const { i18n, t } = useTranslation();

  const [avatar, setAvatar] = useState(null);

  const [callsign, setCallsign] = useState(cookies.callsign || "");
  const [name, setName] = useState(cookies.name || "");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(cookies.phoneNumber || "+39");
  const [email, setEmail] = useState(cookies.email || "");

  const [locator, setLocator] = useState(null);

  const captchaRef = useRef();
  const alertRef = useRef();

  const { setUser } = useContext(UserContext);

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  const [inputRef, setInputFocus] = useFocus();

  const [searchParams] = useSearchParams();

  const lastFetchedCallsign = useRef(null);

  const fetchQrz = useCallback(async () => {
    if (callsign.length < 1 || callsign.length > 10) return;
    if (lastFetchedCallsign.current === callsign) return; // Prevent refetching same callsign

    lastFetchedCallsign.current = callsign;
    setDisabled(true);

    try {
      const { data } = await axios.get(`/api/qrz/${callsign}`, {
        params: {
          geocode: true,
        },
      });
      console.log("QRZ data", data);
      // Use current state values to avoid dependency loop
      setName((prevName) => prevName || data.name);
      setEmail((prevEmail) => prevEmail || data.email);

      // Check current address state to avoid overwriting
      setAddress((prevAddress) => {
        if (
          !prevAddress &&
          data.city &&
          data.province &&
          data.lat &&
          data.lon
        ) {
          setAddressInput(data.address);
          setCity(data.city);
          setProvince(data.province);
          setLat(data.lat);
          setLon(data.lon);
          return data.address;
        }
        return prevAddress;
      });

      if (data.pictureUrl) {
        setAvatar(data.pictureUrl);
      } else {
        setAvatar(null);
      }
    } catch (err) {
      console.log(
        "QRZ callsign fetch failed:",
        err?.response?.data?.err || err,
      );
    } finally {
      setDisabled(false);
      setTimeout(setInputFocus, 100);
    }
  }, [callsign, setInputFocus]);

  // Only fetch QRZ data once when component mounts if there's a cookie callsign
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    if (
      cookies.callsign &&
      cookies.callsign === callsign &&
      !lastFetchedCallsign.current
    ) {
      console.log("fetching QRZ data on mount");
      fetchQrz();
    }
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    window.addEventListener("beforeunload", (event) => {
      const e = event || window.event;
      e.preventDefault();
      if (e) {
        e.returnValue = ""; // Legacy method for cross browser support
      }
      return ""; // Legacy method for cross browser support
    });
  }, []);

  useEffect(() => {
    setCookie("callsign", callsign, { path: "/signup", maxAge: 60 * 5 });
    setCookie("name", name, { path: "/signup", maxAge: 60 * 5 });
    setCookie("phoneNumber", phoneNumber, { path: "/signup", maxAge: 60 * 5 });
    setCookie("email", email, { path: "/signup", maxAge: 60 * 5 });
  }, [callsign, name, phoneNumber, email, setCookie]);

  const placesWidget = usePlacesWidget({
    apiKey: mapsApiKey,
    options: {
      types: ["geocode"],
    },
    onPlaceSelected: (place) => {
      if (!place) return;
      console.log("place", place);
      const addr = place.formatted_address;
      if (!addr) {
        console.log("no address found in place:", place);
        return;
      }
      let cityIndex = place.address_components.findIndex((c) =>
        c.types.includes("administrative_area_level_3"),
      );
      if (cityIndex === -1) {
        cityIndex = place.formatted_address.length <= 2 ? 0 : 1;
      }
      const city = place.address_components[cityIndex]?.long_name;
      const prov = place.address_components[cityIndex + 1]?.short_name;
      setAddress(addr);
      setAddressInput(addr);
      setCity(city);
      setProvince(prov);
      setLat(place.geometry.location.lat());
      setLon(place.geometry.location.lng());
    },
    language: "it",
  });
  const mapsRef = placesWidget.ref;

  useEffect(() => {
    if (!lat || !lon) return;

    async function fetchLocator() {
      try {
        const { data } = await axios.get(`/api/location/locator/${lat}/${lon}`);
        console.log("fetched locator", data);
        setLocator(data.locator);
      } catch (err) {
        console.log("locator fetch failed:", err);
      }
    }

    fetchLocator();
  }, [lat, lon]);

  async function signup(e, recaptchaValue) {
    e?.preventDefault();

    if (!recaptchaValue) {
      try {
        recaptchaValue = captchaRef.current.getValue();
      } catch (err) {
        return handleReCaptchaError(err);
      }
    }

    try {
      if (!recaptchaValue) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        return setAlert(t("verifyNotRobot"));
      }
    } catch (err) {
      return handleReCaptchaError(err);
    }

    if (password !== repeatPassword) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return setAlert(t("passwordsNotMatching"));
    }

    setDisabled(true);
    try {
      const obj = {
        callsign,
        name,
        password,
        phoneNumber,
        email,
        token: recaptchaValue,
      };
      if (address) {
        obj.address = address;
        obj.lat = lat;
        obj.lon = lon;
        obj.city = city;
        obj.province = province;
      }
      console.log("signup obj", { ...obj, password: "********" });
      await axios.post("/api/auth/signup", obj);
      removeCookie("callsign", { path: "/signup" });
      removeCookie("name", { path: "/signup" });
      removeCookie("phoneNumber", { path: "/signup" });
      removeCookie("email", { path: "/signup" });
      const { data } = await axios.post("/api/auth/login", {
        callsign,
        password,
      });
      setUser(data);
      navigate(
        {
          pathname: searchParams.get("to") || "/",
          search: createSearchParams({
            toconfirm: true,
          }).toString(),
        },
        {
          replace: true,
        },
      );
    } catch (err) {
      console.log("signup error", err);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      const str = err.response?.data?.err;
      if (typeof str === "string" && str.includes(",")) {
        setAlert([...new Set(str.split(","))].map(getErrorStr).join(", "));
      } else {
        setAlert(getErrorStr(str));
      }
      setDisabled(false);
    }
  }

  const formattedAddress = useMemo(() => {
    if (!address || !city || !province) return null;
    return `${address}, ${city} (${province})`;
  }, [address, city, province]);

  const [tos, setTos] = useState(null);
  const [privacyPolicy, setPrivacyPolicy] = useState(null);
  const [tosPrivacyShown, setTosPrivacyShown] = useState(false);
  const [tosPrivacyError, setTosPrivacyError] = useState(null);

  async function toggleTosPrivacy(e) {
    e.preventDefault();

    const isShown = tosPrivacyShown;
    setTosPrivacyShown(!isShown);

    if (isShown) return; // already loaded

    try {
      const { data } = await axios.get("/api/document/tos");
      setTos(data);
    } catch (err) {
      console.log("tos fetch failed:", err);
      setTosPrivacyError("Errore nel caricamento dei Termini e Condizioni");
      return;
    }
    try {
      const { data } = await axios.get("/api/document/privacy");
      setPrivacyPolicy(data);
    } catch (err) {
      console.log("privacy policy fetch failed:", err);
      setTosPrivacyError("Errore nel caricamento della Privacy Policy");
      return;
    }

    setTosPrivacyError(null);
  }

  const { user } = useContext(UserContext);

  async function handleReCaptchaError(err) {
    console.log("ReCAPTCHA error", err, "\nReCAPTCHA ref:", captchaRef.current);
    if (
      err instanceof Error &&
      err.message.includes("reCAPTCHA client element has been removed")
    ) {
      let widgetId;
      try {
        const res = await window.grecaptcha.getResponse();
        console.log("getResponse", res);
        return signup(null, res);
      } catch (err) {
        console.log("getResponse failed:", err);
      }
      try {
        console.log("getWidgetId");
        widgetId = captchaRef.current.getWidgetId();
        console.log("widgetId", widgetId);
      } catch (err) {
        console.log("getWidgetId failed:", err);
      }
      try {
        console.log("getWidgetId");
        console.log("resetting ReCAPTCHA");
        window.grecaptcha.reset(widgetId);
        console.log("ReCAPTCHA reset");
      } catch (err) {
        console.log("ReCAPTCHA reset failed:", err, "\ntrying to re-render it");
        try {
          console.log("re-rendering ReCAPTCHA");
          window.grecaptcha.render(
            document.querySelector(".recaptcha-backup-wrapper"),
            {
              sitekey: recaptchaSiteKey,
              theme:
                localStorage.getItem("darkMode") === "true" ? "dark" : "light",
            },
          );
          console.log("ReCAPTCHA re-rendered");
        } catch (err) {
          console.log("ReCAPTCHA re-render failed:", err);
        }
      }
    } else {
      setAlert(t("recaptchaError"));
    }
    setTimeout(() => {
      alertRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }

  return (
    <>
      <Helmet>
        <title>
          {i18n.exists("signupVhf") ? t("signupVhf") : "Signup"} - VHF e
          Superiori
        </title>
      </Helmet>
      {user &&
        navigate(searchParams.get("to") || "/profile", { replace: true })}
      <div className="w-full h-full dark:bg-gray-900 dark:text-white">
        <div className="mx-auto px-8 w-full md:w-2/3 pt-12 pb-20">
          <Typography variant="h1" className="dark:text-white mb-2">
            {t("signupTitle")}
          </Typography>

          <Typography variant="small" className="mb-6 flex">
            <span className="mr-1">{t("accountAlready")}</span>
            <Tooltip content={t("goToLogin")}>
              <Link
                to="/login"
                className="underline decoration-dotted hover:text-black transition-colors"
              >
                {t("loginHere")}
              </Link>
            </Tooltip>
          </Typography>

          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color="failure"
              onDismiss={() => setAlert(null)}
              ref={alertRef}
            >
              <span>{alert}</span>
            </Alert>
          )}

          <form action="#" method="post" onSubmit={signup}>
            <div className="flex items-end gap-2">
              {avatar && (
                <Avatar rounded className="w-20 h-20" img={avatar} size="lg" />
              )}
              <div className="w-full">
                <div className="mb-2 block">
                  <Label htmlFor="username" value={t("callsignNoPreSuf")} />
                </div>
                <TextInput
                  type="text"
                  name="username"
                  id="username"
                  label="Nominativo"
                  autoComplete="username"
                  minLength={1}
                  maxLength={10}
                  onBlur={fetchQrz}
                  value={callsign}
                  // replace non alphanumeric characters with empty string
                  onChange={(e) => {
                    setCallsign(
                      e.target.value.toUpperCase().replace(/[^a-zA-Z0-9]/g, ""),
                    );
                    setAvatar(null);
                  }}
                  disabled={disabled}
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="name" value={t("publicName")} />
                </div>
                <TextInput
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="name"
                  label="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={disabled}
                  ref={inputRef}
                  required
                />
              </div>
              <div>
                {/* DEBUG in traduzione estera, specifica di inserire il prefisso */}
                <div className="mb-2 block">
                  <Label htmlFor="phoneNumber" value={t("phoneNumber")} />
                </div>
                <TextInput
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  autoComplete="tel"
                  label="Numero di telefono"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            </div>
            <div className="my-4" />

            <div className="mb-2">
              <Label htmlFor="addressInput" value={t("fullStationAddress")} />
              <TextInput
                type="text"
                name="addressInput"
                id="addressInput"
                autoComplete="address-level2"
                label="Indirizzo"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onBlur={() => setAddressInput(address)}
                ref={mapsRef}
                helperText={
                  formattedAddress
                    ? `OK! Indirizzo inserito: ${formattedAddress}`
                    : "Indirizzo esatto, usato per la visualizzazione dei QSO sulla mappa"
                }
                disabled={disabled}
              />
            </div>

            {locator && (
              <div className="ml-2 md:ml-4 mb-4 flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">
                  <FaArrowAltCircleRight className="inline mr-1" />
                  {t("locator")}:{" "}
                  <span className="dark:text-gray-200 font-bold">
                    {locator}
                  </span>
                </span>
              </div>
            )}

            <div className="mb-2 block">
              <Label htmlFor="email" value={t("email")} />
            </div>
            <TextInput
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              required
            />
            <div className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password" value={t("password")} />
                </div>
                <TextInput
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Minimo 8 caratteri, almeno un numero e una maiuscola"
                  disabled={disabled}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password-2" value={t("repeatPassword")} />
                </div>
                <TextInput
                  type="password"
                  name="password"
                  id="password-2"
                  autoComplete="new-password"
                  label="Password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  disabled={disabled}
                  maxLength={100}
                  required
                />
              </div>
            </div>
            <hr className="my-4" />
            {/* TOS */}
            <div className="mb-2">
              {t("bySigningUp")}{" "}
              <button
                onClick={toggleTosPrivacy}
                className="inline outline-none hover:text-blue-600 font-semibold underline decoration-dashed transition-colors bg-transparent border-none text-sm"
              >
                {t("termsAndConditions")}
              </button>{" "}
              {t("andThe")}{" "}
              <button
                onClick={toggleTosPrivacy}
                className="inline outline-none hover:text-blue-600 font-semibold underline decoration-dashed transition-colors bg-transparent border-none text-sm"
              >
                {t("privacyPolicyEn")}
              </button>
            </div>
            {tosPrivacyShown && (
              <div className="mb-2">
                {tosPrivacyError ? (
                  <Alert color="failure">
                    <span>{tosPrivacyError}</span>
                    <OpenExternally doc="tos" />
                    <OpenExternally doc="privacy" />
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {["tos", "privacy"].map((doc) => (
                      <Card key={doc}>
                        <ReactPlaceholder
                          showLoadingAnimation
                          type="text"
                          rows={10}
                          ready={!!(doc === "tos" ? tos : privacyPolicy)}
                        >
                          <Markdown className="markdown">
                            {doc === "tos" ? tos : privacyPolicy}
                          </Markdown>
                        </ReactPlaceholder>
                        <OpenExternally doc={doc} />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="my-4" />
            <div className="recaptcha-backup-wrapper" />
            <ReCAPTCHA
              sitekey={recaptchaSiteKey}
              ref={captchaRef}
              onError={handleReCaptchaError}
            />
            <div className="my-4" />
            <Button color="blue" type="submit" disabled={disabled}>
              {t("signUp")}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;

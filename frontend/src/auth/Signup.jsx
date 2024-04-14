import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Avatar, Card, Label, TextInput, Tooltip } from "flowbite-react";
import React, {
  createRef,
  useEffect,
  useRef,
  useState,
  useContext
} from "react";
import {
  Link,
  createSearchParams,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { getErrorStr, UserContext } from "..";
import { useCookies } from "react-cookie";
import ReCAPTCHA from "react-google-recaptcha";
import { usePlacesWidget } from "react-google-autocomplete";
import Layout from "../Layout";
import Markdown from "react-markdown";
import ReactPlaceholder from "react-placeholder";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Helmet } from "react-helmet";

const useFocus = () => {
  const htmlElRef = useRef(null);
  const setFocus = () => {
    htmlElRef.current && htmlElRef.current.focus();
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

const Signup = () => {
  const [cookies, setCookie, removeCookie] = useCookies(["signupcache"]);

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

  useEffect(() => {
    if (cookies.callsign) {
      fetchQrz(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const [inputRef, setInputFocus] = useFocus();

  const [searchParams] = useSearchParams();

  const placesWidget = usePlacesWidget({
    apiKey: "AIzaSyAiPVD_IqTn5kMi2GFXwYQCTYaxznEbCfk",
    onPlaceSelected: place => {
      console.log("place", place);
      const addr = place.formatted_address;
      let cityIndex = place.address_components.findIndex(c =>
        c.types.includes("administrative_area_level_3")
      );
      if (cityIndex === -1) {
        cityIndex = 1;
      }
      const city = place.address_components[cityIndex].long_name;
      const prov = place.address_components[cityIndex + 1].short_name;
      setAddress(addr);
      setAddressInput(addr);
      setCity(city);
      setProvince(prov);
      setLat(place.geometry.location.lat());
      setLon(place.geometry.location.lng());
    },
    language: "it"
  });
  const mapsRef = placesWidget.ref;

  async function fetchQrz(force = false) {
    if (callsign.length < 1 || callsign.length > 10) return;

    setDisabled(true);

    try {
      const { data } = await axios.get("/api/qrz/" + callsign);
      console.log("QRZ data", data);
      if (!name || force) {
        setName(data.name);
      }
      if (!email || force) {
        setEmail(data.email);
      }

      if (data.pictureUrl) {
        setAvatar(data.pictureUrl);
      } else {
        setAvatar(null);
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
      const obj = {
        callsign,
        name,
        password,
        phoneNumber,
        email,
        token: captchaRef.current.getValue()
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
        password
      });
      setUser(data);
      navigate(
        {
          pathname: searchParams.get("to") || "/",
          search: createSearchParams({
            toconfirm: true
          }).toString()
        },
        {
          replace: true
        }
      );
    } catch (err) {
      console.log("signup error", err);
      window.scrollTo({
        top: 0,
        behavior: "smooth"
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

  return (
    <Layout>
      <Helmet>
        <title>Registrazione - VHF e superiori</title>
      </Helmet>
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
            <div className="flex items-end gap-2">
              {avatar && <Avatar img={avatar} size="lg" />}
              <div className="w-full">
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
                  // replace non alphanumeric characters with empty string
                  onChange={e =>
                    setCallsign(
                      e.target.value.toUpperCase().replace(/[^a-zA-Z0-9]/g, "")
                    )
                  }
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
                  required
                />
              </div>
              <div>
                {/* DEBUG in traduzione estera, specifica di inserire il prefisso */}
                <Label
                  htmlFor="phoneNumber"
                  value="Numero di telefono (con prefisso nazionale)"
                />
                <TextInput
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  autoComplete="tel"
                  label="Numero di telefono"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            </div>
            <div className="my-4" />

            <div className="mb-2">
              <Label htmlFor="addressInput" value="Città (opzionale)" />
              <TextInput
                type="text"
                name="addressInput"
                id="addressInput"
                autoComplete="address-level2"
                label="Indirizzo"
                value={addressInput}
                onChange={e => setAddressInput(e.target.value)}
                onBlur={() => setAddressInput(address)}
                ref={mapsRef}
                helperText="Usato per la visualizzazione dei QSO sulla mappa"
                disabled={disabled}
              />
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
                  helperText="Minimo 8 caratteri, almeno un numero e una maiuscola"
                  disabled={disabled}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password-2" value="Ripeti password" />
                </div>
                <TextInput
                  type="password"
                  name="password"
                  id="password-2"
                  autoComplete="new-password"
                  label="Password"
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                  disabled={disabled}
                  maxLength={100}
                  required
                />
              </div>
            </div>
            <hr className="my-4" />
            {/* TOS */}
            <div className="mb-2">
              Registrandoti accetti i{" "}
              <button
                onClick={toggleTosPrivacy}
                className="inline outline-none hover:text-blue-600 font-semibold underline decoration-dashed transition-colors bg-transparent border-none text-sm"
              >
                Termini e Condizioni
              </button>{" "}
              e la{" "}
              <button
                onClick={toggleTosPrivacy}
                className="inline outline-none hover:text-blue-600 font-semibold underline decoration-dashed transition-colors bg-transparent border-none text-sm"
              >
                Privacy Policy (in inglese)
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
                    {["tos", "privacy"].map(doc => (
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

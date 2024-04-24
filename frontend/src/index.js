import React, { createContext, useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import Homepage from "./homepage";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import reportWebVitals from "./reportWebVitals";
import axios, { isAxiosError } from "axios";
import Profile from "./profile";
import AdminManager from "./admin";
import ViewEvent from "./event/ViewEvent";
// import Regolamento from "./homepage/Regolamento";
// import Info from "./homepage/Info";
import ResetPw from "./profile/ResetPw";
import Social from "./social";
import NewPost from "./social/NewPost";
import ViewPost from "./social/ViewPost";
import ProgettiGianni from "./homepage/ProgettiGianni";
import ViewPublished from "./social/ViewPublished";
import QsoManager from "./event/QsoManager";
import EqslRedirect from "./event/EqslRedirect";
import Qso from "./event/Qso";
import MdViewer from "./document/MdViewer";
import Rankings from "./event/Rankings";
import BeaconHomepage from "./beacon";
import BeaconEditor from "./beacon/Editor";
import ViewBeacon from "./beacon/ViewBeacon";
import Blog from "./blog";

import "react-placeholder/lib/reactPlaceholder.css";
import "react-medium-image-zoom/dist/styles.css";
import "leaflet/dist/leaflet.css";

import BlogPostEditor from "./blog/Editor";
import BlogPostViewer from "./blog/View";

export const UserContext = createContext(null);
export const EventsContext = createContext(null);
export const SplashContext = createContext(false);
export const ReadyContext = createContext(false);
export const JoinOpenContext = createContext(false);
export const ViewsContext = createContext(false);
export const SidebarOpenContext = createContext(false);
const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createBrowserRouter([
  { path: "/", element: <Homepage /> },
  { path: "/progetti-gianni", element: <ProgettiGianni /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/profile", element: <Profile /> },
  { path: "/social", element: <Social /> },
  { path: "/social/new", element: <NewPost /> },
  { path: "/u/:callsign", element: <ViewPublished /> },
  { path: "/social/:id", element: <ViewPost /> },
  { path: "/eventmanager", element: <AdminManager /> },
  { path: "/qsomanager/:id", element: <QsoManager /> },
  { path: "/rankings/:id", element: <Rankings /> },
  { path: "/eqsl/:id", element: <EqslRedirect /> },
  { path: "/qso/:id", element: <Qso /> },
  // { path: "/regolamento", element: <Regolamento /> },
  // { path: "/info", element: <Info /> },
  { path: "/resetpw", element: <ResetPw /> },
  { path: "/event/:id", element: <ViewEvent /> },
  { path: "/document/:name", element: <MdViewer /> },
  { path: "/beacon", element: <BeaconHomepage /> },
  { path: "/beacon/editor", element: <BeaconEditor /> },
  { path: "/beacon/:id", element: <ViewBeacon /> },
  { path: "/blog", element: <Blog /> },
  { path: "/blog/editor", element: <BlogPostEditor /> },
  { path: "/blog/:id", element: <BlogPostViewer /> }
  // {
  //   path: "contacts/:contactId",
  //   element: <Contact />,
  // },
]);

export const errors = {
  USER_NOT_FOUND: "Utente non trovato",
  INVALID_PW: "Password non valida",
  WRONG_PW: "Password errata",
  DOC_NOT_FOUND: "Documento non trovato",
  SERVER_ERROR: "Errore del server",
  LOGIN_TOKEN_EXPIRED: "Login scaduto",
  UNKNOWN_ERROR: "Errore sconosciuto",
  MISSING_ENV: "Variabile d'ambiente mancante (server)",
  ALREADY_REGISTERED:
    "Un utente con questo nominativo / email / telefono esiste già, per favore fai il login",
  INVALID_LOCATION: "Posizione non valida",
  QRZ_NO_KEY: "Chiave di QRZ non trovata (server)",
  QRZ_OM_NOT_FOUND: "Utente non trovato su QRZ",
  QTH_NOT_FOUND: "QTH non trovato",
  INVALID_OBJECT_ID:
    "ObjectId non valido. Il documento potrebbe non esistere o essere stato cancellato.",
  INVALID_LOGIN: "Login non valido",
  NOT_LOGGED_IN: "Devi fare il login per procedere",
  MALFORMED_REQUEST_BODY: "Corpo della richiesta malformato",
  NOT_AN_ADMIN: "Devi essere un amministratore per procedere",
  EVENT_NOT_FOUND: "Evento non trovato",
  EVENT_JOIN_ALREADY_REQUESTED:
    "Richiesta di partecipazione all'evento già effettuata",
  EVENT_JOIN_TIME_EXPIRED:
    "La data per richiedere di partecipare all'evento è già trascorsa",
  EVENT_JOIN_TIME_TOO_EARLY:
    "La data per richiedere di partecipare all'evento non è ancora arrivata",
  JOIN_REQUEST_NOT_FOUND: "Richiesta di partecipazione non trovata",
  URL_NOT_FOUND: "URL non trovato",
  INVALID_EMAIL: "Email non valida",
  EMAIL_ALREADY_IN_USE: "Email già in uso",
  INVALID_PHONE_NUMBER:
    "Numero di telefono non valido (hai incluso il prefisso?)",
  PHONE_NUMBER_ALREADY_IN_USE: "Numero di telefono già in uso",
  MUST_ACCEPT_SIGNUP_TOS:
    "Per registrarti, devi accettare i termini e condizioni",
  MUST_ACCEPT_EVENT_TOS:
    "Per continuare, devi accettare i termini e condizioni",
  CAPTCHA_FAILED: "ReCAPTCHA non passato",
  WEAK_PW: "Password troppo debole",
  USER_NOT_VERIFIED:
    "Utente non verificato, per favore verifica il tuo account cliccando il link che hai ricevuto per email",
  USER_ALREADY_VERIFIED: "Utente già verificato",
  VERIFICATION_CODE_NOT_FOUND: "Codice di verifica non trovato",
  INVALID_VERIFICATION_CODE: "Codice di verifica non valido",
  INVALID_PW_RESET_CODE: "Codice per reimpostare la password non valido",
  INVALID_PICS_NUM: "Numero di immagini non valido",
  INVALID_VIDS_NUM: "Numero di video non valido",
  INVALID_FREQUENCY_BAND: "Banda di frequenza non valida",
  INVALID_FILE_MIME_TYPE: "Formato file non valido",
  FILE_SIZE_TOO_LARGE: "Dimensione del file troppo grande",
  FILE_NOT_FOUND: "File non trovato",
  INVALID_POST: "Post non valido",
  COMMENT_NOT_FOUND: "Commento non trovato",
  COMMENT_NOT_OWNER: "Devi essere il proprietario del commento per procedere",
  TOO_MANY_FILES: "Troppi file",
  TOO_MANY_PICTURES: "Troppe immagini",
  TOO_MANY_VIDEOS: "Troppi video",
  POST_NOT_FOUND: "Post non trovato",
  MUST_BE_POST_OWNER: "Devi essere il proprietario del post per procedere",
  VIDEO_COMPRESS_NO_OUTPUT_PATH:
    "Percorso di output per compressione video non presente",
  NO_CONTENT: "Nessun contenuto",
  INVALID_QSO: "QSO non valido",
  JOIN_REQUEST_NOT_APPROVED: "Richiesta di partecipazione non approvata",
  QSO_NOT_FOUND: "QSO non trovato",
  QSO_NOT_OWNED: "Devi essere il proprietario del QSO per procedere",
  ERROR_CREATING_IMAGE: "Errore nella creazione dell'immagine",
  NOT_AUTHORIZED_TO_EQSL: "Non sei autorizzato a creare una eQSL",
  NO_IMAGE_TO_EQSL: "Nessuna immagine da usare per la eQSL",
  INVALID_ADIF: "File ADIF non valido",
  INVALID_ADIF_EXCLUDE: "Esclusione ADIF non valida",
  INVALID_NAME: "Nome non valido",
  INVALID_CALLSIGN: "Nominativo non valido",
  INVALID_COMMENT: "Commento non valido",
  POST_IS_PROCESSING: "Il post è in fase di elaborazione",
  BEACON_EXISTS: "Beacon già esistente",
  INVALID_BEACON: "Beacon non valido",
  BEACON_NOT_FOUND: "Beacon non trovato",
  NO_EMAIL_FOUND: "Nessuna email trovata",
  ERROR_QTH_PARSE: "Errore nel parsing del QTH",
  INVALID_MODE: "Modo non valido",
  INVALID_DATE: "Data non valida",
  INVALID_NOTES: "Note non valide",
  INVALID_LOCATOR: "Locator non valido",
  INVALID_FREQUENCY: "Frequenza non valida",
  INVALID_RST: "RST non valido",
  INVALID_CITY: "Città non valida",
  INVALID_PROVINCE: "Provincia non valida",
  INVALID_LATITUDE: "Latitudine non valida",
  INVALID_LONGITUDE: "Longitudine non valida",
  INVALID_HAMSL: "Altezza non valida",
  INVALID_ANTENNA: "Antenna non valida",
  INVALID_QTF: "QTF non valido",
  INVALID_POWER: "Potenza non valida",
  INVALID_CONTENT: "Contenuto non valido",
  INVALID_TITLE: "Titolo non valido",
  INVALID_TAGS: "Tag non validi",
  INVALID_IMAGE: "Immagine non valida",
  MUST_BE_DEV:
    "Devi essere uno sviluppatore del sito per completare questa azione"
};

function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function getErrorStr(str) {
  console.log("Stringa errore:", str);
  const arr = (
    str instanceof Error
      ? str.message
      : typeof str === "string"
      ? str
      : str?.toString() || errors.UNKNOWN_ERROR
  )
    .split(",")
    .map(s => s.trim());
  return [
    ...new Set(
      arr.map(str =>
        str && str in errors
          ? errors[str]
          : typeof str === "string"
          ? "Errore: " + str
          : errors.UNKNOWN_ERROR
      )
    )
  ]
    .map((e, i) => (i === 0 ? e : lowercaseFirstLetter(e)))
    .join(", ");
}

const App = () => {
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(false);
  const [events, setEvents] = useState(false);
  const [splashPlayed, setSplashPlayed] = useState(false);
  const [ready, setReady] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [views, setViews] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.location.pathname === "/") {
      setTimeout(() => {
        setReady(true);
      }, 4000);
    } else setReady(true);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data } = await axios.get("/api/auth");
        console.log("user", data);
        setUser(data);
      } catch (err) {
        console.log("no user");
        if (!isAxiosError(err)) return console.error(err);
        // setAlert(err.response?.data || "Errore sconosciuto");
        setUser(null);
      }
    }

    if (!user) fetchUser();
  }, [user]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data } = await axios.get("/api/event");
        console.log("events", data);
        setEvents(data);
      } catch (err) {
        console.log("Errore nel caricamento degli eventi");
        if (!isAxiosError(err)) return console.error(err);
        setEvents(null);
      }
    }

    if (!events) fetchEvents();
  }, [events]);

  const getIp = useCallback(async () => {
    try {
      const { data } = await axios.post("https://geolocation-db.com/json/");
      console.log("ip:", data.IPv4);
      return data.IPv4;
    } catch (err) {
      console.log("error while fetching ip");
      if (!isAxiosError(err)) return console.error(err);
      return null;
    }
  }, []);

  useEffect(() => {
    // count view
    let fetchWithoutPost = false;
    async function countView() {
      try {
        const { data } = await axios.post("/api/counter", {
          ip: await getIp()
        });
        console.log("views counted, total:", data);
        setViews(data.views);
      } catch (err) {
        console.log("error while conting view");
        if (!isAxiosError(err)) return console.error(err);
        setViews(null);
        fetchWithoutPost = true;
      }

      if (!fetchWithoutPost) return;
      try {
        const { data } = await axios.get("/api/counter");
        console.log("views NO POST counted, total:", data);
        setViews(data.views);
      } catch (err) {
        console.log("error while conting NO POST view");
        if (!isAxiosError(err)) return console.error(err);
        setViews(null);
      }
    }

    countView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.StrictMode>
      <ThemeProvider>
        <UserContext.Provider value={{ user, setUser }}>
          <EventsContext.Provider value={{ events, setEvents }}>
            <SplashContext.Provider value={{ splashPlayed, setSplashPlayed }}>
              <ReadyContext.Provider value={{ ready, setReady }}>
                <JoinOpenContext.Provider
                  value={{
                    joinOpen,
                    setJoinOpen
                  }}
                >
                  <ViewsContext.Provider value={{ views }}>
                    <SidebarOpenContext.Provider
                      value={{ sidebarOpen, setSidebarOpen }}
                    >
                      <RouterProvider router={router} />
                    </SidebarOpenContext.Provider>
                  </ViewsContext.Provider>
                </JoinOpenContext.Provider>
              </ReadyContext.Provider>
            </SplashContext.Provider>
          </EventsContext.Provider>
        </UserContext.Provider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

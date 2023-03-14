import React, { createContext, useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import Homepage from "./homepage";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import reportWebVitals from "./reportWebVitals";
import axios, { isAxiosError } from "axios";
import Profile from "./profile";
import Event from "./admin/Event";
import ViewEvent from "./event/ViewEvent";
// import Regolamento from "./homepage/Regolamento";
// import Info from "./homepage/Info";
import ResetPw from "./profile/ResetPw";
import Social from "./social";

export const UserContext = createContext(null);
export const EventsContext = createContext(null);
export const SplashContext = createContext(false);
export const ReadyContext = createContext(false);
export const JoinOpenContext = createContext(false);
export const ViewsContext = createContext(false);
const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createBrowserRouter([
  { path: "/", element: <Homepage /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/profile", element: <Profile /> },
  { path: "/social", element: <Social /> },
  { path: "/eventmanager", element: <Event /> },
  // { path: "/regolamento", element: <Regolamento /> },
  // { path: "/info", element: <Info /> },
  { path: "/resetpw", element: <ResetPw /> },
  { path: "/event/:id", element: <ViewEvent /> }
  // {
  //   path: "contacts/:contactId",
  //   element: <Contact />,
  // },
]);

export const errors = {
  USER_NOT_FOUND: "Utente non trovato",
  INVALID_PW: "Password non valida",
  DOC_NOT_FOUND: "Documento non trovato",
  SERVER_ERROR: "Errore del server",
  LOGIN_TOKEN_EXPIRED: "Login scaduto",
  UNKNOWN_ERROR: "Errore sconosciuto",
  MISSING_ENV: "Variabile d'ambiente mancante (server)",
  ALREADY_REGISTERED: "Utente già registrato (fai il login)",
  QRZ_NO_KEY: "Chiave di QRZ non trovata (server)",
  QRZ_OM_NOT_FOUND: "Utente non trovato su QRZ",
  QTH_NOT_FOUND: "QTH non trovato",
  INVALID_OBJECT_ID: "ObjectId non valido",
  INVALID_LOGIN: "Login non valido",
  MALFORMED_REQUEST_BODY: "Corpo della richiesta malformato",
  NOT_LOGGED_IN: "Devi fare il login per procedere",
  NOT_AN_ADMIN: "Devi essere un amministratore per procedere",
  EVENT_NOT_FOUND: "Evento non trovato",
  EVENT_JOIN_ALREADY_REQUESTED:
    "Richiesta di partecipazione all'evento già effettuata",
  EVENT_JOIN_TIME_EXPIRED:
    "La data per richiedere di partecipare all'evento è già trascorsa",
  JOIN_REQUEST_NOT_FOUND: "Richiesta di partecipazione non trovata",
  URL_NOT_FOUND: "URL non trovato",
  INVALID_EMAIL: "Email non valida",
  EMAIL_ALREADY_IN_USE: "Email già in uso",
  INVALID_PHONE_NUMBER: "Numero di telefono non valido",
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
  INVALID_VERIFICATION_CODE: "Codice di verifica non valido"
};
export function getErrorStr(str) {
  console.log("Stringa errore:", str);
  return str && str in errors
    ? errors[str]
    : typeof str === "string"
    ? "Dati mancanti o incorretti: " + str
    : errors.UNKNOWN_ERROR;
}

const App = () => {
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(false);
  const [events, setEvents] = useState(false);
  const [splashPlayed, setSplashPlayed] = useState(false);
  const [ready, setReady] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [views, setViews] = useState(false);

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
                    <RouterProvider router={router} />
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

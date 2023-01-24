import React, { createContext, useEffect, useState } from "react";
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

export const UserContext = createContext(null);
export const EventsContext = createContext(null);
export const SplashContext = createContext(false);
const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createBrowserRouter([
    { path: "/", element: <Homepage /> },
    { path: "/login", element: <Login /> },
    { path: "/signup", element: <Signup /> },
    { path: "/profile", element: <Profile /> },
    { path: "/eventmanager", element: <Event /> },
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
    JOIN_REQUEST_NOT_FOUND: "Richiesta di partecipazione non trovata"
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

    return (
        <React.StrictMode>
            <ThemeProvider>
                <UserContext.Provider value={{ user, setUser }}>
                    <EventsContext.Provider value={{ events, setEvents }}>
                        <SplashContext.Provider
                            value={{ splashPlayed, setSplashPlayed }}
                        >
                            <RouterProvider router={router} />
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

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

export const UserContext = createContext(null);
export const EventsContext = createContext(null);

const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createBrowserRouter([
    { path: "/", element: <Homepage /> },
    { path: "/login", element: <Login /> },
    { path: "/signup", element: <Signup /> },
    { path: "/profile", element: <Profile /> }
    // {
    //   path: "contacts/:contactId",
    //   element: <Contact />,
    // },
]);

const App = () => {
    // eslint-disable-next-line no-unused-vars
    const [alert, setAlert] = useState(null);
    const [user, setUser] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            try {
                const { data } = await axios.get("/api/auth");
                console.log("user", data);
                setUser(data);
            } catch (err) {
                console.log("no user");
                if (!isAxiosError(err)) return console.error(err);
                setAlert(err.response?.data || "Errore sconosciuto");
            }
        }

        if (!user) fetchUser();
    }, [user]);

    return (
        <React.StrictMode>
            <ThemeProvider>
                <UserContext.Provider value={{ user, setUser }}>
                    <RouterProvider router={router} />
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

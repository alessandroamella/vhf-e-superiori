import React, { createContext, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import Homepage from "./homepage";
import Login from "./auth/Login";
import reportWebVitals from "./reportWebVitals";
import axios, { isAxiosError } from "axios";

export const UserContext = createContext(null);
export const EventsContext = createContext(null);

const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createBrowserRouter([
    {
        path: "/",
        element: <Homepage />
        // errorElement: <ErrorPage />,
    },
    { path: "/login", element: <Login /> }
    // {
    //   path: "contacts/:contactId",
    //   element: <Contact />,
    // },
]);

const App = () => {
    // eslint-disable-next-line no-unused-vars
    const [alert, setAlert] = useState(null);
    const [user, setUser] = useState(null);

    const userDoesntExist = !user;

    useEffect(() => {
        async function fetchUser() {
            try {
                const { data } = await axios.get("/auth");
                setUser(data);
            } catch (err) {
                if (!isAxiosError(err)) return console.error(err);
                setAlert(err.response?.data || "Errore sconosciuto");
            }
        }

        fetchUser();
    }, [userDoesntExist]);

    return (
        <React.StrictMode>
            <ThemeProvider>
                <UserContext.Provider value={user}>
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

import { useCallback, useEffect, useState, useRef } from "react";
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
import UserQsoManager from "./event/UserQsoManager";
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
import {
  EventsContext,
  JoinOpenContext,
  ReadyContext,
  SidebarOpenContext,
  SplashContext,
  UserContext,
  ViewsContext
} from "./App";

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
  { path: "/logqso/:id", element: <UserQsoManager /> },
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

export const App = () => {
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

  const isFetchingUser = useRef(false);

  useEffect(() => {
    async function fetchUser() {
      if (isFetchingUser.current) return null;
      isFetchingUser.current = true;

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

  const isFetchingEvents = useRef(false);

  useEffect(() => {
    async function fetchEvents() {
      if (isFetchingEvents.current) return null;
      isFetchingEvents.current = true;

      try {
        const { data } = await axios.get("/api/event");
        console.log("events fetched", data);
        setEvents(data);
      } catch (err) {
        console.log("Errore nel caricamento degli eventi");
        if (!isAxiosError(err)) return console.error(err);
        setEvents(null);
      }
    }

    if (!events) fetchEvents();
  }, [events]);

  const isGettingIp = useRef(false);

  const getIp = useCallback(async () => {
    if (isGettingIp.current) return null;
    isGettingIp.current = true;

    try {
      const { data } = await axios.post("https://checkip.amazonaws.com");
      console.log("ip:", data.trim());
      return data.trim();
    } catch (err) {
      console.log("error while fetching ip");
      if (!isAxiosError(err)) return console.error(err);
      return null;
    }
  }, []);

  const isFetchingViews = useRef(false);

  useEffect(() => {
    // count view
    let fetchWithoutPost = false;
    async function countView() {
      if (isFetchingViews.current) return null;
      isFetchingViews.current = true;

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
  );
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export default App;

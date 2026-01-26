import { ThemeProvider } from "@material-tailwind/react";
import axios, { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import AdminManager from "./admin";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import ViewEvent from "./event/ViewEvent";
import Homepage from "./homepage";
import "./index.css";
import { ErrorBoundary } from "react-error-boundary";
import AntenneGianni from "./antenna/AntenneGianni";
import BeaconHomepage from "./beacon";
import BeaconEditor from "./beacon/Editor";
import ViewBeacon from "./beacon/ViewBeacon";
import Blog from "./blog";
import MdViewer from "./document/MdViewer";
import EqslRedirect from "./event/EqslRedirect";
import Qso from "./event/Qso";
import QsoManager from "./event/QsoManager";
import Rankings from "./event/Rankings";
import GenerateMapPublicPage from "./map/GenerateMapPublicPage"; // <-- NUOVA IMPORTAZIONE
import Profile from "./profile";
import ResetPw from "./profile/ResetPw";
import reportWebVitals from "./reportWebVitals";
import Social from "./social";
import NewPost from "./social/NewPost";
import ViewPost from "./social/ViewPost";
import ViewPublished from "./social/ViewPublished";

import "leaflet/dist/leaflet.css";
import "react-medium-image-zoom/dist/styles.css";
import "react-placeholder/lib/reactPlaceholder.css";

import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import {
  EventsContext,
  JoinOpenContext,
  SidebarOpenContext,
  ViewsContext,
} from "./App";
import BlogPostEditor from "./blog/Editor";
import BlogPostViewer from "./blog/View";
import FallbackView from "./FallbackView";
import Layout from "./Layout";
import NotFoundPage from "./NotFound";
import SplashLoader, { SplashWrapper } from "./SplashLoader";
import useUserStore from "./stores/userStore";

// Prima della definizione del componente App o nell'useEffect iniziale
axios.interceptors.request.use((config) => {
  // Leggi lo stato SENZA hook (Zustand permette l'accesso diretto)
  const impersonatedUserId = useUserStore.getState().impersonatedUserId;

  if (impersonatedUserId) {
    config.headers["x-impersonate-user"] = impersonatedUserId;
  }
  return config;
});

import "./i18n/i18n";
import "./ga4";
import { CookiesProvider } from "react-cookie";
import usePageTracking from "./hooks/usePageTracking";

const AppRoutes = () => {
  usePageTracking();
  return (
    <SplashWrapper>
      <Suspense fallback={<SplashLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/social" element={<Social />} />
            <Route path="/social/new" element={<NewPost />} />
            <Route path="/u/:callsign" element={<ViewPublished />} />
            <Route path="/social/:id" element={<ViewPost />} />
            <Route path="/eventmanager" element={<AdminManager />} />
            <Route path="/qsomanager/:id" element={<QsoManager />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/rankings/:id" element={<Rankings />} />
            <Route path="/eqsl/:id" element={<EqslRedirect />} />
            <Route path="/qso/:id" element={<Qso />} />
            {/* <Route path="/regolamento" element={<Regolamento />} /> */}
            {/* <Route path="/info" element={<Info />} /> */}
            <Route path="/resetpw" element={<ResetPw />} />
            <Route path="/event/:id" element={<ViewEvent />} />
            <Route path="/document/:name" element={<MdViewer />} />
            <Route path="/beacon" element={<BeaconHomepage />} />
            <Route path="/beacon/editor" element={<BeaconEditor />} />
            <Route path="/beacon/:id" element={<ViewBeacon />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/editor" element={<BlogPostEditor />} />
            <Route path="/blog/:id" element={<BlogPostViewer />} />
            <Route path="/antenne-gianni" element={<AntenneGianni />} />
            {/* NUOVA ROTTA */}
            <Route path="/generate-map" element={<GenerateMapPublicPage />} />
            <Route path="*" element={<NotFoundPage />} />
            {/* <Route
              path="contacts/:contactId"
              element={<Contact />}
            /> */}
          </Route>
        </Routes>
      </Suspense>
    </SplashWrapper>
  );
};

export const App = () => {
  const fetchUser = useUserStore((store) => store.fetchUser);
  console.log({ fetchUser });

  const [events, setEvents] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [views, setViews] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isFetchingEvents = useRef(false);

  useEffect(() => {
    async function fetchEvents() {
      if (isFetchingEvents.current) return;
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

  const [ip, setIp] = useState(null);
  useEffect(() => {
    async function getIp() {
      if (isGettingIp.current) return;
      isGettingIp.current = true;

      try {
        const { data } = await axios.post("https://checkip.amazonaws.com");
        console.log("ip:", data.trim());
        setIp(data.trim());
      } catch (err) {
        console.log("error while fetching ip");
        if (!isAxiosError(err)) return console.error(err);
        return;
      }
    }

    getIp();
  }, []);

  const isFetchingViews = useRef(false);

  useEffect(() => {
    // count view
    let fetchWithoutPost = false;
    async function countView() {
      if (isFetchingViews.current || !ip) return;
      isFetchingViews.current = true;

      try {
        const { data } = await axios.post("/api/counter", { ip });
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
  }, [ip]);

  return (
    <ThemeProvider>
      <ErrorBoundary fallback={<FallbackView />}>
        <CookiesProvider /*  defaultSetOptions={{ path: "/" }} */>
          <EventsContext.Provider value={{ events, setEvents }}>
            <JoinOpenContext.Provider
              value={{
                joinOpen,
                setJoinOpen,
              }}
            >
              <ViewsContext.Provider value={{ views }}>
                <SidebarOpenContext.Provider
                  value={{ sidebarOpen, setSidebarOpen }}
                >
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </SidebarOpenContext.Provider>
              </ViewsContext.Provider>
            </JoinOpenContext.Provider>
          </EventsContext.Provider>
        </CookiesProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export default App;

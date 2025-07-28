import axios from "axios";
import { Button, Spinner } from "flowbite-react";
import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaArchive,
  FaCalendar,
  FaCalendarWeek,
  FaListOl,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserAlt,
  FaUserPlus,
  FaUserShield,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";
import { HiMoon, HiSun } from "react-icons/hi";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { createSearchParams, Link, useLocation } from "react-router";
import { JoinOpenContext, SidebarOpenContext, UserContext } from "../App";
import MobileLanguageSelector from "../MobileLanguageSelector";
import { getErrorStr } from "../shared";

const SectionHref = ({ href, wip, children }) => {
  const { setSidebarOpen } = useContext(SidebarOpenContext);

  const location = useLocation();

  // const navigate = useNavigate();

  return location.pathname === "/" || wip ? (
    <a
      href={href}
      className={`flex items-center gap-2 ${
        wip ? "text-gray-500 cursor-not-allowed" : ""
      }`}
      onClick={() => {
        if (wip) return window.alert("Lavori in corso!");
        setSidebarOpen(false);
        // if (window.location.pathname !== "/") {
        //   navigate("/" + href);
        // }
      }}
    >
      {children}
    </a>
  ) : (
    <SectionLink to={`/${href}`}>{children}</SectionLink>
  );
};

SectionHref.propTypes = {
  href: PropTypes.string.isRequired,
  wip: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

const SectionLink = ({ to, children, redirectBack, ...rest }) => {
  const { setSidebarOpen } = useContext(SidebarOpenContext);

  const location = useLocation();

  return (
    <Link
      to={
        to?.includes("#")
          ? to
          : {
              pathname: to,
              search: redirectBack
                ? createSearchParams({
                    to: location.pathname,
                  }).toString()
                : undefined,
            }
      }
      onClick={() => setTimeout(() => setSidebarOpen(false), 50)}
      className="flex items-center gap-2"
      {...rest}
    >
      {children}
    </Link>
  );
};

SectionLink.propTypes = {
  to: PropTypes.string,
  children: PropTypes.node.isRequired,
  redirectBack: PropTypes.bool,
};

const SectionTitle = ({ children, className, ...rest }) => {
  return (
    <h3
      className={`-mb-1 text-white font-semibold text-lg uppercase ${
        className || ""
      }`}
      {...rest}
    >
      {children}
    </h3>
  );
};

SectionTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

const MenuContent = ({ isSideBar }) => {
  const { user, setUser } = useContext(UserContext);
  const { joinOpen, setJoinOpen } = useContext(JoinOpenContext);
  const [, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);

  const location = useLocation();

  useEffect(() => {
    // On mount, check localStorage for dark mode preference
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    // Update localStorage and html class when darkMode changes
    if (darkMode) {
      localStorage.setItem("darkMode", "true");
      document.documentElement.classList.add("dark");
    } else {
      localStorage.setItem("darkMode", "false");
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (joinOpen) {
      setMenuOpen(false);
    }
  }, [joinOpen]);

  async function logout() {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
    } catch (err) {
      console.log("logout error", getErrorStr(err?.response?.data?.err));
      window.alert(getErrorStr(err?.response?.data?.err));
    }
  }

  const { setSidebarOpen } = useContext(SidebarOpenContext);

  return (
    <>
      <Link to="/" className="flex items-center gap-2 mb-4">
        <LazyLoadImage className="w-14" src="/logo-min.png" alt="Logo" />
        <h3
          className={`font-bold text-xl ${
            isSideBar ? "text-gray-800 dark:text-white" : "text-white"
          }`}
        >
          {t("vhf")}
        </h3>
      </Link>

      <MobileLanguageSelector className="mb-4" />

      {/* Dark mode toggle button */}
      <Button
        onClick={() => setDarkMode(!darkMode)}
        color="light"
        size="sm"
        className="mb-4 dark:bg-gray-700 dark:hover:bg-gray-600"
        title={darkMode ? t("enableLightMode") : t("enableDarkMode")}
      >
        {darkMode ? <HiSun className="w-4" /> : <HiMoon className="w-4" />}
      </Button>

      {user?.isAdmin && (
        <Button
          onClick={() => setSidebarOpen(false)}
          color="failure"
          size="lg"
          as={Link}
          to="/eventmanager"
        >
          {t("adminArea")}
        </Button>
      )}

      <SectionTitle
        className={isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""}
      >
        {t("account")}
      </SectionTitle>
      {user === null ? (
        <>
          <SectionLink to="/login" redirectBack>
            <FaSignInAlt /> <span>{t("enterWithCallsign")}</span>
          </SectionLink>
          <SectionLink to="/signup" redirectBack>
            <FaUserPlus /> <span>{t("signUp")}</span>
          </SectionLink>
        </>
      ) : user ? (
        <>
          <SectionLink to="/profile">
            <FaUserAlt />{" "}
            <span>
              {t("accountOf")} <strong>{user.callsign}</strong>
            </span>
          </SectionLink>
          <SectionLink onClick={logout}>
            <FaSignOutAlt /> <span>{t("logout")}</span>
          </SectionLink>
        </>
      ) : (
        <Spinner />
      )}
      <SectionTitle className="mt-4">{/* DEBUG */}</SectionTitle>
      <SectionHref href="#chisiamo">
        <FaUsers /> {t("whoAreWe")}
      </SectionHref>
      <SectionHref href="#amministratori">
        <FaUserShield />
        {t("admins")}
      </SectionHref>
      <SectionHref href="#eventi">
        <FaCalendar />
        {t("events")}
      </SectionHref>
      <SectionHref href="#calendario">
        <FaCalendarWeek />
        {t("eventCalendar")}
      </SectionHref>

      <SectionTitle
        className={`mt-4 ${
          isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""
        }`}
      >
        {t("flashMob")}
      </SectionTitle>
      <SectionHref href="#storiaflashmob">
        <FaArchive />
        {t("flashMobHistory")}
      </SectionHref>
      <SectionHref href="#istruzioniflashmob">
        <FaListOl />
        {t("menuInstructions")}
      </SectionHref>
      <a
        href="https://chat.whatsapp.com/FJ6HissbZwE47OWmpes7Pr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mb-2"
      >
        <FaWhatsapp />
        {t("whatsappGroup")}
      </a>
      <Button
        as={Link}
        className="text-lg mb-4"
        onClick={() => {
          setSidebarOpen(false);
          setJoinOpen(true);
        }}
        to={
          user
            ? location.pathname === "/"
              ? "#"
              : location.pathname
            : {
                pathname: "/login",
                search: createSearchParams({
                  to: location.pathname,
                }).toString(),
              }
        }
      >
        {t("participate")}
      </Button>

      <SectionTitle
        className={`mt-4 ${
          isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""
        }`}
      >
        {t("myArea")}
      </SectionTitle>

      <SectionLink to="/social" className="text-xl font-semibold">
        {t("photoVideo")}
      </SectionLink>

      <Button className="text-xl mb-4" color="purple" as={Link} to="/beacon">
        {t("beacon")}
      </Button>
    </>
  );
};

MenuContent.propTypes = {
  isSideBar: PropTypes.bool,
};

MenuContent.displayName = "MenuContent";

export default MenuContent;

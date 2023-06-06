import axios from "axios";
import { Button, Spinner } from "flowbite-react";
import React, { useContext, useEffect, useState } from "react";
import {
  FaArchive,
  FaCalendar,
  FaCalendarWeek,
  FaListOl,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserAlt,
  FaUserPlus,
  FaUsers,
  FaUserShield,
  FaWhatsapp
} from "react-icons/fa";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import {
  getErrorStr,
  JoinOpenContext,
  SidebarOpenContext,
  UserContext
} from "..";

const SectionHref = ({ href, wip, children }) => {
  const { setSidebarOpen } = useContext(SidebarOpenContext);

  // const navigate = useNavigate();

  return window.location.pathname === "/" || wip ? (
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
    <SectionLink to={"/" + href}>{children}</SectionLink>
  );
};

const SectionLink = ({ to, children, redirectBack, ...rest }) => {
  const { setSidebarOpen } = useContext(SidebarOpenContext);

  return (
    <Link
      to={
        to?.includes("#")
          ? to
          : {
              pathname: to,
              search: redirectBack
                ? createSearchParams({
                    to: window.location.pathname
                  }).toString()
                : undefined
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

const MenuContent = ({ isSideBar }) => {
  const { user, setUser } = useContext(UserContext);
  const { joinOpen, setJoinOpen } = useContext(JoinOpenContext);
  const [, setMenuOpen] = useState(false);

  useEffect(() => {
    if (joinOpen) {
      setMenuOpen(false);
      if (window.location.pathname !== "/") navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinOpen]);

  const navigate = useNavigate();

  async function logout() {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
    } catch (err) {
      console.log("logout error", getErrorStr(err?.response?.data?.err));
      window.alert(getErrorStr(err?.response?.data?.err));
    }
  }

  return (
    <>
      <Link to="/" className="flex items-center gap-2 mb-2">
        <img className="w-14" src="/logo-min.png" alt="Logo" loading="lazy" />
        <h3
          className={`font-bold text-xl ${
            isSideBar ? "text-gray-800 dark:text-white" : "text-white"
          }`}
        >
          vhfesuperiori
        </h3>
      </Link>

      <SectionTitle
        className={isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""}
      >
        Account
      </SectionTitle>
      {user === null ? (
        <>
          <SectionLink to="/login">
            <FaSignInAlt /> <span>Login</span>
          </SectionLink>
          <SectionLink to="/signup">
            <FaUserPlus /> <span>Registrati</span>
          </SectionLink>
        </>
      ) : user ? (
        <>
          <SectionLink to="/profile">
            <FaUserAlt />{" "}
            <span>
              Account di <strong>{user.callsign}</strong>
            </span>
          </SectionLink>
          <SectionLink onClick={logout}>
            <FaSignOutAlt /> <span>Logout</span>
          </SectionLink>
        </>
      ) : (
        <Spinner />
      )}
      <SectionTitle className="mt-4">{/* DEBUG */}</SectionTitle>
      <SectionHref href="#chisiamo">
        <FaUsers /> Chi siamo
      </SectionHref>
      <SectionHref href="#amministratori">
        <FaUserShield />
        Amministratori
      </SectionHref>
      <SectionHref href="#eventi">
        <FaCalendar /> Eventi
      </SectionHref>
      <SectionHref href="#calendario">
        <FaCalendarWeek /> Calendario eventi
      </SectionHref>

      <SectionTitle
        className={`mt-4 ${
          isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""
        }`}
      >
        Flash mob
      </SectionTitle>
      <SectionHref href="#storiaflashmob">
        <FaArchive /> Storia del flash mob
      </SectionHref>
      <SectionHref href="#istruzioniflashmob">
        <FaListOl /> Istruzioni
      </SectionHref>
      <a
        href="https://chat.whatsapp.com/FJ6HissbZwE47OWmpes7Pr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mb-2"
      >
        <FaWhatsapp /> Gruppo WhatsApp
      </a>
      {user ? (
        <Button className="text-lg mb-4" onClick={() => setJoinOpen(true)}>
          Partecipa
        </Button>
      ) : (
        <Button
          className="text-xl mb-4"
          onClick={() =>
            navigate({
              pathname: "/login",
              search: createSearchParams({
                to: window.location.pathname
              }).toString()
            })
          }
        >
          Partecipa
        </Button>
      )}

      <SectionTitle
        className={`mt-4 ${
          isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""
        }`}
      >
        La mia area
      </SectionTitle>

      <SectionLink to="/social" className="text-xl font-semibold">
        Foto / video
      </SectionLink>
      {/* <SectionHref wip href="#">
        I miei amplificatori lineari e preamplificatori
      </SectionHref>
      <SectionHref wip href="#">
        Le mie realizzazioni
      </SectionHref>
      <SectionHref wip href="#">
        Il mio radio flashmob
      </SectionHref> */}
      <a
        href="/listabeacon20230220.pdf"
        target="_blank"
        className="flex items-center gap-2"
      >
        Beacon
      </a>
    </>
  );
};

export default MenuContent;

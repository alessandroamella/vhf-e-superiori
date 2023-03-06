import {} from "@material-tailwind/react";
import axios from "axios";
import { Button, Spinner } from "flowbite-react";
import React, { createContext, useContext, useEffect, useState } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { getErrorStr, JoinOpenContext, ReadyContext, UserContext } from ".";
import { reveal as BurgerMenuComponent } from "react-burger-menu";

const MenuOpenContext = createContext(false);

const SectionHref = ({ href, wip, children }) => {
  const { setMenuOpen } = useContext(MenuOpenContext);

  const navigate = useNavigate();

  return (
    <a
      href={href}
      className={`flex items-center gap-2 ${
        wip ? "text-gray-500 cursor-not-allowed" : ""
      }`}
      onClick={() => {
        if (wip) return alert("Lavori in corso!");
        setMenuOpen(false);
        if (window.location.pathname !== "/") {
          navigate("/" + href);
        }
      }}
    >
      {children}
    </a>
  );
};

const SectionLink = ({ to, children, ...rest }) => {
  return (
    <Link to={to} className="flex items-center gap-2" {...rest}>
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

const BurgerMenu = () => {
  const { ready } = useContext(ReadyContext);
  const { user, setUser } = useContext(UserContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const { joinOpen, setJoinOpen } = useContext(JoinOpenContext);

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
      alert(getErrorStr(err?.response?.data?.err));
    }
  }

  return (
    <MenuOpenContext.Provider value={{ menuOpen, setMenuOpen }}>
      {ready && (
        <BurgerMenuComponent
          right
          pageWrapId={"page-wrap"}
          outerContainerId={"outer-container"}
          isOpen={menuOpen}
          onStateChange={state => setMenuOpen(state.isOpen)}
        >
          <SectionTitle>Account</SectionTitle>
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
              <SectionLink to="#" onClick={logout}>
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

          <SectionTitle className="mt-4">Flash mob</SectionTitle>
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
            className="flex items-center gap-2"
          >
            <FaWhatsapp /> Gruppo WhatsApp
          </a>
          {user ? (
            <Button className="text-lg mb-4" onClick={() => setJoinOpen(true)}>
              Partecipa
            </Button>
          ) : (
            <Button className="text-xl mb-4" onClick={() => navigate("/login")}>
              Partecipa
            </Button>
          )}

          <SectionTitle className="mt-4">La mia area</SectionTitle>

          <SectionHref wip href="#">
            Le mie antenne
          </SectionHref>
          <SectionHref wip href="#">
            I miei amplificatori lineari e preamplificatori
          </SectionHref>
          <SectionHref wip href="#">
            Le mie realizzazioni
          </SectionHref>
          <SectionHref wip href="#">
            Il mio radio flashmob
          </SectionHref>
          <a
            href="/listabeacon20230220.pdf"
            target="_blank"
            className="flex items-center gap-2"
          >
            Beacon
          </a>
        </BurgerMenuComponent>
      )}
    </MenuOpenContext.Provider>
  );
};

export default BurgerMenu;

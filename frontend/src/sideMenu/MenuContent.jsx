import axios from "axios";
import { Button, Spinner } from "flowbite-react";
import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
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
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate
} from "react-router";
import { JoinOpenContext, SidebarOpenContext, UserContext } from "../App";
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
    <SectionLink to={"/" + href}>{children}</SectionLink>
  );
};

SectionHref.propTypes = {
  href: PropTypes.string.isRequired,
  wip: PropTypes.bool,
  children: PropTypes.node.isRequired
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
                    to: location.pathname
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

SectionLink.propTypes = {
  to: PropTypes.string,
  children: PropTypes.node.isRequired,
  redirectBack: PropTypes.bool
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
  className: PropTypes.string
};

const MenuContent = ({ isSideBar }) => {
  const { user, setUser } = useContext(UserContext);
  const { joinOpen, setJoinOpen } = useContext(JoinOpenContext);
  const [, setMenuOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (joinOpen) {
      setMenuOpen(false);
    }
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
        <LazyLoadImage className="w-14" src="/logo-min.png" alt="Logo" />
        <h3
          className={`font-bold text-xl ${
            isSideBar ? "text-gray-800 dark:text-white" : "text-white"
          }`}
        >
          vhfesuperiori
        </h3>
      </Link>

      {user?.isAdmin && (
        <Button color="failure" size="lg" as={Link} to="/eventmanager">
          Area admin
        </Button>
      )}

      <SectionTitle
        className={isSideBar ? "text-gray-700 mb-1 dark:text-white" : ""}
      >
        Account
      </SectionTitle>
      {user === null ? (
        <>
          <SectionLink to="/login" redirectBack>
            <FaSignInAlt /> <span>Entra col nominativo</span>
          </SectionLink>
          <SectionLink to="/signup" redirectBack>
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
            <FaSignOutAlt /> <span>Esci</span>
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
        <Button
          className="text-lg mb-4"
          onClick={() => {
            if (location.pathname !== "/") {
              navigate("/");
            }
            setJoinOpen(true);
          }}
        >
          Partecipa
        </Button>
      ) : (
        <Button
          className="text-xl mb-4"
          onClick={() =>
            navigate({
              pathname: "/login",
              search: createSearchParams({
                to: location.pathname
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

      <Button className="text-xl mb-4" color="purple" as={Link} to="/beacon">
        Beacon
      </Button>
    </>
  );
};

MenuContent.propTypes = {
  isSideBar: PropTypes.bool
};

MenuContent.displayName = "MenuContent";

export default MenuContent;

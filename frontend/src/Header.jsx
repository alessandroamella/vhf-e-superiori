import { Button, Spinner } from "flowbite-react";
import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi"; // Import icons
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "./App";
import Flags from "./Flags";

const LinkButton = ({ to, children, keepCurrent }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  // if keepCurrent is true, add to search params "to=${current location}"
  const searchParams = new URLSearchParams(); // don't use current search params
  if (keepCurrent) {
    searchParams.set("to", location.pathname);
  }

  return (
    <Link
      to={{ pathname: to, search: searchParams.toString() }}
      className="w-full"
    >
      <Button color={isActive ? "purple" : "info"} className="uppercase w-full">
        {children}
      </Button>
    </Link>
  );
};

LinkButton.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  keepCurrent: PropTypes.bool
};

const Header = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [darkMode, setDarkMode] = useState(false); // State for dark mode

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className="bg-lightGray-normal dark:bg-gray-800 dark:text-white py-4 px-2 md:px-8">
      <div className="flex flex-col lg:flex-row md:items-center gap-4">
        <Link
          to="/"
          className="flex gap-2 items-center hover:scale-105 transition-transform w-fit"
        >
          <LazyLoadImage
            className="w-20 md:w-36"
            src="/logo-min.png"
            alt="Logo"
          />
          <h1
            className={`font-bold text-xl md:text-3xl block text-red-500 ${
              isHome ? "underline" : ""
            } dark:text-white`}
          >
            www.vhfesuperiori.eu
          </h1>
        </Link>
        <div className="hidden md:block">
          <Flags />
        </div>
        <div className="mx-auto md:ml-auto md:mr-16 lg:mr-20 scale-125 flex items-center gap-4">
          <form
            action="https://www.paypal.com/donate"
            method="post"
            target="_top"
          >
            <input type="hidden" name="business" value="7AY7WF3G8SVHY" />
            <input type="hidden" name="no_recurring" value="0" />
            <input
              type="hidden"
              name="item_name"
              value="Aiutaci a sostenere Vhfesuperiori, stiamo facendo il massimo per offrirti un servizio migliore. Grazie!"
            />
            <input type="hidden" name="currency_code" value="EUR" />
            <input
              type="image"
              src="https://www.paypalobjects.com/it_IT/IT/i/btn/btn_donate_LG.gif"
              border="0"
              name="submit"
              title="Aiutaci a sostenere VHF e superiori!"
              alt="Fai una donazione con il pulsante PayPal"
            />
            <img
              alt=""
              border="0"
              src="https://www.paypal.com/it_IT/i/scr/pixel.gif"
              width="1"
              height="1"
            />
          </form>
          {/* Dark mode toggle button */}
          <Button
            onClick={toggleDarkMode}
            color="light"
            size="sm"
            className="mb-2 dark:bg-gray-700 dark:hover:bg-gray-600"
            title={
              darkMode ? "Abilita modalità chiara" : "Abilita modalità scura"
            }
          >
            {darkMode ? <HiSun className="w-4" /> : <HiMoon className="w-4" />}
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 justify-items-center">
        <LinkButton to="/social">Foto / video</LinkButton>
        <LinkButton to="/beacon">Beacon</LinkButton>
        {user === false ? (
          <Spinner />
        ) : user ? (
          <LinkButton to="/profile">
            Profilo di{" "}
            <span className="font-semibold ml-1">{user.callsign}</span>
          </LinkButton>
        ) : (
          <LinkButton to="/login" keepCurrent>
            Entra con il tuo nominativo
          </LinkButton>
        )}
        {user === false ? (
          <Spinner />
        ) : user ? (
          <LinkButton to={`/u/${user.callsign}`}>Le mie mappe</LinkButton>
        ) : (
          <LinkButton to="/signup" keepCurrent>
            Registrati
          </LinkButton>
        )}
      </div>
    </header>
  );
};

export default Header;

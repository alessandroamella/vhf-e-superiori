import { Button, Spinner } from "flowbite-react";
import PropTypes from "prop-types";
import ReactGA from "react-ga4";
import { useTranslation } from "react-i18next";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link, useLocation } from "react-router";
import Flags from "./Flags";
import LogoBtns from "./homepage/LogoBtns";
import useUserStore from "./stores/userStore";

const LinkButton = ({ to, children, keepCurrent }) => {
  const location = useLocation();
  const isActive = to && location.pathname?.startsWith(to);

  // if keepCurrent is true, add to search params "to=${current location}"
  const searchParams = new URLSearchParams(); // don't use current search params
  if (keepCurrent) {
    searchParams.set("to", location.pathname);
  }

  return (
    <Button
      as={Link}
      to={{ pathname: to, search: searchParams.toString() }}
      color={isActive ? "purple" : "info"}
      className="uppercase w-full h-fit"
    >
      {children}
    </Button>
  );
};

LinkButton.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  keepCurrent: PropTypes.bool,
};

const Header = () => {
  const user = useUserStore((store) => store.user);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const { t } = useTranslation();

  return (
    <header className="bg-lightGray-normal dark:bg-gray-800 dark:text-white py-4 px-2 md:px-8">
      <div className="flex flex-col lg:flex-row md:items-center gap-4">
        <div className="w-full flex items-center gap-4">
          <Link to="/">
            <LazyLoadImage
              className="w-20 md:w-36 cursor-pointer hover:scale-105 transition-transform"
              src="/logo-min.png"
              alt="Logo"
            />
          </Link>
          <div className="flex md:min-w-[500px] flex-col gap-2">
            <div className="flex items-center gap-">
              <Link
                to="/"
                className="hover:scale-105 transition-transform w-fit"
              >
                <h1
                  className={`font-bold text-xl md:text-3xl block text-red-500 ${
                    isHome ? "underline" : ""
                  } dark:text-white`}
                >
                  www.vhfesuperiori.eu
                </h1>
              </Link>
              <div className="hidden md:flex md:ml-4">
                <Flags />
              </div>
            </div>
            <div className="hidden md:block">
              <LogoBtns />
            </div>
          </div>
        </div>
        <div className="mx-auto md:ml-auto md:mr-16 lg:mr-20 scale-125 flex items-center gap-4">
          <form
            action="https://www.paypal.com/donate"
            method="post"
            target="_top"
            onClick={() =>
              ReactGA.event({ category: "Donation", action: "Click" })
            }
          >
            <input type="hidden" name="business" value="7AY7WF3G8SVHY" />
            <input type="hidden" name="no_recurring" value="0" />
            <input
              type="hidden"
              name="item_name"
              value="Ti piace il progetto VHF e Superiori? Se vuoi, puoi aiutarci a sostenerne i costi di gestione con una libera donazione. Grazie!"
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
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 justify-items-center items-center">
        <div className="block md:hidden col-span-2 w-full">
          <LogoBtns />
        </div>
        <LinkButton to="/social">{t("photoVideo")}</LinkButton>
        <LinkButton to="/beacon">{t("beacon")}</LinkButton>
        {user === false ? (
          <Spinner />
        ) : user ? (
          <LinkButton to="/profile">
            {t("profileOf")}{" "}
            <span className="font-semibold ml-1">{user.callsign}</span>
          </LinkButton>
        ) : (
          <LinkButton to="/login" keepCurrent>
            {t("enterWithCallsign")}
          </LinkButton>
        )}
        <LinkButton to="/rankings">{t("scoreboards")}</LinkButton>
      </div>
    </header>
  );
};

export default Header;

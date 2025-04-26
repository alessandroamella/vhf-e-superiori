import { Spinner } from "flowbite-react";
import { useContext } from "react";
import { FaCircle } from "react-icons/fa";
import { Link } from "react-router";
import { ReadyContext, ViewsContext } from "./App";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { ready } = useContext(ReadyContext);
  const { views } = useContext(ViewsContext);
  const { t } = useTranslation(); 

  return (
    ready && (
      <div className="bg-lightGray-normal dark:bg-gray-700 dark:text-white p-4 flex items-center flex-col md:flex-row justify-center">
        <span className="text-center">
          {t("websiteBy")}{" "}
          <a
            href="https://www.bitrey.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
          >
            IU4QSG
          </a>
        </span>

        <FaCircle className="hidden md:block scale-[.25] text-gray-700 dark:text-gray-300 mx-2" />

        <span className="text-center">
          <Link
            to="/document/tos"
            className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
          >
            {t("termsAndConditions")}
          </Link>
        </span>

        <FaCircle className="hidden md:block scale-[.25] text-gray-700 dark:text-gray-300 mx-2" />

        <span className="text-center">
          <Link
            to="/document/privacy"
            className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
          >
            {t("privacyPolicy")}
          </Link>
        </span>

        <FaCircle className="hidden md:block scale-[.25] text-gray-700 dark:text-gray-300 mx-2" />

        <span className="text-center">
           {t("accessCounter")}:{" "}
          {views ? (
            <strong>{views}</strong>
          ) : views === false ? (
            <Spinner />
          ) : (
            <span>{t("loadingError")}💀💀</span>
          )}
        </span>
        {/* <FaCircle className="hidden md:block scale-[.25] text-gray-700 mx-2" />
        <span className="text-center">
          Aperto per commissioni{" "}
          <a
            href="mailto:info@bitrey.it"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted text-center hover:text-black transition-colors"
          >
            info@bitrey.it
          </a>
        </span> */}
      </div>
    )
  );
};

export default Footer;

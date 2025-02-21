import { Spinner } from "flowbite-react";
import { useContext } from "react";
import { FaCircle } from "react-icons/fa";
import { ReadyContext, ViewsContext } from "./App";
import { Link } from "react-router-dom";

const Footer = () => {
  const { ready } = useContext(ReadyContext);
  const { views } = useContext(ViewsContext);

  return (
    ready && (
      <div className="bg-lightGray-normal dark:bg-gray-700 dark:text-white p-4 flex items-center flex-col md:flex-row justify-center">
        <span className="text-center">
          Sito sviluppato da Alessandro Amella{" "}
          <a
            href="https://www.bitrey.it"
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
            Termini e Condizioni
          </Link>
        </span>

        <FaCircle className="hidden md:block scale-[.25] text-gray-700 dark:text-gray-300 mx-2" />

        <span className="text-center">
          <Link
            to="/document/privacy"
            className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
          >
            Privacy Policy
          </Link>
        </span>

        <FaCircle className="hidden md:block scale-[.25] text-gray-700 dark:text-gray-300 mx-2" />

        <span className="text-center">
          Contatore accessi:{" "}
          {views ? (
            <strong>{views}</strong>
          ) : views === false ? (
            <Spinner />
          ) : (
            <span>errore nel caricamento💀💀</span>
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

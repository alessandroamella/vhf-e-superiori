import { useContext } from "react";
// import { FaCircle, FaDotCircle } from "react-icons/fa";
import { ReadyContext } from ".";

const Footer = () => {
  const { ready } = useContext(ReadyContext);
  return (
    ready && (
      <div className="bg-lightGray-normal dark:bg-gray-700 dark:text-white p-4 flex items-center flex-col md:flex-row justify-center">
        <span className="text-center">
          Sito sviluppato da Alessandro Amella{" "}
          <a
            href="https://www.qrz.com/db/IU4QSG"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
          >
            IU4QSG
          </a>
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

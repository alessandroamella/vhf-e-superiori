import { useContext } from "react";
import { FaCircle, FaDotCircle } from "react-icons/fa";
import { ReadyContext } from ".";

const Footer = () => {
  const { ready } = useContext(ReadyContext);
  return (
    ready && (
      <div className="bg-lightGray-normal p-8 flex items-center justify-center">
        <span className="text-center">Sito costruito da Alessandro Amella</span>
        <FaCircle className="scale-[.25] text-gray-700 mx-2" />
        <a
          href="mailto:info@bitrey.it"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted text-center hover:text-black transition-colors"
        >
          info@bitrey.it
        </a>
      </div>
    )
  );
};

export default Footer;

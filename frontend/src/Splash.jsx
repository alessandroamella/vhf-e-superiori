import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Splash = ({ ready }) => {
  const text = "vhfesuperiori.eu";

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const character = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className={`splashLeave absolute z-50 transition-transform duration-1000 ease-in bg-gray-900 text-white first-letter flex top-0 left-0 right-0 overflow-hidden ${
        ready ? "-translate-y-full" : ""
      }`}
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div className="w-screen h-screen flex flex-col row justify-center items-center">
        <LazyLoadImage
          src="/logo-min.png"
          alt="Logo"
          className="w-96 max-w-[50vw]"
        />
        <motion.h1
          className="font-bold text-3xl md:text-5xl ml-0 flex overflow-hidden"
          aria-label={text}
        >
          {text.split("").map((char, index) => (
            <motion.span
              key={`${char}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: here elements are static
                index
              }`}
              variants={character}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char} {/* Render space correctly */}
            </motion.span>
          ))}
        </motion.h1>
      </div>
    </motion.div>
  );
};

Splash.propTypes = {
  ready: PropTypes.bool.isRequired,
};

export default Splash;

import AnimatedText from "react-animated-text-content";
import { LazyLoadImage } from "react-lazy-load-image-component";
import PropTypes from "prop-types";

const Splash = ({ ready }) => {
  return (
    <div
      className={`splashLeave absolute z-50 transition-transform duration-1000 ease-in bg-gray-900 text-white first-letter flex top-0 left-0 right-0 overflow-hidden ${
        ready ? "-translate-y-full" : ""
      }`}
    >
      <div className="w-screen h-screen flex flex-col row justify-center items-center">
        <LazyLoadImage
          src="/logo-min.png"
          alt="Logo"
          className="w-96 max-w-[50vw]"
        />
        {ready ? (
          <>
            <h1 className="font-bold text-3xl md:text-5xl ml-0">
              vhfesuperiori.eu
            </h1>
          </>
        ) : (
          <>
            <AnimatedText
              type="chars"
              animation={{
                ease: "ease-in-out"
              }}
              animationType="float"
              interval={0.06}
              duration={0.8}
              tag="h1"
              className="animated-paragraph font-bold text-3xl md:text-5xl"
              includeWhiteSpaces
              threshold={0.1}
              rootMargin="20%"
            >
              vhfesuperiori.eu
            </AnimatedText>
          </>
        )}

        {/* <h1 className="text-bold tracking-tighter text-4xl ml-5">
          vhfesuperiori.eu
        </h1> */}
      </div>
    </div>
  );
};

Splash.propTypes = {
  ready: PropTypes.bool.isRequired
};

export default Splash;

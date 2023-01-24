import React from "react";
import AnimatedText from "react-animated-text-content";

const Splash = ({ ready }) => {
  return (
    <div
      className={`splashLeave absolute z-50 transition-transform duration-1000 ease-in bg-gray-900 text-white first-letter flex top-0 left-0 right-0 overflow-hidden ${
        ready ? "-translate-y-full" : ""
      }`}
    >
      <div className="w-screen h-screen flex flex-col md:flex-row justify-center items-center">
        <img src="/logo-min.png" alt="Logo" className="w-96 max-w-[50vw]" />
        {ready ? (
          <h1 className="font-bold text-3xl md:text-5xl ml-0 md:ml-12">
            vhfesuperiori.eu
          </h1>
        ) : (
          <AnimatedText
            type="chars"
            animation={{
              ease: "ease-in-out"
            }}
            animationType="float"
            interval={0.06}
            duration={0.8}
            tag="h1"
            className="animated-paragraph font-bold text-3xl md:text-5xl ml-0 md:ml-12"
            includeWhiteSpaces
            threshold={0.1}
            rootMargin="20%"
          >
            vhfesuperiori.eu
          </AnimatedText>
        )}

        {/* <h1 className="text-bold tracking-tighter text-4xl ml-5">
          
        </h1> */}
      </div>
    </div>
  );
};

export default Splash;

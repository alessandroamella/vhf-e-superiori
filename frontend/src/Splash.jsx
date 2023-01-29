import { differenceInDays } from "date-fns";
import React, { useState } from "react";
import { useEffect } from "react";
import { useContext } from "react";
import AnimatedText from "react-animated-text-content";
import { EventsContext } from ".";

const Splash = ({ ready }) => {
  // const { events } = useContext(EventsContext);

  // const [shownEvent, setShownEvent] = useState(null);

  // useEffect(() => {
  //   if (!events) return;
  //   const now = new Date();
  //   console.log("lo c erco", events);
  //   for (const e of events) {
  //     const diff = differenceInDays(new Date(e.date), now);
  //     if (
  //       diff >= 0 &&
  //       diff <= 14 &&
  //       e.logoUrl &&
  //       e.logoUrl !== "/logo-min.png"
  //     ) {
  //       console.log({ diff });
  //       setShownEvent(e);
  //       return;
  //     }
  //   }
  // }, [events]);

  return (
    <div
      className={`splashLeave absolute z-50 transition-transform duration-1000 ease-in bg-gray-900 text-white first-letter flex top-0 left-0 right-0 overflow-hidden ${
        ready ? "-translate-y-full" : ""
      }`}
    >
      <div className="w-screen h-screen flex flex-col md:flex-row justify-center items-center">
        <img src="/logo-min.png" alt="Logo" className="w-96 max-w-[50vw]" />
        {ready ? (
          <>
            <h1 className="font-bold text-3xl md:text-5xl ml-0 md:ml-12">
              vhfesuperiori.eu
            </h1>
            {/* {shownEvent && (
              <img className="w-96" src={shownEvent.logoUrl} alt="Next event" />
            )} */}
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
              className="animated-paragraph font-bold text-3xl md:text-5xl ml-0 md:ml-12"
              includeWhiteSpaces
              threshold={0.1}
              rootMargin="20%"
            >
              vhfesuperiori.eu
            </AnimatedText>
            {/* {shownEvent && (
              <img className="w-96" src={shownEvent.logoUrl} alt="Next event" />
            )} */}
          </>
        )}

        {/* <h1 className="text-bold tracking-tighter text-4xl ml-5">
          
        </h1> */}
      </div>
    </div>
  );
};

export default Splash;

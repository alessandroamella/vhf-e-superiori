import React from "react";
import AnimatedText from "react-animated-text-content";

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
      <div className="w-screen h-screen flex flex-col row justify-center items-center">
        <img
          loading="eager"
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

export default Splash;

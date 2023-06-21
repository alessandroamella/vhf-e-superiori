import React from "react";
import {
  LazyLoadImage,
  trackWindowScroll
} from "react-lazy-load-image-component";

const Bandiere = ({ scrollPosition }) => {
  return (
    <div className="flex md:mt-2 md:ml-4 xl:ml-8 gap-2 md:gap-4">
      {/* <img className="w-8" src="/bandiere/italy.png" alt="Italy" /> */}
      <LazyLoadImage
        width={32}
        scrollPosition={scrollPosition}
        height={32}
        src="/bandiere/spain.png"
        alt="Spain"
      />
      <LazyLoadImage
        width={32}
        scrollPosition={scrollPosition}
        height={32}
        src="/bandiere/france.png"
        alt="France"
      />
      <LazyLoadImage
        width={32}
        scrollPosition={scrollPosition}
        height={32}
        src="/bandiere/germany.png"
        alt="Germany"
      />
      <LazyLoadImage
        width={32}
        scrollPosition={scrollPosition}
        height={32}
        src="/bandiere/malta.png"
        alt="Malta"
      />
    </div>
  );
};

export default trackWindowScroll(Bandiere);

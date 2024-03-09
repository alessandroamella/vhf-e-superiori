import React from "react";
import Flag from "react-world-flags";

const Flags = ({ scrollPosition }) => {
  // Italy, Spain, France, Germany, Malta
  return (
    <div className="flex gap-2">
      {[
        ["IT", "Italia"],
        ["ES", "España"],
        ["FR", "France"],
        ["DE", "Deutschland"],
        ["MT", "Malta"]
      ].map(([countryCode, countryName]) => (
        <Flag
          key={countryCode}
          code={countryCode}
          className="w-[32px] h-[32px] drop-shadow"
          alt={countryName}
          title={countryName}
        />
      ))}
    </div>
  );
};

export default Flags;

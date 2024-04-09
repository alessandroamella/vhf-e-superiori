import React from "react";

const MapWatermark = () => {
  return (
    <div className="absolute right-8 bottom-8 z-50 flex items-center gap-1">
      <img
        className="w-16 h-16 drop-shadow"
        src="/logo512.png"
        alt="vhfesuperiori"
      />
      <p className="text-red-500 drop-shadow-md font-bold tracking-tight text-2xl">
        vhfesuperiori.eu
      </p>
    </div>
  );
};

export default MapWatermark;

import { LazyLoadImage } from "react-lazy-load-image-component";

const MapWatermark = () => {
  return (
    <div className="absolute right-6 md:right-8 bottom-8 z-[1000]">
      <div className="relative flex items-center gap-1">
        <LazyLoadImage
          className="w-12 z-50 aspect-square drop-shadow-md"
          src="/logo-min.png"
          alt="vhfesuperiori"
        />
        <p className="z-50 text-red-500 drop-shadow-md font-bold tracking-tighter text-2xl">
          vhfesuperiori.eu
        </p>
        <div className="absolute z-0 top-2 bottom-2 left-6 -right-2 rounded-xl bg-white/75" />
      </div>
    </div>
  );
};

export default MapWatermark;

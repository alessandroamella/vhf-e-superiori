import { Button } from "flowbite-react";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { UserContext } from "../App";

const AirscoutBtn = () => {
  const url = "https://forms.gle/3NctoQ7Sy8ksbBQR7";

  const { user } = useContext(UserContext);

  const [search, setSearch] = useSearchParams();

  const isOpenAirscout = search.get("openairscout") === "true";

  useEffect(() => {
    if (isOpenAirscout && user) {
      search.delete("openairscout");
      setSearch(search);
      window.open(url, "_blank");
    }
  }, [isOpenAirscout, search, setSearch, user]);

  return (
    <Button
      as={user ? "a" : Link}
      to={user ? url : `/login?to=/&openairscout=true`}
      href={user ? url : `/login?to=/&openairscout=true`}
      target={user ? "_blank" : undefined}
      rel={user ? "noopener noreferrer" : undefined}
      className="w-full m-0 p-0 md:p-2 bg-[#fe8f44] hover:bg-[#fb7c2b] dark:bg-[#fe8f44] dark:hover:bg-[#fb7c2b] text-black font-bold uppercase"
    >
      <div className="hidden md:flex flex-col items-center justify-center leading-tight">
        <span className="tracking-wide">AirScout</span>
        <span className="tracking-widest">Italia</span>
      </div>
      <div className="flex md:hidden flex-col items-center justify-center leading-tight">
        <span className="tracking-wide">AirScout Italia</span>
      </div>
    </Button>
  );
};

const LogoBtns = () => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 md:gap-4 md:justify-start">
      <AirscoutBtn />

      <Button
        as={Link}
        to="/antenne-gianni"
        className="w-full bg-[#A0CFE7] m-0 p-0 hover:bg-[##87b0c4] dark:bg-[#6b8c9c] dark:hover:bg-[#536c78] text-black dark:text-white font-bold uppercase"
      >
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="tracking-wide">{t("gianni.mainTitle")}</span>
        </div>
      </Button>

      <div className="relative col-span-2 lg:col-span-1 w-full">
        {/* giallo con testo nero (bianco in dark) */}
        <Link
          to="/generate-map"
          className="w-full bg-[#FFFE69] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#dedd52] transition-colors h-full text-center flex items-center justify-center"
        >
          {t("generateMap.generateYourMap")}
        </Link>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse z-10">
          {t("new")}
        </span>
      </div>
    </div>
  );
};

export default LogoBtns;

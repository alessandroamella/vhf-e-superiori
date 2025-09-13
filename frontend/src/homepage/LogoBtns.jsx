import { Button } from "flowbite-react";
import { useContext, useEffect } from "react";
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
      className="w-full md:w-auto m-0 p-0 md:p-2 bg-[#fe8f44] hover:bg-[#fb7c2b] dark:bg-[#fe8f44] dark:hover:bg-[#fb7c2b] text-black font-bold uppercase min-w-[120px]"
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
  return (
    <div className="flex gap-2 md:gap-4 md:justify-start">
      <AirscoutBtn />

      <Button
        as={Link}
        to="/antenne-gianni"
        className="w-full md:w-auto bg-[#A0CFE7] m-0 p-0 hover:bg-[##87b0c4] dark:bg-[#6b8c9c] dark:hover:bg-[#536c78] text-black dark:text-white font-bold uppercase min-w-[120px]"
      >
        <div className="hidden md:flex flex-col items-center justify-center leading-tight">
          <span className="tracking-wide">Progetti antenne Yagi</span>
          <span className="tracking-widest">I4GBZ</span>
        </div>
        <div className="flex md:hidden flex-col items-center justify-center leading-tight">
          <span className="tracking-wide">Progetti antenne Yagi I4GBZ</span>
        </div>
      </Button>
    </div>
  );
};

export default LogoBtns;

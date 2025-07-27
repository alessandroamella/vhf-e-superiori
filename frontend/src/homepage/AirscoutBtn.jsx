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
      className="mb-2 bg-[#fe8f44] hover:bg-[#fb7c2b] dark:bg-[#fe8f44] dark:hover:bg-[#fb7c2b] text-black font-bold uppercase min-w-[120px]"
    >
      <div className="flex flex-col items-center justify-center leading-tight">
        <span className="tracking-wide">AirScout</span>
        <span className="tracking-widest">Italia</span>
      </div>
    </Button>
  );
};

export default AirscoutBtn;

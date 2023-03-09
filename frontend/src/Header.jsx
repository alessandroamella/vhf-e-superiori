import { Link } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { UserContext } from ".";

const Header = () => {
  const { user } = useContext(UserContext);

  return (
    <header className="bg-lightGray-normal dark:bg-gray-800 dark:text-white py-4 px-8 flex flex-col lg:flex-row items-center">
      <Link
        to="/"
        className="flex items-center hover:scale-105 transition-transform"
      >
        <img
          className="w-28 md:w-36"
          src="/logo-min.png"
          alt="Logo"
          loading="lazy"
        />
        <Typography
          variant="h1"
          className="font-bold ml-3 hidden md:block text-red-500 dark:text-white"
        >
          www.vhfesuperiori.eu
        </Typography>
      </Link>
      <div className="flex mt-2 ml-4 xl:ml-8 gap-2 md:gap-4">
        {/* <img className="w-8" src="/bandiere/italy.png" alt="Italy" /> */}
        <img className="w-8" src="/bandiere/france.png" alt="France" />
        <img className="w-8" src="/bandiere/germany.png" alt="Germany" />
        <img className="w-8" src="/bandiere/malta.png" alt="Malta" />
        <img className="w-8" src="/bandiere/spain.png" alt="Spain" />
      </div>
      {user?.isAdmin && (
        <Link
          to="/eventmanager"
          className="bg-red-600 text-white p-2 ml-6 rounded font-medium"
        >
          Gestione eventi (admin)
        </Link>
      )}
    </header>
  );
};

export default Header;

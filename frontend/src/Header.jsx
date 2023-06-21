import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from ".";
import Bandiere from "./Bandiere";
import { Button } from "flowbite-react";
import { LazyLoadImage } from "react-lazy-load-image-component";

const Header = () => {
  const { user } = useContext(UserContext);

  const navigate = useNavigate();

  return (
    <header className="bg-lightGray-normal dark:bg-gray-800 dark:text-white py-4 px-2 md:px-8 flex flex-col lg:flex-row md:items-center">
      <Link
        to="/"
        className="flex items-center hover:scale-105 transition-transform w-fit"
      >
        <LazyLoadImage
          className="w-20 md:w-36"
          src="/logo-min.png"
          alt="Logo"
        />
        <h1 className="font-bold text-xl md:text-3xl ml-2 md:ml-3 block text-red-500 dark:text-white">
          www.vhfesuperiori.eu
        </h1>
      </Link>
      <div className="hidden md:block">
        <Bandiere />
      </div>
      <div className="flex justify-center md:ml-6 lg:ml-12">
        <Button className="uppercase" onClick={() => navigate("/social")}>
          Foto / video
        </Button>
      </div>
      {user?.isAdmin && (
        <div className="flex justify-center">
          <Link
            to="/eventmanager"
            className="bg-red-600 text-white p-2 ml-6 rounded font-medium"
          >
            Gestione eventi (admin)
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;

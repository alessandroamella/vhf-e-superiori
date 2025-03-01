import { Button } from "flowbite-react";
import { HiHome, HiOutlineArrowLeft } from "react-icons/hi";
import { Link } from "react-router";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-lg">
        {/* Error Message */}
        <h1 className="text-7xl font-extrabold text-gray-700 dark:text-gray-300 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          Pagina non trovata
        </h2>
        <p className="text-gray-500 dark:text-gray-500 mb-8">
          La pagina che stai cercando non esiste o è stata rimossa.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            color="blue"
            as={Link}
            to={-1}
            className="inline-flex items-center justify-center"
          >
            <HiOutlineArrowLeft className="mr-2 h-5 w-5" />
            Torna indietro
          </Button>

          <Button
            color="gray"
            as={Link}
            to="/"
            className="inline-flex items-center dark:text-white justify-center"
          >
            <HiHome className="mr-2 h-5 w-5" />
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

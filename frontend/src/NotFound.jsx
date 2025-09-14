import { Button } from "flowbite-react";
import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useTranslation } from "react-i18next";
import { HiHome, HiOutlineArrowLeft } from "react-icons/hi";
import { Link, useLocation } from "react-router";

const NotFoundPage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname) return;
    // Log 404 error to Google Analytics
    ReactGA.event({
      category: "Error",
      action: "404 Not Found",
      label: location.pathname,
      nonInteraction: true,
    });
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-lg">
        {/* Error Message */}
        <h1 className="text-7xl font-extrabold text-gray-700 dark:text-gray-300 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          {t("pageNotFound")}
        </h2>
        <p className="text-gray-500 dark:text-gray-500 mb-8">
          {t("pageRemoved")}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            as={Link}
            to={-1}
            className="inline-flex items-center justify-center"
          >
            <HiOutlineArrowLeft className="mr-2 h-5 w-5" />
            {t("goBack")}
          </Button>

          <Button
            color="gray"
            as={Link}
            to="/"
            outline
            className="inline-flex items-center dark:text-white justify-center"
          >
            <HiHome className="mr-2 h-5 w-5" />
            {t("goBackToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

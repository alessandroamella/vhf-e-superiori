import { Alert } from "flowbite-react";
import { useTranslation } from "react-i18next";
import { FaSadCry } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";

const FallbackView = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-3 h-full min-w-full min-h-full dark:bg-gray-900">
      <a href="/" className="flex items-center gap-2 mb-4">
        <LazyLoadImage
          className="w-12 md:w-24 cursor-pointer hover:scale-105 transition-transform"
          src="/logo-min.png"
          alt="Logo"
        />

        <h1 className="font-bold text-xl md:text-3xl block text-red-500 hover:text-red-600 dark:text-white dark:hover:text-gray-300 transition-colors">
          www.vhfesuperiori.eu
        </h1>
      </a>
      <Alert color="warning">
        <FaSadCry className="inline" /> {t("errors.GENERIC_ERROR")}
      </Alert>
      <div className="my-4 flex items-center flex-col">
        <LazyLoadImage
          src="https://cataas.com/cat/says/sad%20catto"
          alt="cat"
          className="mt-4 rounded-lg shadow-lg max-w-sm min-h-[450px] object-contain"
        />
        <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
          {t("errors.CONTACT_ADMIN")}
        </div>
      </div>
    </div>
  );
};

export default FallbackView;

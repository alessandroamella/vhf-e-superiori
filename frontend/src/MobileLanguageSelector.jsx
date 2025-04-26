import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { FaLanguage } from "react-icons/fa";
import Flag from "react-world-flags";

const MobileLanguageSelector = ({ className }) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "it", name: "Italiano", countryCode: "IT" },
    { code: "es", name: "Español", countryCode: "ES" },
    { code: "fr", name: "Français", countryCode: "FR" },
    { code: "de", name: "Deutsch", countryCode: "DE" },
    { code: "mt", name: "Malti", countryCode: "MT" },
    { code: "en", name: "English", countryCode: "GB" }
  ];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className={`${className || ""}`}>
      <div className="flex items-center mb-2">
        <FaLanguage size={20} className="text-white mr-2" />
        <span className="text-white text-sm font-medium">
          {t("changeLanguage")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              i18n.language === language.code
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
            title={language.name}
          >
            <Flag
              code={language.countryCode}
              className="w-5 h-5 drop-shadow"
              alt={language.name}
            />
            <span className="text-xs">{language.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

MobileLanguageSelector.propTypes = {
  className: PropTypes.string
};

export default MobileLanguageSelector;

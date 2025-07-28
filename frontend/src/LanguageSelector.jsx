import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { FaLanguage } from "react-icons/fa";
import Flag from "react-world-flags";

const LanguageSelector = ({ className }) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "it", name: "Italiano", countryCode: "IT" },
    { code: "es", name: "Español", countryCode: "ES" },
    { code: "fr", name: "Français", countryCode: "FR" },
    { code: "de", name: "Deutsch", countryCode: "DE" },
    { code: "mt", name: "Malti", countryCode: "MT" },
    { code: "en", name: "English", countryCode: "GB" },
  ];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <div className={className}>
      <Menu placement="bottom-end">
        <MenuHandler>
          <Button
            variant="text"
            className="flex items-center gap-2 px-3 text-white text-sm"
            title={t("changeLanguage")}
          >
            <Flag
              code={currentLanguage.countryCode}
              className="w-5 h-5 drop-shadow"
              alt={currentLanguage.name}
            />
            <span className="hidden md:inline">{currentLanguage.name}</span>
            <FaLanguage size={20} className="md:hidden" />
          </Button>
        </MenuHandler>
        <MenuList className="min-w-[150px]">
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`flex items-center gap-2 ${
                i18n.language === language.code ? "bg-gray-100 font-medium" : ""
              }`}
            >
              <Flag
                code={language.countryCode}
                className="w-5 h-5 drop-shadow"
                alt={language.name}
              />
              {language.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </div>
  );
};

LanguageSelector.propTypes = {
  className: PropTypes.string,
};

export default LanguageSelector;

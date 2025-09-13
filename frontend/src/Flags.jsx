import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";

const Flags = () => {
  const { i18n } = useTranslation(); // Usa il contesto i18n per accedere alla funzione di cambio lingua

  // Funzione per gestire il cambio di lingua
  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode); // Cambia la lingua in base al codice della lingua selezionata
  };

  return (
    <div className="flex gap-2">
      {[
        ["IT", "Italiano", "it"],
        ["ES", "Español", "es"],
        ["FR", "Français", "fr"],
        ["DE", "Deutsch", "de"],
        ["MT", "Malti", "mt"],
        ["GB", "English", "en"],
      ].map(([countryCode, countryName, languageCode]) => (
        <div
          key={countryCode}
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={() => handleLanguageChange(languageCode)}
        >
          <Flag
            code={countryCode}
            className="w-[32px] h-[32px] drop-shadow"
            alt={countryName}
            title={countryName}
          />
        </div>
      ))}
    </div>
  );
};

export default Flags;

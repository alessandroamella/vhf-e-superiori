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
        ["IT", "Italia", "it"], // Italia
        ["ES", "España", "es"], // Spagna
        ["FR", "France", "fr"], // Francia
        ["DE", "Deutschland", "de"], // Germania
        ["MT", "Malta", "mt"], // Malta
        ["GB", "United Kingdom", "en"] // Aggiunto l'Inghilterra (bandiera e lingua)
      ].map(([countryCode, countryName, languageCode]) => (
        <div
          key={countryCode}
          className="cursor-pointer"
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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend) // carica le traduzioni da un file (locale o remoto)
  .use(LanguageDetector) // rileva automaticamente la lingua dell'utente
  .use(initReactI18next) // collega i18next con React
  .init({
    fallbackLng: 'it', // lingua di fallback se non trovata
    debug: true,
    interpolation: {
      escapeValue: false, // React già fa l'escaping
    },
    react: {
      useSuspense: false, // per evitare problemi con il caricamento
    },
    backend: {
      loadPath: '/locales/{{lng}}.json', // Ora carica da "public/locales"
    },
  });

export default i18n;
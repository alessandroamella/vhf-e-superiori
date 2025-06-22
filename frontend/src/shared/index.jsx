import { AxiosError } from "axios";
import i18n from "../i18n";

function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function getErrorStr(str) {
  console.log("Stringa errore:", str);

  const raw =
    str instanceof Error
      ? str.message
      : typeof str === "string"
      ? str
      : str?.toString() || "UNKNOWN_ERROR";

  const arr = raw.split(",").map((s) => s.trim());

  const translated = [...new Set(arr)].map((key) => {
    const translation = i18n.t(`errors.${key}`);
    return translation !== `errors.${key}`
      ? translation
      : typeof key === "string"
      ? `Errore: ${key}`
      : i18n.t("errors.UNKNOWN_ERROR") +
        (key instanceof AxiosError ? ` (${key.status} - ${key.message})` : "");
  });

  return translated
    .map((msg, idx) => (idx === 0 ? msg : lowercaseFirstLetter(msg)))
    .join(", ");
}

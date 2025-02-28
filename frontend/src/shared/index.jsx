export const errors = {
  USER_NOT_FOUND: "Utente non trovato. Potrebbe essere stato cancellato",
  INVALID_PW: "Password non valida",
  WRONG_PW: "Password errata",
  DOC_NOT_FOUND:
    "Documento non trovato. Potrebbe essere stato cancellato o non esistere",
  SERVER_ERROR: "Errore del server",
  LOGIN_TOKEN_EXPIRED: "Login scaduto",
  UNKNOWN_ERROR: "Errore sconosciuto",
  MISSING_ENV: "Variabile d'ambiente mancante (server)",
  ALREADY_REGISTERED:
    "Un utente con questo nominativo / email / telefono esiste già, per favore fai il login",
  INVALID_LOCATION: "Posizione non valida",
  QRZ_NO_KEY: "Chiave di QRZ non trovata (server)",
  QRZ_OM_NOT_FOUND: "Utente non trovato su QRZ",
  QTH_NOT_FOUND: "QTH non trovato",
  INVALID_OBJECT_ID:
    "ObjectId non valido. Il documento potrebbe non esistere o essere stato cancellato.",
  INVALID_LOGIN: "Login non valido",
  NOT_LOGGED_IN: "Devi fare il login per procedere",
  MALFORMED_REQUEST_BODY: "Corpo della richiesta malformato",
  NOT_AN_ADMIN: "Devi essere un amministratore per procedere",
  EVENT_NOT_FOUND: "Evento non trovato",
  EVENT_JOIN_ALREADY_REQUESTED:
    "Richiesta di partecipazione all'evento già effettuata",
  EVENT_JOIN_TIME_EXPIRED:
    "La data per richiedere di partecipare all'evento è già trascorsa",
  EVENT_JOIN_TIME_TOO_EARLY:
    "La data per richiedere di partecipare all'evento non è ancora arrivata",
  JOIN_REQUEST_NOT_FOUND: "Richiesta di partecipazione non trovata",
  URL_NOT_FOUND: "URL non trovato",
  INVALID_EMAIL: "Email non valida",
  EMAIL_ALREADY_IN_USE: "Email già in uso",
  INVALID_PHONE_NUMBER: "Numero di telefono non valido",
  PHONE_NUMBER_ALREADY_IN_USE: "Numero di telefono già in uso",
  MUST_ACCEPT_SIGNUP_TOS:
    "Per registrarti, devi accettare i termini e condizioni",
  MUST_ACCEPT_EVENT_TOS:
    "Per continuare, devi accettare i termini e condizioni",
  CAPTCHA_FAILED: "ReCAPTCHA non passato",
  WEAK_PW: "Password troppo debole",
  USER_NOT_VERIFIED:
    "Utente non verificato, per favore verifica il tuo account cliccando il link che hai ricevuto per email",
  USER_ALREADY_VERIFIED: "Utente già verificato",
  VERIFICATION_CODE_NOT_FOUND: "Codice di verifica non trovato",
  INVALID_VERIFICATION_CODE: "Codice di verifica non valido",
  INVALID_PW_RESET_CODE: "Codice per reimpostare la password non valido",
  INVALID_PICS_NUM: "Numero di immagini non valido",
  INVALID_VIDS_NUM: "Numero di video non valido",
  INVALID_FREQUENCY_BAND: "Banda di frequenza non valida",
  INVALID_FILE_MIME_TYPE: "Formato file non valido",
  FILE_SIZE_TOO_LARGE: "Dimensione del file troppo grande",
  FILE_NOT_FOUND: "File non trovato",
  INVALID_POST: "Post non valido",
  COMMENT_NOT_FOUND: "Commento non trovato",
  COMMENT_NOT_OWNER: "Devi essere il proprietario del commento per procedere",
  TOO_MANY_FILES: "Troppi file",
  TOO_MANY_PICTURES: "Troppe immagini",
  TOO_MANY_VIDEOS: "Troppi video",
  POST_NOT_FOUND: "Post non trovato. Potrebbe essere stato cancellato",
  MUST_BE_POST_OWNER: "Devi essere il proprietario del post per procedere",
  VIDEO_COMPRESS_NO_OUTPUT_PATH:
    "Percorso di output per compressione video non presente",
  NO_CONTENT: "Nessun contenuto",
  INVALID_QSO: "QSO non valido",
  JOIN_REQUEST_NOT_APPROVED: "Richiesta di partecipazione non approvata",
  QSO_NOT_FOUND: "QSO non trovato. Potrebbe essere stato cancellato",
  QSO_NOT_OWNED: "Devi essere il proprietario del QSO per procedere",
  ERROR_CREATING_IMAGE: "Errore nella creazione dell'immagine",
  NOT_AUTHORIZED_TO_EQSL: "Non sei autorizzato a creare una eQSL",
  NO_IMAGE_TO_EQSL: "Nessuna immagine da usare per la eQSL",
  INVALID_ADIF: "File ADIF non valido",
  INVALID_ADIF_EXCLUDE: "Esclusione ADIF non valida",
  INVALID_NAME: "Nome non valido",
  INVALID_CALLSIGN: "Nominativo non valido",
  INVALID_COMMENT: "Commento non valido",
  POST_IS_PROCESSING: "Il post è in fase di elaborazione",
  BEACON_EXISTS: "Beacon già esistente",
  INVALID_BEACON: "Beacon non valido",
  BEACON_NOT_FOUND: "Beacon non trovato. Potrebbe essere stato cancellato",
  NO_EMAIL_FOUND:
    "Nessuna email trovata. Forse il nominativo è errato, o l'utente non ha inserito la propria email su QRZ.",
  ERROR_QTH_PARSE: "Errore nel parsing del QTH",
  INVALID_MODE: "Modo non valido",
  INVALID_DATE: "Data non valida",
  INVALID_NOTES: "Note non valide",
  INVALID_LOCATOR: "Locator non valido",
  INVALID_FREQUENCY: "Frequenza non valida",
  INVALID_RST: "RST non valido",
  INVALID_CITY: "Città non valida",
  INVALID_PROVINCE: "Provincia non valida",
  INVALID_LATITUDE: "Latitudine non valida",
  INVALID_LONGITUDE: "Longitudine non valida",
  INVALID_HAMSL: "Altezza non valida",
  INVALID_ANTENNA: "Antenna non valida",
  INVALID_QTF: "QTF non valido",
  INVALID_POWER: "Potenza non valida",
  INVALID_CONTENT: "Contenuto non valido",
  INVALID_TITLE: "Titolo non valido",
  INVALID_TAGS: "Tag non validi",
  INVALID_IMAGE: "Immagine non valida",
  MUST_BE_DEV:
    "Devi essere uno sviluppatore del sito per completare questa azione"
};

function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function getErrorStr(str) {
  console.log("Stringa errore:", str);
  const arr = (
    str instanceof Error
      ? str.message
      : typeof str === "string"
      ? str
      : str?.toString() || errors.UNKNOWN_ERROR
  )
    .split(",")
    .map(s => s.trim());
  return [
    ...new Set(
      arr.map(str =>
        str && str in errors
          ? errors[str]
          : typeof str === "string"
          ? "Errore: " + str
          : errors.UNKNOWN_ERROR
      )
    )
  ]
    .map((e, i) => (i === 0 ? e : lowercaseFirstLetter(e)))
    .join(", ");
}

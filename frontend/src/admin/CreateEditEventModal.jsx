import { Typography } from "@material-tailwind/react";
import axios from "axios";
import Compressor from "compressorjs";
import { getYear, parse } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";
import {
  Alert,
  Button,
  FileInput,
  Label,
  Modal,
  Spinner,
  TextInput,
} from "flowbite-react";
import PropTypes from "prop-types";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  FaClipboard,
  FaClipboardCheck,
  FaExternalLinkAlt,
  FaUndo,
} from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link } from "react-router";
import { EventsContext, UserContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import ViewJoinRequest from "./ViewJoinRequest";

const CreateEditEventModal = ({
  showModal,
  setShowModal,
  eventEditing,
  setEventEditing,
  setAlertFromParent,
}) => {
  const { setEvents } = useContext(EventsContext);
  const { user } = useContext(UserContext);

  const transformToISODate = useCallback((dateString) => {
    // Parse the input date string assuming Rome timezone
    const romeTimeZone = "Europe/Rome";

    // Parse the input format first
    const parsedDate = parse(dateString, "yyyy-MM-dd'T'HH:mm", new Date());

    // Convert to UTC considering Rome timezone
    const utcDate = zonedTimeToUtc(parsedDate, romeTimeZone);

    // Return the ISO string
    return utcDate.toISOString();
  }, []);

  const [disabled, setDisabled] = useState(false);
  const [alert, setAlert] = useState(null);

  const [name, setName] = useState("");
  const [band, setBand] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, -14) + "T10:00",
  );
  const [joinStart, setJoinStart] = useState(
    new Date(`${getYear(new Date())}/01/01`).toISOString().slice(0, -14) +
      "T00:00",
  );
  const [joinDeadline, setJoinDeadline] = useState(
    new Date().toISOString().slice(0, -14) + "T10:00",
  );
  const [logoUrl, setLogoUrl] = useState("/logo-min.png");
  const [eqslUrl, setEqslUrl] = useState("/logo-min.png");
  const [eqslExample, setEqslExample] = useState(null);

  const [offsetCallsign, setOffsetCallsign] = useState(null);
  const [offsetData, setOffsetData] = useState(null);
  const [offsetFrom, setOffsetFrom] = useState(null);

  const [isCompressingPic, setIsCompressingPic] = useState(false);

  const pictureInputRef = useRef(null);
  const eqslInputRef = useRef(null);

  const [uploadedPic, setUploadedPic] = useState(null);
  const [eqslPic, setEqslPic] = useState(null);

  const [copiedError, setCopiedError] = useState(false);
  const [copied, setCopied] = useState(false);
  let copyTimeout = null;

  const [isEditingOffset, setIsEditingOffset] = useState(false);
  const [tempOffsetCallsign, setTempOffsetCallsign] = useState(null);
  const [tempOffsetData, setTempOffsetData] = useState(null);
  const [tempOffsetFrom, setTempOffsetFrom] = useState(null);

  const resetForm = useCallback(() => {
    setName("");
    setBand("");
    setDate(new Date().toISOString().slice(0, -14) + "T10:00");
    setJoinStart(new Date("2023/01/01").toISOString().slice(0, -14) + "T00:00");
    setJoinDeadline(new Date().toISOString().slice(0, -14) + "T10:00");
    setLogoUrl("/logo-min.png");
    setEqslUrl("/logo-min.png");
    setEqslExample(null);
    setOffsetCallsign(null);
    setOffsetData(null);
    setOffsetFrom(null);

    setTempOffsetCallsign(null);
    setTempOffsetData(null);
    setTempOffsetFrom(null);
    setIsEditingOffset(false);

    resetPicture();
    resetEqsl();
    setAlert(null);
  }, []);

  useEffect(() => {
    if (!eventEditing) {
      resetForm();
    }
  }, [eventEditing, resetForm]);

  useEffect(() => {
    if (!showModal) {
      resetForm();
    } else if (eventEditing) {
      const e = events && events.find((e) => e._id === eventEditing);
      if (e) {
        populateForm(e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, eventEditing]);

  const { events } = useContext(EventsContext);

  const populateForm = useCallback((e) => {
    setName(e.name);
    setBand(e.band);
    setDate(formatInTimeZone(e.date, "Europe/Rome", "yyyy-MM-dd'T'HH:mm"));
    setJoinStart(
      formatInTimeZone(e.joinStart, "Europe/Rome", "yyyy-MM-dd'T'HH:mm"),
    );
    setJoinDeadline(
      formatInTimeZone(e.joinDeadline, "Europe/Rome", "yyyy-MM-dd'T'HH:mm"),
    );
    setLogoUrl(e.logoUrl);
    setEqslUrl(e.eqslUrl);

    setOffsetCallsign(e.offsetCallsign);
    setOffsetData(e.offsetData);
    setOffsetFrom(e.offsetFrom);

    setTempOffsetCallsign(e.offsetCallsign);
    setTempOffsetData(e.offsetData);
    setTempOffsetFrom(e.offsetFrom);
  }, []);

  async function createEvent(e) {
    e.preventDefault();

    setDisabled(true);

    try {
      const obj = {
        name,
        band,
        date,
        joinStart,
        joinDeadline,
        logoUrl,
        eqslUrl,
        offsetCallsign,
        offsetData,
        offsetFrom,
      };

      ["date", "joinStart", "joinDeadline"].forEach((e) => {
        if (obj[e]) {
          obj[e] = transformToISODate(obj[e]);
        }
      });

      const { data } = !eventEditing
        ? await axios.post("/api/event", obj)
        : await axios.put(`/api/event/${eventEditing}`, obj);
      console.log("event", data);
      setShowModal(false);
      setEventEditing(null);

      setAlert({
        color: "success",
        msg: `Evento "${name}" ${
          !eventEditing ? "creato" : "modificato"
        } con successo`,
      });
      setAlertFromParent({
        color: "success",
        msg: `Evento "${name}" ${
          !eventEditing ? "creato" : "modificato"
        } con successo`,
      });

      try {
        const { data } = await axios.get("/api/event");
        console.log("events fetched (admin)", data);
        setEvents(data);
      } catch (err) {
        console.log("Errore nel caricamento degli eventi", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
        setAlertFromParent({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
        setEvents(null);
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.log(err.response?.data?.err || err);
      window.alert(
        "ERRORE crea evento: " + getErrorStr(err?.response?.data?.err || err),
      );
    } finally {
      setDisabled(false);
    }
  }

  const uploadEventPic = async (uploadedPic) => {
    const formData = new FormData();
    formData.append("content", uploadedPic);

    try {
      const { data } = await axios.post("/api/event/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 2 * 60 * 1000, // 2 minutes timeout
      });
      console.log("filesPath", data);
      return data;
    } catch (err) {
      console.log(err);
      window.alert(
        "ERRORE upload immagine: " + getErrorStr(err?.response?.data?.err),
      );
      return null;
    }
  };

  const compressPic = (f) => {
    return new Promise((resolve, reject) => {
      new Compressor(f, {
        quality: 0.6,
        success(result) {
          console.log("compressed img", result);
          return resolve(result);
        },
        error(err) {
          console.log("compress img error");
          console.log(err.message);
          return reject(err);
        },
      });
    });
  };

  const handlePictureChange = async (event) => {
    const { files } = event.target;
    if (!files || files.length <= 0) return;
    else if (files.length > 1) {
      window.alert("Solo una foto per evento");
      resetPicture();
      return;
    }
    setDisabled(true);
    setIsCompressingPic(true);

    let pic;
    try {
      pic = await compressPic(files[0]);
      console.log("pic", pic);
      setUploadedPic(pic);
    } catch (err) {
      console.log("compress pic err", err);
      window.alert(
        "Errore nella compressione (in caso mandamelo): " +
          err +
          "\nJSON: " +
          JSON.stringify(err, null, 2),
      );
      return;
    } finally {
      setDisabled(false);
      setIsCompressingPic(false);
    }

    try {
      setDisabled(true);
      const filePath = await uploadEventPic(pic);
      setDisabled(false);
      setLogoUrl(filePath.path);
      window.alert(
        "Path immagine: " +
          filePath.path +
          '\nRICORDA DI PREMERE IL TASTO "Applica modifiche"',
      );
    } catch (err) {
      window.alert("ERRORE upload immagine (outer): " + getErrorStr(err));
    } finally {
      setDisabled(false);
    }
  };

  // don't have to compress eqsl
  const handleEqslChange = async (event) => {
    const { files } = event.target;
    if (!files || files.length <= 0) return;
    else if (files.length > 1) {
      window.alert("Solo una foto per evento");
      resetPicture();
      return;
    }
    setDisabled(true);

    try {
      const formData = new FormData();
      formData.append("content", files[0]);

      const { data } = await axios.post("/api/event/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 2 * 60 * 1000, // 2 minutes timeout,
        params: { isEqsl: true, quality: 80 }, // higher quality for eqsl
      });
      console.log("filesPath", data);
      setEqslPic(data.path);
      window.alert(
        "Path immagine: " +
          data.path +
          '\nRICORDA DI PREMERE IL TASTO "Applica modifiche"',
      );
      setEqslUrl(data.path);

      if (!user.city || !user.province) {
        window.alert(
          "Ricordati di aggiornare la tua città e provincia per poter visualizzare l'anteprima dell'EQSL",
        );
      } else {
        await renderEqslExample(data.path);
      }
    } catch (err) {
      window.alert("ERRORE upload immagine (outer): " + getErrorStr(err));
    } finally {
      setDisabled(false);
    }
  };

  async function renderEqslExample(
    _eqslPic,
    _offsetCallsign,
    _offsetData,
    _offsetFrom,
  ) {
    _eqslPic = _eqslPic || eqslPic || eqslUrl;
    _offsetCallsign = _offsetCallsign || offsetCallsign;
    _offsetData = _offsetData || offsetData;
    _offsetFrom = _offsetFrom || offsetFrom;

    if (!_eqslPic) {
      window.alert("Carica prima un'immagine EQSL");
      return;
    }
    try {
      setDisabled(true);

      if (!_offsetCallsign || !_offsetData || !_offsetFrom) {
        // const { offsetCallsign, offsetData, offsetFrom } = editOffset(false);

        // _offsetCallsign = offsetCallsign;
        // _offsetData = offsetData;
        // _offsetFrom = offsetFrom;

        return window.alert(
          "Inserisci prima l'offset per poter visualizzare l'anteprima dell'EQSL",
        );
      }

      const res2 = await axios.post("/api/eqsl/preview", {
        href: _eqslPic,
        offsetCallsign: _offsetCallsign,
        offsetData: _offsetData,
        offsetFrom: _offsetFrom,
      });
      console.log("eqsl preview", res2.data);
      setEqslExample(res2.data.href);
    } catch (err) {
      window.alert("ERRORE render EQSL: " + getErrorStr(err));
    } finally {
      setDisabled(false);
    }
  }

  const applyOffset = async () => {
    if (
      [tempOffsetCallsign, tempOffsetData, tempOffsetFrom].some((e) =>
        isNaN(parseInt(e)),
      )
    ) {
      window.alert(
        "Non hai inserito tutti i campi, l'offset non è stato modificato",
      );
      return;
    }

    setOffsetCallsign(parseInt(tempOffsetCallsign));
    setOffsetData(parseInt(tempOffsetData));
    setOffsetFrom(parseInt(tempOffsetFrom));
    setIsEditingOffset(false);

    await renderEqslExample(
      null,
      tempOffsetCallsign,
      tempOffsetData,
      tempOffsetFrom,
    );
  };

  const cancelOffsetEdit = () => {
    setTempOffsetCallsign(offsetCallsign);
    setTempOffsetData(offsetData);
    setTempOffsetFrom(offsetFrom);
    setIsEditingOffset(false);
  };

  function resetPicture() {
    if (pictureInputRef.current) pictureInputRef.current.value = null;
    setUploadedPic(null);
  }

  function resetEqsl() {
    if (eqslInputRef.current) eqslInputRef.current.value = null;
    setEqslPic(null);
  }

  async function copyText() {
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      setCopied(false);
      setCopiedError(false);
    }, 1000);
    try {
      await navigator.clipboard.writeText(
        window.location.origin + "/qsomanager/" + eventEditing,
      );
      setCopied(true);
      setCopiedError(false);
    } catch (err) {
      console.log("copy error", err);
      setCopiedError(true);
    }
  }

  const [joinRequests, setJoinRequests] = useState(null);

  const fetchJoinRequests = useCallback(async (eventId) => {
    setJoinRequests(null);
    try {
      const { data } = await axios.get(
        "/api/joinrequest/eventadmin/" + eventId,
      );
      console.log("joinRequests", data);

      setJoinRequests(data);
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      setJoinRequests(false);
    }
  }, []);

  useEffect(() => {
    if (eventEditing) {
      fetchJoinRequests(eventEditing);
    }
  }, [eventEditing, fetchJoinRequests]);

  return (
    <Modal
      position="center"
      size="7xl"
      show={showModal}
      onClose={() => {
        setShowModal(false);
        setEventEditing(null);
      }}
    >
      <form onSubmit={createEvent}>
        <Modal.Header>
          {!eventEditing ? "Crea" : "Modifica"} evento
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-2 flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-4">
            {alert && (
              <Alert
                className="mb-4 dark:text-black"
                color={alert.color}
                onDismiss={() => setAlert(null)}
              >
                <span>{alert.msg}</span>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col items-center">
                  <p className="mb-2 block dark:text-gray-100">Locandina</p>
                  <LazyLoadImage
                    src={logoUrl}
                    alt="Logo URL"
                    className="w-96 max-w-full max-h-96 object-contain m-auto drop-shadow-lg"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <p className="mb-2 block dark:text-gray-100">EQSL</p>
                  <LazyLoadImage
                    src={eqslUrl}
                    alt="EQSL URL"
                    className="w-96 max-w-full max-h-96 object-contain m-auto drop-shadow-lg"
                  />

                  {eqslExample && (
                    <div className="flex flex-col items-center">
                      <p className="mb-2 mt-4 md:mt-0 font-semibold tracking-tight block dark:text-white">
                        Esempio EQSL
                      </p>
                      <LazyLoadImage
                        src={eqslExample}
                        alt="EQSL example"
                        className="w-96 max-w-full max-h-96 object-contain m-auto drop-shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="my-auto">
                <div className="mb-2 block">
                  <Label htmlFor="event-logo-url" value="URL locandina" />
                </div>

                <div className="flex items-center gap-2">
                  <TextInput
                    id="event-logo-url"
                    type="text"
                    required={true}
                    className="w-full"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    disabled={disabled}
                  />

                  <Button
                    onClick={() => setLogoUrl("/logo-min.png")}
                    disabled={disabled}
                  >
                    Resetta
                  </Button>
                </div>

                <div className="my-4">
                  <Label
                    htmlFor="uploadedPic"
                    value="Locandina (MAX 10MB COMPRESSA)"
                  />
                  <div className="flex items-center gap-2">
                    <FileInput
                      disabled={disabled}
                      helperText={(isCompressingPic || disabled) && <Spinner />}
                      id="uploadedPic"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="w-full"
                      ref={pictureInputRef}
                    />
                    <Button
                      color="dark"
                      onClick={resetPicture}
                      disabled={disabled || !uploadedPic}
                    >
                      <FaUndo />
                    </Button>
                  </div>
                </div>

                <div className="my-auto">
                  <div className="mb-2 block">
                    <Label htmlFor="event-eqsl-url" value="URL EQSL" />
                  </div>

                  <div className="flex items-center gap-2">
                    <TextInput
                      id="event-eqsl-url"
                      type="text"
                      required={true}
                      className="w-full"
                      value={eqslUrl}
                      onChange={(e) => setEqslUrl(e.target.value)}
                      disabled={disabled}
                    />

                    <Button
                      onClick={() => {
                        setEqslUrl("/logo-min.png");
                        setEqslExample(null);
                      }}
                      disabled={disabled}
                    >
                      Resetta
                    </Button>
                  </div>
                </div>

                <div className="my-4">
                  <Label htmlFor="eqslPic" value="EQSL (MAX 10MB COMPRESSA)" />
                  <div className="flex items-center gap-2">
                    <FileInput
                      disabled={disabled}
                      helperText={disabled && <Spinner />}
                      id="eqslPic"
                      accept="image/*"
                      onChange={handleEqslChange}
                      className="w-full"
                      ref={eqslInputRef}
                    />
                    <Button
                      color="dark"
                      onClick={resetEqsl}
                      disabled={disabled || !eqslPic}
                    >
                      <FaUndo />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mt-2 flex justify-center items-center gap-2">
                    {!isEditingOffset ? (
                      <Button
                        disabled={disabled}
                        onClick={() => {
                          setIsEditingOffset(true);
                        }}
                        color="light"
                        size="sm"
                      >
                        Modifica offset ({offsetCallsign || "x"},{" "}
                        {offsetData || "x"}, {offsetFrom || "x"})
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          disabled={disabled}
                          onClick={applyOffset}
                          color="green"
                          size="sm"
                        >
                          Applica Offset
                        </Button>
                        <Button
                          disabled={disabled}
                          onClick={cancelOffsetEdit}
                          color="red"
                          size="sm"
                        >
                          Annulla
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingOffset && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <div>
                        <Label
                          htmlFor="offset-callsign"
                          value="Offset Nominativo"
                        />
                        <TextInput
                          id="offset-callsign"
                          type="number"
                          value={tempOffsetCallsign || ""}
                          onChange={(e) =>
                            setTempOffsetCallsign(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="offset-data" value="Offset Dati" />
                        <TextInput
                          id="offset-data"
                          type="number"
                          value={tempOffsetData || ""}
                          onChange={(e) => setTempOffsetData(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="offset-from" value="Offset Da Chi" />
                        <TextInput
                          id="offset-from"
                          type="number"
                          value={tempOffsetFrom || ""}
                          onChange={(e) => setTempOffsetFrom(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {!isEditingOffset && (
                    <div className="mt-2 flex justify-center items-center gap-2">
                      <Button
                        onClick={applyOffset}
                        color="dark"
                        size="sm"
                        disabled={!eqslUrl || disabled}
                      >
                        Ricomputa esempio eQSL
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {eventEditing ? (
              <div className="flex flex-col">
                <hr className="mb-2" />
                <p className="dark:text-gray-200">
                  URL da condividere con stazioni attivatrici:
                </p>

                <div className="flex items-center gap-2">
                  <TextInput
                    className="font-bold w-full"
                    color={
                      copied ? "success" : copiedError ? "failure" : "light"
                    }
                    onClick={copyText}
                    onChange={() => {}}
                    value={
                      window.location.origin + "/qsomanager/" + eventEditing
                    }
                  />
                  <Button
                    onClick={copyText}
                    size="sm"
                    color={
                      copied ? "success" : copiedError ? "failure" : "dark"
                    }
                    disabled={copied}
                  >
                    {copied ? <FaClipboardCheck /> : <FaClipboard />}
                    <span className="ml-1">
                      {copied ? "Copiato" : copiedError ? "Errore" : "Copia"}
                    </span>
                  </Button>
                </div>
                <div className="flex items-center flex-col md:flex-row justify-center gap-2 md:gap-6 mt-4">
                  <Link
                    to={"/qsomanager/" + eventEditing}
                    className="flex items-center gap-2 hover:text-red-600 transition-colors"
                  >
                    <FaExternalLinkAlt />
                    <span>Apri QSO Manager</span>
                  </Link>
                  <Link
                    to={"/rankings/" + eventEditing}
                    className="flex items-center gap-2 hover:text-red-600 transition-colors"
                  >
                    <FaExternalLinkAlt />
                    <span>Apri Classifiche</span>
                  </Link>
                </div>
                <hr className="mt-2" />
              </div>
            ) : (
              <p className="dark:text-white">
                <span className="font-bold">QSO Manager</span>:{" "}
                <span className="font-normal">
                  disponibile solo dopo la creazione dell&apos;evento
                </span>
              </p>
            )}

            <div>
              <div className="mb-2 block">
                <Label htmlFor="event-name" value="Nome" />
              </div>
              <TextInput
                id="event-name"
                type="text"
                placeholder="11^ edizione contest 144MHz..."
                required={true}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="event-band" value="Banda" />
              </div>
              <TextInput
                id="event-band"
                type="text"
                placeholder="VHF"
                required={true}
                value={band}
                onChange={(e) => setBand(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-1 md:gap-4 md:grid-cols-3">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="event-date" value="Data" />
                </div>
                <TextInput
                  id="event-date"
                  type="datetime-local"
                  required={true}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label
                    htmlFor="event-join-start"
                    value="Data minima richiesta di partecipazione"
                  />
                </div>
                <TextInput
                  id="event-join-start"
                  type="datetime-local"
                  required={true}
                  value={joinStart}
                  onChange={(e) => setJoinStart(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label
                    htmlFor="event-join-deadline"
                    value="Scadenza richiesta di partecipazione"
                  />
                </div>
                <TextInput
                  id="event-join-deadline"
                  type="datetime-local"
                  required={true}
                  value={joinDeadline}
                  onChange={(e) => setJoinDeadline(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>

            {eventEditing && (
              <div className="min-h-[60vh] overflow-auto">
                <Typography variant="h4" className="pb-2 dark:text-white">
                  Richieste di partecipazione
                </Typography>
                {joinRequests === null ? (
                  <Spinner />
                ) : joinRequests === false ? (
                  <p className="dark:text-gray-300">Errore nel caricamento</p>
                ) : joinRequests.length > 0 ? (
                  <ViewJoinRequest
                    disabled={disabled}
                    joinRequests={joinRequests}
                    setAlert={setAlert}
                    setDisabled={setDisabled}
                    setJoinRequests={setJoinRequests}
                  />
                ) : (
                  <p className="dark:text-gray-300">Ancora nessuna richiesta</p>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center gap-2">
            <Button
              color="gray"
              type="button"
              disabled={disabled}
              onClick={() => {
                setShowModal(false);
                setEventEditing(null);
              }}
            >
              Chiudi
            </Button>
            <Button type="submit" disabled={disabled}>
              {!eventEditing ? "Crea evento" : "Applica modifiche"}
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

CreateEditEventModal.propTypes = {
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  eventEditing: PropTypes.object,
  setEventEditing: PropTypes.func,
  setAlertFromParent: PropTypes.func,
};

export default CreateEditEventModal;

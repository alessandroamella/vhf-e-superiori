import { Typography } from "@material-tailwind/react";
import axios from "axios";
import {
  Alert,
  Badge,
  Button,
  Dropdown,
  FileInput,
  Checkbox,
  Label,
  Modal,
  Spinner,
  Table,
  TextInput,
  Tooltip,
  Timeline,
  Card
} from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import React, {
  createRef,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { format, zonedTimeToUtc } from "date-fns-tz";
import { getErrorStr, UserContext } from "..";
import Layout from "../Layout";
import {
  Link,
  createSearchParams,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  FaBackward,
  FaCheck,
  FaDatabase,
  FaEnvelope,
  FaExternalLinkAlt,
  FaForward,
  FaInfoCircle,
  FaPlusCircle,
  FaShare,
  FaUndo
} from "react-icons/fa";
import { useCookies } from "react-cookie";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import { useMap } from "@uidotdev/usehooks";

const QsoManager = () => {
  const { user } = useContext(UserContext);

  const [disabled, setDisabled] = useState(true);
  const [alert, setAlert] = useState(null);

  const [fromStation, setFromStation] = useState(null);
  const [users, setUsers] = useState(false);

  const { id } = useParams();
  const [event, setEvent] = useState(false);
  const [qsos, setQsos] = useState(false);

  const [hasPermission, setHasPermission] = useState(false);

  const [highlighted, setHighlighted] = useState(null);

  const eqslSending = useMap();

  const isEventStation =
    event &&
    user &&
    Array.isArray(event.joinRequests) &&
    event.joinRequests
      ?.filter(e => e.isApproved)
      ?.map(e => e.fromUser.callsign)
      ?.includes(user.callsign);

  useEffect(() => {
    async function getUsers() {
      try {
        const { data } = await axios.get("/api/auth/all", {
          params: {
            sortByCallsign: true
          }
        });
        console.log("users", data);
        setUsers(data);
        setFromStation(data.find(e => e.callsign === user.callsign) || data[0]);
      } catch (err) {
        console.log("Errore nel caricamento degli utenti", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setUsers(null);
      }
    }
    if (user?.isAdmin && !users) getUsers();
  }, [event, isEventStation, user, users]);

  const [showAddressWarning, setShowAddressWarning] = useState(true);

  useEffect(() => {
    async function getEvent() {
      try {
        const { data } = await axios.get("/api/event/" + id);
        console.log("event", data);
        setEvent(data);
      } catch (err) {
        console.log("Errore nel caricamento dell'evento", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setEvent(null);
      }
    }
    async function getQsos() {
      try {
        const { data } = await axios.get("/api/qso", {
          params: {
            event: id,
            fromStation: user.isAdmin ? undefined : user._id
          }
        });
        console.log("QSOs", data);
        data.sort((a, b) => new Date(a.qsoDate) - new Date(b.qsoDate));
        setQsos(data);
      } catch (err) {
        console.log("Errore nel caricamento dei QSO", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setQsos(null);
      }
    }
    if (user && id && (event === false || qsos === false)) {
      if (!event) getEvent();
      if (!qsos) getQsos();
    }
  }, [event, id, qsos, user]);

  useEffect(() => {
    if (user === null) {
      setAlert({
        color: "failure",
        msg: "Devi prima effettuare il login"
      });
      return;
    } else if (user && event && !isEventStation) {
      console.log(
        "not event station",
        user,
        event,
        isEventStation,
        "f",
        !!event,
        !!user,
        Array.isArray(event.joinRequests) &&
          event.joinRequests
            ?.filter(e => e.isApproved)
            ?.map(e => e.fromUser.callsign)
            ?.includes(user.callsign),
        event.joinRequests
      );
      if (user.isAdmin) {
        setAlert({
          color: "info",
          msg: "Non sei una stazione attivatrice per questo evento, ma sei un amministratore e puoi comunque gestire i QSO"
        });
      } else {
        setAlert({
          color: "failure",
          msg: "Non sei una stazione attivatrice per questo evento"
        });
        setHasPermission(false);
        return;
      }
    } else if (event === null) {
      setAlert({
        color: "failure",
        msg: "Evento non trovato"
      });
      return;
    } else if (qsos === null) {
      setAlert({
        color: "failure",
        msg: "Errore nel caricamento dei QSO"
      });
      return;
    }

    if (event && qsos && user) {
      setDisabled(false);
      setHasPermission(true);
    }
  }, [event, isEventStation, qsos, user]);

  const [cookies, setCookie] = useCookies(["qsoManagerCache"]);

  const [callsign, setCallsign] = useState(cookies.callsign || "");
  const [locator, setLocator] = useState(cookies.locator || "");
  const [rst, setRst] = useState(parseInt(cookies.rst) || 59);
  const [frequency, setFrequency] = useState(cookies.frequency || "");
  const [mode, setMode] = useState(cookies.mode || "");
  const [qsoDate, setQsoDate] = useState(
    new Date().toISOString().slice(0, -14) +
      "T" +
      formatInTimeZone(new Date(), "UTC", "HH:mm")
  );

  function resetDate() {
    setQsoDate(
      new Date().toISOString().slice(0, -14) +
        "T" +
        formatInTimeZone(new Date(), "UTC", "HH:mm")
    );
  }

  const callsignRef = useRef(null);

  useEffect(() => {
    window.addEventListener("beforeunload", event => {
      const e = event || window.event;
      e.preventDefault();
      if (e) {
        e.returnValue = ""; // Legacy method for cross browser support
      }
      return ""; // Legacy method for cross browser support
    });
  }, []);

  useEffect(() => {
    console.log("set cookie", {
      callsign,
      frequency,
      mode
    });
    // durata di 4 ore
    setCookie("callsign", callsign, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 4
    });
    setCookie("locator", locator, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 4
    });
    setCookie("rst", rst, { path: "/qsomanager", maxAge: 60 * 60 * 4 });
    setCookie("frequency", frequency, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 4
    });
    setCookie("mode", mode, { path: "/qsomanager", maxAge: 60 * 60 * 4 });
  }, [callsign, frequency, mode, locator, setCookie, rst]);

  async function createQso(e) {
    e.preventDefault();

    setDisabled(true);

    console.log("create qso", {
      callsign,
      frequency,
      mode,
      qsoDate: new Date(qsoDate)
    });

    try {
      const obj = {
        // fromStation,
        callsign,
        event: id,
        frequency: parseFloat(frequency),
        mode,
        qsoDate: zonedTimeToUtc(new Date(qsoDate), "UTC"),
        locator,
        rst: isNaN(parseInt(rst)) ? 59 : parseInt(rst)
        // emailSent,
        // emailSentDate,
        // notes,
        // email,
        // imageHref
      };
      if (user.isAdmin && !isEventStation && fromStation) {
        console.log("fromStation changed", fromStation);
        obj.fromStation = fromStation._id;
      } else {
        console.log("fromStation unchanged", user);
      }

      const { data } = await axios.post("/api/qso", obj);
      console.log("QSO", data);

      setAlert({
        color: "success",
        msg: "QSO creato con successo"
      });

      setHighlighted(data._id);
      setTimeout(() => setHighlighted(null), 1000);

      const newQsos = [...qsos, data];
      newQsos.sort((a, b) => new Date(a.qsoDate) - new Date(b.qsoDate));
      setQsos(newQsos);
      setCallsign("");
      // resetDate();

      setTimeout(() => {
        callsignRef?.current?.focus();
      }, 100);
    } catch (err) {
      console.log(err.response?.data?.err || err);
      window.alert(
        "ERRORE crea QSO: " + getErrorStr(err?.response?.data?.err || err)
      );

      // setAlert({
      //     color: "failure",
      //     msg: getErrorStr(err?.response?.data?.err)
      // });
      // setUser(null);
    }
    setDisabled(false);
  }

  const [adifFile, setAdifFile] = useState(null);
  const [adifQsos, setAdifQsos] = useState(null);
  const [adifChecked, setAdifChecked] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [hasFile, setHasFile] = useState(false);

  const adifInputRef = createRef(null);

  const [page, setPage] = useState(0); // 0 = pre data, 1 = insert qso

  function getAdifKey(qso, index) {
    return JSON.stringify({
      callsign: qso.callsign,
      index
    });
  }

  async function importAdif(_adifFile) {
    if (!_adifFile) return;

    setAdifFile(_adifFile);

    setHasFile(true);
    setDisabled(true);
    console.log("import adif", _adifFile);
    const formData = new FormData();
    formData.append("adif", _adifFile);
    formData.append("event", id);
    try {
      const { data } = await axios.post("/api/adif/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log("imported", { data });

      setAdifQsos(data);
      setAdifChecked(
        data.reduce((acc, q, i) => {
          acc[getAdifKey(q, i)] = true;
          return acc;
        }, {})
      );
      setShowModal(true);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } finally {
      setDisabled(false);
    }
  }

  async function importAdifSubmit(e) {
    e.preventDefault();
    console.log("import adif submit", adifQsos);

    // send ADIF again, this time with checked QSOs and parameter save=true
    setDisabled(true);
    const formData = new FormData();
    formData.append("adif", adifFile);
    formData.append("event", id);
    formData.append(
      "exclude",
      JSON.stringify(
        adifQsos.map((q, i) => getAdifKey(q, i)).filter(k => !adifChecked[k])
      )
    );
    formData.append("save", true);
    try {
      const { data } = await axios.post("/api/adif/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log("imported", { data });

      setAdifQsos(null);
      setAdifChecked({});
      resetAdif();
      setAlert({
        color: "success",
        msg: "QSO importati con successo"
      });
      setDisabled(false);
      setQsos([...qsos, ...data]);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      setDisabled(false);
    } finally {
      setShowModal(false);
    }
  }

  function resetAdif() {
    if (adifInputRef.current) {
      adifInputRef.current.value = null;
      setHasFile(false);
    }
    setAdifFile(null);
  }

  const [selectedQsos, setSelectedQsos] = useState([]);
  function selectQso(qso, checked) {
    if (checked) {
      setSelectedQsos([...selectedQsos, qso._id]);
    } else {
      setSelectedQsos(selectedQsos.filter(q => q !== qso._id));
    }
  }

  async function deleteSelected() {
    if (
      !window.confirm(
        `Vuoi ELIMINARE i QSO selezionati (${selectedQsos.length})?\n⚠️⚠️ L'operazione è irrevocabile!`
      )
    ) {
      return;
    }

    setDisabled(true);
    const deleted = [];
    try {
      for (const qso of selectedQsos) {
        await axios.delete("/api/qso/" + qso);
        deleted.push(qso);
      }
      console.log("deleted", deleted);
      setQsos(qsos.filter(q => !deleted.includes(q._id)));
      setSelectedQsos([]);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);
    }
  }

  async function exportAdif() {
    if (selectedQsos.length === 0) {
      window.alert("Seleziona almeno un QSO");
      return;
    }

    setDisabled(true);
    const url = `/api/adif/export?qsos=${selectedQsos.join(",")}&event=${id}`;
    window.open(url, "_blank");
    setDisabled(false);
  }

  const navigate = useNavigate();

  async function forceSendEqsl(q) {
    eqslSending.set(q._id, "sending");

    console.log("forceSendEqsl for qso", q._id, q);

    try {
      const { data } = await axios.get("/api/eqsl/forcesend/" + q._id);
      console.log("OK forceSendEqsl for qso", q._id, data);
      setQsos(
        qsos.map(qso =>
          qso._id === q._id
            ? { ...qso, imageHref: data?.href, emailSent: true }
            : qso
        )
      );
      setAlert({
        color: "success",
        msg: "eQSL inviata con successo"
      });
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      eqslSending.set(q._id, "ok");

      setTimeout(() => {
        eqslSending.delete(q._id);
      }, 3000);
    }
  }

  const [allPredataInserted, setAllPredataInserted] = useState(false);

  useEffect(() => {
    setAllPredataInserted(frequency && mode && qsoDate && locator);
    console.log("predata", { frequency, mode, qsoDate, locator });
  }, [frequency, mode, qsoDate, locator]);

  const [editTime, setEditTime] = useState(false);

  // if not editTime, update qsoDate to current time every second
  useEffect(() => {
    if (!editTime) {
      const interval = setInterval(() => {
        if (!editTime) {
          resetDate();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [editTime]);

  return user === null ? (
    navigate({
      pathname: "/login",
      search: createSearchParams({
        to: window.location.pathname + window.location.search
      }).toString()
    })
  ) : (
    <Layout>
      <Modal
        position="center"
        size="7xl"
        show={showModal}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={importAdifSubmit}>
          <Modal.Header>Importa QSO da file ADIF</Modal.Header>
          <Modal.Body className="p-0">
            {adifQsos ? (
              <div className="max-h-[60vh] overflow-y-auto">
                {/* seleziona - deseleziona tutti */}
                <Button.Group className="mb-4 p-4 pb-2">
                  <Button
                    color="light"
                    disabled={disabled}
                    onClick={() => {
                      setAdifChecked(
                        adifQsos.reduce((acc, q, i) => {
                          acc[getAdifKey(q, i)] = true;
                          return acc;
                        }, {})
                      );
                    }}
                  >
                    Seleziona tutti
                  </Button>
                  <Button
                    color="light"
                    disabled={disabled}
                    onClick={() => {
                      setAdifChecked(
                        adifQsos.reduce((acc, q, i) => {
                          acc[getAdifKey(q, i)] = false;
                          return acc;
                        }, {})
                      );
                    }}
                  >
                    Deseleziona tutti
                  </Button>
                </Button.Group>

                <Table>
                  <Table.Head>
                    <Table.HeadCell>Nominativo</Table.HeadCell>
                    <Table.HeadCell>Data UTC</Table.HeadCell>
                    <Table.HeadCell>Frequenza</Table.HeadCell>
                    <Table.HeadCell>Modo</Table.HeadCell>
                    <Table.HeadCell>Locatore</Table.HeadCell>
                    <Table.HeadCell>RST</Table.HeadCell>
                  </Table.Head>
                  <Table.Body>
                    {adifQsos.map((q, i) => (
                      <Table.Row
                        key={q._id}
                        className={`transition-colors duration-300 ${
                          adifChecked[getAdifKey(q, i)]
                            ? "bg-green-100"
                            : "bg-red-100 line-through"
                        }`}
                      >
                        <Table.Cell className="flex gap-2 items-center">
                          <Checkbox
                            value={q._id}
                            checked={adifChecked[getAdifKey(q, i)]}
                            onChange={e => {
                              setAdifChecked({
                                ...adifChecked,
                                [getAdifKey(q, i)]: e.target.checked
                              });
                            }}
                          />{" "}
                          {q.callsign}
                        </Table.Cell>
                        <Table.Cell>
                          {formatInTimeZone(
                            q.qsoDate,
                            "UTC",
                            "yyyy-MM-dd HH:mm"
                          )}
                        </Table.Cell>
                        <Table.Cell>{q.frequency} MHz</Table.Cell>
                        <Table.Cell>{q.mode}</Table.Cell>
                        <Table.Cell>{q.locator}</Table.Cell>
                        <Table.Cell>{q.rst}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            ) : (
              <Spinner />
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="w-full flex justify-center gap-2">
              <Button
                color="gray"
                type="button"
                // disabled={!user || changePwBtnDisabled}
                disabled={disabled}
                onClick={() => setShowModal(false)}
              >
                Chiudi
              </Button>
              <Button type="submit" disabled={disabled}>
                Importa
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          {alert && (
            <Alert
              className="mb-6"
              color={alert.color}
              onDismiss={() => (hasPermission ? setAlert(null) : navigate("/"))}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          {hasPermission && (
            <>
              <Typography variant="h1" className="mb-8 flex items-center gap-2">
                <Badge size="lg" color="info">
                  {event?.name || "..."}
                </Badge>
              </Typography>

              <div className="mb-6">
                {event === null ? (
                  <p>
                    Errore nel caricamento dell'evento (prova a ricaricare la
                    pagina)
                  </p>
                ) : !event ? (
                  <Spinner />
                ) : null}

                <div className="my-12">
                  <Typography variant="h2" className="mb-2">
                    QSO registrati
                  </Typography>
                  <div className="mb-6">
                    {Array.isArray(qsos) ? (
                      qsos.length > 0 ? (
                        <div>
                          <div className="flex flex-col md:flex-row gap-2 items-center md:justify-between">
                            {/* seleziona - deseleziona - esporta adif - elimina */}
                            <Button.Group className="mb-2">
                              <Button
                                color="light"
                                disabled={disabled}
                                onClick={() => {
                                  setSelectedQsos(qsos.map(q => q._id));
                                }}
                              >
                                Seleziona tutti
                              </Button>
                              <Button
                                color="light"
                                disabled={disabled}
                                onClick={() => {
                                  setSelectedQsos([]);
                                }}
                              >
                                Deseleziona tutti
                              </Button>
                              <Button
                                color="dark"
                                disabled={disabled || selectedQsos.length === 0}
                                onClick={exportAdif}
                              >
                                {disabled ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <span>Esporta ADIF</span>
                                )}
                              </Button>
                              <Button
                                color="failure"
                                disabled={disabled || selectedQsos.length === 0}
                                onClick={deleteSelected}
                              >
                                {disabled ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <span>Elimina</span>
                                )}
                              </Button>
                            </Button.Group>

                            <div>
                              <h3 className="font-bold">
                                Importa QSO da file ADIF
                              </h3>
                              <div className="mb-8 flex items-center gap-2">
                                <FileInput
                                  disabled={disabled}
                                  helperText={disabled && <Spinner />}
                                  accept=".adi"
                                  className="h-fit"
                                  onChange={e => importAdif(e.target.files[0])}
                                  ref={adifInputRef}
                                />
                                <Button
                                  color="dark"
                                  onClick={resetAdif}
                                  disabled={disabled || !hasFile}
                                >
                                  <FaUndo />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="shadow-lg">
                            <Table>
                              <Table.Head>
                                <Table.HeadCell>
                                  <span className="sr-only">Azioni</span>
                                </Table.HeadCell>
                                <Table.HeadCell>Nominativo</Table.HeadCell>
                                <Table.HeadCell>Data UTC</Table.HeadCell>
                                <Table.HeadCell>Frequenza</Table.HeadCell>
                                <Table.HeadCell>Modo</Table.HeadCell>
                                <Table.HeadCell>Locatore</Table.HeadCell>
                                <Table.HeadCell>RST</Table.HeadCell>
                                <Table.HeadCell>
                                  <span className="sr-only">Azioni</span>
                                </Table.HeadCell>
                              </Table.Head>
                              <Table.Body>
                                {qsos?.map((q, i) => (
                                  <Table.Row
                                    key={q._id}
                                    className={`transition-colors duration-200 ${
                                      highlighted === q._id
                                        ? "bg-green-200 hover:bg-green-300"
                                        : selectedQsos.includes(q._id)
                                        ? "bg-red-200 hover:bg-red-300"
                                        : i % 2 === 0
                                        ? "hover:bg-gray-200"
                                        : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                                  >
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                      <div className="flex items-center gap-2">
                                        <Tooltip content={"Id: " + q._id}>
                                          <Checkbox
                                            value={q._id}
                                            disabled={disabled}
                                            checked={selectedQsos.includes(
                                              q._id
                                            )}
                                            onClick={e =>
                                              selectQso(q, e.target.checked)
                                            }
                                          />
                                        </Tooltip>
                                      </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <div className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex gap-1 items-center">
                                        {q.callsign}
                                        {q.fromStation?.callsign &&
                                          q.fromStation?.callsign !==
                                            user?.callsign && (
                                            <Tooltip
                                              content={`QSO da ${q.fromStation.callsign}`}
                                            >
                                              <p className="text-xs font-light text-gray-600">
                                                <FaInfoCircle />
                                              </p>
                                            </Tooltip>
                                          )}
                                      </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {formatInTimeZone(
                                        q.qsoDate,
                                        "UTC",
                                        "yyyy-MM-dd HH:mm"
                                      )}
                                    </Table.Cell>
                                    <Table.Cell>{q.frequency} MHz</Table.Cell>
                                    <Table.Cell>{q.mode}</Table.Cell>
                                    <Table.Cell>{q.locator}</Table.Cell>
                                    <Table.Cell>{q.rst}</Table.Cell>
                                    <Table.Cell>
                                      <div className="flex w-full justify-center">
                                        <div>
                                          <Button
                                            color={
                                              eqslSending.get(q._id) === "ok"
                                                ? "success"
                                                : q.emailSent
                                                ? "light"
                                                : "info"
                                            }
                                            disabled={
                                              eqslSending.get(q._id) ===
                                              "sending"
                                            }
                                            onClick={() => {
                                              forceSendEqsl(q);
                                            }}
                                            className={`transition-all ${
                                              q.emailSent
                                                ? "bg-gray-200 border-gray-200 hover:bg-gray-300"
                                                : ""
                                            }`}
                                            size={q.emailSent ? "sm" : "md"}
                                          >
                                            <Tooltip
                                              className="transition-all"
                                              content={
                                                eqslSending.get(q._id) ===
                                                "sending"
                                                  ? "Invio in corso..."
                                                  : eqslSending.get(q._id) ===
                                                    "ok"
                                                  ? "Email inviata con successo!"
                                                  : q.emailSent
                                                  ? "⚠️ eQSL già inviata, usa per reinviarla"
                                                  : "Usa il pulsante per forzare l'invio"
                                              }
                                            >
                                              {eqslSending.get(q._id) ===
                                              "sending" ? (
                                                <Spinner size="sm" />
                                              ) : eqslSending.get(q._id) ===
                                                "ok" ? (
                                                <FaCheck />
                                              ) : (
                                                <FaEnvelope />
                                              )}
                                            </Tooltip>
                                          </Button>
                                        </div>

                                        {q.emailSent && (
                                          <Tooltip content="Apri eQSL">
                                            <Link
                                              to={`/qso/${q._id}`}
                                              target="_blank"
                                            >
                                              <Button
                                                color="light"
                                                className="bg-gray-200 border-gray-200 hover:bg-gray-300"
                                                size="sm"
                                              >
                                                <FaExternalLinkAlt />
                                              </Button>
                                            </Link>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table>
                          </div>
                        </div>
                      ) : (
                        <p>Nessun QSO registrato</p>
                      )
                    ) : qsos === false ? (
                      <Spinner />
                    ) : (
                      <p>
                        Errore nel caricamento dei QSO (prova a ricaricare la
                        pagina)
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row justify-center md:justify-between gap-4 items-center">
                    <Typography variant="h2" className="my-2 flex items-center">
                      Crea QSO
                    </Typography>
                  </div>
                  {user ? (
                    !user.address ? (
                      <Alert color="failure">
                        <span>
                          ⚠️ Devi prima completare il tuo profilo con
                          l'indirizzo:{" "}
                          <Link to="/profile" className="underline font-bold">
                            clicca qui
                          </Link>{" "}
                          per navigare al tuo profilo, poi clicca su "Modifica
                          profilo" e completa l'indirizzo.
                        </span>
                      </Alert>
                    ) : (
                      <div className="mb-6">
                        {showAddressWarning && (
                          <Alert
                            color="info"
                            className="mb-4"
                            onDismiss={() => setShowAddressWarning(false)}
                          >
                            <span>
                              ⚠️ La tua città è attualmente impostata a{" "}
                              <span className="font-bold">{user.city}</span> (
                              <span className="font-bold">{user.province}</span>
                              ), assicurati che sia corretta. In caso contrario,{" "}
                              <Link
                                to="/profile?forceEditCity=true"
                                className="underline font-bold"
                              >
                                clicca qui
                              </Link>{" "}
                              per navigare al tuo profilo, poi clicca su "
                              <span className="font-medium">
                                Modifica profilo
                              </span>
                              " e modifica la città.
                            </span>
                          </Alert>
                        )}

                        <div className="w-full flex justify-center">
                          <Timeline horizontal>
                            <Timeline.Item>
                              <Timeline.Point icon={FaDatabase} />
                              <Timeline.Content>
                                <Timeline.Title>
                                  <span
                                    className={`${
                                      page === 0 ? "font-bold" : "font-medium"
                                    } cursor-pointer hover:text-blue-700 transition-colors`}
                                    onClick={() => setPage(0)}
                                  >
                                    Dati preliminari
                                  </span>
                                </Timeline.Title>
                                <Timeline.Body>
                                  Necessari per la creazione del QSO
                                </Timeline.Body>
                              </Timeline.Content>
                            </Timeline.Item>
                            <Timeline.Item>
                              <Timeline.Point icon={FaShare} />
                              <Timeline.Content>
                                <Timeline.Title>
                                  <span
                                    className={`${
                                      page === 1 ? "font-bold" : "font-medium"
                                    } ${
                                      allPredataInserted
                                        ? "cursor-pointer hover:text-blue-700 transition-colors"
                                        : "cursor-not-allowed"
                                    }`}
                                    onClick={
                                      allPredataInserted
                                        ? () => setPage(1)
                                        : null
                                    }
                                  >
                                    Nominativo
                                  </span>
                                </Timeline.Title>
                                <Timeline.Body>Registrazione QSO</Timeline.Body>
                              </Timeline.Content>
                            </Timeline.Item>
                          </Timeline>
                        </div>

                        <form onSubmit={createQso}>
                          {page === 0 ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!isEventStation && user.isAdmin && users && (
                                  <div>
                                    <Label
                                      htmlFor="fromStation"
                                      value="Da stazione attivatrice*"
                                    />
                                    <Dropdown
                                      label={fromStation.callsign}
                                      disabled={disabled}
                                      id="fromStation"
                                      className="w-full"
                                      required
                                      color="light"
                                    >
                                      {users.map(u => (
                                        <Dropdown.Item
                                          key={u._id}
                                          onClick={() => setFromStation(u)}
                                        >
                                          <span
                                            className={
                                              u._id === fromStation._id
                                                ? "font-bold"
                                                : ""
                                            }
                                          >
                                            {u.callsign}
                                          </span>
                                        </Dropdown.Item>
                                      ))}
                                    </Dropdown>
                                    <p className="flex items-center gap-1">
                                      <FaInfoCircle />
                                      Vedi questo in quanto sei un{" "}
                                      <span className="font-bold">
                                        amministratore
                                      </span>
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <Label
                                    htmlFor="frequency"
                                    value="Frequenza (in MHz)*"
                                  />
                                  <TextInput
                                    color={frequency ? "success" : "warning"}
                                    disabled={disabled}
                                    id="frequency"
                                    label="Frequenza"
                                    placeholder="144.205"
                                    type="number"
                                    value={frequency}
                                    onChange={e => {
                                      setFrequency(e.target.value);
                                      setCookie("frequency", e.target.value, {
                                        path: "/qsomanager",
                                        maxAge: 60 * 60 * 4
                                      });
                                    }}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor="mode"
                                    value="Modo (CW, SSB, FT8, ecc.)*"
                                  />
                                  <TextInput
                                    color={mode ? "success" : "warning"}
                                    disabled={disabled}
                                    id="mode"
                                    label="Modo"
                                    minLength={1}
                                    maxLength={10}
                                    placeholder="SSB"
                                    value={mode}
                                    onChange={e => {
                                      setMode(e.target.value);
                                      setCookie("mode", e.target.value, {
                                        path: "/qsomanager",
                                        maxAge: 60 * 60 * 4
                                      });
                                    }}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="locator" value="Locatore" />
                                  <TextInput
                                    color={locator ? "success" : "warning"}
                                    disabled={disabled}
                                    id="locator"
                                    label="Locatore"
                                    minLength={1}
                                    maxLength={20}
                                    placeholder="JN54mn"
                                    value={locator}
                                    onChange={e => {
                                      setLocator(e.target.value);
                                      setCookie("locator", e.target.value, {
                                        path: "/qsomanager",
                                        maxAge: 60 * 60 * 4
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-2 items-center">
                              <div className="flex flex-col md:flex-row gap-2 justify-center items-center md:items-end">
                                <div className="w-full">
                                  <Label
                                    htmlFor="callsign"
                                    value="Nominativo*"
                                  />
                                  <TextInput
                                    disabled={disabled}
                                    id="callsign"
                                    label="Nominativo"
                                    sizing="xl"
                                    minLength={1}
                                    maxLength={10}
                                    ref={callsignRef}
                                    placeholder={
                                      user ? user.callsign : "IU4QSG"
                                    }
                                    value={callsign}
                                    className="uppercase font-semibold text-2xl input-large"
                                    onChange={e => {
                                      const val = e.target.value.toUpperCase();
                                      setCallsign(val);
                                      setCookie("callsign", val, {
                                        path: "/qsomanager",
                                        maxAge: 60 * 60 * 4
                                      });
                                    }}
                                    required
                                  />
                                </div>

                                <Button
                                  type="submit"
                                  disabled={disabled}
                                  size="lg"
                                  color={highlighted ? "success" : "info"}
                                  className="transition-colors duration-500 min-w-[10rem]"
                                >
                                  {disabled ? (
                                    <Spinner />
                                  ) : (
                                    <span className="flex items-center gap-2">
                                      <FaPlusCircle />
                                      Salva QSO
                                    </span>
                                  )}
                                </Button>
                              </div>

                              {/* orario */}
                            </div>
                          )}
                          <div className="mt-4 flex flex-col items-center gap-2">
                            <div className="flex justify-center">
                              {page === 0 ? (
                                <Tooltip
                                  content={
                                    allPredataInserted
                                      ? "Pagina successiva"
                                      : "Completa tutti i campi per abilitare il pulsante"
                                  }
                                >
                                  <Button
                                    type="button"
                                    disabled={disabled || !allPredataInserted}
                                    onClick={() => setPage(1)}
                                    size="lg"
                                    color={
                                      allPredataInserted ? "success" : "failure"
                                    }
                                    className="transition-colors"
                                  >
                                    Inserisci nominativo
                                    <FaForward className="inline ml-2" />
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setPage(0)}
                                  color="light"
                                  className="mt-6"
                                >
                                  <FaBackward className="inline mr-2" />
                                  Precedente
                                </Button>
                              )}
                            </div>

                            {page === 0 ? (
                              <Alert color="gray">
                                <span>
                                  <FaInfoCircle className="inline" /> I campi
                                  contrassegnati con * sono obbligatori
                                </span>
                              </Alert>
                            ) : (
                              <div className="mt-8 flex flex-col justify-center gap-2 items-center">
                                <h5 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-400">
                                  Riepilogo
                                </h5>
                                <Card className="w-full">
                                  <div className="flex flex-col md:flex-row gap-4 items-start">
                                    <div className="w-full">
                                      <Label
                                        htmlFor="callsign"
                                        value="Nominativo"
                                      />
                                      <TextInput
                                        disabled
                                        id="callsign"
                                        label="Nominativo"
                                        minLength={1}
                                        maxLength={10}
                                        value={callsign}
                                        className="font-semibold"
                                      />
                                    </div>
                                    <div className="w-full">
                                      {editTime ? (
                                        <>
                                          <div>
                                            <Label
                                              htmlFor="qsoDate"
                                              value="Data QSO in UTC*"
                                            />
                                            <div className="flex gap-1 justify-center items-start">
                                              <div className="w-full relative">
                                                <TextInput
                                                  disabled={disabled}
                                                  id="qsoDate"
                                                  label="Data"
                                                  type="datetime-local"
                                                  className="w-full"
                                                  value={qsoDate}
                                                  onChange={e =>
                                                    setQsoDate(e.target.value)
                                                  }
                                                  required
                                                  helperText={
                                                    <>
                                                      {format(
                                                        new Date(qsoDate),
                                                        "HH:mm"
                                                      )}{" "}
                                                      UTC
                                                      {", "}
                                                      {formatInTimeZone(
                                                        zonedTimeToUtc(
                                                          new Date(qsoDate),
                                                          "UTC"
                                                        ),
                                                        "Europe/Rome",
                                                        "HH:mm"
                                                      )}{" "}
                                                      Roma
                                                    </>
                                                  }
                                                />
                                              </div>
                                              <div className="mt-1">
                                                <Tooltip content="Imposta all'orario attuale">
                                                  <Button
                                                    color="light"
                                                    // size="sm"
                                                    className="h-max"
                                                    onClick={resetDate}
                                                  >
                                                    <FaUndo />
                                                  </Button>
                                                </Tooltip>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <Label
                                            htmlFor="time"
                                            value="Data QSO"
                                          />

                                          <TextInput
                                            disabled
                                            id="time"
                                            label="Ora"
                                            value={format(
                                              new Date(qsoDate),
                                              "yyyy-MM-dd HH:mm"
                                            )}
                                          />
                                        </>
                                      )}
                                    </div>
                                    <div className="w-full">
                                      <Label
                                        htmlFor="frequency"
                                        value="Frequenza (in MHz)"
                                      />
                                      <TextInput
                                        disabled
                                        id="frequency"
                                        label="Frequenza"
                                        placeholder="144.205"
                                        type="number"
                                        onClick={() => setPage(0)}
                                        value={frequency}
                                      />
                                    </div>
                                    <div className="w-full">
                                      <Label htmlFor="mode" value="Modo" />
                                      <TextInput
                                        disabled
                                        id="mode"
                                        label="Modo"
                                        minLength={1}
                                        maxLength={10}
                                        onClick={() => setPage(0)}
                                        value={mode}
                                      />
                                    </div>
                                    <div className="w-full">
                                      <Label
                                        htmlFor="locator"
                                        value="Locatore"
                                      />
                                      <TextInput
                                        disabled
                                        id="locator"
                                        label="Locatore"
                                        minLength={1}
                                        maxLength={20}
                                        onClick={() => setPage(0)}
                                        value={locator}
                                      />
                                    </div>
                                    <div className="w-full">
                                      <Label htmlFor="rst" value="RST" />
                                      <TextInput
                                        disabled={disabled}
                                        id="rst"
                                        label="RST"
                                        placeholder="59"
                                        type="text"
                                        value={rst}
                                        maxLength={3}
                                        onChange={e => {
                                          const val =
                                            parseInt(
                                              e.target.value.replace(/\D+/g, "")
                                            ) || "";
                                          setRst(val);
                                          setCookie("frequency", val, {
                                            path: "/qsomanager",
                                            maxAge: 60 * 60 * 4
                                          });
                                        }}
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div
                                    className={`w-full flex gap-2 ${
                                      editTime ? "-mt-4" : ""
                                    }`}
                                  >
                                    <Checkbox
                                      id="editTime"
                                      checked={editTime}
                                      onChange={e =>
                                        setEditTime(e.target.checked)
                                      }
                                      disabled={disabled}
                                    />
                                    <Label
                                      htmlFor="editTime"
                                      value="Modifica ora"
                                    />
                                  </div>
                                </Card>
                              </div>
                            )}
                          </div>
                        </form>
                      </div>
                    )
                  ) : (
                    <Spinner />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QsoManager;

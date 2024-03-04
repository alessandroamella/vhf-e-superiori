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
  Tooltip
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
import { formatInTimeZone } from "date-fns-tz";
import { getErrorStr, UserContext } from "..";
import Layout from "../Layout";
import {
  Link,
  createSearchParams,
  useNavigate,
  useParams
} from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  FaCircle,
  FaInfoCircle,
  FaPlusCircle,
  FaSync,
  FaUndo
} from "react-icons/fa";
import { useCookies } from "react-cookie";
import ButtonGroup from "flowbite-react/lib/esm/components/Button/ButtonGroup";

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
    if (user?.isAdmin && !users)
      //  && event.joinRequests && !isEventStation) {
      getUsers();
    // }
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
  const [frequency, setFrequency] = useState(cookies.frequency || "");
  const [mode, setMode] = useState(cookies.mode || "");
  const [qsoDate, setQsoDate] = useState(
    new Date().toISOString().slice(0, -14) +
      "T" +
      formatInTimeZone(new Date(), "Europe/Rome", "HH:mm")
  );

  function resetDate() {
    setQsoDate(
      new Date().toISOString().slice(0, -14) +
        "T" +
        formatInTimeZone(new Date(), "Europe/Rome", "HH:mm")
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
    setCookie("frequency", frequency, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 4
    });
    setCookie("mode", mode, { path: "/qsomanager", maxAge: 60 * 60 * 4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsign, frequency, mode]);

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
        qsoDate: new Date(qsoDate)
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
                <ButtonGroup className="mb-4 p-4 pb-2">
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
                </ButtonGroup>

                <Table>
                  <Table.Head>
                    <Table.HeadCell>Nominativo</Table.HeadCell>
                    <Table.HeadCell>Data</Table.HeadCell>
                    <Table.HeadCell>Frequenza</Table.HeadCell>
                    <Table.HeadCell>Modo</Table.HeadCell>
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
                            "Europe/Rome",
                            "yyyy-MM-dd HH:mm"
                          )}
                        </Table.Cell>
                        <Table.Cell>{q.frequency} MHz</Table.Cell>
                        <Table.Cell>{q.mode}</Table.Cell>
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
              <Typography variant="h1" className="mb-6 flex items-center">
                <Badge size="lg" color="info" className="mr-2">
                  Gestione QSO
                </Badge>
              </Typography>

              <div className="mb-6">
                {event ? (
                  <div>
                    <h2 className="text-4xl mb-6 flex gap-2 flex-col md:flex-row items-center justify-center">
                      <span className="font-bold">{event.name}</span>
                      <FaCircle className="hidden md:block scale-[.25] text-gray-700 dark:text-gray-300 mx-2" />
                      <span>{user?.callsign}</span>
                    </h2>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2">
                      {[
                        ["logoUrl", "Locandina"],
                        ["eqslUrl", "Anteprima EQSL"]
                      ].map(([key, text], i) => (
                        <div
                          key={i}
                          className="flex flex-col gap-2 justify-center items-center"
                        >
                          <LazyLoadImage
                            src={event[key]}
                            alt={key}
                            className="w-48 max-w-full max-h-48 object-contain m-auto drop-shadow-lg"
                          />
                          <p className="font-bold text-gray-700 dark:text-gray-400">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : event === null ? (
                  <p>
                    Errore nel caricamento dell'evento (prova a ricaricare la
                    pagina)
                  </p>
                ) : (
                  <Spinner />
                )}

                <div className="my-6">
                  <Typography variant="h2" className="mb-2">
                    QSO registrati{" "}
                    <span className="font-light">({event?.name || "..."})</span>
                  </Typography>
                  <div className="mb-6">
                    {user?.isAdmin && (
                      <Alert className="mb-4">
                        Puoi vedere i QSO di tutte le altre stazioni
                        attivatrici, indicate con{" "}
                        <FaInfoCircle className="inline" />, in quanto sei un{" "}
                        <span className="font-bold">amministratore</span>.
                      </Alert>
                    )}
                    {Array.isArray(qsos) ? (
                      qsos.length > 0 ? (
                        <div>
                          {/* seleziona - deseleziona - esporta adif - elimina */}
                          <ButtonGroup className="mb-2">
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
                          </ButtonGroup>

                          <div className="max-h-screen overflow-y-auto shadow-lg">
                            <Table>
                              <Table.Head>
                                <Table.HeadCell>Azioni</Table.HeadCell>
                                <Table.HeadCell>Nominativo</Table.HeadCell>
                                <Table.HeadCell>Data</Table.HeadCell>
                                <Table.HeadCell>Frequenza</Table.HeadCell>
                                <Table.HeadCell>Modo</Table.HeadCell>
                              </Table.Head>
                              <Table.Body>
                                {qsos?.map((q, i) => (
                                  <Table.Row
                                    key={q._id}
                                    className={`transition-colors duration-1000 ${
                                      highlighted === q._id
                                        ? "bg-green-200"
                                        : i % 2 === 0
                                        ? "bg-gray-100 dark:bg-gray-800"
                                        : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                  >
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          value={q._id}
                                          disabled={disabled}
                                          checked={selectedQsos.includes(q._id)}
                                          onClick={e =>
                                            selectQso(q, e.target.checked)
                                          }
                                        />
                                      </div>
                                    </Table.Cell>
                                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex gap-1 items-center">
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
                                    </Table.Cell>
                                    <Table.Cell>
                                      {formatInTimeZone(
                                        q.qsoDate,
                                        "Europe/Rome",
                                        "yyyy-MM-dd HH:mm"
                                      )}
                                    </Table.Cell>
                                    <Table.Cell>{q.frequency} MHz</Table.Cell>
                                    <Table.Cell>{q.mode}</Table.Cell>
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
                    <Typography variant="h2" className="mb-2 flex items-center">
                      Crea QSO
                    </Typography>

                    <div>
                      <h3 className="font-bold">Importa QSO da file ADIF</h3>
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
                          profilo" e completa l'indirizzo
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
                              <span className="font-bold">{user.city}</span> con
                              codice di provincia{" "}
                              <span className="font-bold">{user.province}</span>
                              , assicurati che sia corretta. In caso contrario,{" "}
                              <Link
                                to="/profile"
                                className="underline font-bold"
                              >
                                clicca qui
                              </Link>{" "}
                              per navigare al tuo profilo, poi clicca su
                              "Modifica profilo" e modifica la città
                            </span>
                          </Alert>
                        )}

                        <form onSubmit={createQso}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!isEventStation && user.isAdmin && users && (
                              <div>
                                <Label
                                  htmlFor="fromStation"
                                  value="Da stazione attivatrice"
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
                                value="Frequenza (in MHz)"
                              />
                              <TextInput
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
                                value="Modo (CW, SSB, FT8, ecc.)"
                              />
                              <TextInput
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
                              <Label htmlFor="qsoDate" value="Data QSO" />
                              <div className="flex gap-1 justify-center items-center">
                                <TextInput
                                  disabled={disabled}
                                  id="qsoDate"
                                  label="Data"
                                  type="datetime-local"
                                  className="w-full"
                                  value={qsoDate}
                                  onChange={e => setQsoDate(e.target.value)}
                                  required
                                />
                                <Button
                                  color="light"
                                  // size="sm"
                                  className="h-max"
                                  onClick={resetDate}
                                >
                                  <FaSync />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="callsign" value="Nominativo" />
                              <TextInput
                                disabled={disabled}
                                id="callsign"
                                label="Nominativo"
                                minLength={1}
                                maxLength={10}
                                ref={callsignRef}
                                placeholder={user ? user.callsign : "IU4QSG"}
                                value={callsign}
                                className="uppercase"
                                onChange={e => {
                                  setCallsign(e.target.value);
                                  setCookie("callsign", e.target.value, {
                                    path: "/qsomanager",
                                    maxAge: 60 * 60 * 4
                                  });
                                }}
                                required
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex justify-center">
                            <Button type="submit" disabled={disabled} size="lg">
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

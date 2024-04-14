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
  Card,
  Avatar
} from "flowbite-react";
import React, {
  createRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { getErrorStr, UserContext } from "..";
import Layout from "../Layout";
import {
  Link,
  createSearchParams,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  FaCheck,
  FaEnvelope,
  FaExternalLinkAlt,
  FaForward,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
  FaUndo,
  FaUser
} from "react-icons/fa";
import { useCookies } from "react-cookie";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import { useMap } from "@uidotdev/usehooks";
import { Helmet } from "react-helmet";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import StationMapMarker from "../shared/StationMapMarker";
import MapWatermark from "../shared/MapWatermark";

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

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        setUsers(null);
      }
    }
    if (user?.isAdmin && !users) getUsers();
  }, [event, isEventStation, user, users]);

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

        window.scrollTo({
          top: 0,
          behavior: "smooth"
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

        window.scrollTo({
          top: 0,
          behavior: "smooth"
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

      window.scrollTo({
        top: 0,
        behavior: "smooth"
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

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        setHasPermission(false);
        return;
      }
    } else if (event === null) {
      setAlert({
        color: "failure",
        msg: "Evento non trovato"
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    } else if (qsos === null) {
      setAlert({
        color: "failure",
        msg: "Errore nel caricamento dei QSO"
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth"
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
  const [locatorLoading, setLocatorLoading] = useState(true);
  const [locator, setLocator] = useState(cookies.locator || null);
  const [isManuallySettingLocator, setIsManuallySettingLocator] =
    useState(false);

  const [formattedAddress, setFormattedAddress] = useState(null);
  const [city, setCity] = useState(null);
  const [province, setProvince] = useState(null);
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

  useEffect(() => {
    if (isManuallySettingLocator || !formattedAddress) {
      setPage(0);
    } else {
      setPage(1);

      setTimeout(() => {
        document.getElementById("create-qso-container")?.scrollIntoView();
      }, 500);
    }
  }, [formattedAddress, isManuallySettingLocator]);

  const geolocalize = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      async position => {
        console.log("Geolocalizzato", position);

        setFormattedAddress(null);

        const { data } = await axios.get(
          `/api/location/locator/${position.coords.latitude}/${position.coords.longitude}`
        );
        console.log("fetched locator in geolocalize", data);
        setLocator(data.locator);
      },
      err => {
        console.log("Errore nella geolocalizzazione", err);
        setAlert({
          color: "failure",
          msg: "Errore nella geolocalizzazione"
        });

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    );
  }, []);

  useEffect(() => {
    if (!user || formattedAddress) return;

    async function getLatLon(locator) {
      if (
        user &&
        locator === user.locator &&
        user.lat &&
        user.lon &&
        user.locator &&
        user.city &&
        user.province
      ) {
        setLocator(user.locator);
        setFormattedAddress(`${user.city} (${user.province})`);
        setCity(user.city);
        setProvince(user.province);
        setLat(user.lat);
        setLon(user.lon);

        console.log("locator same as user:", locator, user);

        return;
      }
      try {
        setFormattedAddress(false);
        const { data } = await axios.get(`/api/location/latlon/${locator}`, {
          params: {
            geocode: true
          }
        });
        console.log("fetched lat lon", data);
        setLocator(data.locator);
        setFormattedAddress(data.address);
        setCity(data.city);
        setProvince(data.province);
        setLat(data.lat);
        setLon(data.lon);

        console.log("from locator", locator, "set geocoded", data);
      } catch (err) {
        console.log("error in lat lon fetch", err);
        setFormattedAddress(null);
      }
    }

    async function fetchLocator() {
      setLocatorLoading(!isManuallySettingLocator);
      let _locator;

      if (
        user.lat &&
        user.lon &&
        !isManuallySettingLocator &&
        !formattedAddress
      ) {
        try {
          const { data } = await axios.get(
            `/api/location/locator/${user.lat}/${user.lon}`
          );
          console.log("fetched locator from user lat lon", data);
          _locator = data.locator;
        } catch (err) {
          console.error("error in locator fetch", err?.response?.data || err);
        }
      }

      if (!_locator && !isManuallySettingLocator && !formattedAddress) {
        try {
          const { data } = await axios.get(
            "/api/autocomplete/" + user.callsign.replaceAll("/", "%2F")
          );
          console.log("fetched locator from user callsign", data);
          _locator = data.locator;
        } catch (err) {
          console.error(
            "error in USER locator fetch",
            err?.response?.data || err
          );
        }
      }

      if (_locator || (isManuallySettingLocator && locator.length === 6)) {
        if (!isManuallySettingLocator) {
          setLocator(_locator);

          await getLatLon(_locator);
        } else {
          await getLatLon(locator);
        }
      }
      setLocatorLoading(false);
    }

    fetchLocator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManuallySettingLocator, locator, user]);

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
    // durata di 4 ore
    setCookie("callsign", callsign, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 4
    });
    setCookie("locator", locator, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 4
    });
  }, [callsign, locator, setCookie]);

  async function createQso(e) {
    e.preventDefault();

    setDisabled(true);

    console.log("create qso for callsign", callsign);

    try {
      const obj = {
        // fromStation,
        callsign,
        event: id,
        band: event.band,
        mode: "SSB/CW",
        qsoDate: new Date().toISOString(),
        locator,
        rst: 59,
        fromStationCity: city,
        fromStationProvince: province,
        fromStationLat: lat,
        fromStationLon: lon
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

      // setAlert({
      //   color: "success",
      //   msg: "QSO creato con successo"
      // });

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

  const [autocomplete, setAutocomplete] = useState(null);

  const autocompleteTimeout = useRef(null);
  useEffect(() => {
    if (!callsign || !user) return;

    if (autocompleteTimeout.current) {
      clearTimeout(autocompleteTimeout.current);
    }
    if (callsign.length <= 2) {
      console.log(
        "too shirt for autocomplete, callsign length",
        callsign.length
      );
      setAutocomplete(null);
      return;
    }
    autocompleteTimeout.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          "/api/autocomplete/" + callsign.replaceAll("/", "%2F")
        );
        console.log("autocomplete", data);
        if (data.callsign !== callsign) {
          console.log("callsign changed, aborting");
          return;
        }
        if (
          Object.keys(data).length > 1 &&
          !(
            "date" in data &&
            "callsign" in data &&
            Object.keys(data).length === 2
          )
        ) {
          // if only keys are date and callsign, it's not a valid autocomplete
          console.log("setAutocomplete", data);
          setAutocomplete(data);
        } else {
          console.log("no autocomplete, keys", Object.keys(data).length);
          setAutocomplete(null);
        }
      } catch (err) {
        console.log(err);
      }
    }, 200);
  }, [callsign, user]);

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
    } finally {
      setDisabled(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
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
    formData.append("fromStationCity", city);
    formData.append("fromStationProvince", province);
    formData.append("fromStationLat", lat);
    formData.append("fromStationLon", lon);
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
        msg: data.length + " QSO importati con successo"
      });
      setDisabled(false);
      setQsos([...qsos, ...data]);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setDisabled(false);
    } finally {
      setShowModal(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
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

      setAlert({
        color: "success",
        msg: `Eliminat${deleted.length === 1 ? "o" : "i"} ${deleted.length} QSO`
      });
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
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

    setAlert({
      color: "success",
      msg: `Esportati ${selectedQsos.length} QSO`
    });
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
      eqslSending.set(q._id, "ok");
      // setAlert({
      //   color: "success",
      //   msg: "eQSL inviata con successo"
      // });
    } catch (err) {
      eqslSending.set(q._id, "failed");
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
      setTimeout(() => {
        eqslSending.delete(q._id);
      }, 3000);
    }
  }

  const [allPredataInserted, setAllPredataInserted] = useState(false);

  useEffect(() => {
    setAllPredataInserted(locator && formattedAddress);
    console.log("predata", { locator });
  }, [locator, formattedAddress]);

  return user === null ? (
    navigate({
      pathname: "/login",
      search: createSearchParams({
        to: window.location.pathname + window.location.search
      }).toString()
    })
  ) : (
    <Layout>
      <Helmet>
        <title>
          Gestione QSO -{event ? ` ${event.name} -` : ""} VHF e superiori
        </title>
      </Helmet>
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
                    <Table.HeadCell>Banda</Table.HeadCell>
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
                        <Table.Cell>{q.band || q.frequency}</Table.Cell>
                        <Table.Cell>{q.mode}</Table.Cell>
                        <Table.Cell>{q.locator}</Table.Cell>
                        <Table.Cell>{q.rst}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            ) : (
              <Spinner className="dark:text-white dark:fill-white" />
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
        <div className="mx-auto px-4 w-full md:w-5/6 pt-12">
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
              <div className="mb-8 flex flex-col md:flex-row md:justify-between gap-4 items-center">
                <Typography variant="h1" className="flex items-center gap-2">
                  <Badge size="lg" color="info">
                    {event?.name || "..."}
                  </Badge>
                </Typography>
              </div>

              <div className="mb-6">
                {event === null ? (
                  <p>
                    Errore nel caricamento dell'evento (prova a ricaricare la
                    pagina)
                  </p>
                ) : !event ? (
                  <Spinner className="dark:text-white dark:fill-white" />
                ) : null}

                <div className="my-12">
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <Typography variant="h2" className="mb-2">
                      QSO registrati
                    </Typography>
                    <div>
                      <h3 className="font-bold">Importa QSO da file ADIF</h3>
                      <div className="mb-8 flex items-center gap-2">
                        <FileInput
                          disabled={disabled}
                          helperText={
                            disabled && (
                              <Spinner className="dark:text-white dark:fill-white" />
                            )
                          }
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
                  <div className="mb-16 -mt-6">
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
                                  <Spinner
                                    className="dark:text-white dark:fill-white"
                                    size="sm"
                                  />
                                ) : (
                                  <span>Esporta ADIF</span>
                                )}
                              </Button>
                              <Button
                                color="failure"
                                disabled={
                                  disabled ||
                                  selectedQsos.length === 0 ||
                                  selectedQsos.some(
                                    e => eqslSending.get(e) === "sending"
                                  )
                                }
                                onClick={deleteSelected}
                              >
                                {disabled ? (
                                  <Spinner
                                    className="dark:text-white dark:fill-white"
                                    size="sm"
                                  />
                                ) : selectedQsos.some(
                                    e => eqslSending.get(e) === "sending"
                                  ) ? (
                                  <Tooltip
                                    content={`Attendi che la eQSL per ${
                                      qsos.find(
                                        q =>
                                          q._id ===
                                          selectedQsos.find(
                                            e =>
                                              eqslSending.get(e) === "sending"
                                          )
                                      )?.callsign
                                    } si invii...`}
                                  >
                                    <Spinner
                                      className="dark:text-white dark:fill-white"
                                      size="sm"
                                    />
                                  </Tooltip>
                                ) : (
                                  <span>Elimina selezionati</span>
                                )}
                              </Button>
                            </Button.Group>
                          </div>

                          <div className="shadow-lg">
                            <Table>
                              <Table.Head>
                                <Table.HeadCell>
                                  <span className="sr-only">Azioni</span>
                                </Table.HeadCell>
                                {user?.isAdmin && (
                                  <Table.HeadCell>Stazione</Table.HeadCell>
                                )}
                                <Table.HeadCell>Nominativo</Table.HeadCell>
                                <Table.HeadCell>Data UTC</Table.HeadCell>
                                <Table.HeadCell>Banda</Table.HeadCell>
                                <Table.HeadCell>Modo</Table.HeadCell>
                                <Table.HeadCell>A locatore</Table.HeadCell>
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
                                        ? "bg-yellow-200 hover:bg-yellow-200"
                                        : i % 2 === 0
                                        ? "hover:bg-gray-200 dark:hover:bg-gray-600"
                                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                                            onChange={e =>
                                              selectQso(q, e.target.checked)
                                            }
                                          />
                                        </Tooltip>
                                      </div>
                                    </Table.Cell>
                                    {user?.isAdmin && (
                                      <Table.Cell>
                                        {q.fromStation?.callsign}
                                      </Table.Cell>
                                    )}
                                    <Table.Cell>
                                      <div className="whitespace-nowrap font-medium text-gray-900 dark:text-white flex gap-1 items-center">
                                        {q.callsign}
                                      </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {formatInTimeZone(
                                        q.qsoDate,
                                        "UTC",
                                        "yyyy-MM-dd HH:mm"
                                      )}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {q.band || q.frequency}
                                    </Table.Cell>
                                    <Table.Cell>{q.mode}</Table.Cell>
                                    <Table.Cell>{q.toLocator}</Table.Cell>
                                    <Table.Cell>{q.rst}</Table.Cell>
                                    <Table.Cell>
                                      <div className="flex w-full justify-center">
                                        <div>
                                          <Button
                                            color={
                                              eqslSending.get(q._id) === "ok"
                                                ? "success"
                                                : eqslSending.get(q._id) ===
                                                  "failed"
                                                ? "failure"
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
                                                  : eqslSending.get(q._id) ===
                                                    "failed"
                                                  ? "Errore nell'invio, riprova"
                                                  : q.emailSent
                                                  ? "⚠️ eQSL già inviata, usa per reinviarla" +
                                                    (q.email
                                                      ? " a " + q.email
                                                      : "")
                                                  : "Usa il pulsante per forzare l'invio" +
                                                    (q.email
                                                      ? " a " + q.email
                                                      : "")
                                              }
                                            >
                                              {eqslSending.get(q._id) ===
                                              "sending" ? (
                                                <Spinner
                                                  className="dark:text-white dark:fill-white"
                                                  size="sm"
                                                />
                                              ) : eqslSending.get(q._id) ===
                                                "ok" ? (
                                                <FaCheck />
                                              ) : eqslSending.get(q._id) ===
                                                "failed" ? (
                                                <FaTimes />
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
                      <Spinner className="dark:text-white dark:fill-white" />
                    ) : (
                      <p>
                        Errore nel caricamento dei QSO (prova a ricaricare la
                        pagina)
                      </p>
                    )}
                  </div>

                  <div
                    id="create-qso-container"
                    className="flex flex-col md:flex-row justify-center md:justify-between gap-4 items-center"
                  >
                    <Typography variant="h2" className="my-2 flex items-center">
                      Crea QSO
                    </Typography>
                  </div>
                  {user ? (
                    <div>
                      <form onSubmit={createQso}>
                        {page === 0 ? (
                          locatorLoading ? (
                            <Spinner className="dark:text-white dark:fill-white" />
                          ) : (
                            <>
                              <div className="flex flex-col md:flex-row justify-center items-center gap-4">
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

                                <div
                                  className={`${
                                    formattedAddress ? "" : "mb-7"
                                  } flex items-center gap-2`}
                                >
                                  <div className="w-full">
                                    <Label
                                      htmlFor="locator"
                                      value="Tuo locatore"
                                    />
                                    <TextInput
                                      color={
                                        locator?.length === 6 &&
                                        formattedAddress
                                          ? "success"
                                          : formattedAddress === false
                                          ? "info"
                                          : "warning"
                                      }
                                      disabled={disabled}
                                      id="locator"
                                      label="Tuo locatore"
                                      helperText={
                                        (formattedAddress !== false &&
                                          formattedAddress) ||
                                        "Locatore non valido"
                                      }
                                      minLength={6}
                                      maxLength={6}
                                      placeholder="JN54mn"
                                      value={locator}
                                      onChange={e => {
                                        setLocator(e.target.value);
                                        setCookie("locator", e.target.value, {
                                          path: "/qsomanager",
                                          maxAge: 60 * 60 * 4
                                        });
                                        if (e.target.value.length !== 6) {
                                          setFormattedAddress(null);
                                        }
                                      }}
                                    />
                                  </div>

                                  <Button
                                    color="gray"
                                    onClick={geolocalize}
                                    disabled={disabled}
                                    className="mb-1"
                                  >
                                    <FaMapMarkerAlt className="text-xl" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )
                        ) : (
                          <div className="flex flex-col gap-2 items-center">
                            <div className="flex flex-col md:flex-row gap-2 justify-center items-center md:items-end">
                              <div className="w-full relative">
                                <Label htmlFor="callsign" value="Nominativo" />
                                <TextInput
                                  disabled={disabled}
                                  id="callsign"
                                  label="Nominativo"
                                  sizing="xl"
                                  minLength={1}
                                  maxLength={10}
                                  ref={callsignRef}
                                  placeholder="Inserisci nominativo"
                                  value={callsign}
                                  className="uppercase font-semibold text-2xl input-large text-black"
                                  onChange={e => {
                                    const val = e.target.value.toUpperCase();
                                    setCallsign(val);
                                    setCookie("callsign", val, {
                                      path: "/qsomanager",
                                      maxAge: 60 * 60 * 4
                                    });
                                  }}
                                  required
                                  autocomplete="off"
                                  autoComplete="off"
                                />

                                {callsign && autocomplete && (
                                  <div className="absolute top-20 left-0 bg-white min-w-[28rem] dark:bg-gray-800 shadow-lg rounded-lg z-10">
                                    <Card
                                      onClick={createQso}
                                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      {/* justify-between */}
                                      <div className="flex items-center gap-4">
                                        <Avatar
                                          img={autocomplete.pictureUrl}
                                          size="lg"
                                        />
                                        <div className="flex flex-col items-center min-w-[10rem]">
                                          <span className="font-semibold text-lg flex items-center gap-1">
                                            <span className="text-gray-500">
                                              <FaUser />
                                            </span>{" "}
                                            {autocomplete.callsign}
                                          </span>
                                          {autocomplete.name && (
                                            <span className="text-center">
                                              {autocomplete.name}
                                            </span>
                                          )}
                                        </div>

                                        <div className="ml-auto flex flex-col items-center min-w-[10rem]">
                                          {autocomplete.email && (
                                            <a
                                              href={`mailto:${autocomplete.email}`}
                                              className="text-center font-semibold text-blue-500 dark:text-blue-400 text-sm"
                                            >
                                              {autocomplete.email}
                                            </a>
                                          )}
                                          {autocomplete.address && (
                                            <span className="text-center text-sm text-gray-500 dark:text-gray-400">
                                              {autocomplete.address}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  </div>
                                )}
                              </div>

                              <Button
                                type="submit"
                                disabled={disabled || callsign.length === 0}
                                size="lg"
                                color={highlighted ? "success" : "info"}
                                className="transition-colors duration-500 min-w-[11rem]"
                              >
                                {disabled ? (
                                  <Spinner className="dark:text-white dark:fill-white" />
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <FaSave />
                                    Inserisci QSO
                                  </span>
                                )}
                              </Button>
                            </div>

                            {/* orario */}
                          </div>
                        )}
                        <div className="mt-4 flex flex-col items-center gap-2">
                          <div className="flex justify-center">
                            {page === 0 && (
                              <Tooltip
                                content={
                                  allPredataInserted
                                    ? "Pagina successiva"
                                    : "Completa tutti i campi per procedere"
                                }
                              >
                                <Button
                                  type="button"
                                  disabled={disabled || !allPredataInserted}
                                  onClick={() =>
                                    setIsManuallySettingLocator(false)
                                  }
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
                            )}
                          </div>
                        </div>
                      </form>

                      {page === 1 && (
                        <div className="mt-8 flex justify-end">
                          <Button
                            onClick={() => setIsManuallySettingLocator(true)}
                          >
                            Modifica locatore per portatili /P
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Spinner className="dark:text-white dark:fill-white" />
                  )}
                </div>

                {user?.isAdmin && qsos && (
                  <div>
                    <Alert color="failure">
                      <FaInfoCircle className="inline mr-1" />
                      Vedi questo in quanto sei un{" "}
                      <span className="font-bold">amministratore</span>
                    </Alert>
                    <Typography variant="h2" className="my-2 flex items-center">
                      Mappa QSO
                    </Typography>

                    <MapContainer
                      center={[44.646331832036864, 10.925526003071043]}
                      zoom={5}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />

                      {qsos
                        .filter(
                          q =>
                            q.fromStationLat &&
                            q.fromStationLon &&
                            q.toStationLat &&
                            q.toStationLon
                        )
                        .map(q => (
                          <>
                            <Polyline
                              positions={[
                                [q.fromStationLat, q.fromStationLon],
                                [q.toStationLat, q.toStationLon]
                              ]}
                              color="blue"
                              weight={2} // make a bit thinner
                            />

                            <StationMapMarker
                              callsign={q.fromStation.callsign}
                              lat={q.fromStationLat}
                              lon={q.fromStationLon}
                              locator={q.fromLocator}
                              iconRescaleFactor={0.5}
                            />
                            <StationMapMarker
                              callsign={q.callsign}
                              lat={q.toStationLat}
                              lon={q.toStationLon}
                              locator={q.toLocator}
                              iconRescaleFactor={0.5}
                            />
                          </>
                        ))}

                      <MapWatermark />
                    </MapContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QsoManager;

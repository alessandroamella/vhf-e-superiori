import { Typography } from "@material-tailwind/react";
import { useMap } from "@uidotdev/usehooks";
import axios from "axios";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  FileInput,
  Label,
  Modal,
  Spinner,
  Table,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
import {
  FaBook,
  FaForward,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaSave,
  FaUndo,
  FaUser,
} from "react-icons/fa";
import { IoIosRadio } from "react-icons/io";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import {
  createSearchParams,
  Navigate,
  useNavigate,
  useParams,
} from "react-router";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import MapWatermark from "../shared/MapWatermark";
import PayPalDonateBtn from "../shared/PayPalDonateBtn";
import StationMapMarker from "../shared/StationMapMarker";
import useUserStore from "../stores/userStore";
import ShareMapBtn from "./ShareMapBtn";
import VirtualizedQsoRow from "./VirtualizedQsoRow";

const formatForInput = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16); // Formats to YYYY-MM-DDTHH:mm
};

function getAdifKey(qso, index) {
  return JSON.stringify({
    callsign: qso.callsign,
    index,
  });
}

const QsoManager = () => {
  const user = useUserStore((store) => store.user);

  const alertContainerRef = useRef(null);
  const scrollToAlert = useCallback(() => {
    alertContainerRef.current?.scrollIntoView();
  }, []);

  const [disabled, setDisabled] = useState(true);
  const [alert, _setAlert] = useState(null);

  const setAlert = useCallback(
    (alert) => {
      _setAlert(alert);
      if (alert) scrollToAlert();
    },
    [scrollToAlert],
  );

  const [fromStation, setFromStation] = useState(null);
  const [fromStationInput, setFromStationInput] = useState("");
  const [users, setUsers] = useState(false);

  // NEW: State for the custom dropdown visibility
  const [showStationSuggestions, setShowStationSuggestions] = useState(false);
  const fromStationRef = useRef(null); // To detect clicks outside

  // NEW: State for the Edit Modal search
  const [editStationSearch, setEditStationSearch] = useState("");
  const [showEditStationSuggestions, setShowEditStationSuggestions] =
    useState(false);
  const editStationRef = useRef(null);
  const editingQsoIdRef = useRef(null);

  const { id } = useParams();
  const [event, setEvent] = useState(false);
  const [qsos, setQsos] = useState(false);

  const [hasPermission, setHasPermission] = useState(false);

  const [highlighted, setHighlighted] = useState(null);

  const eqslSending = useMap();

  const [editingQso, setEditingQso] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredQsos = useMemo(() => {
    if (!qsos || !Array.isArray(qsos)) return [];
    if (!searchQuery) return qsos;
    const lowerQuery = searchQuery.toLowerCase();
    return qsos.filter((q) => {
      // Search in "To Station"
      const callsignMatch = q.callsign.toLowerCase().includes(lowerQuery);
      // Search in "From Station" (User object)
      const fromStationMatch = q.fromStation?.callsign
        ? q.fromStation.callsign.toLowerCase().includes(lowerQuery)
        : false;
      // Search in "From Station" (Override text)
      const overrideMatch = q.fromStationCallsignOverride
        ? q.fromStationCallsignOverride.toLowerCase().includes(lowerQuery)
        : false;

      return callsignMatch || fromStationMatch || overrideMatch;
    });
  }, [qsos, searchQuery]);

  useEffect(() => {
    async function getUsers() {
      try {
        const { data } = await axios.get("/api/auth/all", {
          params: {
            sortByCallsign: true,
          },
        });
        console.log("users", data);
        setUsers(data);

        // MODIFIED LOGIC START
        const defaultStation =
          data.find((e) => e.callsign === user.callsign) || data[0];
        setFromStation(defaultStation);
        if (defaultStation) setFromStationInput(defaultStation.callsign);
        // MODIFIED LOGIC END
      } catch (err) {
        console.log("Errore nel caricamento degli utenti", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });

        setUsers(null);
      }
    }

    if ((user?.isAdmin || user?.isDev) && !users) {
      getUsers();
    }
  }, [setAlert, user, users]);

  const getQsos = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/qso", {
        params: {
          event: id,
          fromStation: user.isAdmin ? undefined : user._id,
        },
      });
      console.log("QSOs", data);
      data.sort((b, a) => new Date(a.qsoDate) - new Date(b.qsoDate));
      setQsos(data);
    } catch (err) {
      console.log("Errore nel caricamento dei QSO", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });

      setQsos(null);
    }
  }, [id, setAlert, user]);

  const [callsignOverride, setCallsignOverride] = useState(null);
  useEffect(() => {
    if (!user) return;
    setCallsignOverride(user.callsign);
  }, [user]);

  useEffect(() => {
    async function getEvent() {
      try {
        const { data } = await axios.get(`/api/event/${id}`);
        console.log("event", data);
        setEvent(data);
      } catch (err) {
        console.log("Errore nel caricamento dell'evento", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });

        setEvent(null);
      }
    }
    if (user && id && (event === false || qsos === false)) {
      if (!event) getEvent();
      if (!qsos) getQsos();
    }
  }, [event, id, qsos, user, getQsos, setAlert]);

  useEffect(() => {
    if (user === null) {
      setAlert({
        color: "failure",
        msg: "Devi prima effettuare il login",
      });

      return;
    } else if (user && event) {
      console.log(
        "not event station",
        user,
        event,
        "f",
        !!event,
        !!user,
        Array.isArray(event.joinRequests) &&
          event.joinRequests
            ?.filter((e) => e.isApproved)
            ?.map((e) => e.fromUser.callsign)
            ?.includes(user.callsign),
        event.joinRequests,
      );
      // if (user.isAdmin) {
      //   setAlert({
      //     color: "info",
      //     msg: "Non sei una stazione attivatrice per questo evento, ma sei un amministratore e puoi comunque gestire i QSO",
      //   });
      // }
      // now we allow everyone
      //  else {
      //   setAlert({
      //     color: "failure",
      //     msg: "Non sei una stazione attivatrice per questo evento"
      //   });

      //   setHasPermission(false);
      //   return;
      // }
    } else if (event === null) {
      setAlert({
        color: "failure",
        msg: "Evento non trovato",
      });

      return;
    } else if (qsos === null) {
      setAlert({
        color: "failure",
        msg: "Errore nel caricamento dei QSO",
      });

      return;
    }

    if (event && qsos && user) {
      setDisabled(false);
      setHasPermission(true);
    }
  }, [event, qsos, setAlert, user]);

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
      async (position) => {
        console.log("Geolocalizzato", position);

        setFormattedAddress(null);

        const { data } = await axios.get(
          `/api/location/locator/${position.coords.latitude}/${position.coords.longitude}`,
        );
        console.log("fetched locator in geolocalize", data);
        setLocator(data.locator);
      },
      (err) => {
        console.log("Errore nella geolocalizzazione", err);
        setAlert({
          color: "failure",
          msg: "Errore nella geolocalizzazione",
        });
      },
    );
  }, [setAlert]);

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
            geocode: true,
          },
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
            `/api/location/locator/${user.lat}/${user.lon}`,
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
            `/api/autocomplete/${user.callsign.replaceAll("/", "%2F")}`,
          );
          console.log("fetched locator from user callsign", data);
          _locator = data.locator;
        } catch (err) {
          console.error(
            "error in USER locator fetch",
            err?.response?.data || err,
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
  }, [isManuallySettingLocator, locator, user, formattedAddress]);

  const callsignRef = useRef(null);

  useEffect(() => {
    window.addEventListener("beforeunload", (event) => {
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
      maxAge: 60 * 60 * 4,
    });
    setCookie("locator", locator, {
      path: "/qsomanager",
      maxAge: 60 * 60 * 36, // 36 ore
    });
  }, [callsign, locator, setCookie]);

  const createQso = async (e) => {
    e?.preventDefault();

    if (callsign === user?.callsign) {
      setAlert({
        color: "failure",
        msg: "Non puoi creare un QSO con te stesso",
      });
      setDisabled(false);
      return;
    }

    setDisabled(true);

    console.log("create qso for callsign", callsign);

    try {
      const obj = {
        // fromStation,
        callsign,
        fromStationCallsignOverride: callsignOverride,
        event: id,
        band: event.band,
        mode: "SSB/CW",
        qsoDate: new Date().toISOString(),
        locator,
        rst: 59,
        fromStationCity: city,
        fromStationProvince: province,
        fromStationLat: lat,
        fromStationLon: lon,
        // emailSent,
        // emailSentDate,
        // notes,
        // email,
        // imageHref
      };

      if (user.isAdmin) {
        let selectedStation = fromStation;

        // If no object selected, try to match text input to a user
        if (!selectedStation && fromStationInput && users) {
          selectedStation = users.find((u) => u.callsign === fromStationInput);
        }

        if (selectedStation) {
          // Case A: A valid user was found (via click or text match)
          obj.fromStation = selectedStation._id;

          // If the override is still the default Admin callsign, update it to the selected station's callsign
          // This prevents the QSO from appearing as the Admin despite selecting another station
          if (callsignOverride === user.callsign) {
            obj.fromStationCallsignOverride = selectedStation.callsign;
          }
        } else if (fromStationInput) {
          // Case B: Text entered does NOT match any user (Arbitrary override)
          // We use the Admin's ID as base, but force the override text
          obj.fromStation = user._id;
          obj.fromStationCallsignOverride = fromStationInput;
        } else {
          // Case C: Nothing entered, use Admin default
          obj.fromStation = user._id;
        }
      } else {
        console.log("fromStation unchanged", user);
      }

      const { data } = await axios.post("/api/qso", obj);
      ReactGA.event({
        category: "QSO Management",
        action: "Create QSO",
      });
      console.log("QSO", data);

      // setAlert({
      //   color: "success",
      //   msg: "QSO creato con successo"
      // });

      setHighlighted(data._id);
      setTimeout(() => setHighlighted(null), 2500);

      setQsos([data, ...qsos]);
      setCallsign("");
      // resetDate();

      setTimeout(() => {
        callsignRef?.current?.focus();
      }, 100);
    } catch (err) {
      console.log(err.response?.data?.err || err);
      window.alert(
        `ERRORE crea QSO: ${getErrorStr(err?.response?.data?.err || err)}`,
      );

      // setAlert({
      //     color: "failure",
      //     msg: getErrorStr(err?.response?.data?.err)
      // });
      // setUser(null);
    }
    setDisabled(false);
  };

  const updateQso = useCallback(
    async (e) => {
      e.preventDefault();
      if (!editingQso) return;

      // Create a copy of the object to avoid modifying the state directly
      const payload = { ...editingQso };

      // "Flatten" populated objects back to their IDs so the backend validator is happy
      if (payload.fromStation && typeof payload.fromStation === "object") {
        payload.fromStation = payload.fromStation._id;
      }
      if (payload.event && typeof payload.event === "object") {
        payload.event = payload.event._id;
      }
      if (payload.toStation && typeof payload.toStation === "object") {
        payload.toStation = payload.toStation._id;
      }

      try {
        setDisabled(true);
        // Send 'payload' instead of 'editingQso'
        const { data } = await axios.put(`/api/qso/${editingQso._id}`, payload);

        setQsos((prevQsos) => {
          // 1. Replace the updated QSO in the list
          const updatedList = prevQsos.map((q) =>
            q._id === data._id ? { ...q, ...data } : q,
          );

          // 2. Re-sort the list by date (Descending: Newest at the top)
          // Using .sort() on a copied array or using the functional update pattern
          return [...updatedList].sort(
            (a, b) => new Date(b.qsoDate) - new Date(a.qsoDate),
          );
        });

        setEditingQso(null);
        setAlert({ color: "success", msg: "QSO aggiornato con successo" });
      } catch (err) {
        console.error(err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setDisabled(false);
      }
    },
    [editingQso, setAlert],
  );

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
        callsign.length,
      );
      setAutocomplete(null);
      return;
    } else if (callsign === user.callsign) {
      console.log("callsign is user, aborting");
      setAutocomplete(null);
      return;
    }
    autocompleteTimeout.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `/api/autocomplete/${callsign.replaceAll("/", "%2F")}`,
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

  const adifInputRef = useRef(null);

  const [page, setPage] = useState(0); // 0 = pre data, 1 = insert qso

  const importAdif = useCallback(
    async (_adifFile) => {
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
            "Content-Type": "multipart/form-data",
          },
        });
        ReactGA.event({
          category: "QSO Management",
          action: "Start ADIF Import",
        });
        console.log("imported", { data });

        setAdifQsos(data);
        setAdifChecked(
          data.reduce((acc, q, i) => {
            acc[getAdifKey(q, i)] = true;
            return acc;
          }, {}),
        );
        setShowModal(true);
      } catch (err) {
        console.log(err?.response?.data || err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setDisabled(false);
      }
    },
    [id, setAlert],
  );

  const [isImportingAdif, setIsImportingAdif] = useState(false);

  const resetAdif = useCallback(() => {
    if (adifInputRef.current) {
      adifInputRef.current.value = null;
      setHasFile(false);
    }
    setAdifFile(null);
  }, []);

  const importAdifSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!window.confirm("Vuoi importare i QSO selezionati?")) {
        return;
      }

      console.log("import adif submit", adifQsos);

      setIsImportingAdif(true);

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
          adifQsos
            .map((q, i) => getAdifKey(q, i))
            .filter((k) => !adifChecked[k]),
        ),
      );
      formData.append("save", true);
      try {
        const { data } = await axios.post("/api/adif/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        ReactGA.event({
          category: "QSO Management",
          action: "Submit ADIF Import",
          value: adifQsos.filter(
            (qso) => adifChecked[getAdifKey(qso, adifQsos.indexOf(qso))],
          ).length,
        });
        console.log("imported", { data });

        setAdifQsos(null);
        setAdifChecked({});
        resetAdif();

        await getQsos();

        setTimeout(() => {
          setAlert({
            color: "success",
            msg: `${data.length} QSO importati con successo`,
          });
          setDisabled(false);
        }, 690);
      } catch (err) {
        console.log(err?.response?.data || err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
        setDisabled(false);
      } finally {
        setShowModal(false);
        setIsImportingAdif(false);
      }
    },
    [
      adifChecked,
      adifFile,
      adifQsos,
      city,
      getQsos,
      id,
      lat,
      lon,
      province,
      setAlert,
      resetAdif,
    ],
  );

  const [selectedQsos, setSelectedQsos] = useState([]);
  function selectQso(qso, checked) {
    if (checked) {
      setSelectedQsos([...selectedQsos, qso._id]);
    } else {
      setSelectedQsos(selectedQsos.filter((q) => q !== qso._id));
    }
  }

  const [deleteQsoAnimation, setDeleteQsoAnimation] = useState(false);

  const deleteSelected = useCallback(async () => {
    if (
      !window.confirm(
        `Vuoi ELIMINARE i QSO selezionati (${selectedQsos.length})?\n⚠️⚠️ L'operazione è irrevocabile!`,
      )
    ) {
      return;
    }

    setDisabled(true);
    const deleted = [];
    try {
      for (const qso of selectedQsos) {
        await axios.delete(`/api/qso/${qso}`);
        deleted.push(qso);
      }
      console.log("deleted", deleted);
      setQsos(qsos.filter((q) => !deleted.includes(q._id)));
      setSelectedQsos([]);

      setAlert({
        color: "success",
        msg: `Eliminat${deleted.length === 1 ? "o" : "i"} ${deleted.length} QSO`,
      });

      setDeleteQsoAnimation(true);
      setTimeout(() => setDeleteQsoAnimation(false), 1000);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDisabled(false);
    }
  }, [selectedQsos, qsos, setAlert]);

  const exportAdif = useCallback(async () => {
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
      msg: `Esportati ${selectedQsos.length} QSO`,
    });
  }, [id, selectedQsos, setAlert]);

  const navigate = useNavigate();

  const forceSendEqsl = useCallback(
    async (q) => {
      eqslSending.set(q._id, "sending");

      console.log("forceSendEqsl for qso", q._id, q);

      try {
        const { data } = await axios.get(`/api/eqsl/forcesend/${q._id}`);
        console.log("OK forceSendEqsl for qso", q._id, data);
        setQsos(
          qsos.map((qso) =>
            qso._id === q._id
              ? { ...qso, imageHref: data?.href, emailSent: true }
              : qso,
          ),
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
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setTimeout(() => {
          eqslSending.delete(q._id);
        }, 3000);
      }
    },
    [eqslSending, qsos, setAlert],
  );

  const [allPredataInserted, setAllPredataInserted] = useState(false);

  const lastUpdatedLocator = useRef(locator);
  useEffect(() => {
    if (
      isManuallySettingLocator ||
      !locator ||
      !event ||
      locator === lastUpdatedLocator.current
    )
      return;

    async function updateLocator() {
      try {
        await axios.put(`/api/qso/changelocator/${event._id}`, {
          locator,
        });
        lastUpdatedLocator.current = locator;
        setCookie("locator", locator, {
          path: "/qsomanager",
          maxAge: 60 * 60 * 36, // 36 ore
        });
      } catch (err) {
        console.log("Error while updating locator", err);
        setAlert({
          color: "failure",
          msg:
            "Errore nell'aggiornamento del locatore. " +
            getErrorStr(err?.response?.data?.err),
        });
      }
    }

    updateLocator();
  }, [locator, isManuallySettingLocator, event, setAlert, setCookie]);

  useEffect(() => {
    setAllPredataInserted(locator && formattedAddress);
    console.log("predata", { locator });
  }, [locator, formattedAddress]);

  const autocompleteRef = useRef(null);

  // if clicked outside of autocomplete, close it
  useEffect(() => {
    function handleClickOutside(event) {
      // Existing logic
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target)
      ) {
        setAutocomplete(null);
      }

      // NEW: Logic for Create Form Dropdown
      if (
        fromStationRef.current &&
        !fromStationRef.current.contains(event.target)
      ) {
        setShowStationSuggestions(false);
      }

      // NEW: Logic for Edit Modal Dropdown
      if (
        editStationRef.current &&
        !editStationRef.current.contains(event.target)
      ) {
        setShowEditStationSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modified useEffect to prevent resetting input while typing
  useEffect(() => {
    // If modal is closed, reset ref
    if (!editingQso) {
      editingQsoIdRef.current = null;
      return;
    }

    // If we are still editing the same QSO ID, do not reset the search text
    if (editingQsoIdRef.current === editingQso._id) return;

    // We are editing a new QSO, update the ref and initialize the search field
    editingQsoIdRef.current = editingQso._id;

    if (users) {
      // Try to use the override text first (allows arbitrary edits)
      if (editingQso.fromStationCallsignOverride) {
        setEditStationSearch(editingQso.fromStationCallsignOverride);
        return;
      }

      // Fallback to looking up the ID
      const currentStationId =
        typeof editingQso.fromStation === "object"
          ? editingQso.fromStation?._id
          : editingQso.fromStation;

      const currentStation = users.find((u) => u._id === currentStationId);
      if (currentStation) {
        setEditStationSearch(currentStation.callsign);
      } else {
        setEditStationSearch("");
      }
    }
  }, [editingQso, users]);

  return user === null ? (
    <Navigate
      to={{
        pathname: "/login",
        search: createSearchParams({
          to: window.location.pathname + window.location.search,
        }).toString(),
      }}
    />
  ) : (
    <>
      <Helmet>
        <title>
          Gestione QSO -{event ? ` ${event.name} -` : ""} VHF e Superiori
        </title>
      </Helmet>

      {/* Edit Modal */}
      <Modal
        show={!!editingQso}
        onClose={() => setEditingQso(null)}
        dismissible
      >
        <Modal.Header>Modifica QSO</Modal.Header>
        <Modal.Body>
          {editingQso && (
            <form
              id="edit-qso-form"
              onSubmit={updateQso}
              className="flex flex-col gap-4"
            >
              {(user?.isAdmin || user?.isDev) && users && (
                <div className="relative" ref={editStationRef}>
                  <Label value="DA Stazione (fromStationCallsignOverride)" />
                  <TextInput
                    value={editStationSearch}
                    placeholder="Cerca stazione..."
                    onFocus={() => setShowEditStationSuggestions(true)}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEditStationSearch(val);
                      setShowEditStationSuggestions(true);

                      const exact = users.find((u) => u.callsign === val);
                      if (exact) {
                        // If text matches a real user, link to that user ID
                        setEditingQso({
                          ...editingQso,
                          fromStation: exact._id,
                          fromStationCallsignOverride: exact.callsign,
                        });
                      } else {
                        // If text is arbitrary, just update the override text
                        setEditingQso({
                          ...editingQso,
                          fromStationCallsignOverride: val,
                        });
                      }
                    }}
                    autoComplete="off"
                  />

                  {/* Custom Dropdown for Edit Modal */}
                  {showEditStationSuggestions && users && (
                    <div className="absolute top-16 left-0 w-full z-50 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {users
                        .filter((u) => u.callsign.includes(editStationSearch))
                        .map((u) => (
                          <div
                            key={u._id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                            onClick={() => {
                              setEditingQso({
                                ...editingQso,
                                fromStation: u._id,
                                fromStationCallsignOverride: u.callsign,
                              });
                              setEditStationSearch(u.callsign);
                              setShowEditStationSuggestions(false);
                            }}
                          >
                            <Avatar
                              img={u.pictureUrl}
                              rounded
                              size="xs"
                              placeholderInitials={u.callsign.substring(0, 2)}
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm dark:text-white">
                                {u.callsign}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                {u.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      {users.filter((u) =>
                        u.callsign.includes(editStationSearch),
                      ).length === 0 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Nessuna stazione trovata
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label value="A Stazione (callsign)" />
                <TextInput
                  value={editingQso.callsign}
                  onChange={(e) =>
                    setEditingQso({
                      ...editingQso,
                      callsign: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label value="Banda" />
                  <TextInput
                    value={editingQso.band}
                    onChange={(e) =>
                      setEditingQso({ ...editingQso, band: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label value="Modo" />
                  <TextInput
                    value={editingQso.mode}
                    onChange={(e) =>
                      setEditingQso({ ...editingQso, mode: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label value="RST" />
                  <TextInput
                    type="number"
                    value={editingQso.rst}
                    onChange={(e) =>
                      setEditingQso({
                        ...editingQso,
                        rst: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>
                <div>
                  <Label value="DA Locatore" />
                  <TextInput
                    value={editingQso.locator || ""}
                    onChange={(e) =>
                      setEditingQso({ ...editingQso, locator: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label value="Data e Ora (UTC)" />
                  <TextInput
                    type="datetime-local"
                    value={formatForInput(editingQso.qsoDate)}
                    onChange={(e) =>
                      setEditingQso({
                        ...editingQso,
                        qsoDate: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label value="A Locatore" />
                  <TextInput
                    placeholder="es. JN54xx"
                    value={editingQso.toLocator || ""}
                    onChange={(e) => {
                      setEditingQso({
                        ...editingQso,
                        toLocator: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label value="Note" />
                <TextInput
                  value={editingQso.notes || ""}
                  onChange={(e) =>
                    setEditingQso({ ...editingQso, notes: e.target.value })
                  }
                />
              </div>
            </form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button form="edit-qso-form" type="submit" disabled={disabled}>
            Salva
          </Button>
          <Button color="gray" onClick={() => setEditingQso(null)}>
            Annulla
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        position="center"
        size="7xl"
        show={showModal}
        onClose={isImportingAdif ? undefined : () => setShowModal(false)}
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
                    disabled={disabled || isImportingAdif}
                    onClick={() => {
                      setAdifChecked(
                        adifQsos.reduce((acc, q, i) => {
                          acc[getAdifKey(q, i)] = true;
                          return acc;
                        }, {}),
                      );
                    }}
                  >
                    Seleziona tutti
                  </Button>
                  <Button
                    color="light"
                    disabled={disabled || isImportingAdif}
                    onClick={() => {
                      setAdifChecked(
                        adifQsos.reduce((acc, q, i) => {
                          acc[getAdifKey(q, i)] = false;
                          return acc;
                        }, {}),
                      );
                    }}
                  >
                    Deseleziona tutti
                  </Button>
                </Button.Group>

                <div className="w-full">
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
                              ? "bg-green-100 dark:bg-green-800"
                              : "bg-red-100 dark:bg-red-800 line-through"
                          }`}
                        >
                          <Table.Cell className="flex gap-2 items-center">
                            <Checkbox
                              value={q._id}
                              checked={adifChecked[getAdifKey(q, i)]}
                              onChange={(e) => {
                                setAdifChecked({
                                  ...adifChecked,
                                  [getAdifKey(q, i)]: e.target.checked,
                                });
                              }}
                            />{" "}
                            {q.callsign}
                          </Table.Cell>
                          <Table.Cell>
                            {formatInTimeZone(
                              q.qsoDate,
                              "UTC",
                              "yyyy-MM-dd HH:mm",
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
              </div>
            ) : (
              <Spinner className="dark:text-white dark:fill-white" />
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="w-full flex flex-col items-center">
              <div className="w-full flex justify-center gap-2">
                <Button
                  color="gray"
                  type="button"
                  disabled={disabled || isImportingAdif}
                  onClick={() => setShowModal(false)}
                >
                  Chiudi
                </Button>
                <Button type="submit" disabled={disabled || isImportingAdif}>
                  {isImportingAdif ? (
                    <Spinner
                      size="sm"
                      className="dark:text-white dark:fill-white"
                    />
                  ) : (
                    "Importa"
                  )}
                </Button>
              </div>

              {isImportingAdif && (
                <div className="w-full flex justify-center gap-2 mt-4">
                  <Spinner className="dark:text-white dark:fill-white" />
                  <span className="animate-pulse">
                    Importazione in corso, attendere prego...
                  </span>
                </div>
              )}
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="w-full h-full pb-4 dark:text-white bg-white dark:bg-gray-900">
        <div
          ref={alertContainerRef}
          className="mx-auto px-4 w-full md:w-5/6 pt-12"
        >
          {alert && (
            <Alert
              className="mb-6 dark:border dark:text-black"
              color={alert.color}
              onDismiss={() => (hasPermission ? setAlert(null) : navigate("/"))}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          {hasPermission && (
            <>
              <div className="mb-8 flex flex-col md:flex-row md:justify-between gap-4 items-center">
                <Typography
                  variant="h1"
                  className="dark:text-white flex items-center gap-2"
                >
                  <Badge size="lg" color="info">
                    {event?.name || "..."}
                  </Badge>
                </Typography>
              </div>

              <div className="mb-6 dark:text-black">
                {event === null ? (
                  <p>
                    Errore nel caricamento dell&apos;evento (prova a ricaricare
                    la pagina)
                  </p>
                ) : !event ? (
                  <Spinner className="dark:text-white dark:fill-white" />
                ) : null}

                <Card id="create-qso-container" className="my-12">
                  <div>
                    <div className="flex flex-col md:flex-row justify-center md:justify-between gap-2 md:gap-4 mb-8 items-center">
                      <Typography
                        variant="h2"
                        className="flex items-center dark:text-white"
                      >
                        <IoIosRadio className="opacity-65 scale-75 inline-block" />
                        Crea QSO
                      </Typography>

                      {page === 1 && (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => setIsManuallySettingLocator(true)}
                            color="yellow"
                            size="sm"
                            disabled={disabled}
                          >
                            Modifica il tuo locatore se sei in portatile/P
                          </Button>
                        </div>
                      )}
                    </div>
                    {user ? (
                      <div>
                        <form onSubmit={createQso}>
                          {page === 0 ? (
                            locatorLoading ? (
                              <Spinner className="dark:text-white dark:fill-white" />
                            ) : (
                              <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                                {user.isAdmin && users && (
                                  <div
                                    className="relative w-full"
                                    ref={fromStationRef}
                                  >
                                    <Label
                                      htmlFor="fromStation"
                                      value="Da stazione attivatrice*"
                                    />
                                    <TextInput
                                      id="fromStation"
                                      placeholder="Cerca stazione..."
                                      disabled={disabled}
                                      required
                                      autoComplete="off"
                                      color={
                                        fromStation &&
                                        fromStation.callsign ===
                                          fromStationInput
                                          ? "success"
                                          : "failure"
                                      }
                                      value={fromStationInput}
                                      onFocus={() =>
                                        setShowStationSuggestions(true)
                                      }
                                      onChange={(e) => {
                                        const val =
                                          e.target.value.toUpperCase();
                                        setFromStationInput(val);
                                        setShowStationSuggestions(true);

                                        // Auto-select if exact match, otherwise clear selection
                                        // This ensures the object state stays in sync with text
                                        const exact = users.find(
                                          (u) => u.callsign === val,
                                        );
                                        setFromStation(exact || null);
                                      }}
                                    />

                                    {/* RICH DROPDOWN LIST */}
                                    {showStationSuggestions && users && (
                                      <div className="absolute top-[70px] left-0 w-full min-w-[200px] z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {users
                                          .filter((u) =>
                                            u.callsign.includes(
                                              fromStationInput,
                                            ),
                                          )
                                          .map((u) => (
                                            <div
                                              key={u._id}
                                              className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                              onClick={() => {
                                                setFromStation(u);
                                                setFromStationInput(u.callsign);
                                                setShowStationSuggestions(
                                                  false,
                                                );
                                              }}
                                            >
                                              <Avatar
                                                img={u.pictureUrl}
                                                rounded
                                                size="sm"
                                                placeholderInitials={u.callsign.substring(
                                                  0,
                                                  2,
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-bold dark:text-white">
                                                  {u.callsign}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                  {u.name}
                                                </span>
                                              </div>
                                            </div>
                                          ))}

                                        {users.filter((u) =>
                                          u.callsign.includes(fromStationInput),
                                        ).length === 0 && (
                                          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            Nessuna stazione trovata
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <p className="flex items-center dark:text-gray-200 gap-1 md:mt-2 text-xs md:text-sm">
                                      <FaInfoCircle />
                                      Vedi questo in quanto sei un{" "}
                                      <span className="font-bold">
                                        amministratore
                                      </span>
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                                  <div>
                                    <Label
                                      htmlFor="callsignOverride"
                                      value="Tuo nominativo"
                                    />
                                    <TextInput
                                      id="callsignOverride"
                                      color={
                                        callsignOverride ? "success" : "warning"
                                      }
                                      value={callsignOverride}
                                      onChange={(e) =>
                                        setCallsignOverride(
                                          e.target.value.toUpperCase(),
                                        )
                                      }
                                    />
                                  </div>
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
                                        placeholder="Locatore..."
                                        value={locator}
                                        onChange={(e) => {
                                          setLocator(e.target.value);
                                          setCookie("locator", e.target.value, {
                                            path: "/qsomanager",
                                            maxAge: 60 * 60 * 4,
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
                              </div>
                            )
                          ) : (
                            <div className="sticky flex flex-col gap-2 items-center">
                              <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-[1fr,auto,auto,1fr] gap-2 items-end">
                                {/* Empty spacer for desktop centering */}
                                <div className="hidden md:block" />

                                {/* Nominativo input */}
                                <div className="w-full relative">
                                  <Label
                                    htmlFor="username"
                                    value="Nominativo"
                                  />
                                  <TextInput
                                    disabled={disabled}
                                    id="username"
                                    label="Nominativo"
                                    sizing="xl"
                                    minLength={1}
                                    maxLength={10}
                                    ref={callsignRef}
                                    placeholder="Inserisci nominativo"
                                    value={callsign}
                                    className="uppercase font-semibold text-2xl input-large text-black"
                                    onChange={(e) => {
                                      const val = e.target.value.toUpperCase();
                                      setCallsign(val);
                                      setCookie("callsign", val, {
                                        path: "/qsomanager",
                                        maxAge: 60 * 60 * 4,
                                      });
                                    }}
                                    required
                                    autocomplete="off"
                                    autoComplete="off"
                                  />

                                  {callsign && autocomplete && (
                                    <div
                                      ref={autocompleteRef}
                                      className="absolute opacity bottom-20 md:top-20 -left-3 md:left-0 bg-white min-w-[20rem] md:min-w-[28rem] max-w-[50vw] md:max-w-[80vw] dark:bg-gray-800 shadow-lg rounded-lg z-10"
                                    >
                                      <Card
                                        onClick={createQso}
                                        className="z-40 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-75"
                                      >
                                        <div className="flex justify-center items-center gap-2 md:gap-4">
                                          <div className="hidden md:block">
                                            <Avatar
                                              img={autocomplete.pictureUrl}
                                              size="lg"
                                              rounded
                                            />
                                          </div>
                                          <div className="flex flex-col items-center min-w-[10rem]">
                                            <span className="font-semibold text-lg flex items-center gap-1">
                                              <span className="text-gray-500 dark:text-gray-400">
                                                <Avatar
                                                  className="block md:hidden mb-1 mr-1 md:mb-0"
                                                  img={autocomplete.pictureUrl}
                                                  size="xs"
                                                  rounded
                                                />
                                                <FaUser className="hidden md:block" />
                                              </span>{" "}
                                              <span className="dark:text-white">
                                                {autocomplete.callsign}
                                              </span>
                                            </span>
                                            {autocomplete.name && (
                                              <span className="text-center text-sm md:text-md text-gray-500 dark:text-gray-400 max-w-[5rem] md:max-w-[15rem]">
                                                {autocomplete.name}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex flex-col items-center min-w-[10rem]">
                                            {autocomplete.email && (
                                              <span className="text-center font-semibold text-blue-500 dark:text-blue-400 text-sm truncate max-w-[8rem] md:max-w-[15rem]">
                                                {autocomplete.email}
                                              </span>
                                            )}
                                            {autocomplete.address && (
                                              <span className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-[8rem] md:max-w-[15rem] line-clamp-2 md:line-clamp-3">
                                                {autocomplete.address}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </Card>
                                    </div>
                                  )}
                                </div>

                                {/* Submit button */}
                                <div className="relative">
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

                                  <span
                                    className={`${
                                      highlighted
                                        ? "animate-bounce"
                                        : "fade-out"
                                    } absolute text-2xl lg:text-3xl font-semibold uppercase tracking-tight top-4 md:top-2 -right-52 md:-right-48 lg:-right-52 w-48 text-green-600 dark:text-green-400`}
                                  >
                                    ✅ Inserito
                                  </span>
                                </div>

                                {/* PayPal button - on right for desktop, stacked on mobile */}
                                <div className="flex justify-center md:justify-end mt-6 md:mt-0">
                                  <div className="transition-transform lg:scale-125 mr-4 md:mr-8">
                                    <PayPalDonateBtn />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex flex-col items-center gap-2">
                            <div className="flex justify-center pb-2">
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
                                    className="transition-colors px-1"
                                  >
                                    Inserisci nominativo
                                    <FaForward className="inline ml-2" />
                                  </Button>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <Spinner className="dark:text-white dark:fill-white" />
                    )}
                  </div>

                  <hr />

                  <div className="mt-12 flex flex-col md:flex-row md:justify-between">
                    <Typography
                      variant="h2"
                      className="dark:text-white mb-2 flex items-center gap-2"
                    >
                      <FaBook className="opacity-65 scale-75 inline-block" />
                      QSO registrati
                      {user?.isAdmin && (
                        <Badge color="green" size="xl">
                          {Array.isArray(qsos) ? (
                            qsos.length
                          ) : (
                            <Spinner className="dark:text-white dark:fill-white" />
                          )}
                        </Badge>
                      )}
                    </Typography>
                    <div>
                      <h3 className="font-bold dark:text-gray-400">
                        Importa QSO da file ADIF
                      </h3>
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
                          onChange={(e) => importAdif(e.target.files[0])}
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
                  <div className="-mt-6">
                    {Array.isArray(qsos) ? (
                      qsos.length > 0 ? (
                        <div>
                          <div className="flex flex-col md:flex-row gap-2 items-center md:justify-between">
                            {/* SEARCH BAR FOR ADMINS */}
                            {user?.isAdmin && (
                              <div className="w-full md:w-1/3 mb-2">
                                <TextInput
                                  type="text"
                                  placeholder="Cerca QSO (Stazione o Attivatore)..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                />
                              </div>
                            )}

                            {/* seleziona - deseleziona - esporta adif - elimina */}
                            <Button.Group className="mb-2">
                              <Button
                                color="light"
                                disabled={
                                  disabled ||
                                  selectedQsos.length === qsos.length ||
                                  qsos.length === 0
                                }
                                onClick={() => {
                                  setSelectedQsos(qsos.map((q) => q._id));
                                }}
                              >
                                Seleziona tutti
                              </Button>
                              <Button
                                color="light"
                                disabled={disabled || selectedQsos.length === 0}
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
                                color={
                                  deleteQsoAnimation ? "success" : "failure"
                                }
                                disabled={
                                  disabled ||
                                  selectedQsos.length === 0 ||
                                  selectedQsos.some(
                                    (e) => eqslSending.get(e) === "sending",
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
                                    (e) => eqslSending.get(e) === "sending",
                                  ) ? (
                                  <Tooltip
                                    content={`Attendi che la eQSL per ${
                                      qsos.find(
                                        (q) =>
                                          q._id ===
                                          selectedQsos.find(
                                            (e) =>
                                              eqslSending.get(e) === "sending",
                                          ),
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

                          <div className="shadow-lg md:-mx-6 lg:-mx-14 xl:mx-0">
                            {/* Table Header */}
                            <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 min-h-[60px] px-2 font-medium text-gray-900 dark:text-white w-full">
                              <div
                                className="flex-shrink-0 flex justify-center items-center"
                                style={{ width: "5%" }}
                              >
                                <span className="sr-only">Azione</span>
                              </div>
                              {user?.isAdmin && (
                                <div
                                  className="flex-shrink-0"
                                  style={{ width: "12%" }}
                                >
                                  Stazione
                                </div>
                              )}
                              <div
                                className="flex-shrink-0"
                                style={{ width: user?.isAdmin ? "15%" : "18%" }}
                              >
                                Nominativo
                              </div>
                              <div
                                className="flex-shrink-0"
                                style={{ width: user?.isAdmin ? "20%" : "25%" }}
                              >
                                Data UTC
                              </div>
                              <div
                                className="flex-shrink-0"
                                style={{ width: user?.isAdmin ? "12%" : "15%" }}
                              >
                                Banda
                              </div>
                              <div
                                className="flex-shrink-0"
                                style={{ width: user?.isAdmin ? "10%" : "12%" }}
                              >
                                Modo
                              </div>
                              <div
                                className="flex-shrink-0"
                                style={{ width: user?.isAdmin ? "12%" : "15%" }}
                              >
                                A locatore
                              </div>
                              <div
                                className="flex-shrink-0"
                                style={{ width: user?.isAdmin ? "10%" : "12%" }}
                              >
                                RST
                              </div>
                              <div
                                className={`text-center`}
                                style={{ width: user?.isAdmin ? "14%" : "8%" }}
                              >
                                Azioni
                              </div>
                            </div>

                            {/* Virtualized Table Body */}
                            <div
                              style={{
                                height: Math.min(600, qsos.length * 60),
                              }}
                            >
                              <AutoSizer>
                                {({ height, width }) => (
                                  <List
                                    height={height}
                                    width={width}
                                    itemCount={filteredQsos.length}
                                    itemSize={60}
                                    itemData={{
                                      qsos: filteredQsos,
                                      user,
                                      highlighted,
                                      selectedQsos,
                                      setSelectedQsos,
                                      selectQso,
                                      disabled,
                                      eqslSending,
                                      forceSendEqsl,
                                      formatInTimeZone,
                                      onEdit: setEditingQso,
                                    }}
                                  >
                                    {VirtualizedQsoRow}
                                  </List>
                                )}
                              </AutoSizer>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="dark:text-white">Nessun QSO registrato</p>
                      )
                    ) : qsos === false ? (
                      <Spinner className="dark:text-white dark:fill-white" />
                    ) : (
                      <p className="dark:text-white">
                        Errore nel caricamento dei QSO (prova a ricaricare la
                        pagina)
                      </p>
                    )}
                  </div>
                </Card>

                {qsos && (
                  <div>
                    <div className="flex flex-col md:flex-row gap-12 justify-center items-center md:gap-2 md:justify-between my-4">
                      <Typography
                        variant="h3"
                        className="dark:text-white font-medium gap-2 flex items-center"
                      >
                        Mappa QSO di <strong>{user?.callsign}</strong>
                      </Typography>
                      <ShareMapBtn
                        event={event}
                        qsos={qsos}
                        user={user}
                        setAlert={setAlert}
                      />
                    </div>

                    {/* center in Perugia */}
                    <MapContainer center={[43.110717, 12.390828]} zoom={5}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />

                      {qsos
                        .filter(
                          (q) =>
                            q.fromStationLat &&
                            q.fromStationLon &&
                            q.toStationLat &&
                            q.toStationLon,
                        )
                        .map((q) => (
                          <>
                            <Polyline
                              positions={[
                                [q.fromStationLat, q.fromStationLon],
                                [q.toStationLat, q.toStationLon],
                              ]}
                              color="blue"
                              weight={2} // make a bit thinner
                            />

                            <StationMapMarker
                              callsign={
                                q.fromStationCallsignOverride ||
                                q.fromStation.callsign
                              }
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
    </>
  );
};

export default QsoManager;

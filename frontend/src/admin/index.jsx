import { Typography } from "@material-tailwind/react";
import axios from "axios";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  FileInput,
  Label,
  Modal,
  Pagination,
  Spinner,
  Table,
  TextInput,
  Tooltip
} from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import {
  createRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { it } from "date-fns/locale";
import { EventsContext, UserContext } from "../App";
import Layout from "../Layout";
// import { DefaultEditor } from "react-simple-wysiwyg";
import {
  FaPlusCircle,
  FaTimes,
  FaUndo,
  FaExternalLinkAlt,
  FaClipboardCheck,
  FaClipboard,
  FaUserShield,
  FaKey,
  FaExclamationTriangle
} from "react-icons/fa";
import {
  Link,
  createSearchParams,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { Navigation, Pagination as SwiperPagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Zoom from "react-medium-image-zoom";
import ReactPlayer from "react-player";
import Compressor from "compressorjs";
import ViewJoinRequest from "./ViewJoinRequest";
import { isFuture } from "date-fns";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import { Helmet } from "react-helmet";
import ReactPlaceholder from "react-placeholder";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import CallsignLoading from "../shared/CallsignLoading";
import { getErrorStr } from "../shared";

const AdminManager = () => {
  const { user } = useContext(UserContext);
  const { events, setEvents } = useContext(EventsContext);

  const [showModal, setShowModal] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [alert, setAlert] = useState(null);

  const [name, setName] = useState("");
  const [band, setBand] = useState("");
  // const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, -14) + "T10:00"
  );
  const [joinStart, setJoinStart] = useState(
    new Date("2023/01/01").toISOString().slice(0, -14) + "T00:00"
  );
  const [joinDeadline, setJoinDeadline] = useState(
    new Date().toISOString().slice(0, -14) + "T10:00"
  );
  const [logoUrl, setLogoUrl] = useState("/logo-min.png");
  const [eqslUrl, setEqslUrl] = useState("/logo-min.png");
  const [eqslExample, setEqslExample] = useState(null);

  const [offsetCallsign, setOffsetCallsign] = useState(null);
  const [offsetData, setOffsetData] = useState(null);
  const [offsetFrom, setOffsetFrom] = useState(null);

  const [joinRequests, setJoinRequests] = useState(null);

  const [users, setUsers] = useState(false);
  const [posts, setPosts] = useState(false);

  const [isCompressingPic, setIsCompressingPic] = useState(false);

  const pictureInputRef = createRef(null);
  const eqslInputRef = createRef(null);

  const [postPage, setPostPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  const postsPerPage = 10;
  const postsCurPage = Math.ceil((posts?.length || 0) / postsPerPage);
  const postsInterval = [
    (postPage - 1) * postsPerPage,
    (postPage - 1) * postsPerPage + postsPerPage
  ];
  const eventsPerPage = 10;
  const eventsCurPage = Math.ceil((events?.length || 0) / eventsPerPage);
  const eventsInterval = [
    (eventPage - 1) * eventsPerPage,
    (eventPage - 1) * eventsPerPage + eventsPerPage
  ];

  const isFetchingUsers = useRef(false);

  async function getUsers() {
    if (isFetchingUsers.current) return null;
    isFetchingUsers.current = true;

    try {
      const { data } = await axios.get("/api/auth/all");
      console.log("users", data);
      setUsers(data);
      // set page to last
    } catch (err) {
      console.log("Errore nel caricamento degli utenti", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setUsers(null);
    } finally {
      isFetchingUsers.current = false;
    }
  }

  const isFetchingPosts = useRef(false);

  useEffect(() => {
    if (isFetchingPosts.current) return null;
    isFetchingPosts.current = true;

    async function getPosts() {
      try {
        const { data } = await axios.get("/api/post");
        console.log("posts", data);
        setPosts(data.posts);
        setPostPage(Math.ceil(data.posts.length / postsPerPage));
      } catch (err) {
        console.log("Errore nel caricamento dei post", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setPosts(null);
      }
    }
    getUsers();
    getPosts();
  }, []);

  useEffect(() => {
    if (!events) return;
    // set to last page
    setEventPage(Math.ceil(events.length / eventsPerPage));
  }, [events]);

  async function createEvent(e) {
    e.preventDefault();

    setDisabled(true);

    try {
      const obj = {
        name,
        // description,
        band,
        date,
        joinStart,
        joinDeadline,
        logoUrl,
        eqslUrl,
        offsetCallsign,
        offsetData,
        offsetFrom
      };

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
        } con successo`
      });

      try {
        const { data } = await axios.get("/api/event");
        console.log("events fetched (admin)", data);
        setEvents(data);
      } catch (err) {
        console.log("Errore nel caricamento degli eventi", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setEvents(null);
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      // setUser(data);
      // navigate("/");
    } catch (err) {
      console.log(err.response?.data?.err || err);
      window.alert(
        "ERRORE crea evento: " + getErrorStr(err?.response?.data?.err || err)
      );

      // setAlert({
      //     color: "failure",
      //     msg: getErrorStr(err?.response?.data?.err)
      // });
      // setUser(null);
    }
    setDisabled(false);
  }

  function newEventModal() {
    setEventEditing(null);
    setShowModal(true);
  }

  const fetchJoinRequests = useCallback(async eventId => {
    setJoinRequests(null);
    try {
      const { data } = await axios.get(
        "/api/joinrequest/eventadmin/" + eventId
      );
      console.log("joinRequests", data);

      setJoinRequests(data);
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setJoinRequests(false);
    }
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const eventEditing = searchParams.get("event");
  const setEventEditing = _id => {
    if (!_id) searchParams.delete("event");
    else searchParams.set("event", _id);
    setSearchParams(searchParams);
  };

  const editEventModal = useCallback(
    e => {
      console.log("edit event:", e);
      if (eventEditing?._id !== e._id) fetchJoinRequests(e._id);
      setEventEditing(e._id);
      setName(e.name);
      setBand(e.band);
      // setDescription(e.description);
      setDate(formatInTimeZone(e.date, "Europe/Rome", "yyyy-MM-dd'T'HH:mm"));
      setJoinStart(
        formatInTimeZone(e.joinStart, "Europe/Rome", "yyyy-MM-dd'T'HH:mm")
      );
      setJoinDeadline(
        formatInTimeZone(e.joinDeadline, "Europe/Rome", "yyyy-MM-dd'T'HH:mm")
      );
      setLogoUrl(e.logoUrl);
      setEqslUrl(e.eqslUrl);

      setOffsetCallsign(e.offsetCallsign);
      setOffsetData(e.offsetData);
      setOffsetFrom(e.offsetFrom);

      setShowModal(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventEditing, fetchJoinRequests]
  );

  useEffect(() => {
    if (!eventEditing) {
      setShowModal(false);
      return;
    }
    const e = events && events?.find(e => e._id === eventEditing);
    if (e) editEventModal(e);
  }, [editEventModal, eventEditing, events]);

  const uploadEventPic = async uploadedPic => {
    const formData = new FormData();
    console.log({ uploadedPic });
    formData.append("content", uploadedPic);

    try {
      const { data } = await axios.post("/api/event/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        timeout: 2 * 60 * 1000 // 2 minutes timeout
      });
      console.log("filesPath", data);
      return data;
    } catch (err) {
      console.log(err);
      window.alert(
        "ERRORE upload immagine: " + getErrorStr(err?.response?.data?.err)
      );
      return null;
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  async function deletePost(j) {
    if (!window.confirm("Vuoi ELIMINARE il post con ID " + j._id + "?")) {
      return;
    }

    console.log("delete post", j);
    setIsDeleting(true);
    try {
      await axios.delete("/api/post/" + j._id);
      console.log("delete post", j._id);
      const _posts = [...posts];
      const i = _posts.findIndex(_j => _j._id === j._id);
      _posts.splice(i, 1);
      setPosts(_posts);
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
      setIsDeleting(false);
    }
  }

  const navigate = useNavigate();

  const [uploadedPic, setUploadedPic] = useState(null);
  const [eqslPic, setEqslPic] = useState(null);

  function resetPicture() {
    pictureInputRef.current.value = null;
    setUploadedPic(null);
  }

  function resetEqsl() {
    eqslInputRef.current.value = null;
    setEqslPic(null);
  }

  const compressPic = f => {
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
        }
      });
    });
  };

  const handlePictureChange = async event => {
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
          JSON.stringify(err, null, 2)
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
          '\nRICORDA DI PREMERE IL TASTO "Applica modifiche"'
      );
    } catch (err) {
      window.alert("ERRORE upload immagine (outer): " + getErrorStr(err));
    } finally {
      setDisabled(false);
    }
  };

  // don't have to compress eqsl
  const handleEqslChange = async event => {
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
      console.log({ files });
      formData.append("content", files[0]);

      const { data } = await axios.post("/api/event/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        timeout: 2 * 60 * 1000, // 2 minutes timeout,
        params: { isEqsl: true, quality: 80 } // higher quality for eqsl
      });
      console.log("filesPath", data);
      setEqslPic(data.path);
      window.alert(
        "Path immagine: " +
          data.path +
          '\nRICORDA DI PREMERE IL TASTO "Applica modifiche"'
      );
      setEqslUrl(data.path);

      if (!user.city || !user.province) {
        window.alert(
          "Ricordati di aggiornare la tua città e provincia per poter visualizzare l'anteprima dell'EQSL"
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
    _offsetFrom
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
      const res2 = await axios.post("/api/eqsl/preview", {
        href: _eqslPic,
        offsetCallsign: _offsetCallsign,
        offsetData: _offsetData,
        offsetFrom: _offsetFrom
      });
      console.log("eqsl preview", res2.data);
      setEqslExample(res2.data.href);
    } catch (err) {
      window.alert("ERRORE render EQSL: " + getErrorStr(err));
    } finally {
      setDisabled(false);
    }
  }

  const [hidePastEvents, setHidePastEvents] = useState(false);

  useEffect(() => {
    if (!hidePastEvents) return;
    setEventPage(1);
  }, [hidePastEvents]);

  const [copiedError, setCopiedError] = useState(false);
  const [copied, setCopied] = useState(false);

  let copyTimeout = null;
  async function copyText() {
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      setCopied(false);
      setCopiedError(false);
    }, 1000);
    try {
      await navigator.clipboard.writeText(
        window.location.origin + "/qsomanager/" + eventEditing
      );
      setCopied(true);
      setCopiedError(false);
    } catch (err) {
      console.log("copy error", err);
      setCopiedError(true);
    }
  }

  const [joinRequestsModal, setJoinRequestsModal] = useState(null);

  const editOffset = () => {
    const offsetCallsign = window.prompt("Inserisci offset NOMINATIVO");
    const offsetData = window.prompt("Inserisci offset DATI");
    const offsetFrom = window.prompt("Inserisci offset DA CHI");

    if (
      [offsetCallsign, offsetData, offsetFrom].some(e => isNaN(parseInt(e)))
    ) {
      window.alert(
        "Non hai inserito tutti i campi, l'offset non è stato modificato"
      );
      return;
    }

    setOffsetCallsign(offsetCallsign);
    setOffsetData(offsetData);
    setOffsetFrom(offsetFrom);

    renderEqslExample(null, offsetCallsign, offsetData, offsetFrom);

    window.alert(
      `Offset impostato a:\nNominativo: ${offsetCallsign}\nDati: ${offsetData}\nDa: ${offsetFrom}`
    );
  };

  const [blogPosts, setBlogPosts] = useState([]);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const { data } = await axios.get("/api/blog");
        setBlogPosts(data);
      } catch (err) {
        console.log("Errore nel caricamento dei post", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      }
    }

    fetchBlogPosts();
  }, []);

  const [_showEditUserModal, _setShowEditUserModal] = useState(null);
  const [userEditing, setUserEditing] = useState(null);

  const [addressInput, setAddressInput] = useState("");
  const addressInputRef = useRef(null);

  useEffect(() => {
    if (!userEditing) {
      _setShowEditUserModal(false);
      setAddressInput("");
      return;
    }
    _setShowEditUserModal(true);
    setAddressInput(userEditing.address || "");
  }, [userEditing]);

  const [editAlert, setEditAlert] = useState(null);

  async function submitEditUser(e) {
    e.preventDefault();

    setEditAlert(null);

    if (!window.confirm(`Vuoi modificare l'utente ${userEditing.callsign}?`)) {
      return;
    }

    setDisabled(true);
    try {
      await axios.put("/api/auth/" + userEditing._id, userEditing);
      await getUsers();
      setUserEditing(null);
    } catch (err) {
      console.log(err);
      setEditAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);
    }
  }

  const editUserRef = useRef(null);

  useEffect(() => {
    if (!editAlert || !editUserRef.current) return;

    // scroll div to top
    editUserRef.current.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [editAlert]);

  async function sendPwResetMail() {
    if (
      !window.confirm(
        `Vuoi inviare una email di reset password all'utente ${userEditing.callsign} (email: ${userEditing.email})?`
      )
    ) {
      return;
    }
    setDisabled(true);
    try {
      await axios.post("/api/auth/sendresetpw", {
        email: userEditing.email,
        token: "nope" // admin so no captcha
      });
      window.alert("Email inviata");
    } catch (err) {
      console.log(err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
      setUserEditing(null);
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } finally {
      setDisabled(false);
    }
  }

  return user === null ? (
    navigate({
      pathname: "/login",
      search: createSearchParams({
        to:
          "/eventmanager" +
          (eventEditing ? createSearchParams({ event: eventEditing }) : "")
      }).toString()
    })
  ) : user && !user.isAdmin ? (
    navigate(-1)
  ) : (
    <Layout>
      <Helmet>
        <title>Admin - VHF e superiori</title>
      </Helmet>
      <Modal
        position="center"
        size="7xl"
        show={showModal}
        onClose={() => setEventEditing(null)}
      >
        <form onSubmit={createEvent}>
          <Modal.Header>
            {!eventEditing ? "Crea" : "Modifica"} evento
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-2 flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-4">
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
                      onChange={e => setLogoUrl(e.target.value)}
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
                        helperText={
                          (isCompressingPic || disabled) && <Spinner />
                        }
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
                        onChange={e => setEqslUrl(e.target.value)}
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
                    <Label
                      htmlFor="eqslPic"
                      value="EQSL (MAX 10MB COMPRESSA)"
                    />
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
                      <Button
                        disabled={disabled}
                        onClick={editOffset}
                        color="light"
                        size="sm"
                      >
                        Modifica offset ({offsetCallsign || "x"},{" "}
                        {offsetData || "x"}, {offsetFrom || "x"})
                      </Button>
                      <Button
                        onClick={() => renderEqslExample()}
                        color="dark"
                        size="sm"
                        disabled={!eqslUrl || disabled}
                      >
                        Ricomputa esempio eQSL
                      </Button>
                    </div>
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
                  <div className="flex items-center gap-2 mt-4">
                    <Link
                      to={"/qsomanager/" + eventEditing}
                      className="flex items-center gap-2 hover:text-red-600 transition-colors"
                    >
                      <FaExternalLinkAlt />
                      <span>Apri QSO Manager</span>
                    </Link>
                  </div>
                  <hr className="mt-2" />
                </div>
              ) : (
                <p>
                  <span className="font-bold">QSO Manager</span>:{" "}
                  <span className="font-normal">
                    disponibile solo dopo la creazione dell'evento
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
                  onChange={e => setName(e.target.value)}
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
                  onChange={e => setBand(e.target.value)}
                  disabled={disabled}
                />
              </div>
              {/* <div>
                <div className="mb-2 block">
                  <Label
                    htmlFor="event-description"
                    value="Descrizione (opzionale)"
                  />
                </div>
                <DefaultEditor
                  id="event-description"
                  required={true}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={disabled}
                />
              </div> */}
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
                    onChange={e => setDate(e.target.value)}
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
                    onChange={e => setJoinStart(e.target.value)}
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
                    onChange={e => setJoinDeadline(e.target.value)}
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
                    <p className="dark:text-gray-300">
                      Ancora nessuna richiesta
                    </p>
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
                // disabled={!user || changePwBtnDisabled}
                disabled={disabled}
                onClick={() => {
                  setEventEditing(null);
                  setShowModal(false);
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

      <Modal
        position="center"
        size="7xl"
        show={joinRequestsModal}
        onClose={() => setJoinRequestsModal(null)}
      >
        <Modal.Header>Richiesta di partecipazione</Modal.Header>
        <Modal.Body>
          <ViewJoinRequest
            disabled={disabled}
            joinRequests={joinRequestsModal}
            setAlert={setAlert}
            setDisabled={setDisabled}
            setJoinRequests={setJoinRequestsModal}
            showEvent
          />
        </Modal.Body>
      </Modal>

      <Modal
        position="center"
        size="7xl"
        show={_showEditUserModal}
        onClose={() => _setShowEditUserModal(null)}
      >
        <form onSubmit={submitEditUser}>
          <Modal.Header>
            <div className="flex items-center gap-2">
              Modifica utente <CallsignLoading user={userEditing} />
            </div>
          </Modal.Header>
          <Modal.Body>
            <ReactPlaceholder
              ready={userEditing}
              showLoadingAnimation
              type="text"
              rows={10}
            >
              <div
                ref={editUserRef}
                className="space-y-2 flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-4"
              >
                {editAlert && (
                  <Alert
                    color={editAlert.color}
                    onDismiss={() => setEditAlert(null)}
                  >
                    <span>{editAlert.msg}</span>
                  </Alert>
                )}
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="user-name" value="Nome" />
                  </div>
                  <TextInput
                    id="user-name"
                    type="text"
                    required={true}
                    value={userEditing?.name}
                    onChange={e =>
                      setUserEditing({ ...userEditing, name: e.target.value })
                    }
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="user-address" value="Indirizzo" />
                  </div>
                  <ReactGoogleAutocomplete
                    apiKey="AIzaSyAiPVD_IqTn5kMi2GFXwYQCTYaxznEbCfk"
                    options={{
                      types: ["geocode"]
                    }}
                    onPlaceSelected={place => {
                      console.log("place", place);
                      const addr = place.formatted_address;
                      let cityIndex = place.address_components.findIndex(c =>
                        c.types.includes("administrative_area_level_3")
                      );
                      if (cityIndex === -1) {
                        cityIndex = 1;
                      }
                      const city =
                        place.address_components[cityIndex].long_name;
                      const province =
                        place.address_components[cityIndex + 1].short_name;

                      setUserEditing({
                        ...userEditing,
                        city,
                        province,
                        lat: place.geometry.location.lat(),
                        lon: place.geometry.location.lng(),
                        address: addr
                      });
                    }}
                    className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 rounded-lg p-2.5 text-sm"
                    id="address"
                    name="addressInput"
                    lang="it"
                    language="it"
                    type="text"
                    placeholder="Modena"
                    autoComplete="address-level4"
                    value={addressInput}
                    onChange={e => setAddressInput(e.target.value)}
                    onBlur={() => setAddressInput(userEditing?.address || "")}
                    disabled={!user}
                    helperText="Inserisci l'indirizzo di stazione (la via)"
                    ref={addressInputRef}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label
                      htmlFor="user-email"
                      value={`Email ${
                        typeof userEditing?.isVerified !== "boolean" ? (
                          <Spinner />
                        ) : userEditing?.isVerified ? (
                          "(✅ verificata)"
                        ) : (
                          "(❌ non verificata, clicca su 'Applica modifiche' per forzare la verifica)"
                        )
                      }`}
                    />
                  </div>
                  <TextInput
                    id="user-email"
                    type="email"
                    required={true}
                    value={userEditing?.email}
                    onChange={e =>
                      setUserEditing({
                        ...userEditing,
                        email: e.target.value
                      })
                    }
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="user-phone" value="Telefono" />
                  </div>
                  <TextInput
                    id="user-phone"
                    type="tel"
                    required={true}
                    value={userEditing?.phoneNumber}
                    onChange={e =>
                      setUserEditing({
                        ...userEditing,
                        phoneNumber: e.target.value
                      })
                    }
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="user-callsign" value="Nominativo" />
                  </div>
                  <TextInput
                    id="user-callsign"
                    type="text"
                    required={true}
                    value={userEditing?.callsign}
                    onChange={e =>
                      setUserEditing({
                        ...userEditing,
                        callsign: e.target.value.toUpperCase()
                      })
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900 flex flex-col items-center gap-4">
                  <h3 className="text-red-800 dark:text-red-200 font-semibold flex items-center gap-2">
                    <FaExclamationTriangle className="inline" />
                    Attenzione a modificare i permessi!
                  </h3>
                  <div className="flex justify-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2">
                      <Tooltip
                        content={
                          userEditing?._id === user?._id
                            ? "Non puoi rimuovere i tuoi permessi"
                            : userEditing?.isAdmin
                            ? "ATTENZIONE: rimuovendo i permessi di amministratore, l'utente non potrà più accedere a questa pagina e non potrà più gestire gli eventi."
                            : "Concedi i permessi di amministratore"
                        }
                      >
                        <Checkbox
                          id="user-admin"
                          checked={userEditing?.isAdmin}
                          onChange={e =>
                            setUserEditing({
                              ...userEditing,
                              isAdmin: e.target.checked
                            })
                          }
                          disabled={disabled || userEditing?._id === user?._id}
                        />
                        <Label
                          className="ml-1 select-none dark:text-gray-100"
                          htmlFor="user-admin"
                          value="Amministratore"
                        />
                      </Tooltip>
                    </div>
                    <Button
                      color="info"
                      onClick={() => sendPwResetMail()}
                      disabled={disabled}
                    >
                      <FaKey className="inline mr-1" />
                      Invia email reset password
                    </Button>
                  </div>
                </div>
              </div>
            </ReactPlaceholder>
          </Modal.Body>
          <Modal.Footer>
            <div className="w-full flex justify-center gap-2">
              <Button
                color="gray"
                type="button"
                // disabled={!user || changePwBtnDisabled}
                disabled={disabled}
                onClick={() => setUserEditing(null)}
              >
                Chiudi
              </Button>
              <Button disabled={disabled} color="info" type="submit">
                Applica modifiche
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="w-full h-full pb-24 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          <Typography variant="h1" className="mb-6 flex items-center">
            <Badge size="lg" color="info" className="mr-2">
              Admin
            </Badge>
          </Typography>

          <Accordion>
            <Accordion.Panel>
              <Accordion.Title>
                Utenti ({users ? users.length : <Spinner />})
              </Accordion.Title>
              <Accordion.Content>
                {users ? (
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Nominativo</Table.HeadCell>
                      <Table.HeadCell>Nome</Table.HeadCell>
                      <Table.HeadCell>Email</Table.HeadCell>
                      <Table.HeadCell>Telefono</Table.HeadCell>
                      <Table.HeadCell>Creazione</Table.HeadCell>
                      <Table.HeadCell>Locatore</Table.HeadCell>
                      <Table.HeadCell>Richieste</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {users?.map(u => (
                        <Table.Row key={u._id}>
                          <Table.Cell className="flex gap-2 items-center whitespace-nowrap text-gray-900 dark:text-white">
                            <Button
                              size="sm"
                              color="info"
                              onClick={() => setUserEditing(u)}
                              disabled={disabled}
                            >
                              {u.isAdmin && (
                                <FaUserShield className="inline mr-1" />
                              )}
                              {u.callsign}
                            </Button>
                          </Table.Cell>
                          <Table.Cell className="dark:text-gray-300">
                            {u.isAdmin ? (
                              <Tooltip content="Amministratore">
                                {" "}
                                {u.name}
                              </Tooltip>
                            ) : (
                              <span>{u.name}</span>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <a
                              href={"mailto:" + u.email}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              {u.email}
                            </a>
                          </Table.Cell>
                          <Table.Cell>
                            <a
                              href={"tel:" + u.phoneNumber}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              {u.phoneNumber}
                            </a>
                          </Table.Cell>
                          <Table.Cell>
                            {formatInTimeZone(
                              u.createdAt,
                              "Europe/Rome",
                              "dd/MM/yyyy "
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {u.locator ? (
                              <Tooltip
                                content={`${u.lat},${u.lon} (${
                                  u.address || "Indirizzo sconosciuto"
                                })`}
                              >
                                <span>{u.locator}</span>
                              </Tooltip>
                            ) : (
                              <FaTimes />
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {u.joinRequests.length !== 0 ? (
                              <Button
                                color="info"
                                onClick={() =>
                                  setJoinRequestsModal(u.joinRequests)
                                }
                              >
                                <Badge color="info">
                                  {u.joinRequests.length}
                                </Badge>
                                <span className="ml-1">
                                  <FaExternalLinkAlt />
                                </span>
                              </Button>
                            ) : (
                              <FaTimes />
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ) : users === false ? (
                  <Spinner />
                ) : (
                  <p>Errore nel caricamento degli utenti</p>
                )}
              </Accordion.Content>
            </Accordion.Panel>

            <Accordion.Panel>
              <Accordion.Title>Post ({posts?.length || "-"})</Accordion.Title>
              <Accordion.Content>
                {posts ? (
                  <div>
                    <Table striped>
                      <Table.Head>
                        <Table.HeadCell>
                          <span className="sr-only">Azioni</span>
                        </Table.HeadCell>
                        <Table.HeadCell>Autore</Table.HeadCell>
                        <Table.HeadCell>Descrizione</Table.HeadCell>
                        <Table.HeadCell>Foto</Table.HeadCell>
                        <Table.HeadCell>Video</Table.HeadCell>
                        <Table.HeadCell>Creazione</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {posts?.slice(...postsInterval)?.map(u => (
                          <Table.Row key={u._id}>
                            <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <Button
                                  color="failure"
                                  disabled={isDeleting}
                                  onClick={() => deletePost(u)}
                                >
                                  {isDeleting ? (
                                    <Spinner />
                                  ) : (
                                    <span>Elimina</span>
                                  )}
                                </Button>
                              </div>
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              {u.fromUser.callsign}
                            </Table.Cell>
                            <Table.Cell>
                              <Tooltip content={u.description}>
                                <Link to={"/social/" + u._id}>
                                  <span className="line-clamp-3">
                                    {u.description}
                                  </span>
                                </Link>
                              </Tooltip>
                            </Table.Cell>
                            <Table.Cell>
                              <Swiper
                                spaceBetween={30}
                                slidesPerView="auto"
                                navigation
                                pagination={{
                                  clickable: true
                                }}
                                modules={[Navigation, SwiperPagination]}
                              >
                                {u.pictures.map(p => (
                                  <SwiperSlide key={p}>
                                    <Zoom>
                                      <LazyLoadImage
                                        className="select-none w-full max-h-32 object-center object-contain"
                                        src={p}
                                        alt="Post pic"
                                      />
                                    </Zoom>
                                  </SwiperSlide>
                                ))}
                              </Swiper>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="w-[228px]">
                                <Swiper
                                  spaceBetween={30}
                                  slidesPerView="auto"
                                  navigation
                                  pagination={{
                                    clickable: true
                                  }}
                                  modules={[Navigation, SwiperPagination]}
                                >
                                  {u.videos.map(v => (
                                    <SwiperSlide key={v}>
                                      <ReactPlayer
                                        controls
                                        height={128}
                                        width={228}
                                        url={v}
                                      />
                                    </SwiperSlide>
                                  ))}
                                </Swiper>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              {formatInTimeZone(
                                u.createdAt,
                                "Europe/Rome",
                                "dd/MM/yyyy HH:mm:ss"
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                    <Pagination
                      showIcons
                      currentPage={postPage}
                      totalPages={postsCurPage}
                      onPageChange={setPostPage}
                    />
                  </div>
                ) : posts === false ? (
                  <Spinner />
                ) : (
                  <p>Errore nel caricamento dei post</p>
                )}
              </Accordion.Content>
            </Accordion.Panel>

            <Accordion.Panel>
              <Accordion.Title>Eventi</Accordion.Title>

              <Accordion.Content>
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    onChange={e => setHidePastEvents(e.target.checked)}
                    id="remove-passed-events"
                  />
                  <Label htmlFor="remove-passed-events" className="select-none">
                    Escludi eventi passati
                  </Label>
                </div>

                {events === null ? (
                  <p>Eventi non caricati</p>
                ) : events ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                      {events
                        .filter(e =>
                          hidePastEvents ? isFuture(new Date(e.date)) : true
                        )
                        .slice(...eventsInterval)
                        .map(e => (
                          <Card
                            className="cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-700 hover:scale-105 transition-all"
                            key={e._id}
                            imgSrc={e.logoUrl || "/logo-min.png"}
                            onClick={() => editEventModal(e)}
                          >
                            <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                              {e.name}
                            </h5>
                            {/* {e.description ? (
                    <div
                      className="line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: e.description
                      }}
                    />
                  ) : (
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                      "-- nessuna descrizione --"
                    </p>
                  )} */}

                            <p className="font-bold text-gray-700 dark:text-gray-400">
                              📅{" "}
                              {formatInTimeZone(
                                new Date(e.date),
                                "Europe/Rome",
                                "eee d MMMM Y",
                                {
                                  locale: it
                                }
                              )}
                              <br />
                              🕒{" "}
                              {formatInTimeZone(
                                new Date(e.date),
                                "Europe/Rome",
                                "HH:mm",
                                {
                                  locale: it
                                }
                              )}
                            </p>
                            <p className="font-normal text-gray-700 dark:text-gray-400">
                              📡 <strong>{e.band}</strong>
                            </p>
                            <p className="font-normal text-gray-700 dark:text-gray-400">
                              Scadenza per partecipare{" "}
                              <strong>
                                {formatInTimeZone(
                                  new Date(e.joinDeadline),
                                  "Europe/Rome",
                                  "eee d MMMM Y",
                                  {
                                    locale: it
                                  }
                                )}
                              </strong>
                            </p>
                          </Card>
                        ))}
                      {events?.length === 0 && <p>Nessun evento salvato</p>}
                    </div>
                    <div className="w-full flex justify-center my-3 py-1 border-y border-gray-200">
                      <Button
                        className="flex h-full my-auto text-md flex-col justify-center items-center"
                        onClick={newEventModal}
                      >
                        <span className="text-5xl mb-1 mr-2">
                          <FaPlusCircle />
                        </span>{" "}
                        Nuovo evento
                      </Button>
                    </div>
                    <Pagination
                      showIcons
                      currentPage={eventPage}
                      totalPages={eventsCurPage}
                      onPageChange={setEventPage}
                    />
                  </div>
                ) : (
                  <Spinner />
                )}
              </Accordion.Content>
            </Accordion.Panel>

            <Accordion.Panel>
              <Accordion.Title>Blog</Accordion.Title>

              <Accordion.Content>
                {blogPosts ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                      {blogPosts.map(e => (
                        <Card
                          className="cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-700 hover:scale-105 transition-all"
                          key={e._id}
                          onClick={() => navigate("/blog/edit/" + e._id)}
                        >
                          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {e.title}
                          </h5>
                          <p className="font-normal text-gray-700 dark:text-gray-400">
                            {formatInTimeZone(
                              new Date(e.createdAt),
                              "Europe/Rome",
                              "eee d MMMM Y",
                              {
                                locale: it
                              }
                            )}
                          </p>
                        </Card>
                      ))}
                      {blogPosts?.length === 0 && <p>Nessun post salvato</p>}
                    </div>
                    <div className="w-full flex justify-center my-3 py-1 border-y border-gray-200">
                      <Button
                        className="flex h-full my-auto text-md flex-col justify-center items-center"
                        onClick={() => navigate("/blog/editor")}
                      >
                        <span className="text-5xl mb-1 mr-2">
                          <FaPlusCircle />
                        </span>{" "}
                        Nuovo post
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Spinner />
                )}
              </Accordion.Content>
            </Accordion.Panel>
          </Accordion>

          <div className="mt-8">
            <Alert color="failure" className="dark:text-black">
              <h3 className="font-bold text-2xl">ATTENZIONE</h3>
              <p>
                Il backup è un'operazione costosa che richiede un po' di tempo,
                si consiglia di effettuarlo solo in caso di necessità
              </p>
              <a href="/api/backup" target="_blank" rel="noopener noreferrer">
                <Button
                  color="failure"
                  size="lg"
                  className="mt-2 px-1 dark:text-black"
                >
                  Backup dati
                </Button>
              </a>
            </Alert>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminManager;

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
import React, { createRef, useContext, useEffect, useState } from "react";
import { it } from "date-fns/locale";
import { EventsContext, getErrorStr, UserContext } from "..";
import Layout from "../Layout";
// import { DefaultEditor } from "react-simple-wysiwyg";
import {
  FaCheck,
  FaPlusCircle,
  FaTimes,
  FaUndo,
  FaExternalLinkAlt,
  FaClipboardCheck,
  FaClipboard,
  FaUnlink,
  FaUserPlus
} from "react-icons/fa";
import { Link, createSearchParams, useNavigate } from "react-router-dom";
import { Navigation, Pagination as SwiperPagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Zoom from "react-medium-image-zoom";
import ReactPlayer from "react-player";
import Compressor from "compressorjs";
import ViewJoinRequest from "./ViewJoinRequest";
import { isFuture } from "date-fns";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { formatInTimeZone } from "../shared/formatInTimeZone";

const AdminManager = () => {
  const { user } = useContext(UserContext);
  const { events, setEvents } = useContext(EventsContext);

  const [showModal, setShowModal] = useState(false);
  const [eventEditing, setEventEditing] = useState(null);
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

  useEffect(() => {
    async function getUsers() {
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
      }
    }
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
        eqslUrl
      };

      const { data } = !eventEditing
        ? await axios.post("/api/event", obj)
        : await axios.put(`/api/event/${eventEditing}`, obj);
      console.log("event", data);
      setShowModal(false);

      setAlert({
        color: "success",
        msg: `Evento "${name}" ${
          !eventEditing ? "creato" : "modificato"
        } con successo`
      });

      try {
        const { data } = await axios.get("/api/event");
        console.log("events", data);
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

  function editEventModal(e) {
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
    setShowModal(true);
  }

  async function fetchJoinRequests(eventId) {
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
  }

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
        const res2 = await axios.post("/api/eqsl/preview", { href: data.path });
        console.log("eqsl preview", res2.data);
        setEqslExample(res2.data.href);
      }
    } catch (err) {
      window.alert("ERRORE upload immagine (outer): " + getErrorStr(err));
    } finally {
      setDisabled(false);
    }
  };

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

  return user === null || (user && !user.isAdmin) ? (
    navigate({
      pathname: "/login",
      search: createSearchParams({
        to: "/"
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
        <form onSubmit={createEvent}>
          <Modal.Header>
            {!eventEditing ? "Crea" : "Modifica"} evento
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-2 flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex flex-col items-center">
                    <p className="mb-2 block">Locandina</p>
                    <LazyLoadImage
                      src={logoUrl}
                      alt="Logo URL"
                      className="w-96 max-w-full max-h-96 object-contain m-auto drop-shadow-lg"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="mb-2 block">EQSL</p>
                    <LazyLoadImage
                      src={eqslUrl}
                      alt="EQSL URL"
                      className="w-96 max-w-full max-h-96 object-contain m-auto drop-shadow-lg"
                    />

                    {eqslExample && (
                      <div className="flex flex-col items-center">
                        <p className="mb-2 block">Esempio EQSL</p>
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
                </div>
              </div>

              {eventEditing ? (
                <div className="flex flex-col">
                  <hr className="mb-2" />
                  <p>URL da condividere con stazioni attivatrici:</p>

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
                onClick={() => setShowModal(false)}
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

      <div className="w-full h-full pb-24 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          {alert && (
            <Alert
              className="mb-6"
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
                {/* <Typography variant="h2" className="mb-4 flex items-center"> */}
                Utenti
                {/* </Typography> */}
              </Accordion.Title>
              <Accordion.Content>
                {users ? (
                  <div>
                    <Table striped>
                      <Table.Head>
                        <Table.HeadCell>Nominativo</Table.HeadCell>
                        <Table.HeadCell>Nome</Table.HeadCell>
                        <Table.HeadCell>Email</Table.HeadCell>
                        <Table.HeadCell>Telefono</Table.HeadCell>
                        <Table.HeadCell>Creazione</Table.HeadCell>
                        <Table.HeadCell>Richieste</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {users?.map(u => (
                          <Table.Row key={u._id}>
                            <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              {u.callsign}
                            </Table.Cell>
                            <Table.Cell
                              className={`${u.isAdmin ? "font-bold" : ""}`}
                            >
                              {u.isAdmin ? (
                                <Tooltip content="Amministratore">
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
                  </div>
                ) : users === false ? (
                  <Spinner />
                ) : (
                  <p>Errore nel caricamento degli utenti</p>
                )}
              </Accordion.Content>
            </Accordion.Panel>

            <Accordion.Panel>
              <Accordion.Title>Post</Accordion.Title>
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
          </Accordion>

          {/* <form action="#" method="post" onSubmit={login}>
                    <Input
                        type="text"
                        name="callsign"
                        label="Nominativo"
                        value={callsign}
                        onChange={e => setCallsign(e.target.value)}
                        disabled={disabled}
                        ref={loginInput}
                        autoComplete="callsign"
                        autoFocus
                    />
                    <div className="my-4" />
                    <Input
                        type="password"
                        name="password"
                        label="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={disabled}
                    />
                    <div className="my-4" />
                    <Button type="submit" disabled={disabled}>
                        AdminManager
                    </Button>
                </form> */}
        </div>
      </div>
    </Layout>
  );
};

export default AdminManager;

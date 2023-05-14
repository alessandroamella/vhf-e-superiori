import { Typography } from "@material-tailwind/react";
import axios from "axios";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  FileInput,
  Label,
  ListGroup,
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
import React, { createRef, useContext, useEffect, useState } from "react";
import { it } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { EventsContext, getErrorStr, UserContext } from "..";
import Layout from "../Layout";
// import { DefaultEditor } from "react-simple-wysiwyg";
import {
  FaCheck,
  FaDownload,
  FaPlusCircle,
  FaTimes,
  FaUndo
} from "react-icons/fa";
import { createSearchParams, useNavigate } from "react-router-dom";
import ReactHTMLTableToExcel from "react-html-table-to-excel";
import { Navigation, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Zoom from "react-medium-image-zoom";
import ReactPlayer from "react-player/lazy";
import Compressor from "compressorjs";
import { isFuture } from "date-fns";

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

  const [joinRequests, setJoinRequests] = useState(null);

  const [users, setUsers] = useState(false);
  const [posts, setPosts] = useState(false);

  const [isCompressingPic, setIsCompressingPic] = useState(false);

  const pictureInputRef = createRef(null);

  useEffect(() => {
    async function getUsers() {
      try {
        const { data } = await axios.get("/api/auth/all");
        console.log("users", data);
        setUsers(data);
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
        const { data } = await axios.get("/api/post", {
          params: { limit: 100 }
        });
        console.log("posts", data);
        setPosts(data.posts);
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
        logoUrl
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

  async function approveJoinRequests(j) {
    if (
      !window.confirm(
        `Vuoi ${
          j.isApproved ? "ANNULLARE" : "APPROVARE"
        } la richiesta di partecipazione con ID ${j._id}?`
      )
    ) {
      return;
    }
    setDisabled(true);
    try {
      await axios.post("/api/joinrequest/" + j._id);
      console.log("approved joinRequest", j);
      setJoinRequests([
        ...joinRequests.filter(_j => _j._id !== j._id),
        { ...j, isApproved: !j.isApproved, updatedAt: new Date() }
      ]);
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);
    }
  }

  async function deleteJoinRequests(j) {
    if (
      !window.confirm(
        "Vuoi ELIMINARE la richiesta di partecipazione con ID " + j._id + "?"
      )
    ) {
      return;
    }

    setDisabled(true);
    try {
      await axios.delete("/api/joinrequest/" + j._id);
      console.log("deleted joinRequest", j);
      setJoinRequests([...joinRequests.filter(_j => _j._id !== j._id)]);
    } catch (err) {
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);
    }
  }

  const [isApproving, setIsApproving] = useState(false);

  async function setApprovePost(j) {
    if (
      !window.confirm(
        `Vuoi ${j.isApproved ? "DISAPPROVARE" : "APPROVARE"} il post con ID ${
          j._id
        }?`
      )
    ) {
      return;
    }

    console.log("approve post", j);
    setIsApproving(true);
    try {
      await axios.post("/api/post/approve/" + j._id);
      console.log("set approved post", j._id);
      const _posts = [...posts];
      const i = _posts.findIndex(_j => _j._id === j._id);
      _posts[i] = { ...j, isApproved: !j.isApproved };
      setPosts(_posts);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setIsApproving(false);
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
    } finally {
      setIsDeleting(false);
    }
  }

  const navigate = useNavigate();

  const [uploadedPic, setUploadedPic] = useState(null);

  function resetPicture() {
    pictureInputRef.current.value = null;
    setUploadedPic(null);
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

  const [hidePastEvents, setHidePastEvents] = useState(false);

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
                <img
                  loading="lazy"
                  src={logoUrl}
                  alt="Logo URL"
                  className="w-96 max-w-full max-h-96 object-contain mx-auto"
                />
                <div className="my-auto">
                  <div className="mb-2 block">
                    <Label htmlFor="event-logo-url" value="URL logo" />
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
                        helperText={isCompressingPic && <Spinner />}
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
                </div>
              </div>
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
                    <>
                      <Button className="mx-auto mb-2 flex items-center">
                        <FaDownload className="mr-1" />
                        <ReactHTMLTableToExcel
                          className="download-table-xls-button"
                          table="join-requests-list"
                          filename={
                            "lista-richieste-" + name.replace(/\W/g, "")
                          }
                          sheet="lista"
                          buttonText="Scarica come Excel"
                        />
                      </Button>
                      <Table id="join-requests-list" striped>
                        <Table.Head>
                          <Table.HeadCell>Nominativo</Table.HeadCell>
                          <Table.HeadCell>Nome</Table.HeadCell>
                          <Table.HeadCell>Telefono</Table.HeadCell>
                          <Table.HeadCell>Stato richiesta</Table.HeadCell>
                          <Table.HeadCell>Data creazione</Table.HeadCell>
                          <Table.HeadCell>Antenna</Table.HeadCell>
                          <Table.HeadCell>
                            <span className="sr-only">Azioni</span>
                          </Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                          {(console.log(joinRequests), null)}
                          {joinRequests.map(j => (
                            <Table.Row key={j._id}>
                              <Table.Cell className="whitespace-nowrap font-medium">
                                <a
                                  href={
                                    "https://www.qrz.com/db/" +
                                    j.fromUser.callsign
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                                >
                                  {j.fromUser.callsign}
                                </a>
                              </Table.Cell>
                              <Table.Cell>
                                <Tooltip content={j.fromUser.email}>
                                  <a
                                    href={"mailto:" + j.fromUser.email}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                                  >
                                    {j.fromUser.name}
                                  </a>
                                </Tooltip>
                              </Table.Cell>
                              <Table.Cell>
                                <a
                                  href={"tel:" + j.fromUser.phoneNumber}
                                  className="text-red-400 hover:text-black dark:hover:text-red-200 transition-colors"
                                >
                                  {j.fromUser.phoneNumber}
                                </a>
                              </Table.Cell>
                              <Table.Cell>
                                {j.isApproved ? (
                                  <span className="ml-1 font-medium dark:text-gray-300">
                                    ✅ Approvata
                                  </span>
                                ) : (
                                  <span className="ml-1 font-medium dark:text-gray-300">
                                    ⌛ In attesa
                                  </span>
                                )}
                              </Table.Cell>
                              <Table.Cell className="dark:text-gray-300">
                                {formatInTimeZone(
                                  new Date(j.updatedAt),
                                  "Europe/Rome",
                                  "d MMM HH:mm",
                                  {
                                    locale: it
                                  }
                                )}
                              </Table.Cell>
                              <Table.Cell className="max-w-xs dark:text-gray-300">
                                <Tooltip content={j.antenna}>
                                  <p className="whitespace-nowrap overflow-hidden text-ellipsis">
                                    {j.antenna}
                                  </p>
                                </Tooltip>
                              </Table.Cell>
                              <Table.Cell>
                                <Button.Group>
                                  {j.isApproved ? (
                                    <Button
                                      color="warning"
                                      onClick={() => approveJoinRequests(j)}
                                      disabled={disabled}
                                    >
                                      Annulla approvazione
                                    </Button>
                                  ) : (
                                    <Button
                                      color="success"
                                      onClick={() => approveJoinRequests(j)}
                                      disabled={disabled}
                                    >
                                      Approva richiesta
                                    </Button>
                                  )}

                                  <Button
                                    color="failure"
                                    onClick={() => deleteJoinRequests(j)}
                                    disabled={disabled}
                                  >
                                    Cancella richiesta
                                  </Button>
                                </Button.Group>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </>
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

          <Typography variant="h2" className="mb-4 flex items-center">
            Utenti
          </Typography>
          <div className="mb-6">
            {users ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>callsign</Table.HeadCell>
                  <Table.HeadCell>name</Table.HeadCell>
                  <Table.HeadCell>email</Table.HeadCell>
                  <Table.HeadCell>phoneNumber</Table.HeadCell>
                  <Table.HeadCell>createdAt</Table.HeadCell>
                  <Table.HeadCell>isAdmin</Table.HeadCell>
                  <Table.HeadCell>joinRequests</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {users?.map(u => (
                    <Table.Row key={u._id}>
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {u.callsign}
                      </Table.Cell>
                      <Table.Cell>{u.name}</Table.Cell>
                      <Table.Cell>{u.email}</Table.Cell>
                      <Table.Cell>{u.phoneNumber}</Table.Cell>
                      <Table.Cell>
                        {formatInTimeZone(
                          u.createdAt,
                          "Europe/Rome",
                          "yyyy-MM-dd HH:mm:ss"
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {u.isAdmin ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-red-600" />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <ListGroup>
                          {u.joinRequests.length ? (
                            u.joinRequests.map(j => (
                              <ListGroup.Item>{j}</ListGroup.Item>
                            ))
                          ) : (
                            <FaTimes />
                          )}
                        </ListGroup>
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
          </div>

          <Typography variant="h2" className="mb-4 flex items-center">
            Post (ultimi 100)
          </Typography>
          <div className="mb-6">
            {posts ? (
              <Table>
                <Table.Head>
                  <Table.HeadCell>Azioni</Table.HeadCell>
                  <Table.HeadCell>fromUser</Table.HeadCell>
                  <Table.HeadCell>description</Table.HeadCell>
                  <Table.HeadCell>band</Table.HeadCell>
                  <Table.HeadCell>brand</Table.HeadCell>
                  <Table.HeadCell>isSelfBuilt</Table.HeadCell>
                  <Table.HeadCell>metersFromSea</Table.HeadCell>
                  <Table.HeadCell>boomLengthCm</Table.HeadCell>
                  <Table.HeadCell>numberOfElements</Table.HeadCell>
                  <Table.HeadCell>numberOfAntennas</Table.HeadCell>
                  <Table.HeadCell>cable</Table.HeadCell>
                  <Table.HeadCell>pictures</Table.HeadCell>
                  <Table.HeadCell>videos</Table.HeadCell>
                  <Table.HeadCell>isApproved</Table.HeadCell>
                  <Table.HeadCell>createdAt</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {posts?.map(u => (
                    <Table.Row key={u._id}>
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {u.isApproved ? (
                            <>
                              <Button
                                color="warning"
                                disabled={isApproving}
                                onClick={() => setApprovePost(u)}
                              >
                                {isApproving ? (
                                  <Spinner />
                                ) : (
                                  <span>Disapprova</span>
                                )}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                color="success"
                                disabled={isApproving}
                                onClick={() => setApprovePost(u)}
                              >
                                {isApproving ? (
                                  <Spinner />
                                ) : (
                                  <span>Approva</span>
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            color="failure"
                            disabled={isDeleting}
                            onClick={() => deletePost(u)}
                          >
                            {isDeleting ? <Spinner /> : <span>Elimina</span>}
                          </Button>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {u.fromUser.callsign}
                      </Table.Cell>
                      <Table.Cell>
                        <Tooltip content={u.description}>
                          <span className="line-clamp-3">{u.description}</span>
                        </Tooltip>
                      </Table.Cell>
                      <Table.Cell>{u.band}</Table.Cell>
                      <Table.Cell>{u.brand}</Table.Cell>
                      <Table.Cell>
                        {u.isSelfBuilt ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-red-600" />
                        )}
                      </Table.Cell>
                      <Table.Cell>{u.metersFromSea}</Table.Cell>
                      <Table.Cell>{u.boomLengthCm}</Table.Cell>
                      <Table.Cell>{u.numberOfElements}</Table.Cell>
                      <Table.Cell>{u.numberOfAntennas}</Table.Cell>
                      <Table.Cell>{u.cable}</Table.Cell>
                      <Table.Cell>
                        <Swiper
                          spaceBetween={30}
                          slidesPerView="auto"
                          navigation
                          pagination={{
                            clickable: true
                          }}
                          modules={[Navigation, Pagination]}
                        >
                          {u.pictures.map(p => (
                            <SwiperSlide key={p}>
                              <Zoom>
                                <img
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
                        <div className="w-[384px]">
                          <Swiper
                            spaceBetween={30}
                            slidesPerView="auto"
                            navigation
                            pagination={{
                              clickable: true
                            }}
                            modules={[Navigation, Pagination]}
                          >
                            {u.videos.map(v => (
                              <SwiperSlide key={v}>
                                <ReactPlayer
                                  controls
                                  height={128}
                                  width={384}
                                  url={v}
                                />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {u.isApproved ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-red-600" />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {formatInTimeZone(
                          u.createdAt,
                          "Europe/Rome",
                          "yyyy-MM-dd HH:mm:ss"
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            ) : posts === false ? (
              <Spinner />
            ) : (
              <p>Errore nel caricamento degli utenti</p>
            )}
          </div>

          <Typography variant="h2" className="mb-4 flex items-center">
            Eventi
          </Typography>

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
            <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
              {events
                .filter(e =>
                  hidePastEvents ? isFuture(new Date(e.date)) : true
                )
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
              {events.length === 0 && <p>Nessun evento salvato</p>}
              <Button
                className="flex h-full text-md flex-col justify-center items-center"
                onClick={newEventModal}
              >
                <span className="text-5xl mb-1 mr-2">
                  <FaPlusCircle />
                </span>{" "}
                Nuovo evento
              </Button>
            </div>
          ) : (
            <Spinner />
          )}

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

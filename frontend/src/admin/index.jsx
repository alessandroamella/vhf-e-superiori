import { Typography } from "@material-tailwind/react";
import axios from "axios";
import { isFuture } from "date-fns";
import { it } from "date-fns/locale";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Label,
  Modal,
  Pagination,
  Spinner,
  TextInput,
  Tooltip
} from "flowbite-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { Helmet } from "react-helmet";
import { FaExclamationTriangle, FaKey, FaPlusCircle } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams
} from "react-router";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { EventsContext, UserContext } from "../App";
import { mapsApiKey } from "../constants/mapsApiKey";
import { getErrorStr } from "../shared";
import CallsignLoading from "../shared/CallsignLoading";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import CreateEditEventModal from "./CreateEditEventModal";
import PostsTable from "./PostsTable";
import UsersTable from "./UsersTable";
import ViewJoinRequest from "./ViewJoinRequest";

const AdminManager = () => {
  const { user } = useContext(UserContext);
  const { events } = useContext(EventsContext);

  const [showModal, setShowModal] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [alert, setAlert] = useState(null);

  const [users, setUsers] = useState(false);
  const [posts, setPosts] = useState(false);

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
    if (isFetchingUsers.current) return;
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
    if (isFetchingPosts.current) return;
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

  function newEventModal() {
    setEventEditing(null);
    setShowModal(true);
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const eventEditing = searchParams.get("event");

  const setEventEditing = useCallback(
    (_id) => {
      if (!_id) searchParams.delete("event");
      else searchParams.set("event", _id);
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

  const editEventModal = useCallback(
    (e) => {
      console.log("edit event:", e);
      setEventEditing(e._id);
      setShowModal(true);
    },
    [setEventEditing]
  );

  useEffect(() => {
    if (!eventEditing) {
      setShowModal(false);
      return;
    }
    const e = events && events?.find((e) => e._id === eventEditing);
    if (e) editEventModal(e);
  }, [editEventModal, eventEditing, events]);

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
      const i = _posts.findIndex((_j) => _j._id === j._id);
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

  const [hidePastEvents, setHidePastEvents] = useState(false);

  useEffect(() => {
    if (!hidePastEvents) return;
    setEventPage(1);
  }, [hidePastEvents]);

  const [joinRequestsModal, setJoinRequestsModal] = useState(null);

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

  useEffect(() => {
    if (user === null) {
      navigate({
        pathname: "/login",
        search: createSearchParams({
          to:
            "/eventmanager" +
            (eventEditing ? createSearchParams({ event: eventEditing }) : "")
        }).toString()
      });
    } else if (user && !user.isAdmin) {
      navigate(-1);
    }
  }, [eventEditing, navigate, user]);

  return (
    <>
      <Helmet>
        <title>Admin - VHF e superiori</title>
      </Helmet>

      <CreateEditEventModal
        showModal={showModal}
        setShowModal={setShowModal}
        eventEditing={eventEditing}
        setEventEditing={setEventEditing}
        setAlertFromParent={setAlert}
      />

      <Modal
        position="center"
        size="7xl"
        show={joinRequestsModal}
        dismissible
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
                    onChange={(e) =>
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
                    apiKey={mapsApiKey}
                    options={{
                      types: ["geocode"]
                    }}
                    onPlaceSelected={(place) => {
                      console.log("place", place);
                      const addr = place.formatted_address;
                      let cityIndex = place.address_components.findIndex((c) =>
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
                    onChange={(e) => setAddressInput(e.target.value)}
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
                        typeof userEditing?.isVerified !== "boolean"
                          ? "(caricamento...)"
                          : userEditing?.isVerified
                          ? "(✅ verificata)"
                          : "(❌ non verificata, clicca su 'Applica modifiche' per forzare la verifica)"
                      }`}
                    />
                  </div>
                  <TextInput
                    id="user-email"
                    type="email"
                    required={true}
                    value={userEditing?.email}
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                          onChange={(e) =>
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

      <div className="w-full overflow-y-auto h-full pb-24 dark:text-white dark:bg-gray-900">
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

          <Typography
            variant="h1"
            className="dark:text-white mb-6 flex items-center"
          >
            <Badge size="lg" color="info" className="mr-2">
              Admin
            </Badge>
          </Typography>

          <Accordion collapseAll>
            <Accordion.Panel>
              <Accordion.Title>
                Utenti ({users ? users.length : <Spinner size="sm" />})
              </Accordion.Title>
              <Accordion.Content>
                <UsersTable
                  disabled={disabled}
                  setJoinRequestsModal={setJoinRequestsModal}
                  setUserEditing={setUserEditing}
                  users={users === false ? null : users}
                />
              </Accordion.Content>
            </Accordion.Panel>

            <Accordion.Panel>
              <Accordion.Title>
                Post ({posts ? posts.length : <Spinner size="sm" />})
              </Accordion.Title>
              <Accordion.Content>
                <PostsTable
                  deletePost={deletePost}
                  isDeleting={isDeleting}
                  postPage={postPage}
                  posts={posts === false ? null : posts}
                  postsCurPage={postsCurPage}
                  postsInterval={postsInterval}
                  setPostPage={setPostPage}
                />
              </Accordion.Content>
            </Accordion.Panel>

            <Accordion.Panel>
              <Accordion.Title>
                Eventi ({events ? events.length : <Spinner size="sm" />})
              </Accordion.Title>

              <Accordion.Content>
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    onChange={(e) => setHidePastEvents(e.target.checked)}
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
                        .filter((e) =>
                          hidePastEvents ? isFuture(new Date(e.date)) : true
                        )
                        .slice(...eventsInterval)
                        .map((e) => (
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
                      <Button onClick={newEventModal}>
                        <FaPlusCircle className="inline-block mr-2 mt-[3px]" />
                        <span>Nuovo evento</span>
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
              <Accordion.Title>
                Blog ({blogPosts ? blogPosts.length : <Spinner size="sm" />})
              </Accordion.Title>

              <Accordion.Content>
                {blogPosts ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                      {blogPosts.map((e) => (
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
                        as={Link}
                        to="/blog/editor"
                      >
                        <FaPlusCircle className="inline-block mt-[3px] mr-1" />
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
                Il backup è un&apos;operazione costosa che richiede un po&apos;
                di tempo, si consiglia di effettuarlo solo in caso di necessità
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
    </>
  );
};

export default AdminManager;

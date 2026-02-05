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
} from "flowbite-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { FaPlusCircle } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { EventsContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import useUserStore from "../stores/userStore";
import CreateEditEventModal from "./CreateEditEventModal";
import EditUserModal from "./EditUserModal"; // Import the new component
import LogViewer from "./LogViewer";
import PostsTable from "./PostsTable";
import UsersTable from "./UsersTable";
import ViewJoinRequest from "./ViewJoinRequest";

const AdminManager = () => {
  const user = useUserStore((store) => store.user);
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
    (postPage - 1) * postsPerPage + postsPerPage,
  ];
  const eventsPerPage = 10;
  const eventsCurPage = Math.ceil((events?.length || 0) / eventsPerPage);
  const eventsInterval = [
    (eventPage - 1) * eventsPerPage,
    (eventPage - 1) * eventsPerPage + eventsPerPage,
  ];

  const isFetchingUsers = useRef(false);

  const getUsers = useCallback(async () => {
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
        msg: getErrorStr(err?.response?.data?.err),
      });
      setUsers(null);
    } finally {
      isFetchingUsers.current = false;
    }
  }, []);

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
          msg: getErrorStr(err?.response?.data?.err),
        });
        setPosts(null);
      }
    }
    getUsers();
    getPosts();
  }, [getUsers]);

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
    [searchParams, setSearchParams],
  );

  const editEventModal = useCallback(
    (e) => {
      console.log("edit event:", e);
      setEventEditing(e._id);
      setShowModal(true);
    },
    [setEventEditing],
  );

  useEffect(() => {
    if (!eventEditing) {
      setShowModal(false);
      return;
    }
    const e = events ? events.find((e) => e._id === eventEditing) : null;
    if (e) editEventModal(e);
  }, [editEventModal, eventEditing, events]);

  const [isDeleting, setIsDeleting] = useState(false);
  async function deletePost(j) {
    if (!window.confirm(`Vuoi ELIMINARE il post con ID ${j._id}?`)) {
      return;
    }

    console.log("delete post", j);
    setIsDeleting(true);
    try {
      await axios.delete(`/api/post/${j._id}`);
      console.log("delete post", j._id);
      const _posts = [...posts];
      const i = _posts.findIndex((_j) => _j._id === j._id);
      _posts.splice(i, 1);
      setPosts(_posts);
    } catch (err) {
      console.log(err?.response?.data || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
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
          msg: getErrorStr(err?.response?.data?.err),
        });
      }
    }

    fetchBlogPosts();
  }, []);

  const [_showEditUserModal, _setShowEditUserModal] = useState(null);
  const [userEditing, setUserEditing] = useState(null);

  useEffect(() => {
    if (user === null) {
      navigate({
        pathname: "/login",
        search: createSearchParams({
          to:
            "/eventmanager" +
            (eventEditing ? createSearchParams({ event: eventEditing }) : ""),
        }).toString(),
      });
    } else if (user && !user.isAdmin) {
      navigate(-1);
    }
  }, [eventEditing, navigate, user]);

  return (
    <>
      <Helmet>
        <title>Admin - VHF e Superiori</title>
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

      {/* Edit User Modal Component */}
      {user === false ? (
        <ReactPlaceholder type="text" rows={10} showLoadingAnimation={true} />
      ) : (
        <EditUserModal
          showEditUserModal={_showEditUserModal}
          setShowEditUserModal={_setShowEditUserModal}
          userEditing={userEditing}
          setUserEditing={setUserEditing}
          getUsers={getUsers}
          setAlert={setAlert}
          disabled={disabled}
          setDisabled={setDisabled}
          user={user}
        />
      )}

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
                          hidePastEvents ? isFuture(new Date(e.date)) : true,
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
                                  locale: it,
                                },
                              )}
                              <br />🕒{" "}
                              {formatInTimeZone(
                                new Date(e.date),
                                "Europe/Rome",
                                "HH:mm",
                                {
                                  locale: it,
                                },
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
                                    locale: it,
                                  },
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
              <Accordion.Title>Log di sistema</Accordion.Title>
              <Accordion.Content>
                {user?.isDev ? <LogViewer /> : <p>Solo per sviluppatori</p>}
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
                          onClick={() => navigate(`/blog/edit/${e._id}`)}
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
                                locale: it,
                              },
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

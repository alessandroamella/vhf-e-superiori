import Layout from "../Layout";
import { Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { EventsContext, getErrorStr, UserContext } from "..";
import {
  Alert,
  Button,
  Card,
  Label,
  Modal,
  Spinner,
  TextInput
} from "flowbite-react";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { isAfter } from "date-fns/esm";
import { it } from "date-fns/locale";
import { FaLink } from "react-icons/fa";
import { formatInTimeZone } from "date-fns-tz";

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const { events } = useContext(EventsContext);

  const [isEditing, setIsEditing] = useState(false);

  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [changePwBtnDisabled, setChangePwBtnDisabled] = useState(false);
  const [changeDataBtnDisabled, setChangeDataBtnDisabled] = useState(true);

  const [alert, setAlert] = useState(null);
  const [pwError, setPwError] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const [joinRequests, setJoinRequests] = useState(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  useEffect(() => {
    console.log({ name, email, user });
    setChangeDataBtnDisabled(
      !user || (name?.trim() === user.name && email?.trim() === user.email)
    );
  }, [name, email, user]);

  async function changePassword(e) {
    e.preventDefault();
    setChangePwBtnDisabled(true);

    try {
      await axios.post("/api/auth/changepw", {
        oldPassword: oldPw,
        newPassword: newPw
      });
      setOldPw("");
      setNewPw("");
      setAlert({
        color: "success",
        msg: "Password modificata con successo"
      });
      setPwError(null);
      setShowChangePwModal(false);
    } catch (err) {
      setPwError(getErrorStr(err?.response?.data?.err));
    }

    setChangePwBtnDisabled(false);
  }

  async function changeData(e) {
    e.preventDefault();

    setChangeDataBtnDisabled(true);
    setAlert(null);

    try {
      const { data } = await axios.put("/api/auth", { name, email });
      setAlert({ color: "success", msg: "Dati modificati con successo" });
      setUser(data);
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    }

    setChangeDataBtnDisabled(false);
  }

  async function fetchDeleteJoinRequest(e) {
    e.preventDefault();

    setJoinRequestDeleteError(null);

    try {
      await axios.delete("/api/joinrequest/" + deleteJoinRequest._id);
      setAlert({
        color: "success",
        msg: "Partecipazione annullata con successo"
      });
      setJoinRequests(jArr =>
        jArr.filter(j => j._id !== deleteJoinRequest._id)
      );
      setDeleteJoinRequest(null);
    } catch (err) {
      console.log(err);
      setJoinRequestDeleteError(getErrorStr(err?.response?.data?.err));
    }
  }

  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [isFetchingJoinRequests, setIsFetchingJoinRequests] = useState(false);

  useEffect(() => {
    if (joinRequests || !events || !user || isFetchingJoinRequests) return;
    setIsFetchingJoinRequests(true);

    async function fetchJoinRequests() {
      try {
        const { data } = await axios.get("/api/joinrequest");
        const j = data
          .map(_j => ({
            ..._j,
            event: events.find(e => e._id === _j.forEvent)
          }))
          .filter(_j => _j.event);
        setJoinRequests(j);
        setDeleteJoinRequestDisabled(false);
      } catch (err) {
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      }
    }

    fetchJoinRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinRequests, events, user]);

  const [deleteJoinRequest, setDeleteJoinRequest] = useState(false);
  const [deleteJoinRequestDisabled, setDeleteJoinRequestDisabled] =
    useState(true);
  const [joinRequestDeleteError, setJoinRequestDeleteError] = useState("");

  return (
    <Layout>
      <Modal
        show={showChangePwModal}
        onClose={() => setShowChangePwModal(false)}
      >
        <form onSubmit={changePassword}>
          <Modal.Header>Cambio password</Modal.Header>
          <Modal.Body>
            {pwError && (
              <Alert color="failure" className="mb-4">
                <span>
                  <span className="font-medium">Errore</span> {pwError}
                </span>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                Usa il seguente form per cambiare la password
              </p>

              <div>
                <div className="mb-2 block">
                  <Label htmlFor="current-password" value="Password attuale" />
                </div>
                <TextInput
                  id="current-password"
                  name="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={!user || changePwBtnDisabled}
                  value={oldPw}
                  onChange={e => setOldPw(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="new-password" value="Nuova password" />
                </div>
                <TextInput
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={!user || changePwBtnDisabled}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  helperText="Minimo 8 caratteri, almeno un numero e un carattere speciale"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="w-full flex justify-center gap-2">
              <Button
                color="gray"
                type="button"
                disabled={!user || changePwBtnDisabled}
                onClick={() => setShowChangePwModal(false)}
              >
                Chiudi
              </Button>
              <Button type="submit" disabled={!user || changePwBtnDisabled}>
                Cambia password
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal
        show={deleteJoinRequest}
        onClose={() => setDeleteJoinRequest(false)}
      >
        <form onSubmit={fetchDeleteJoinRequest}>
          <Modal.Header>Annullamento richiesta di partecipazione</Modal.Header>
          <Modal.Body>
            {joinRequestDeleteError && (
              <Alert color="failure" className="mb-4">
                <span>
                  <span className="font-medium">Errore</span>{" "}
                  {joinRequestDeleteError}
                </span>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              <p className="text-base leading-relaxed -mb-2">
                Sei sicuro di annullare la tua richiesta di partecipazione a:
              </p>
              <Link
                to={"/event/" + deleteJoinRequest?.event?._id}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-bold underline flex items-center"
              >
                <FaLink className="scale-75" />
                {deleteJoinRequest?.event?.name}
              </Link>
              {deleteJoinRequest?.isApproved && (
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  La tua richiesta è già stata approvata:{" "}
                  <strong>
                    se la annulli, dovrai fare una nuova richiesta se intenderai
                    partecipare
                  </strong>
                </p>
              )}
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                ⚠️ L'annullamento non è revocabile!
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="w-full flex justify-center gap-2">
              <Button
                color="gray"
                type="button"
                disabled={!user || deleteJoinRequestDisabled}
                onClick={() => setDeleteJoinRequest(null)}
              >
                Chiudi
              </Button>
              <Button
                type="submit"
                color="warning"
                disabled={!user || deleteJoinRequestDisabled}
              >
                Annulla richiesta
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="bg-white py-3 md:py-6 px-6 md:px-12 lg:px-24">
        <Typography variant="h3" className="my-4">
          Profilo
        </Typography>

        {alert && (
          <Alert
            className="mb-4"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div>
            {user ? (
              <div className="flex items-center flex-col md:flex-row md:items-center mb-8">
                <Typography variant="h1" className="ml-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="scale-150"
                  >
                    <path d="M22 8h-20c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2h20c1.104 0 2-.896 2-2v-12c0-1.104-.896-2-2-2zm-19 3h11v2h-11v-2zm14 5v1h-10v-1h10zm0 5h-10v-1h10v1zm2-2h-14v-1h14v1zm2-6h-6v-2h6v2zm-14-6h-4v-1h4v1zm4.421-4.448l-2.18-1.567c-.244-.178-.297-.519-.12-.762.178-.243.518-.296.761-.119l2.186 1.569-.647.879zm8.246 4.448h-2.442l-5.099-3.677.891-1.219 6.65 4.896z" />
                  </svg>
                  <span className="ml-4">{user.callsign}</span>
                </Typography>
              </div>
            ) : (
              <Spinner />
            )}

            {user && (
              <>
                <form className="flex flex-col gap-4" onSubmit={changeData}>
                  <div className={isEditing ? "block" : "flex"}>
                    <div className="mb-2 block">
                      <Label htmlFor="name" value="Nome" />
                    </div>
                    {isEditing ? (
                      <TextInput
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Alessandro Amella"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={!user}
                        autoFocus
                      />
                    ) : (
                      <Typography variant="paragraph" className="ml-2 mb-2">
                        {user?.name || <Spinner />}
                      </Typography>
                    )}
                  </div>
                  <div className={isEditing ? "block" : "flex"}>
                    <div className="mb-2 block">
                      <Label htmlFor="email" value="Email" />
                    </div>

                    {isEditing ? (
                      <TextInput
                        id="email"
                        name="email"
                        type="email"
                        placeholder="alessandro@iu4qsg.it"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={!user}
                      />
                    ) : (
                      <Typography variant="paragraph" className="ml-2 mb-2">
                        <a
                          href={"mailto:" + user?.email}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {user?.email || <Spinner />}
                        </a>
                      </Typography>
                    )}
                  </div>

                  <div className="flex mb-2">
                    {isEditing ? (
                      <>
                        <Button
                          color="gray"
                          type="button"
                          onClick={() => setIsEditing(false)}
                        >
                          Chiudi modifica
                        </Button>
                        <Button
                          type="submit"
                          disabled={!user || changeDataBtnDisabled}
                          className="ml-4"
                        >
                          Modifica dati
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="mt-2"
                        disabled={!user}
                        type="button"
                        onClick={() => setIsEditing(true)}
                      >
                        Modifica profilo
                      </Button>
                    )}
                  </div>
                </form>

                {isEditing && (
                  <>
                    <div className="my-4 flex items-center gap-4">
                      <span>
                        Password attuale: <strong>{"*".repeat(8)}</strong>
                      </span>
                      <Button onClick={() => setShowChangePwModal(true)}>
                        Cambia password
                      </Button>
                    </div>

                    <small className="mt-4">
                      Se hai sbagliato a inserire il nominativo o desideri
                      eliminare il tuo account, per favore procedi a inviarci
                      una mail ad{" "}
                      <a
                        href="mailto:alessandro@iu4qsg.it"
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        alessandro@iu4qsg.it
                      </a>
                      .
                    </small>
                  </>
                )}
              </>
            )}
          </div>

          <div>
            <Typography variant="h3" className="my-4">
              Partecipazioni
            </Typography>

            {joinRequests && events ? (
              joinRequests.length > 0 ? (
                joinRequests.map(j => (
                  <Card key={j._id} className="mb-2">
                    <h6 className="text-xl font-bold tracking-tight text-gray-900 hover:underline">
                      <Link to={"/event/" + j.event._id}>{j.event.name}</Link>
                    </h6>
                    <p className="font-normal text-gray-700 -mt-2">
                      {formatInTimeZone(
                        new Date(j.event.date),
                        "Europe/Rome",
                        "📅 dd/MM/yyyy",
                        {
                          locale: it
                        }
                      )}
                    </p>
                    <p className="font-medium">
                      {j.isApproved ? (
                        <span>✅ Approvata</span>
                      ) : isAfter(new Date(j.event.date), new Date()) ? (
                        <span>⌛ In attesa di approvazione</span>
                      ) : (
                        <span>❌ Non approvata</span>
                      )}
                    </p>

                    {isAfter(new Date(j.event.joinDeadline), new Date()) && (
                      <div>
                        <Button
                          color="warning"
                          onClick={() => setDeleteJoinRequest(j)}
                          disabled={deleteJoinRequestDisabled}
                        >
                          Annulla richiesta
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <Alert color="info">
                  <p className="font-medium">Ancora nessuna richiesta!</p>
                  <p>
                    Ma puoi richiedere di partecipare a uno dei nostri flash mob
                    sfogliando gli eventi visibili in{" "}
                    <Link to="/" className="underline">
                      homepage
                    </Link>
                  </p>
                </Alert>
              )
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

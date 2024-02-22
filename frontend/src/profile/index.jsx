import Layout from "../Layout";
import { Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { EventsContext, getErrorStr, UserContext } from "..";
import {
  Alert,
  Button,
  Card,
  Label,
  ListGroup,
  Modal,
  Spinner,
  TextInput
} from "flowbite-react";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import { isAfter } from "date-fns/esm";
import { it, itCH } from "date-fns/locale";
import { FaCheck, FaExclamation, FaLink, FaTrash } from "react-icons/fa";
import { formatInTimeZone } from "date-fns-tz";
import ReactGoogleAutocomplete from "react-google-autocomplete";

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const { events } = useContext(EventsContext);

  const [isEditing, setIsEditing] = useState(false);

  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [changePwBtnDisabled, setChangePwBtnDisabled] = useState(false);
  const [changeDataBtnDisabled, setChangeDataBtnDisabled] = useState(false);

  const [alert, setAlert] = useState(null);
  const [pwError, setPwError] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const [joinRequests, setJoinRequests] = useState(null);

  const [addressInput, setAddressInput] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhoneNumber(user.phoneNumber);
    if (user.address) {
      setAddress(user.address);
      setAddressInput(user.address);
      setLat(user.lat);
      setLon(user.lon);
      setCity(user.city);
      setProvince(user.province);
    }
  }, [user]);

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
      const obj = { name, email, phoneNumber };
      if (address) {
        obj.address = address;
        obj.lat = lat;
        obj.lon = lon;
        obj.city = city;
        obj.province = province;
      }
      console.log("obj", obj);
      const { data } = await axios.put("/api/auth", obj);
      console.log("data", data);
      if (data.email === user.email) {
        setAlert({ color: "success", msg: "Dati modificati con successo" });
      } else {
        setAlert({
          color: "success",
          msg: "Verifica il nuovo indirizzo email cliccando sul link nell'email che hai ricevuto"
        });
      }
      setUser(data);
      setIsEditing(false);
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      // scroll a bit up
      window.scrollTo({ top: 350, behavior: "smooth" });
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

  const [deleteDisabled, setDeleteDisabled] = useState(false);
  async function deletePost(p) {
    if (!window.confirm(`Vuoi davvero eliminare il post "${p.description}"?`)) {
      return;
    }

    setDeleteDisabled(true);

    try {
      await axios.delete("/api/post/" + p._id);
      setAlert({
        color: "success",
        msg: "Post eliminato con successo"
      });
      setUser({ ...user, posts: user.posts.filter(_p => _p._id !== p._id) });
      setDeleteJoinRequest(null);
    } catch (err) {
      console.log("error in post delete", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDeleteDisabled(false);
    }
  }

  const navigate = useNavigate();

  useEffect(() => {
    console.log("check user", user);
    if (user === null)
      return navigate({
        pathname: "/login",
        search: createSearchParams({
          to: "/profile"
        }).toString()
      });
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
        position="center"
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
                  helperText="Minimo 8 caratteri, almeno un numero, una maiuscola e un carattere speciale"
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
        position="center"
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
              <p className="text-base leading-relaxed -mb-2 dark:text-white">
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

      <div className="bg-white dark:bg-gray-900 dark:text-white py-3 md:py-6 px-6 md:px-12 lg:px-24 min-h-[69vh]">
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

        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 h-full">
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
                    <path
                      className="dark:fill-white"
                      d="M22 8h-20c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2h20c1.104 0 2-.896 2-2v-12c0-1.104-.896-2-2-2zm-19 3h11v2h-11v-2zm14 5v1h-10v-1h10zm0 5h-10v-1h10v1zm2-2h-14v-1h14v1zm2-6h-6v-2h6v2zm-14-6h-4v-1h4v1zm4.421-4.448l-2.18-1.567c-.244-.178-.297-.519-.12-.762.178-.243.518-.296.761-.119l2.186 1.569-.647.879zm8.246 4.448h-2.442l-5.099-3.677.891-1.219 6.65 4.896z"
                    />
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
                  <div
                    className={`mb-2 items-center ${
                      isEditing ? "block" : "flex"
                    }`}
                  >
                    <div className="block">
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
                      <div className="flex items-center gap-2">
                        <Typography variant="paragraph" className="ml-2">
                          {user?.email || <Spinner />}
                        </Typography>
                        {user?.isVerified ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <FaCheck /> Verificata
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-yellow-200 text-black p-1 rounded">
                            <FaExclamation /> Da verificare
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={isEditing ? "block" : "flex"}>
                    <div className="mb-2 block">
                      <Label htmlFor="phone" value="Numero di telefono" />
                    </div>
                    {isEditing ? (
                      <TextInput
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+393471234567"
                        autoComplete="tel"
                        required
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        disabled={!user}
                        helperText="Inserisci il tuo numero di telefono, compreso di prefisso internazionale"
                      />
                    ) : (
                      <Typography variant="paragraph" className="ml-2 mb-2">
                        {user?.phoneNumber || <Spinner />}
                      </Typography>
                    )}
                  </div>
                  <div className={isEditing ? "block" : "flex"}>
                    <div className="mb-2 block">
                      <Label htmlFor="address" value="Città" />
                    </div>
                    {isEditing ? (
                      <ReactGoogleAutocomplete
                        apiKey="AIzaSyAiPVD_IqTn5kMi2GFXwYQCTYaxznEbCfk"
                        onPlaceSelected={place => {
                          console.log("place", place);
                          const addr = place.formatted_address;
                          let cityIndex = place.address_components.findIndex(
                            c => c.types.includes("administrative_area_level_3")
                          );
                          if (cityIndex === -1) {
                            cityIndex = 1;
                          }
                          const city =
                            place.address_components[cityIndex].long_name;
                          const prov =
                            place.address_components[cityIndex + 1].short_name;
                          setAddress(addr);
                          setAddressInput(addr);
                          setCity(city);
                          setProvince(prov);
                          setLat(place.geometry.location.lat());
                          setLon(place.geometry.location.lng());
                        }}
                        className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 rounded-lg p-2.5 text-sm"
                        id="address"
                        name="addressInput"
                        lang="it"
                        language="it"
                        type="text"
                        placeholder="Modena"
                        autoComplete="address-level2"
                        value={addressInput}
                        onChange={e => setAddressInput(e.target.value)}
                        onBlur={() => setAddressInput(address)}
                        disabled={!user}
                        helperText="Inserisci la tua città di residenza (opzionale)"
                      />
                    ) : user?.address ? (
                      <div>
                        <Typography variant="paragraph" className="ml-2 mb-2">
                          {user.city} (
                          <span className="font-bold">{user.province}</span>)
                        </Typography>
                      </div>
                    ) : (
                      <Typography variant="paragraph" className="ml-2 mb-2">
                        <span className="text-gray-500">Non specificata</span>
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
                          {/* {!user || changeDataBtnDisabled ? (
                            <Spinner />
                          ) : ( */}
                          <span>Salva dati</span>
                          {/* )} */}
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
                        className="underline decoration-dotted text-center hover:text-black transition-colors"
                        rel="noreferrer"
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
                      <p className="font-normal text-gray-700 dark:text-gray-100 -mt-2">
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
                      Ma puoi richiedere di partecipare a uno dei nostri flash
                      mob sfogliando gli eventi visibili in{" "}
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

            <div>
              <Typography variant="h3" className="my-4">
                Post
              </Typography>
              {user?.posts ? (
                user.posts.length > 0 ? (
                  <ListGroup className="p-0">
                    {user.posts.map(p => (
                      <ListGroup.Item key={p._id}>
                        <div className="flex items-center gap-1 w-full">
                          <Link
                            to={p.isApproved ? "/social/" + p._id : "#"}
                            className={`w-fit hover:scale-105 transition-transform flex items-center gap-1 p-1 ${
                              p.isApproved ? "" : "ml-5"
                            }`}
                          >
                            {p.isApproved && (
                              <FaLink className="text-gray-500" />
                            )}
                            <span>{p.description}</span>
                          </Link>
                          <p className="ml-auto text-gray-500">
                            {p.createdAt &&
                              formatInTimeZone(
                                p.createdAt,
                                "Europe/Rome",
                                "dd MMM yyyy",
                                { locale: itCH }
                              )}
                          </p>
                          <Button
                            color="failure"
                            onClick={() => deletePost(p)}
                            disabled={deleteDisabled}
                            className="p-0 ml-3"
                          >
                            <FaTrash className="p-0" />
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p>Ancora nessun post</p>
                )
              ) : (
                <Spinner />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

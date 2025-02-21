import { Typography } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Button, Label, Spinner, TextInput } from "flowbite-react";
import { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../App";
import Layout from "../Layout";
import { useParams, useNavigate, createSearchParams } from "react-router-dom";
import { FaSave } from "react-icons/fa";
import { useCookies } from "react-cookie";
import { Helmet } from "react-helmet";
import { getErrorStr } from "../shared";

const UserQsoLogger = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [disabled, setDisabled] = useState(false);
  const [alert, setAlert] = useState(null);

  const { id } = useParams();
  const [event, setEvent] = useState(false);

  const [hasPermission, setHasPermission] = useState(true);

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
          msg:
            err?.response?.status === 404
              ? "Evento non trovato, redirect alla homepage..."
              : getErrorStr(err?.response?.data?.err)
        });
        setEvent(null);

        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    }
    if (user && id && event === false) {
      if (!event) getEvent();
    }
  }, [event, id, user, navigate]);

  useEffect(() => {
    if (user === null) {
      setAlert({
        color: "failure",
        msg: "Devi prima effettuare il login"
      });
      return;
    } else if (event === null) {
      setAlert({
        color: "failure",
        msg: "Evento non trovato"
      });
      return;
    }

    if (event && user) {
      setDisabled(false);
      setHasPermission(true);
    }
  }, [event, user]);

  const [cookies, setCookie] = useCookies(["cacciatoreQsoLoggerCache"]);

  const [userCallsign, setUserCallsign] = useState(cookies.userCallsign || "");
  const [userLocator, setUserLocator] = useState(cookies.userLocator || "");
  const [contactedCallsign, setContactedCallsign] = useState(""); // Only contacted station callsign here

  useEffect(() => {
    if (!user) return;
    setUserCallsign(user.callsign);
    setUserLocator(user.locator);
  }, [user]);

  useEffect(() => {
    setCookie("userCallsign", userCallsign, {
      path: "/logqso",
      maxAge: 60 * 60 * 4
    });
    setCookie("userLocator", userLocator, {
      path: "/logqso",
      maxAge: 60 * 60 * 36 // 36 ore
    });
  }, [userCallsign, userLocator, setCookie]);

  async function createQso(e) {
    e.preventDefault();

    setDisabled(true);

    console.log("create cacciatore qso for callsign", contactedCallsign);

    try {
      const obj = {
        callsign: contactedCallsign, // Use contactedCallsign here
        event: id,
        band: event.band,
        mode: "SSB/CW",
        qsoDate: new Date().toISOString(),
        locator: userLocator, // Use userLocator here
        rst: 59,
        userCallsign: userCallsign // Include user's callsign in the object if needed in backend
      };

      const { data } = await axios.post("/api/qso/cacciatore", obj);
      console.log("QSO creato da cacciatore", data);

      setAlert({
        color: "success",
        msg: "QSO creato e loggato con successo!"
      });
      setContactedCallsign(""); // Clear only contacted callsign input
    } catch (err) {
      console.log(err.response?.data?.err || err);
      window.alert(
        "ERRORE crea QSO: " + getErrorStr(err?.response?.data?.err || err)
      );
    } finally {
      setDisabled(false);
    }
  }

  const contactedCallsignRef = useRef(null);

  return user === null ? (
    navigate({
      pathname: "/login",
      search: createSearchParams({
        to: "/logqso/" + id
      }).toString()
    })
  ) : user?.isAdmin ? (
    navigate(`/qsomanager/${id}`)
  ) : (
    <Layout>
      <Helmet>
        <title>
          Log QSO -{event ? ` ${event.name} -` : ""} VHF e superiori
          (Cacciatori)
        </title>
      </Helmet>

      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 pt-12">
          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          {hasPermission && (
            <>
              <div className="mb-8 flex flex-col md:flex-row md:justify-between gap-4 items-center">
                <Typography variant="h1" className="flex items-center gap-2">
                  Log QSO per{" "}
                  <span className="underline">{event?.name || "..."}</span>{" "}
                  (Cacciatori)
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

                <div className="my-12">
                  <div
                    id="create-qso-container"
                    className="bg-gray-50 dark:bg-gray-700 sticky -top-16 z-50 -mx-4 md:-mx-12 lg:-mx-18 rounded-xl px-4"
                  >
                    <div className="flex flex-col md:flex-row justify-center md:justify-between gap-4 items-center">
                      <Typography
                        variant="h2"
                        className="my-2 flex items-center dark:text-white"
                      >
                        Log QSO da{" "}
                        <span className="mx-2 text-yellow-300">
                          {userCallsign || "..."}
                        </span>{" "}
                        verso...
                      </Typography>
                    </div>
                    {user ? (
                      <div>
                        <form onSubmit={createQso}>
                          <div className="mb-6 p-4 border rounded-md dark:border-gray-500">
                            <Typography
                              variant="h5"
                              className="mb-2 dark:text-white"
                            >
                              Le tue informazioni
                            </Typography>
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="w-full">
                                <Label
                                  htmlFor="userCallsign"
                                  value="Tuo nominativo"
                                />
                                <TextInput
                                  id="userCallsign"
                                  color="success" // Always success as it's based on login
                                  value={userCallsign}
                                  onChange={e =>
                                    setUserCallsign(
                                      e.target.value.toUpperCase().trim()
                                    )
                                  }
                                />
                              </div>
                              <div className="w-full">
                                <Label
                                  htmlFor="userLocator"
                                  value="Tuo locatore"
                                />
                                <TextInput
                                  color={
                                    userLocator?.length === 6
                                      ? "success"
                                      : "warning"
                                  }
                                  disabled={disabled}
                                  id="userLocator"
                                  minLength={6}
                                  maxLength={6}
                                  placeholder="Inserisci locatore..."
                                  value={userLocator}
                                  onChange={e => {
                                    setUserLocator(e.target.value);
                                    setCookie("userLocator", e.target.value, {
                                      path: "/logqso",
                                      maxAge: 60 * 60 * 4
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mb-6 p-4 border rounded-md dark:border-gray-500">
                            <Typography
                              variant="h5"
                              className="mb-2 dark:text-white"
                            >
                              Contacted Station Information
                            </Typography>
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="w-full">
                                <Label
                                  htmlFor="contactedCallsign"
                                  value="Contacted Station Callsign"
                                />
                                <TextInput
                                  id="contactedCallsign"
                                  color={
                                    contactedCallsign ? "success" : "warning"
                                  }
                                  value={contactedCallsign}
                                  onChange={e =>
                                    setContactedCallsign(
                                      e.target.value.toUpperCase()
                                    )
                                  }
                                  ref={contactedCallsignRef}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col items-center gap-2">
                            <div className="flex justify-center pb-2">
                              <Button
                                type="submit"
                                disabled={
                                  disabled || contactedCallsign.length === 0
                                }
                                size="lg"
                                color="info"
                                className="transition-colors duration-500 min-w-[11rem]"
                              >
                                {disabled ? (
                                  <Spinner className="dark:text-white dark:fill-white" />
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <FaSave />
                                    Log QSO
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <Spinner className="dark:text-white dark:fill-white" />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserQsoLogger;

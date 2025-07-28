import { Button, Alert as MTAlert, Typography } from "@material-tailwind/react";
import axios from "axios";
import { isAfter } from "date-fns";
import it from "date-fns/locale/it";
import { Alert, Checkbox, Label, Modal, TextInput } from "flowbite-react";
import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  FaBackward,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { createSearchParams, Link, useNavigate, useParams } from "react-router";
import { EventsContext, UserContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";

const EventContainer = ({ event, children }) =>
  event?.logoUrl ? (
    <div className="grid min-h-[90vh] grid-cols-1 md:grid-cols-2 dark:text-white dark:bg-gray-900">
      <LazyLoadImage className={event.logoUrl} alt="Logo dell'evento" />
      <div>{children}</div>
    </div>
  ) : (
    <div className="w-full min-h-[90vh] h-full pt-8 pb-24 dark:text-white dark:bg-gray-900">
      <div className="mx-auto px-2 w-full md:w-2/3">{children} </div>
    </div>
  );

const ViewEvent = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const { events } = useContext(EventsContext);

  const [event, setEvent] = useState(null);
  const [alert, setAlert] = useState(null);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [antenna, setAntenna] = useState("");

  useEffect(() => {
    if (!events) return;
    const _event = events.find((e) => e._id === id);
    setEvent(_event);
    console.log({ _event, events });
    setDisabled(false);
  }, [events, id]);

  async function sendJoinRequest(e) {
    e.preventDefault();

    setJoinError(null);
    setDisabled(true);

    try {
      await axios.post("/api/joinrequest", {
        antenna,
        forEvent: event._id,
      });

      setAlert({
        color: "success",
        msg: "Richiesta di partecipazione inviata con successo!",
      });
      setJoinError(null);
      setShowJoinModal(false);
      setAlreadyJoined(true);
    } catch (err) {
      setJoinError(getErrorStr(err?.response?.data?.err));
      setDisabled(false);
    }
  }

  const [alreadyJoined, setAlreadyJoined] = useState(null);
  useEffect(() => {
    async function checkIfJoined() {
      if (!event) return;

      try {
        await axios.get(`/api/joinrequest/event/${event._id}`);
        setAlreadyJoined(true);
      } catch (err) {
        console.log("checkIfJoined error", err);
        setAlreadyJoined(false);
      }
    }

    checkIfJoined();
  }, [event]);

  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{event?.name || "Evento"} - VHF e superiori</title>
      </Helmet>
      <Modal
        position="center"
        show={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      >
        <form onSubmit={sendJoinRequest}>
          <Modal.Header>Richiesta di partecipazione {event?.name}</Modal.Header>
          <Modal.Body>
            {joinError && (
              <Alert color="failure" className="mb-4">
                <span>
                  <span className="font-medium">Errore</span> {joinError}
                </span>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-300">
                Usa il seguente form per fare richiesta di partecipazione
                all&apos;evento
              </p>

              <div>
                <div className="mb-2 block">
                  <Label htmlFor="antenna" value="Antenna in uso" />
                </div>
                <TextInput
                  id="antenna"
                  name="antenna"
                  type="text"
                  autoComplete="off"
                  required
                  disabled={disabled}
                  value={antenna}
                  onChange={(e) => setAntenna(e.target.value)}
                  helperText="Informazioni sull'antenna utilizzata per questo evento"
                />
              </div>
              <div className="my-1">
                <Checkbox
                  className="checked:bg-current mr-1"
                  id="accept-tos"
                  required
                />
                <Label htmlFor="accept-tos">
                  Dichiaro di aver preso visione e di accettare
                  incondizionatamente il{" "}
                  <a
                    href="/docs/Regolamento_FLASH_MOB_2023_01_23.pdf"
                    target="_blank"
                    className="underline"
                    rel="noopener"
                  >
                    regolamento
                  </a>
                </Label>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="w-full flex justify-center gap-2">
              <Button
                color="gray"
                type="button"
                disabled={disabled}
                onClick={() => setShowJoinModal(false)}
              >
                Chiudi
              </Button>
              <Button type="submit" disabled={disabled}>
                Invia richiesta come {user?.callsign}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      {event ? (
        <EventContainer>
          <Button className="mb-4" onClick={() => navigate(-1)}>
            <FaBackward />
          </Button>

          <Typography
            variant="h1"
            className="dark:text-white flex items-center"
          >
            <span>{event.name}</span>
          </Typography>

          {/* {JSON.stringify(event)} */}

          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          <div className="text-gray-600 dark:text-gray-300 mt-2 mb-4">
            {formatInTimeZone(
              new Date(event.date),
              "Europe/Rome",
              "📅 dd/MM/yyyy  🕒 HH:mm ",
              {
                locale: it,
              },
            )}
            📡 {event.band}
          </div>

          {event.description ? (
            <div
              dangerouslySetInnerHTML={{
                __html: event.description,
              }}
              className="text-gray-700 my-8"
            />
          ) : (
            <p className="font-normal text-gray-700 dark:text-gray-400">
              -- nessuna descrizione --
            </p>
          )}

          <div className="border-t w-full mt-12 mb-8" />

          <p className="text-gray-600 dark:text-gray-300 mb-1 uppercase font-bold tracking-tight">
            Prenotazioni
          </p>
          {isAfter(new Date(event.date), new Date()) ? (
            alreadyJoined ? (
              <MTAlert color="blue" className="mt-3 w-fit">
                <div className="flex items-center -mr-10">
                  <FaInfoCircle />
                  <span className="ml-1">
                    Hai già fatto richiesta di partecipare a questo evento. Se
                    vuoi, puoi annullarla dal{" "}
                    <Link to="/profile" className="underline">
                      tuo profilo
                    </Link>
                    .
                  </span>
                </div>
              </MTAlert>
            ) : (
              <>
                <div>
                  <MTAlert color="blue" className="mt-3 w-fit">
                    <div className="flex items-center -mr-10">
                      <FaInfoCircle />
                      <span className="ml-1">
                        Hai tempo fino a{" "}
                        <span className="font-bold">
                          {" "}
                          {formatInTimeZone(
                            new Date(event.joinDeadline),
                            "Europe/Rome",
                            "eeee d MMMM Y",
                            {
                              locale: it,
                            },
                          )}
                        </span>{" "}
                        alle ore
                        <span className="font-bold">
                          {" "}
                          {formatInTimeZone(
                            new Date(event.joinDeadline),
                            "Europe/Rome",
                            "HH:mm",
                            {
                              locale: it,
                            },
                          )}
                        </span>{" "}
                        per prenotarti a questo evento!
                      </span>
                    </div>
                  </MTAlert>
                </div>

                <Typography
                  variant="paragraph"
                  className="font-normal mb-2 mt-6"
                >
                  Vuoi partecipare all&apos;evento?{" "}
                  {user ? (
                    <span>Fanne richiesta</span>
                  ) : (
                    <span>Esegui il login</span>
                  )}{" "}
                  premendo il tasto qua sotto
                </Typography>

                {user ? (
                  <Button onClick={() => setShowJoinModal(true)}>
                    Partecipa
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      navigate({
                        pathname: "/login",
                        search: createSearchParams({
                          to: "/social/new",
                        }).toString(),
                      })
                    }
                  >
                    Login
                  </Button>
                )}
              </>
            )
          ) : (
            <MTAlert color="amber" className="mt-3">
              <div className="flex items-center">
                <FaExclamationTriangle />
                <span className="ml-1">
                  Il tempo per prenotarsi è scaduto{" "}
                  {formatInTimeZone(
                    new Date(event.date),
                    "Europe/Rome",
                    "eeee d MMMM Y 'alle ore' HH:mm",
                    {
                      locale: it,
                    },
                  )}
                </span>
              </div>
            </MTAlert>
          )}
        </EventContainer>
      ) : (
        <MTAlert color="red" className="mt-3">
          <div className="flex items-center">
            <FaExclamationTriangle />
            <span className="ml-1">
              Errore nel caricamento dell&apos;evento
            </span>
          </div>
        </MTAlert>
      )}
    </>
  );
};

EventContainer.propTypes = {
  event: PropTypes.object,
  children: PropTypes.node,
};

EventContainer.displayName = "EventContainer";

export default ViewEvent;

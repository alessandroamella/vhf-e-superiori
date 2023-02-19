import { Option, Select } from "@material-tailwind/react";
import axios from "axios";
import { isAfter, isBefore } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";
import {
  Alert,
  Button,
  Checkbox,
  Label,
  Modal,
  Spinner,
  TextInput
} from "flowbite-react";
import React, { useContext, useEffect, useState } from "react";
import { FaInfo } from "react-icons/fa";
import { Link } from "react-router-dom";
import { EventsContext, getErrorStr, UserContext } from "..";

const JoinRequestModal = ({ open, setOpen, event, setEvent }) => {
  const { user } = useContext(UserContext);
  const { events } = useContext(EventsContext);

  const [joinableEvents, setJoinableEvents] = useState(null);
  useEffect(() => {
    if (!events) return;
    const now = new Date();
    setJoinableEvents(events.filter(e => isAfter(new Date(e.date), now)));
  }, [events]);

  const [joinError, setJoinError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [antenna, setAntenna] = useState("");
  const [closable, setClosable] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function sendJoinRequest(e) {
    e.preventDefault();

    if (!event) return;

    setJoinError(null);
    setDisabled(true);
    setIsSending(true);

    try {
      await axios.post("/api/joinrequest", {
        antenna,
        forEvent: event._id
      });

      setJoinError(null);
      setAlreadyJoined(true);
      setClosable(true);
    } catch (err) {
      setJoinError(getErrorStr(err?.response?.data?.err));
      setDisabled(false);
    } finally {
      setIsSending(false);
    }
  }

  function isBetweenDates() {
    if (
      isBefore(new Date(), new Date(event.joinStart)) ||
      isAfter(new Date(), new Date(event.joinDeadline))
    ) {
      setDisabled(true);
      setClosable(true);
      return false;
    }
    return true;
  }

  const [alreadyJoined, setAlreadyJoined] = useState(null);
  useEffect(() => {
    // if (!event) return;

    async function checkIfJoined() {
      if (!event) return;

      setDisabled(true);
      setClosable(true);
      try {
        await axios.get("/api/joinrequest/event/" + event._id);
        setAlreadyJoined(true);
      } catch (err) {
        console.log("checkIfJoined error", err);
        setAlreadyJoined(false);
        if (isBetweenDates()) setDisabled(false);
      }
    }

    checkIfJoined();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  useEffect(() => {
    if (!alreadyJoined) return;
    setDisabled(true);
    setClosable(true);
  }, [alreadyJoined]);

  useEffect(() => {
    if (!event) return;
    if (!isBetweenDates()) setDisabled(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return (
    <Modal dismissible="true" show={open} onClose={() => setOpen(!open)}>
      <form onSubmit={sendJoinRequest}>
        <Modal.Header>
          Richiesta di partecipazione{" "}
          <span className="underline">{event?.name}</span>
        </Modal.Header>
        <Modal.Body>
          {event && (
            <div className="mt-3 mb-4">
              <Select
                variant="static"
                className="dark:text-gray-300"
                label="Evento per cui fare richiesta"
                disabled={!joinableEvents || (disabled && !closable)}
                value={joinableEvents && joinableEvents[0].name}
              >
                {joinableEvents &&
                  joinableEvents.map(e => (
                    <Option key={e._id} onClick={() => setEvent(e)}>
                      {e.name}
                    </Option>
                  ))}
              </Select>
            </div>
          )}

          {alreadyJoined === null ? (
            <Spinner />
          ) : alreadyJoined ? (
            <Alert color="info" className="mb-4">
              <span>
                <span className="inline">
                  <FaInfo className="inline" />
                </span>{" "}
                Hai fatto richiesta di partecipare a{" "}
                <strong>{event.name}</strong> come stazione attivatrice. Puoi
                visualizzare le richieste di partecipazione dalla pagina del{" "}
                <Link
                  to="/profile"
                  className="underline decoration-dotted hover:text-black transition-colors"
                >
                  tuo profilo
                </Link>
                .
              </span>
            </Alert>
          ) : isAfter(new Date(), new Date(event.joinDeadline)) ? (
            <Alert color="warning" className="mb-4">
              <span>
                <span className="font-medium">Attenzione</span> Il periodo per
                fare richiesta di stazione attivatrice per questo evento è
                scaduto il{" "}
                {formatInTimeZone(
                  new Date(event.joinDeadline),
                  "Europe/Rome",
                  "dd/MM/yyyy 'alle ore' HH:mm",
                  {
                    locale: it
                  }
                )}
                .
              </span>
            </Alert>
          ) : isBefore(new Date(), new Date(event.joinStart)) ? (
            <Alert color="warning" className="mb-4">
              <span>
                <span className="font-medium">Attenzione</span> Il periodo per
                fare richiesta di stazione attivatrice per questo evento inizia
                il{" "}
                {formatInTimeZone(
                  new Date(event.joinStart),
                  "Europe/Rome",
                  "dd/MM/yyyy 'alle ore' HH:mm",
                  {
                    locale: it
                  }
                )}
                .
              </span>
            </Alert>
          ) : (
            <>
              {joinError && (
                <Alert color="failure" className="mb-4">
                  <span>
                    <span className="font-medium">Errore</span> {joinError}
                  </span>
                </Alert>
              )}

              <div className="flex flex-col gap-4">
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Usa il seguente form per fare richiesta di partecipazione
                  all'evento
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
                    onChange={e => setAntenna(e.target.value)}
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
                      href="/Regolamento_FLASH_MOB_2023_01_23.pdf"
                      target="_blank"
                      className="underline"
                    >
                      regolamento
                    </a>
                  </Label>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center gap-2">
            <Button
              color="gray"
              type="button"
              disabled={disabled && !closable}
              onClick={() => setOpen(false)}
            >
              Chiudi
            </Button>
            <Button type="submit" disabled={disabled}>
              {isSending ? (
                <Spinner />
              ) : (
                <span>Invia richiesta come {user?.callsign}</span>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default JoinRequestModal;

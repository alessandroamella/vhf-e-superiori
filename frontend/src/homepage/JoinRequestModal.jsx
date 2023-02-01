import { Option, Select } from "@material-tailwind/react";
import axios from "axios";
import { isAfter } from "date-fns";
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

  const [alert, setAlert] = useState(null);

  const [joinError, setJoinError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [antenna, setAntenna] = useState("");

  async function sendJoinRequest(e) {
    e.preventDefault();

    if (!event) return;

    setJoinError(null);
    setDisabled(true);

    try {
      await axios.post("/api/joinrequest", {
        antenna,
        forEvent: event._id
      });

      setAlert({
        color: "success",
        msg: "Richiesta di partecipazione inviata con successo!"
      });
      setJoinError(null);
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

      setDisabled(true);
      try {
        await axios.get("/api/joinrequest/event/" + event._id);
        setAlreadyJoined(true);
      } catch (err) {
        console.log("checkIfJoined error", err);
        setAlreadyJoined(false);
      } finally {
        setDisabled(false);
      }
    }

    checkIfJoined();
  }, [event]);

  useEffect(() => {
    if (!event) return;
    setDisabled(false);
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
                label="Evento per cui fare richiesta"
                disabled={!joinableEvents || disabled}
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
            <Alert color="warning" className="mb-4">
              <span>
                <span className="font-medium">Attenzione</span> Hai già fatto
                richiesta di partecipare a questo evento come stazione
                attivatrice. Puoi visualizzare le richieste di partecipazione
                dalla pagina del{" "}
                <Link
                  to="/profile"
                  className="underline decoration-dotted hover:text-black transition-colors"
                >
                  tuo profilo
                </Link>
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
              disabled={disabled}
              onClick={() => setOpen(false)}
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
  );
};

export default JoinRequestModal;

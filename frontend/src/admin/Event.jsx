import { Typography } from "@material-tailwind/react";
import axios from "axios";
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Modal,
  Spinner,
  Table,
  TextInput,
  Tooltip
} from "flowbite-react";
import React, { useContext, useState } from "react";
import { it } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { EventsContext, getErrorStr, UserContext } from "..";
import Layout from "../Layout";
import { DefaultEditor } from "react-simple-wysiwyg";
import { FaDownload, FaPlusCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReactHTMLTableToExcel from "react-html-table-to-excel";

const Event = () => {
  const { user } = useContext(UserContext);
  const { events, setEvents } = useContext(EventsContext);

  const [showModal, setShowModal] = useState(false);
  const [eventEditing, setEventEditing] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [alert, setAlert] = useState(null);

  const [name, setName] = useState("");
  const [band, setBand] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, -8));
  const [joinStart, setJoinStart] = useState(
    new Date().toISOString().slice(0, -8)
  );
  const [joinDeadline, setJoinDeadline] = useState(
    new Date().toISOString().slice(0, -8)
  );
  const [logoUrl, setLogoUrl] = useState("/logo-min.png");

  const [joinRequests, setJoinRequests] = useState(null);

  async function createEvent(e) {
    e.preventDefault();

    setDisabled(true);

    try {
      const obj = {
        name,
        description,
        date,
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
      window.alert(getErrorStr(err.response?.data?.err));
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
    setDescription(e.description);
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
    setDisabled(true);
    try {
      await axios.post("/api/joinrequest/" + j._id);
      console.log("approved joinRequest", j);
      setJoinRequests([
        ...joinRequests.filter(_j => _j._id !== j._id),
        { ...j, isApproved: !j.isApproved, updatedAt: new Date() }
      ]);
    } catch (err) {
      window.alert("Errore: " + getErrorStr(err?.response?.data?.err));
      console.log(err.response.data);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDisabled(false);
    }
  }

  const navigate = useNavigate();

  return user === null || (user && !user.isAdmin) ? (
    navigate("/login")
  ) : (
    <Layout>
      <Modal size="7xl" show={showModal} onClose={() => setShowModal(false)}>
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
                  <TextInput
                    id="event-logo-url"
                    type="text"
                    required={true}
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    disabled={disabled}
                  />
                  <Button
                    className="mt-2"
                    onClick={() => setLogoUrl("/logo-min.png")}
                    disabled={disabled}
                  >
                    Resetta
                  </Button>
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
                  <Label htmlFor="event-band" value="Nome" />
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
              <div>
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

                {/* <TextInput
                                id="event-description"
                                type="text"
                                required={true}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            /> */}
              </div>
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

              <Button type="submit" disabled={disabled}>
                {!eventEditing ? "Crea" : "Modifica"} evento
              </Button>

              {eventEditing && (
                <div className="min-h-[60vh] overflow-auto">
                  <Typography variant="h4" className="pb-2">
                    Richieste di partecipazione
                  </Typography>
                  {joinRequests === null ? (
                    <Spinner />
                  ) : joinRequests === false ? (
                    <p>Errore nel caricamento</p>
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
                                {j.fromUser.callsign}
                              </Table.Cell>
                              <Table.Cell>
                                <Tooltip content={j.fromUser.email}>
                                  <a
                                    href={"mailto:" + j.fromUser.email}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-black transition-colors"
                                  >
                                    {j.fromUser.name}
                                  </a>
                                </Tooltip>
                              </Table.Cell>
                              <Table.Cell>
                                {j.isApproved ? (
                                  <span className="ml-1 font-medium">
                                    ✅ Approvata
                                  </span>
                                ) : (
                                  <span className="ml-1 font-medium">
                                    ❌ Non approvata
                                  </span>
                                )}
                              </Table.Cell>
                              <Table.Cell>
                                {formatInTimeZone(
                                  new Date(j.updatedAt),
                                  "Europe/Rome",
                                  "dd/MM/yyyy 'alle' HH:mm",
                                  {
                                    locale: it
                                  }
                                )}
                              </Table.Cell>
                              <Table.Cell className="max-w-xs">
                                <Tooltip content={j.antenna}>
                                  <p className="whitespace-nowrap overflow-hidden text-ellipsis">
                                    {j.antenna}
                                  </p>
                                </Tooltip>
                              </Table.Cell>
                              <Table.Cell className="max-w-[10rem]">
                                {j.isApproved ? (
                                  <Button
                                    color="failure"
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
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </>
                  ) : (
                    <p>Ancora nessuna richiesta</p>
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
            </div>
          </Modal.Footer>
        </form>
      </Modal>

      <div className="mx-auto px-2 w-full md:w-2/3 my-12">
        {alert && (
          <Alert
            className="mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <Typography variant="h1" className="mb-12 flex items-center">
          <Badge size="lg" color="info" className="mr-2">
            Admin
          </Badge>
          <span>Manager eventi</span>
        </Typography>

        {events === null ? (
          <p>Eventi non caricati</p>
        ) : events ? (
          <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
            {events.map(e => (
              <Card
                className="cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all"
                key={e._id}
                imgSrc={e.logoUrl || "/logo-min.png"}
                onClick={() => editEventModal(e)}
              >
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {e.name}
                </h5>
                {e.description ? (
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
                )}
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  Data{" "}
                  <strong>
                    {formatInTimeZone(
                      new Date(e.date),
                      "Europe/Rome",
                      "eee d MMMM Y",
                      {
                        locale: it
                      }
                    )}
                  </strong>
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
                        Event
                    </Button>
                </form> */}
      </div>
    </Layout>
  );
};

export default Event;

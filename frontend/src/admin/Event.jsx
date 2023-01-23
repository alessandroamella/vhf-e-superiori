import { Button, Typography } from "@material-tailwind/react";
import axios from "axios";
import {
    Alert,
    Badge,
    Card,
    Label,
    Modal,
    Spinner,
    TextInput
} from "flowbite-react";
import React, { useContext, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { EventsContext, getErrorStr } from "..";
import Layout from "../Layout";
import { DefaultEditor } from "react-simple-wysiwyg";
import { FaPlusCircle } from "react-icons/fa";
import { useEffect } from "react";

const Event = () => {
    const { events, setEvents } = useContext(EventsContext);

    const [showModal, setShowModal] = useState(false);
    const [eventEditing, setEventEditing] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [alert, setAlert] = useState(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, -8));
    const [joinDeadline, setJoinDeadline] = useState(
        new Date().toISOString().slice(0, -8)
    );
    const [logoUrl, setLogoUrl] = useState("/logo-min.png");

    function sortEvents() {
        const _events = [...events];
        _events.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEvents(_events);
    }

    useEffect(() => {
        if (!events) return;
        sortEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                msg: `Evento ${
                    !eventEditing ? "creato" : "modificato"
                } con successo`
            });

            const _events = [...events];
            const i = _events.findIndex(e => e._id === data._id);
            if (_events[i]) _events[i] = data;
            else _events.push(data);

            setEvents(_events);
            sortEvents();

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
        setEventEditing(e._id);
        setName(e.name);
        setDescription(e.description);
        setDate(e.date.slice(0, -8));
        setJoinDeadline(e.joinDeadline.slice(0, -8));
        setLogoUrl(e.logoUrl);
        setShowModal(true);
    }

    return (
        <Layout>
            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <form onSubmit={createEvent}>
                    <Modal.Header>
                        {!eventEditing ? "Crea" : "Modifica"} evento
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-2 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-2">
                                <img
                                    src={logoUrl}
                                    alt="Logo URL"
                                    className="w-96 max-w-full"
                                />
                                <div className="my-auto">
                                    <div className="mb-2 block">
                                        <Label
                                            htmlFor="event-logo-url"
                                            value="URL logo"
                                        />
                                    </div>
                                    <TextInput
                                        id="event-logo-url"
                                        type="text"
                                        required={true}
                                        value={logoUrl}
                                        onChange={e =>
                                            setLogoUrl(e.target.value)
                                        }
                                        disabled={disabled}
                                    />
                                    <Button
                                        className="mt-2"
                                        onClick={() =>
                                            setLogoUrl("/logo-min.png")
                                        }
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
                                    <Label
                                        htmlFor="event-description"
                                        value="Descrizione (opzionale)"
                                    />
                                </div>
                                <DefaultEditor
                                    id="event-description"
                                    required={true}
                                    value={description}
                                    onChange={e =>
                                        setDescription(e.target.value)
                                    }
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
                            <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2">
                                <div>
                                    <div className="mb-2 block">
                                        <Label
                                            htmlFor="event-date"
                                            value="Data"
                                        />
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
                                            htmlFor="event-join-deadline"
                                            value="Scadenza richiesta di partecipazione"
                                        />
                                    </div>
                                    <TextInput
                                        id="event-join-deadline"
                                        type="datetime-local"
                                        required={true}
                                        value={joinDeadline}
                                        onChange={e =>
                                            setJoinDeadline(e.target.value)
                                        }
                                        disabled={disabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="w-full flex justify-center gap-2">
                            <Button
                                color="gray"
                                type="button"
                                // disabled={!user || changePwBtnDisabled}
                                onClick={() => setShowModal(false)}
                            >
                                Chiudi
                            </Button>
                            <Button
                                type="submit"
                                disabled={disabled}

                                // disabled={!user || changePwBtnDisabled}
                            >
                                {!eventEditing ? "Crea" : "Modifica"} evento
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

                <p className="bg-red-600 font-semibold w-fit text-white text-2xl p-3">
                    DEBUG rendi pagina accessibile solo agli admin
                </p>
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
                                        {format(
                                            new Date(e.date),
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
                                        {format(
                                            new Date(e.joinDeadline),
                                            "eee d MMMM Y",
                                            { locale: it }
                                        )}
                                    </strong>
                                </p>
                            </Card>
                        ))}
                        {events.length === 0 && <p>Nessun evento salvato</p>}
                        <Button
                            className="flex text-md flex-col justify-center items-center"
                            onClick={newEventModal}
                        >
                            <span className="text-5xl mb-1">
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

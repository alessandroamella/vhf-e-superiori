import Layout from "../Layout";
import EventPreview from "./EventPreview";
import { Carousel } from "react-responsive-carousel";
import { Button, Typography } from "@material-tailwind/react";
import { useState } from "react";
import { EventsContext } from "..";
import { useContext } from "react";
import { Alert, Card, Spinner } from "flowbite-react";
import { format, isAfter } from "date-fns";
import { it } from "date-fns/locale";

const Homepage = () => {
    const { events, setEvents } = useContext(EventsContext);

    const [alert, setAlert] = useState(null);
    const [viewEventModal, setViewEventModal] = useState(false);
    // const [events, setEvents] = useState([
    //     {
    //         name: "prova 2",
    //         description: "lorem ipsum dolor sit amet andrea dura",
    //         date: new Date("2023/02/01 10:00"),
    //         joinDeadline: new Date("2023/01/15 10:00"),
    //         logoUrl: "https://picsum.photos/600"
    //     },
    //     {
    //         name: "prova 2",
    //         description: "lorem ipsum dolor sit amet andrea dura",
    //         date: new Date("2023/02/01 10:00"),
    //         joinDeadline: new Date("2023/01/15 10:00"),
    //         logoUrl: "https://picsum.photos/500"
    //     },
    //     {
    //         name: "bio ghane",
    //         description: "lorem ipsum dolor sit amet andrea dura",
    //         date: new Date("2023/02/01 10:00"),
    //         joinDeadline: new Date("2023/01/15 10:00"),
    //         logoUrl: "https://picsum.photos/500"
    //     }
    // ]);

    return (
        <Layout>
            {/* <StarSky /> */}
            <div className="p-3 md:p-6">
                <Typography variant="h2" className="mb-8">
                    Prossimi eventi
                </Typography>

                {events === null ? (
                    <p>Eventi non caricati</p>
                ) : events ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4 md:mx-12 lg:mx-24 xl:mx-36">
                        {events.map(e => (
                            <Card
                                className="cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all"
                                key={e._id}
                                horizontal
                                // imgSrc={e.logoUrl || "/logo-min.png"}
                                onClick={() => setViewEventModal(e)}
                            >
                                <div className="flex items-center text-gray-500">
                                    <p className="font-bold text-5xl">
                                        {format(new Date(e.date), "d")}
                                    </p>
                                    <div className="ml-2">
                                        <p className="text-lg mb-0">
                                            {format(new Date(e.date), "MMMM", {
                                                locale: it
                                            })}
                                        </p>
                                        <p className="-mt-1">
                                            {format(new Date(e.date), "HH:mm")}
                                        </p>
                                    </div>
                                </div>

                                <Typography
                                    variant="h5"
                                    className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                                >
                                    {e.name}
                                </Typography>

                                <div className="border-t w-full" />

                                <p className="text-gray-400 uppercase font-bold tracking-tight -mb-4">
                                    Prenotazioni
                                </p>

                                {isAfter(new Date(e.date), new Date()) ? (
                                    <Button>Prenota</Button>
                                ) : (
                                    <p className="text-gray-600">
                                        Il tempo per prenotarsi è scaduto il{" "}
                                        {format(
                                            new Date(e.date),
                                            "dd/MM/yyyy 'alle' HH:mm",
                                            {
                                                locale: it
                                            }
                                        )}
                                    </p>
                                )}

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
                                <p className="font-normal text-gray-700 dark:text-gray-400">
                                    {e.joinRequests.join(",")}
                                </p>
                            </Card>
                        ))}
                        {events.length === 0 && <p>Nessun evento salvato</p>}
                    </div>
                ) : (
                    <Spinner />
                )}

                {events === null ? (
                    <Alert
                        className="mb-6"
                        color="failure"
                        onDismiss={() => setAlert(null)}
                    >
                        <span>Errore nel caricamento degli eventi</span>
                    </Alert>
                ) : !events ? (
                    <Spinner />
                ) : (
                    <Carousel
                        showThumbs={false}
                        autoPlay
                        centerMode
                        emulateTouch
                        infiniteLoop
                    >
                        {events.map((e, i) => (
                            <EventPreview event={e} key={i} />
                        ))}
                    </Carousel>
                )}
            </div>
        </Layout>
    );
};

export default Homepage;

import Layout from "../Layout";
import EventPreview from "./EventPreview";
import { Carousel } from "react-responsive-carousel";
import { Button, Typography } from "@material-tailwind/react";
import { useState } from "react";
import { EventsContext, SplashContext } from "..";
import { useContext } from "react";
import { Alert, Card, Spinner } from "flowbite-react";
import { format, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Splash from "../Splash";

const Homepage = () => {
  const { events } = useContext(EventsContext);
  const { splashPlayed, setSplashPlayed } = useContext(SplashContext);

  const [alert, setAlert] = useState(null);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setReady(true);
      setTimeout(() => setSplashPlayed(true), 1500);
    }, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useNavigate();
  return (
    <Layout>
      {!splashPlayed && <Splash ready={ready} />}
      <div className="p-3 md:p-6">
        {/* <Typography variant="h2" className="mb-8">
          Prossimi eventi
        </Typography> */}

        {/* {events === null ? (
          <p>Eventi non caricati</p>
        ) : events ? (
          <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4 md:mx-12 lg:mx-24 xl:mx-36">
            {events
              .filter(e => isAfter(new Date(e.date), new Date()))
              .map(e => (
                <Card
                  className="cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all"
                  key={e._id}
                  horizontal
                  // imgSrc={e.logoUrl || "/logo-min.png"}
                  // onClick={() => setViewEventModal(e)}
                  onClick={() => navigate("/event/" + e._id)}
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
                      {format(new Date(e.date), "dd/MM/yyyy 'alle' HH:mm", {
                        locale: it
                      })}
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
                      {format(new Date(e.date), "eee d MMMM Y", {
                        locale: it
                      })}
                    </strong>
                  </p>
                  <p className="font-normal text-gray-700 dark:text-gray-400">
                    Scadenza per partecipare{" "}
                    <strong>
                      {format(new Date(e.joinDeadline), "eee d MMMM Y", {
                        locale: it
                      })}
                    </strong>
                  </p>
                </Card>
              ))}
            {events.length === 0 && <p>Nessun evento salvato</p>}
          </div>
        ) : (
          <Spinner />
        )} */}

        {events === null ? (
          <Alert
            className="mb-6"
            color="failure"
            onDismiss={() => setAlert(null)}
          >
            <span>
              <span className="font-medium">
                Errore nel caricamento degli eventi
              </span>{" "}
              {alert?.msg}
            </span>
          </Alert>
        ) : !events ? (
          <Spinner />
        ) : (
          <Carousel
            showThumbs={false}
            // autoPlay
            centerMode
            emulateTouch
            infiniteLoop
          >
            {events.map((e, i) => (
              <EventPreview
                onClick={() => navigate("/event/" + e._id)}
                event={e}
                key={i}
              />
            ))}
          </Carousel>
        )}
      </div>
    </Layout>
  );
};

export default Homepage;

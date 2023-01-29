import Layout from "../Layout";
import EventPreview from "./EventPreview";
// import { Carousel } from "react-responsive-carousel";
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Button,
  Typography
} from "@material-tailwind/react";
import { useState } from "react";
import { EventsContext, ReadyContext, SplashContext } from "..";
import { useContext } from "react";
import { Alert, Card, Spinner, Table } from "flowbite-react";
import { differenceInDays, format, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Splash from "../Splash";
import { FaAngleDoubleRight, FaCalendar, FaCalendarAlt } from "react-icons/fa";
import { formatInTimeZone } from "date-fns-tz";
import { Carousel, CarouselItem } from "react-round-carousel";
import Zoom from "react-medium-image-zoom";

import "react-medium-image-zoom/dist/styles.css";
import "react-round-carousel/src/index.css";

const Homepage = () => {
  const { events } = useContext(EventsContext);
  const { splashPlayed, setSplashPlayed } = useContext(SplashContext);
  const { ready, setReady } = useContext(ReadyContext);

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setReady(true);
      setTimeout(() => setSplashPlayed(true), 3500);
    }, 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [accordionOpen, setAccordionOpen] = useState(false);

  const navigate = useNavigate();

  const [shownEvent, setShownEvent] = useState(null);

  const prossimiEventi = [
    { i: 13, d: new Date(2023, 1 - 1, 29) },
    { i: 14, d: new Date(2023, 2 - 1, 26) },
    { i: 15, d: new Date(2023, 3 - 1, 26) },
    { i: 16, d: new Date(2023, 4 - 1, 30) },
    { i: 17, d: new Date(2023, 5 - 1, 28) },
    { i: 18, d: new Date(2023, 6 - 1, 25) },
    { i: 19, d: new Date(2023, 7 - 1, 30) },
    { i: 20, d: new Date(2023, 8 - 1, 27) },
    { i: 21, d: new Date(2023, 9 - 1, 24) },
    { i: 22, d: new Date(2023, 10 - 1, 29) },
    { i: 23, d: new Date(2023, 11 - 1, 26) },
    { i: 24, d: new Date(2023, 12 - 1, 31) }
  ].filter(e => isAfter(e.d, new Date()));
  // prossimiEventi.sort((a, b) => a - b);

  console.log({ prossimiEventi });

  useEffect(() => {
    if (!events) return;
    const now = new Date();
    for (const e of events) {
      const diff = differenceInDays(new Date(e.date), now);
      if (
        diff >= 0 &&
        diff <= 14 &&
        e.logoUrl &&
        e.logoUrl !== "/logo-min.png"
      ) {
        console.log({ diff });
        setShownEvent(e);
        return;
      }
    }
  }, [events]);

  const items = Array.from(Array(13).keys()).map(e => ({
    alt: "Locandina " + e,
    image: `/locandine/${e + 1}.png`,
    content: (
      <div />
      // <Zoom>
      //   <img alt="Locandina" src={`/locandine/${e + 1}.png`} />
      // </Zoom>
    )
  }));

  return (
    <Layout>
      {!splashPlayed && <Splash ready={ready} />}

      <div
        className={`px-4 md:px-12 max-w-full pt-4 pb-12 min-h-[80vh] bg-white ${
          !ready ? "overflow-hidden w-0 h-0" : ""
        }`}
      >
        <div className="flex h-full">
          <div className="flex flex-col">
            <img
              src="/flashmob.png"
              alt="Flash mob"
              className="w-full fit max-w-md md:max-w-xl lg:max-w-2xl py-4 mx-auto"
            />
            {/* <p className="text-[#003399] uppercase tracking-tight text-4xl md:text-5xl font-bold drop-shadow-md flex items-center justify-center"> */}
            {/* <span className="text-green-500 ombra">Radio</span>
              <span className="text-white mx-2 ombra">Flash</span>
              <span className="text-red-500 ombra">Mob</span> */}
            {/* Radio Flash Mob */}
            {/* <span className="text-green-500 ombra">Radio</span>
              <span className="text-white mx-2 ombra">Flash</span>
              <span className="text-red-500 ombra">Mob</span> */}
            {/* </p> */}
            <div className="text-gray-600 mb-8 mt-4">
              <p>
                Nasce da un’idea di <strong>IU4JJJ</strong> Pietro Cerrone
                membro della chat vhf e superiori che la propone a{" "}
                <strong>IZ5RNF</strong> Alessandro Ronca creatore del gruppo.{" "}
              </p>

              <p>
                Accolta l’idea viene creato un gruppo di lavoro con la
                collaborazione di
                <a
                  href="https://www.ft8activity.it/author/ic8tem/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-1 text-center underline decoration-dotted hover:text-black transition-colors"
                >
                  <strong>IC8TEM</strong> Costantino Certotta
                </a>
                e IU0FBK Marco Naccari creatore del sito
                <a
                  href="https://www.diplomiradio.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-center underline decoration-dotted hover:text-black transition-colors"
                >
                  diplomiradio.it
                </a>
              </p>

              <p>
                Il gruppo dopo aver delineato modalità e tempi,giunge a
                pianificare il primo evento che viene pubblicizzato su varie
                piattaforme social come prova del funzionamento ,organizzazione
                e gestione.{" "}
              </p>

              <p>
                Ispirandosi proprio al “flash mob “ che si prefigge lo scopo di
                far incontrare più persone possibile per poco tempo usando mail
                e social ,da qui il nome.{" "}
              </p>

              <p>
                Con soddisfazione si raccolgono attorno alle prime due stazioni
                molti appassionati radioamatori e il debutto e’ un successo.
              </p>

              <div className="py-4 flex w-full mt-4 md:mt-0 justify-center items-center">
                <img
                  className="max-w-sm object-contain w-full"
                  // src="undraw_podcast_re_wr88.svg"
                  src="/locandine/1.png"
                  alt="Esempio"
                />
              </div>

              <p>
                Le stazioni dette “attivatrici” chiamate così per l’occasione
                ricevono molte richieste di contatto da tutta Italia.{" "}
              </p>

              <p>
                Il numero dei partecipanti supera le aspettative e la struttura
                di gestione creata supera il test.{" "}
              </p>

              <p>
                Viene quindi deciso di continuare con questa esperienza e di
                organizzare i successivi eventi.{" "}
              </p>

              <p>
                Viene inviata attraverso il sito diplomi radio la eqsl conferma
                del contatto da ogni stazione attivatrice e successivamente
                Vengono raccolti e pubblicati i dati dei relativi ai
                partecipanti e al numero contatti,sia dei “cacciatori” che delle
                stazioni “attivatrici” e attribuito un punteggio attributodipari
                ad un punto per ogni collegamento avvenuto{" "}
              </p>

              <p>
                Viene stilata da IU0FBK una seconda classifica in base alla
                distanza coperta da ogni stazione attivatrice(QRB){" "}
              </p>

              <p>
                L’evento non è una gara ma ha lo scopo di aumentare il numero di
                stazioni operanti sulle bande vhf e superiori con uno spirito
                partecipativo e non competitivo.
              </p>
            </div>

            {/* <div className="self-center">
              <Button color="red" onClick={() => navigate("/regolamento")}>
                Regolamento
              </Button>
              <Button className="ml-4" onClick={() => navigate("/info")}>
                Scopri di più
              </Button>
            </div> */}

            {/* <div className="box-content h-[80vh] pt-8 md:pt-12 lg:pt-16 pb-32 mb-24 bg-lightGray-normal">
        <p className="text-2xl text-center p-4 text-white bg-blue-500 mx-auto rounded mb-8 md:text-4xl w-fit font-bold tracking-tight">
          Eventi passati
        </p>

        <AwesomeSlider
          cssModule={[CoreStyles, AnimationStyles]}
          play={true}
          cancelOnInteraction
          interval={6000}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(e => (
            <div key={e} data-src={`/locandine/${e}.png`} />
          ))}
        </AwesomeSlider>
      </div> */}

            <div
              onMouseEnter={e => {
                if (
                  [...e.target.classList].includes("carousel__control--prev")
                ) {
                  document.querySelector(".carousel__control--prev")?.click();
                } else if (
                  [...e.target.classList].includes("carousel__control--next")
                ) {
                  document.querySelector(".carousel__control--next")?.click();
                }
              }}
              className="min-h-[20rem] mt-12 lg:scale-100 xl:scale-125 overflow-x-hidden overflow-y-clip"
            >
              <Carousel items={items} />
            </div>

            <div className="my-12" />

            <div className="flex flex-col items-center justify-center">
              <h2 className="font-bold mb-4 text-center text-3xl tracking-tight">
                SE VUOI ESSERE PROSSIMA STAZIONE ATTIVATRICE:
              </h2>
              <Button
                className="text-xl"
                onClick={() => window.alert("Ancora da implementare!")}
              >
                CLICCA QUI
              </Button>
            </div>

            <div>
              <Accordion open={accordionOpen}>
                <AccordionHeader
                  onClick={() => setAccordionOpen(!accordionOpen)}
                >
                  Istruzioni per partecipare
                </AccordionHeader>
                <AccordionBody>
                  <p className="font-bold text-lg uppercase mt-2">
                    COS’È IL RADIO FLASH MOB
                  </p>

                  <p>
                    Parlare insieme a molte persone in radio nelle frequenze VHF
                    (144MHz) , UHF (432-1296MHz) per poco tempo (FLASH) e
                    contattare stazioni “sentinella”. Le stazioni sentinella
                    sono dei radioamatori che in quel momento, dopo aver
                    verificato che la frequenza è libera, sono lì pronti a
                    ricevere collegamenti con tutti i partecipanti radioamatori.
                    Non occorre inviare il LOG, non è una gara.
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">SCOPO</p>

                  <p>
                    Gli scopi sono molteplici, collegare altri radioamatori,
                    spezzare la quotidianità dei partecipanti, stabilire
                    rapporti di amicizia e collaborazione in generale con
                    persone italiane e europee, testare le proprie
                    apparecchiature, incentivare e promuovere l’hobby del
                    radioamatore. Il Radio Flash Mob è un’attività collettiva
                    causale che segue le indicazioni della locandina.
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">REQUISITI</p>

                  <p>
                    Bisogna essere radioamatori con idonea patente rilasciata
                    dal Ministero per trasmettere nelle frequenze autorizzate.
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">DATA</p>

                  <p>
                    Il Radio Flash Mob si svolge principalmente l’ultima
                    domenica di ogni mese dalle ore 10 alle ore 12 ora italiana.
                    Trattandosi di Flash Mob le date possono variare
                    improvvisamente ma sono aggiornate sul calendario presente
                    nel sito www.vhfesuperiori.eu
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">
                    COME GESTIRE IL COLLEGAMENTO{" "}
                  </p>

                  <p>
                    Il Radio Flash Mob ha come caratteristica quella di radunare
                    decine di persone nella stessa frequenza.
                  </p>

                  <p>
                    Principalmente il partecipante collega la stazione
                    “sentinella” così effettua il collegamento passando il
                    rapporto RST. La stazione “sentinella” registra il
                    collegamento nel sul log e inoltra la EQSL in memoria del
                    QSO intrattenuto. Inoltre, in secondo momento, lasciando
                    sempre spazio per nuovi partecipanti tra un messaggio e
                    l’altro, i partecipanti possono anche fare cose differenti
                    oltre al collegamento RST. I partecipanti possono: parlare
                    di radio, condividere esperienze, consigli sulla propria
                    stazione, svolgere normale attività di radio, l'importante è
                    che tutto avvenga nello stesso momento, riempiendo la
                    frequenza indicata. La stazione “sentinella” farà da
                    capo-maglia per eventuale formazione di un QSO, dando la
                    priorità alle nuove stazioni intervenute per stabilire il
                    collegamento con il rapporto RST, inserimento nel Log e
                    invio automatico della EQSL.
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">
                    COS’E’ LA LOCANDINA
                  </p>

                  <p>
                    Ogni Radio Flash Mob viene annunciato con una volantino che
                    viene presentata nel sito www.vhfesuperiori.eu{" "}
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">MODI</p>

                  <p>
                    SSB, CW ( se la stazione sentinella è disponibile) –
                    polarizzazione consigliata orizzontale – Si consiglia usare
                    chat whatsapp vhfsuperiori.eu per gli Sked. Le stazioni
                    sentinella ogni 30 min circa effettueranno rotazione del
                    puntamento dell’antenna e comunicano nella chat la loro
                    posizione.{" "}
                  </p>
                  <p className="font-bold text-lg uppercase mt-2">DIPLOMI</p>

                  <p>
                    Potranno essere redatti dagli organizzatori diplomi di
                    riconoscimento e di ringraziamento per la partecipazione. I
                    diplomi non seguono nessuna classifica, sono solo di
                    ringraziamento per la partecipazione
                  </p>

                  <p>Non occorre inviare il Log.</p>
                </AccordionBody>
              </Accordion>
            </div>

            <h2 className="mt-16 mb-6 font-bold text-center text-3xl tracking-tight">
              Prossimi eventi
            </h2>

            <div className="w-full md:w-2/3 mx-auto">
              <Table>
                <Table.Head>
                  <Table.HeadCell>Nome</Table.HeadCell>
                  <Table.HeadCell>Data</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {prossimiEventi.map((e, i) => (
                    <Table.Row
                      key={e.i.toString()}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <Table.Cell className="py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {e.i}° Radio Flash Mob
                      </Table.Cell>
                      <Table.Cell className="py-2">
                        {formatInTimeZone(
                          e.d,
                          "Europe/Rome",
                          "EEEE dd MMMM yyyy",
                          {
                            locale: it
                          }
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="p-3 md:p-6"> */}
      {/* {shownEvent && (
          <div className="w-full flex flex-col md:flex-row justify-center py-4">
            <img
              className="max-h-[69vh] object-contain shadow hover:scale-105 transition-all"
              src={shownEvent.logoUrl}
              alt="Next event"
            />
            <div className="h-full mt-2 ml-0 md:ml-8">
              <p className="text-2xl md:text-4xl w-fit bg-red-500 shadow p-4 font-bold tracking-tight text-white">
                Prossimo evento
              </p>

              <p className="text-3xl mt-4 md:mt-8 md:text-5xl font-bold">
                {shownEvent.name}
              </p>
              <p className="text-xl mt-2 mb-6 text-gray-600">
                {formatInTimeZone(
                  new Date(shownEvent.date),
                  "Europe/Rome",
                  "dd MMMM yyyy",
                  { locale: it }
                )}
              </p>

              <Button className="flex items-center text-md">
                <FaCalendarAlt />
                <span className="ml-1">Aggiungi al calendario</span>
              </Button>
            </div>
          </div>
        )} */}

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

      {/* {events === null ? (
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
        )} */}
      {/* </div> */}
    </Layout>
  );
};

export default Homepage;

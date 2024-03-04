import Layout from "../Layout";
import { useCallback, useMemo, useState } from "react";
import {
  JoinOpenContext,
  EventsContext,
  ReadyContext,
  SplashContext,
  UserContext
} from "..";
import { useContext } from "react";
import { Accordion, Alert, Card, Spinner, Table } from "flowbite-react";
import { differenceInDays, isAfter, addDays } from "date-fns";
import { it } from "date-fns/locale";
import {
  Link,
  createSearchParams,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { useEffect } from "react";
import Splash from "../Splash";
import { FaWhatsapp } from "react-icons/fa";
import { formatInTimeZone } from "date-fns-tz";
import { Carousel } from "react-round-carousel";
import Zoom, { Controlled as ControlledZoom } from "react-medium-image-zoom";
import JoinRequestModal from "./JoinRequestModal";
import { Button } from "@material-tailwind/react";

import "react-medium-image-zoom/dist/styles.css";
import "react-round-carousel/src/index.css";
import Bandiere from "../Bandiere";
import { adminsList } from "./Info";
import { LazyLoadImage } from "react-lazy-load-image-component";
import axios, { isAxiosError } from "axios";

const Homepage = () => {
  const { user } = useContext(UserContext);
  const { events } = useContext(EventsContext);
  const { splashPlayed, setSplashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [alert, setAlert] = useState(null);

  const [searchParams] = useSearchParams();

  // const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);

  const handleZoomChange = useCallback((shouldZoom, zoomImg) => {
    console.log({ shouldZoom, zoomedImg });
    if (!shouldZoom) {
      setZoomedImg(null);
    } else {
      setZoomedImg(zoomImg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getNumbersFromString = useCallback(
    str => str.match(/\d+/g)?.map(Number) || [],
    []
  );

  useEffect(() => {
    if (searchParams.get("toconfirm")) {
      setAlert({
        color: "info",
        msg: "Grazie per esserti registrato! Per favore verifica il tuo account cliccando il link presente all'interno della mail"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } else if (searchParams.get("confirmed")) {
      setAlert({
        color: "success",
        msg: "Email confermata con successo! Ora puoi prenotarti come stazione attivatrice, inviare foto e video e altro."
      });
    }
  }, [searchParams]);

  useEffect(() => {
    setTimeout(() => {
      setSplashPlayed(true);
    }, 4000 + 3500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (!events) return;
    const now = new Date();
    const _events = [...events].filter(e => isAfter(new Date(e.date), now));
    _events.sort(
      (a, b) =>
        differenceInDays(now, new Date(b.date)) -
        differenceInDays(now, new Date(a.date))
    );
    if (_events.length > 0) setEventJoining(_events[0]);
    for (const e of events) {
      const diff = differenceInDays(new Date(e.date), now);
      if (
        diff >= 0 &&
        diff <= 14 &&
        e.logoUrl &&
        e.logoUrl !== "/logo-min.png"
      ) {
        // setShownEvent(e);
        return;
      }
    }
  }, [events]);

  const posters = useMemo(() => {
    if (!events) return null;
    const _inverted = [...events];
    _inverted.sort((a, b) => new Date(b.date) - new Date(a.date));
    return _inverted
      .filter(e => e.logoUrl && !e.logoUrl.endsWith("logo-min.png"))
      .map(e => ({
        alt: "Locandina " + e.i,
        image: e.logoUrl,
        content: (
          <ControlledZoom
            isZoomed={zoomedImg?.includes(e.logoUrl)}
            onZoomChange={s => handleZoomChange(s, e.logoUrl)}
          >
            <LazyLoadImage
              src={e.logoUrl}
              alt={`Locandina di ${e.name}`}
              className="object-contain w-full h-full"
            />
          </ControlledZoom>
        )
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, zoomedImg]);

  const [eventJoining, setEventJoining] = useState(null);
  const { joinOpen, setJoinOpen } = useContext(JoinOpenContext);

  // scroll to URL href
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) element.scrollIntoView();
    }
  }, []);

  const _stationEvent = useCallback(async () => {
    if (!events || !user) return null;
    const now = new Date();
    // show for next 25 days after event has started
    const _events = [...events].filter(e =>
      isAfter(addDays(new Date(e.date), 8), now)
    );
    _events.sort(
      (a, b) =>
        differenceInDays(now, new Date(b.date)) -
        differenceInDays(now, new Date(a.date))
    );
    const e = _events[0];
    if (!e) return null;

    console.log("event to show", e);

    try {
      const { data } = await axios.get("/api/joinrequest/event/" + e._id);
      if (!data?.isApproved) {
        throw new Error("join request not found or approved");
      }
      console.log("join request found", data);
    } catch (err) {
      console.log(
        "join request error",
        isAxiosError(err) ? err?.response?.data : err
      );
      return null;
    }

    // here means user has join request approved
    return e;
  }, [events, user]);

  const [stationEventToShow, setStationEventToShow] = useState(null);
  useEffect(() => {
    _stationEvent().then(setStationEventToShow);
  }, [_stationEvent]);

  return (
    <Layout>
      {!splashPlayed && <Splash ready={ready} />}

      <JoinRequestModal
        event={eventJoining}
        setEvent={setEventJoining}
        open={joinOpen}
        setOpen={setJoinOpen}
      />

      {ready && (
        <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
          <div className="flex h-full">
            <div className="flex flex-col">
              {alert && (
                <Alert
                  className="mb-6"
                  color={alert.color}
                  onDismiss={() => setAlert(null)}
                >
                  <span>{alert.msg}</span>
                </Alert>
              )}

              <div className="flex dark:mb-3 flex-col justify-center md:hidden">
                <hr />
                <div className="mx-auto">
                  <Bandiere />
                </div>
                <hr />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3">
                <div>
                  <LazyLoadImage
                    src="/flashmob.png"
                    alt="Flash mob"
                    className="dark:p-3 dark:bg-gray-100 w-full fit max-w-md md:max-w-xl lg:max-w-2xl py-4 mx-auto"
                  />
                  <div
                    id="storiaflashmob"
                    className="text-gray-600 dark:text-gray-100 mb-8 mt-4 md:pr-4 text-justify"
                  >
                    <p>
                      Nasce da un'idea di <strong>IU4JJJ</strong> Pietro Cerrone
                      membro della chat VHF e superiori che la propone a{" "}
                      <strong>IZ5RNF</strong> Alessandro Ronca creatore del
                      gruppo.
                    </p>

                    <p>
                      Accolta l'idea viene creato un gruppo di lavoro con la
                      collaborazione di{" "}
                      <a
                        href="https://www.qrz.com/db/IC8TEM"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center underline decoration-dotted hover:text-black hover:dark:text-white transition-colors"
                      >
                        <strong>IC8TEM</strong> Costantino Cerrotta
                      </a>{" "}
                      (
                      <a
                        href="https://www.ft8activity.it/author/ic8tem/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center underline decoration-dotted hover:text-black hover:dark:text-white transition-colors"
                      >
                        FT8ACTIVITY
                      </a>
                      ).
                    </p>

                    <p>
                      Il gruppo dopo aver delineato modalità e tempi, giunge a
                      pianificare il primo evento che viene pubblicizzato su
                      varie piattaforme social come prova del funzionamento
                      ,organizzazione e gestione.
                    </p>

                    <p>
                      Ispirandosi proprio al "flash mob" che si prefigge lo
                      scopo di far incontrare più persone possibile per poco
                      tempo usando mail e social ,da qui il nome.
                    </p>

                    <p>
                      Con soddisfazione si raccolgono attorno alle prime due
                      stazioni molti appassionati radioamatori e il debutto è un
                      successo.
                    </p>

                    <div className="py-6 flex w-full mt-4 md:mt-0 justify-center items-center">
                      <figure>
                        <Zoom>
                          <LazyLoadImage
                            className="max-w-[10rem] mx-auto object-contain w-full"
                            src="/locandine/1-min.png"
                            alt="Esempio"
                          />
                        </Zoom>
                        <figcaption className="text-center">
                          Locandina del primo flash mob
                        </figcaption>
                      </figure>
                    </div>

                    <p>
                      Le stazioni dette "attivatrici" chiamate così per
                      l'occasione ricevono molte richieste di contatto da tutta
                      Italia.
                    </p>

                    <p>
                      Il numero dei partecipanti supera le aspettative e la
                      struttura di gestione creata supera il test: viene quindi
                      deciso di continuare con questa esperienza e di
                      organizzare i successivi eventi.
                    </p>

                    <p>
                      Viene inviata attraverso il sito diplomi radio la eqsl
                      conferma del contatto da ogni stazione attivatrice e
                      successivamente Vengono raccolti e pubblicati i dati dei
                      relativi ai partecipanti e al numero contatti, sia dei
                      "cacciatori" che delle stazioni "attivatrici" e attribuito
                      un punteggio pari ad un punto per ogni collegamento
                      avvenuto
                    </p>

                    <p>
                      L'evento non è una gara ma ha lo scopo di aumentare il
                      numero di stazioni operanti sulle bande VHF e superiori
                      con uno spirito partecipativo e non competitivo.
                    </p>
                  </div>

                  <Accordion id="calendario" alwaysOpen flush className="mt-8">
                    <Accordion.Panel>
                      <Accordion.Title className="pt-1 pb-1">
                        Calendario
                      </Accordion.Title>
                      <Accordion.Content className="px-0 py-0 pt-1 scale-90">
                        <Table>
                          <Table.Head>
                            <Table.HeadCell className="pr-2">
                              Edizione
                            </Table.HeadCell>
                            <Table.HeadCell>Banda</Table.HeadCell>
                            <Table.HeadCell>Data</Table.HeadCell>
                          </Table.Head>
                          <Table.Body className="text-xl">
                            {!events ? (
                              <Spinner />
                            ) : (
                              events
                                .filter(e =>
                                  isAfter(new Date(e.date), new Date())
                                )
                                .map(e => (
                                  <Table.Row
                                    key={e._id}
                                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    <Table.Cell className="py-2 pr-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                      {getNumbersFromString(e.name)
                                        .join("")
                                        .substring(0, 2)}
                                      °
                                    </Table.Cell>
                                    <Table.Cell className="py-2">
                                      {e.band}
                                    </Table.Cell>
                                    <Table.Cell className="py-2 font-semibold">
                                      <span className="block xl:hidden">
                                        {formatInTimeZone(
                                          e.date,
                                          "Europe/Rome",
                                          "dd/MM",
                                          {
                                            locale: it
                                          }
                                        )}
                                      </span>
                                      <span className="hidden xl:block">
                                        {formatInTimeZone(
                                          e.date,
                                          "Europe/Rome",
                                          "dd MMMM yyyy",
                                          {
                                            locale: it
                                          }
                                        )}
                                      </span>
                                    </Table.Cell>
                                  </Table.Row>
                                ))
                            )}
                            {/* {prossimiEventi.map((e, i) => (
                              <Table.Row
                                key={e.i.toString()}
                                className="bg-white dark:border-gray-700 dark:bg-gray-800"
                              >
                                <Table.Cell className="py-2 pr-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                  {e.i}°
                                </Table.Cell>
                                <Table.Cell className="py-2">
                                  {e.i % 3 === 1
                                    ? "2m"
                                    : e.i % 3 === 2
                                    ? "70cm"
                                    : "23cm"}
                                </Table.Cell>
                                <Table.Cell className="py-2 font-semibold">
                                  <span className="block xl:hidden">
                                    {formatInTimeZone(
                                      e.d,
                                      "Europe/Rome",
                                      "dd/MM",
                                      {
                                        locale: it
                                      }
                                    )}
                                  </span>
                                  <span className="hidden xl:block">
                                    {formatInTimeZone(
                                      e.d,
                                      "Europe/Rome",
                                      "dd MMMM yyyy",
                                      {
                                        locale: it
                                      }
                                    )}
                                  </span>
                                </Table.Cell>
                              </Table.Row>
                            ))} */}
                          </Table.Body>
                        </Table>
                      </Accordion.Content>
                    </Accordion.Panel>
                  </Accordion>
                </div>
                <div className="md:px-4">
                  <div
                    id="eventi"
                    onClick={e => {
                      if (e.target.dataset.rmizContent) {
                        const img =
                          e.target?.parentNode?.parentNode?.parentNode?.querySelector(
                            "img"
                          )?.src;
                        console.log("setto zoomed img", img);
                        if (img) setZoomedImg(img);
                      }
                    }}
                    onMouseEnter={e => {
                      if (
                        [...e.target.classList].includes(
                          "carousel__control--prev"
                        )
                      ) {
                        document
                          .querySelector(".carousel__control--prev")
                          ?.click();
                      } else if (
                        [...e.target.classList].includes(
                          "carousel__control--next"
                        )
                      ) {
                        document
                          .querySelector(".carousel__control--next")
                          ?.click();
                      }
                    }}
                    className="min-h-[20rem] mt-12 md:mt-24 overflow-x-hidden overflow-y-clip -mx-4 md:mx-4 md:max-w-[80vw] select-none"
                  >
                    {posters ? (
                      <Carousel items={posters} showControls={false} />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    )}
                  </div>

                  <div className="my-12" />

                  <div className="md:-mt-12 flex flex-col items-center justify-center">
                    <h2 className="font-bold mb-4 text-center text-2xl tracking-tight">
                      SE VUOI ESSERE PROSSIMA STAZIONE ATTIVATRICE:
                    </h2>
                    {user ? (
                      <Button
                        className="text-lg mb-4"
                        onClick={() => setJoinOpen(true)}
                      >
                        CLICCA QUI
                      </Button>
                    ) : (
                      <Button
                        className="text-xl mb-4"
                        onClick={() =>
                          navigate({
                            pathname: "/login",
                            search: createSearchParams({
                              to: "/#eventi"
                            }).toString()
                          })
                        }
                      >
                        CLICCA QUI
                      </Button>
                    )}
                    {/* <Alert color="info">
                  <span>
                    <span className="font-medium">Info</span> Il modulo per
                    registrarsi non è ancora in funzione. Nel frattempo, puoi
                    contattarci scrivendo a uno degli amministratori.
                  </span>
                </Alert> */}
                  </div>

                  <Accordion
                    id="istruzioniflashmob"
                    alwaysOpen
                    flush
                    className="mt-8"
                  >
                    <Accordion.Panel>
                      <Accordion.Title>
                        Istruzioni per partecipare
                      </Accordion.Title>
                      <Accordion.Content className="text-gray-600 dark:text-gray-100">
                        <a
                          href="https://chat.whatsapp.com/FJ6HissbZwE47OWmpes7Pr"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="mx-auto flex items-center mb-4 text-lg bg-[#2BB741]">
                            <FaWhatsapp />{" "}
                            <span className="ml-1">Chatta su WhatsApp</span>
                          </Button>
                        </a>
                        <p className="font-bold text-lg text-black dark:text-white uppercase mt-2">
                          COSA È IL RADIO FLASH MOB
                        </p>

                        <p>
                          L'intento di questo evento è quello di incentivare
                          l'utilizzo delle frequenze VHF 144MHz e UHF
                          432/1200MHz e superiori nei modi fonia e CW.
                        </p>

                        <p>
                          Per l'occasione le stazioni che si sono rese
                          disponibili vengono denominate "attivatrici"e viene
                          assegnata loro una frequenza di riferimento per i
                          collegamenti, da utilizzare nel corso delle due ore
                          della manifestazione che si terrà l'ultima domenica di
                          ogni mese.
                        </p>

                        <p className="font-bold text-lg text-black dark:text-white uppercase mt-2">
                          COME GESTIRE I COLLEGAMENTI
                        </p>

                        <p>
                          Le stazioni che attuano il contatto si scambiano
                          nominativo, rapporto e locatore e a conferma del
                          collegamento verrà inviata QSL elettronica concepita
                          per l'occasione.
                        </p>

                        <p className="font-bold text-lg text-black dark:text-white uppercase mt-2">
                          RACCOMANDAZIONI
                        </p>

                        <p>
                          Si consiglia l'uso della Chat per organizzare sked
                          specialmente per i collegamenti a lunga distanza e
                          quindi più difficili.
                        </p>

                        <p>
                          Si invitano i partecipanti al radio flash mob di
                          SEGUIRE I{" "}
                          <a
                            href="https://chat.whatsapp.com/FJ6HissbZwE47OWmpes7Pr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
                          >
                            MESSAGGI DELLA CHAT vhfesuperiori
                          </a>{" "}
                          per non perdere richieste di stazioni che stanno
                          cercando di effettuare il collegamento e non ci
                          riescano. Lo strumento della richiesta via messaggio
                          sul gruppo risulta essere contributo essenziale al
                          fine di completare il collegamento.
                        </p>

                        <p>GRAZIE A TUTTI DELLA PARTECIPAZIONE.</p>

                        <p className="italic uppercase mt-2">
                          LA FREQUENZA ASSEGNATA È DI RIFERIMENTO MA NEI MOMENTI
                          OPPORTUNI, SI PUÒ EFFETTUARE UNO SPOSTAMENTO ALLO
                          SCOPO DI COLLEGARE ALTRA STAZIONE ATTIVATRICE
                          INTERESSATA, PER FARE RITORNO A CONTATTO AVVENUTO
                          SULLA FREQUENZA PROPRIA PER ESSERE DISPONIBILE AD
                          ALTRE RICHIESTE DI COLLEGAMENTO.
                        </p>
                      </Accordion.Content>
                    </Accordion.Panel>
                  </Accordion>
                  {stationEventToShow &&
                    Object.keys(stationEventToShow).length > 0 && (
                      <div className="mt-4">
                        {/* aggiungi link a /qsomanager/:idevento */}
                        <Card className="text-center">
                          <p className="text-gray-600 dark:text-gray-200">
                            Sei stato accettato come stazione attivatrice per:
                          </p>

                          {stationEventToShow.logoUrl && (
                            <LazyLoadImage
                              src={stationEventToShow.logoUrl}
                              alt={`Stazione attivatrice per ${stationEventToShow.name}`}
                              className="w-full mx-auto mb-2 object-contain max-h-48"
                            />
                          )}
                          <h2 className="text-2xl font-bold">
                            {stationEventToShow.name}
                          </h2>

                          <Link
                            to={"/qsomanager/" + stationEventToShow._id}
                            className="underline decoration-dotted hover:text-black transition-colors"
                          >
                            <Button className="text-lg mt-4">
                              Gestisci QSO
                            </Button>
                          </Link>
                        </Card>
                      </div>
                    )}
                </div>
                <div>
                  <div className="mt-4 mb-2">
                    <div className="mb-6 w-fit mx-auto dark:bg-gray-800 dark:rounded-lg dark:items-center dark:flex dark:flex-col dark:overflow-hidden">
                      <h2
                        id="amministratori"
                        className="font-bold text-center text-3xl tracking-tight dark:w-full dark:bg-gray-700 dark:px-8 dark:pt-4 pb-2 mb-2"
                      >
                        Amministratori
                      </h2>

                      <div className="mx-auto dark:pb-2 dark:px-4">
                        {adminsList.map(e => (
                          <a
                            href={"https://www.qrz.com/db/" + e.split(" ")[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={e}
                            className="flex font-bold text-lg items-center underline decoration-dotted text-gray-900 dark:text-gray-200"
                          >
                            {/* <span className="text-gray-500 font-bold text-3xl">
                              <FaAngleDoubleRight />
                            </span> */}
                            <span /* className="ml-1" */>{e}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* storia flash mob */}
                    <div className="text-justify text-gray-600 dark:text-gray-200">
                      <h3 className="text-left text-3xl mb-2 font-bold text-red-600 tracking-tight uppercase">
                        LA CHAT VHFESUPERIORI
                      </h3>

                      <p>
                        Fondata il 28 gennaio 2018 da Alessandro Ronca{" "}
                        <strong>IZ5RNF</strong>, la chat vhfesuperiori ha lo
                        scopo di essere un contenitore velocemente accessibile
                        dove riunire tutti i radioamatori attivi sulle bande da
                        144mhz a salire, per sapere in tempo reale chi fosse
                        disponibile in radio in un preciso momento e verso quale
                        direzione chiamare.
                      </p>

                      <p>
                        Per poter creare un gruppo, WhatsApp necessita di un
                        numero minimo di due persone. Così, Alessandro Ronca
                        spiega a <strong>IZ5IOQ</strong> Giacomo Matteucci,
                        amico di vecchia data, cosa ha in mente di fare e chiede
                        se lui condivide gli intenti e se acconsente a creare il
                        gruppo con lui. Accordato da Giacomo l’impegno, può
                        nascere la chat.
                      </p>

                      <p>
                        Il primo vantaggio offerto dall’utilizzo del gruppo è
                        quello di poter orientare correttamente le antenne in
                        direzione del corrispondente, evitando così di fare
                        chiamate in direzioni dove non ci fossero stazioni
                        operanti e senza quindi ricevere risposta alle chiamate.
                      </p>

                      <p>
                        Negli ultimi anni c’è stato un tracollo nell’utilizzo di
                        queste bande, fino a creare un vero e proprio tam tam
                        negativo che diceva che non c’erano più operatori su
                        queste frequenze, definite ormai “morte”. Seguendo il
                        progetto iniziale di formare un gruppo più numeroso
                        possibile nei primi due anni, Alessandro invita nella
                        neonata chat tutti gli operatori di stazione che collega
                        durante la sua attività radiantistica in SSB 144MHz e
                        432MHz. Alcuni accettavano l’invito e altri rifiutavano.
                      </p>

                      <p>
                        Il primo risultato che si era prefissato era quello di
                        “interrompere” il tam tam che da tempo si sentiva
                        ripetere: “In VHF SSB non c’è più nessuno, figuriamoci
                        sulle bande superiori”. Lentamente gli amici collegati
                        in radio che accettavano di essere inseriti passarono da
                        3 a 5 a 20 a 30 a 50, ma molte zone del paese rimanevano
                        purtroppo ancora scoperte. Fu per lui un risultato
                        memorabile il superamento della soglia dei 100
                        partecipanti dopo un lavoro portato avanti
                        ininterrottamente per due anni di contatti radio, inviti
                        e inserimenti. Così la chat inizia a essere utile e i
                        messaggi iniziano a essere sempre più numerosi grazie al
                        contributo di molti appassionati presenti nel gruppo.
                      </p>

                      <p>
                        Fiero del risultato e del fatto che il gruppo iniziasse
                        ad essere utilizzato per i fini per i quali era nato,
                        continuò, come fa ancora oggi, ad invitare operatori nel
                        gruppo vhfesuperiori contattando i potenziali membri
                        personalmente uno ad uno. Giunto vicino alla soglia dei
                        200 iscritti, la gestione della chat richiedeva sempre
                        più tempo, diventando un impegno difficile e
                        impegnativo.
                      </p>

                      <p>
                        Decide così di nominare degli amministratori che fossero
                        di supporto e sviluppo, seguendo il concetto di
                        “copertura” territoriale, competenza, disponibilità e
                        condivisione degli intenti del gruppo. Gli
                        amministratori sono diventati in breve tempo
                        indispensabili e riferimenti zonali per le stazioni di
                        nuovo ingresso e per quelle che già facevano parte della
                        chat. La divisione che fu fatta è quella che rimane ad
                        oggi, e cioè in zone: nord, centro, centro-sud e sud.
                        Entrano nel gruppo nuovi amici che iniziano la loro
                        attività e altri che riprendono dopo periodi di pausa, e
                        altri che sempre sono stati operativi.
                      </p>

                      <p>
                        Nel tempo si è visto un incremento esponenziale del
                        numero delle stazioni operative e del numero dei
                        collegamenti, sia quotidianamente che in occasione di
                        manifestazioni, con un trend ancora oggi in continua
                        crescita. L’entusiasmo e la passione per questo hobby
                        sta coinvolgendo e divertendo sempre più appassionati.
                        Ad oggi, 27 febbraio 2023, il gruppo conta oltre 400
                        partecipanti da tutta Italia, Spagna, Svizzera, Francia,
                        Croazia, Malta ecc.
                      </p>

                      <p>
                        Questa grande partecipazione ha portato alla creazione
                        di questo sito, con lo scopo di diffondere questo
                        entusiasmo e passione per queste bande e modi anche
                        oltre i confini italiani, in tutta Europa. In questa
                        sede, intendo ringraziare personalmente e singolarmente
                        tutti, nessuno escluso, per aver accettato di far parte
                        di questo progetto e di aver condiviso questa idea. Ogni
                        singolo operatore, con il suo contributo e passione, sta
                        portando sempre più radioamatori ad operare sulle VHF e
                        superiori.
                      </p>

                      <p className="font-semibold text-lg">
                        UN GRAZIE SENTITO DEL VOSTRO CONTRIBUTO, SENZA IL QUALE
                        NON SAREBBE STATO POSSIBILE PORTARE COSÌ TANTE PERSONE A
                        DIVERTIRSI IN RADIO INSIEME.
                      </p>

                      <p className="font-semibold text-xl text-black dark:text-white">
                        IZ5RNF ALESSANDRO
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Homepage;

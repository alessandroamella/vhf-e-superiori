import { Button } from "@material-tailwind/react";
import axios from "axios";
import {
  addDays,
  addHours,
  differenceInDays,
  isAfter,
  isBefore,
  subDays
} from "date-fns";
import { it } from "date-fns/locale";
import { Accordion, Alert, Card, Spinner, Table } from "flowbite-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Trans, useTranslation } from "react-i18next";
import { FaExternalLinkAlt, FaWhatsapp } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Zoom, { Controlled as ControlledZoom } from "react-medium-image-zoom";
import ReactPlaceholder from "react-placeholder";
import { Carousel } from "react-round-carousel";
import {
  createSearchParams,
  Link,
  useNavigate,
  useSearchParams
} from "react-router";
import { EventsContext, JoinOpenContext } from "../App";
import JoinRequestModal from "./JoinRequestModal";
import "react-round-carousel/src/index.css";
import Flags from "../Flags";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import useUserStore from "../stores/userStore";

const Homepage = () => {
  const user = useUserStore((store) => store.user);
  const { events: _events } = useContext(EventsContext);
  const { t } = useTranslation();

  const events = useMemo(() => {
    if (!Array.isArray(_events)) return null;
    // just events before 2040
    return _events.filter((e) => isBefore(e.date, new Date("2040-01-01")));
  }, [_events]);

  const [alert, setAlert] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to run this only once
  const handleZoomChange = useCallback((shouldZoom, zoomImg) => {
    console.log({ shouldZoom, zoomedImg });
    if (!shouldZoom) {
      setZoomedImg(null);
    } else {
      setZoomedImg(zoomImg);
    }
  }, []);

  const getNumbersFromString = useCallback(
    (str) => str.match(/\d+/g)?.map(Number) || [],
    []
  );

  const toConfirm = searchParams.get("toconfirm");
  const confirmed = searchParams.get("confirmed");

  useEffect(() => {
    if (toConfirm) {
      console.log("showing toconfirm alert");
      setAlert({
        color: "info",
        msg: "Grazie per esserti registrato! Per favore verifica il tuo account cliccando il link presente all'interno della mail"
      });
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }, 100);
    } else if (confirmed) {
      console.log("showing confirmed alert");
      setAlert({
        color: "success",
        msg: "Email confermata con successo! Ora puoi prenotarti come stazione attivatrice, inviare foto e video e altro."
      });
      searchParams.delete("confirmed");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, confirmed, toConfirm]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!Array.isArray(events)) return;
    const now = new Date();
    console.log("filtering events", events);
    const _events = [...events].filter((e) => isAfter(new Date(e.date), now));
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to run this only once
  const posters = useMemo(() => {
    if (!Array.isArray(events)) return null;
    const _inverted = [...events];
    _inverted.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log("filtering _inverted", _inverted);
    return _inverted
      .filter((e) => e.logoUrl && !e.logoUrl.endsWith("logo-min.png"))
      .map((e) => ({
        alt: `Locandina ${e.i}`,
        image: e.logoUrl,
        content: (
          <ControlledZoom
            isZoomed={zoomedImg?.includes(e.logoUrl)}
            onZoomChange={(s) => handleZoomChange(s, e.logoUrl)}
          >
            <LazyLoadImage
              src={e.logoUrl}
              alt={`Locandina di ${e.name}`}
              className="object-contain w-full h-full"
            />
          </ControlledZoom>
        )
      }));
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
    if (!Array.isArray(events) || !user) return null;
    const now = new Date();
    // show for next 10 days after event has started and 10 days before
    console.log("events to filter (_stationEvent)", events);
    const _events = [...events].filter((e) => {
      const eventDate = new Date(e.date);
      return (
        isAfter(now, subDays(eventDate, 10)) &&
        isBefore(now, addDays(eventDate, 10))
      );
    });
    _events.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log("events possibly to show", _events);

    for (const e of _events) {
      console.log("event to try to show", e);
      try {
        const { data } = await axios.get(`/api/joinrequest/event/${e._id}`);
        if (!data?.isApproved) {
          console.log("join request to show not found or not approved", data);
          continue;
        }
        console.log("join request to show found", data);
        // here means user has join request approved
        return e;
      } catch (err) {
        console.log(
          "join request error",
          getErrorStr(err?.response?.data?.err || err?.response?.data || err)
        );
      }
    }

    return null;
  }, [events, user]);

  const _rankingsEvent = useCallback(async () => {
    if (!Array.isArray(events)) return null;
    const now = new Date();
    // show for 2 hours after event has started and 20 days before
    console.log("events to filter (_rankingsEvent)", events);
    const _events = [...events].filter((e) => {
      const eventDate = new Date(e.date);
      return (
        // show rankings 2 hours after event has started
        // and up to 20 days later
        isAfter(now, addHours(eventDate, 2)) &&
        isBefore(now, addDays(eventDate, 20))
      );
    });
    _events.sort(
      (a, b) =>
        differenceInDays(now, new Date(b.date)) -
        differenceInDays(now, new Date(a.date))
    );
    return _events[_events.length - 1] ?? null;
  }, [events]);

  const _eqslEvent = useCallback(async () => {
    if (!Array.isArray(events)) return null;
    const now = new Date();
    console.log("events to filter (_eqslEvent)", events);
    const _events = [...events].filter((e) => {
      const eventDate = new Date(e.date);
      // show for next 10 days after event has started and 1 day
      return (
        isAfter(now, subDays(eventDate, 1)) &&
        isBefore(now, addDays(eventDate, 10))
      );
    });
    // Sort by date, showing the latest event
    _events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return _events[0] || null;
  }, [events]);

  const [eqslEventToShow, setEqslEventToShow] = useState(null);
  useEffect(() => {
    // returns eqslEventToShow
    _eqslEvent().then(setEqslEventToShow);
  }, [_eqslEvent]);

  const [rankingsEventToShow, setRankingsEventToShow] = useState(null);
  const [stationEventToShow, setStationEventToShow] = useState(null);
  useEffect(() => {
    // returns [rankingsEventToShow, stationEventToShow]
    _stationEvent().then(setStationEventToShow);
    _rankingsEvent().then(setRankingsEventToShow);
  }, [_stationEvent, _rankingsEvent]);

  const [admins, setAdmins] = useState(null);
  useEffect(() => {
    async function fetchAdmins() {
      try {
        const { data } = await axios.get("/api/auth/admins");
        console.log("admins fetched", data);
        setAdmins(data);
      } catch (err) {
        console.error(
          "error while fetching admins",
          err?.response?.data || err
        );
      }
    }
    fetchAdmins();
  }, []);

  const cardEvent = useMemo(
    () => stationEventToShow || eqslEventToShow,
    [eqslEventToShow, stationEventToShow]
  );

  const scoringItems = t("scoring", { returnObjects: true });

  return (
    <>
      <Helmet>
        <title>
          {t("mainTitle", {
            defaultValue: "VHF e Superiori - Flash Mob Radioamatoriale"
          })}
        </title>
      </Helmet>

      <JoinRequestModal
        event={eventJoining}
        setEvent={setEventJoining}
        open={joinOpen}
        setOpen={setJoinOpen}
      />

      <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        <div className="flex h-full">
          <div className="flex flex-col">
            {alert && (
              <Alert
                className="mb-6 dark:text-black"
                color={alert.color}
                onDismiss={() => setAlert(null)}
              >
                <span>{alert.msg}</span>
              </Alert>
            )}

            <div className="flex dark:mb-3 flex-col justify-center md:hidden">
              <hr />
              <div className="mx-auto">
                <Flags />
              </div>
              <hr />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3">
              <div>
                <LazyLoadImage
                  src="/images/flashmob.png"
                  alt="Flash mob"
                  className="dark:p-3 dark:bg-gray-100 w-full fit max-w-md md:max-w-xl lg:max-w-2xl py-4 mx-auto"
                />
                <div
                  id="storiaflashmob"
                  className="text-gray-600 dark:text-gray-100 mb-8 mt-4 md:pr-4 text-justify"
                >
                  <p>
                    <Trans
                      i18nKey="bornFrom"
                      components={{ 1: <strong />, 3: <strong /> }}
                    />
                  </p>

                  <p>
                    <Trans
                      i18nKey="workGroup"
                      components={[
                        "ACC", // placeholder 0 (non usato, serve solo per occupare la posizione)
                        <a
                          key="link1"
                          href="https://www.qrz.com/db/IC8TEM"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center underline decoration-dotted hover:text-black hover:dark:text-white transition-colors"
                        >
                          {/* Figlio di <1>…</1> */}
                          <strong />
                        </a>,
                        "ACC2", // placeholder 2 (non usato)
                        <a
                          key="link3"
                          href="https://www.ft8activity.it/author/ic8tem/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center underline decoration-dotted hover:text-black hover:dark:text-white transition-colors"
                        >
                          <strong />
                        </a>
                      ]}
                    />
                  </p>

                  <p>{t("firstEvent")}</p>

                  <p>{t("inspiration")}</p>

                  <p>{t("satisfaction")}</p>

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
                        {t("firstPoster")}
                      </figcaption>
                    </figure>
                  </div>

                  <p>{t("activators")}</p>

                  <p>{t("participants")}</p>

                  <p>
                    <Trans i18nKey="processDescription" />
                  </p>

                  <ul className="list-disc list-inside">
                    {scoringItems.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>

                  <p>{t("event")}</p>
                </div>

                <Accordion id="calendario" alwaysOpen flush className="mt-8">
                  <Accordion.Panel>
                    <Accordion.Title className="pt-1 pb-1">
                      {t("calendar")}
                    </Accordion.Title>
                    <Accordion.Content className="px-0 py-0 pt-1 scale-90">
                      <Table>
                        <Table.Head>
                          <Table.HeadCell className="pr-2">
                            {t("edition")}
                          </Table.HeadCell>
                          <Table.HeadCell>{t("band")}</Table.HeadCell>
                          <Table.HeadCell>{t("date")}</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="text-xl">
                          {!Array.isArray(events) ? (
                            <Spinner />
                          ) : (
                            events
                              .filter((e) =>
                                isAfter(new Date(e.date), new Date())
                              )
                              .map((e) => (
                                <Table.Row
                                  key={e._id}
                                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                                >
                                  <Table.Cell className="py-2 pr-2 whitespace-nowrap font-medium text-gray-900 dark:text-white max-w-[6.5rem] text-ellipsis overflow-hidden">
                                    {getNumbersFromString(e.name).length > 0
                                      ? `${getNumbersFromString(e.name)
                                          .join("")
                                          .substring(0, 2)}°`
                                      : e.name}
                                  </Table.Cell>
                                  <Table.Cell className="py-2">
                                    {e.band.toUpperCase()}
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
                                        "dd/MM/yyyy",
                                        {
                                          locale: it
                                        }
                                      )}
                                    </span>
                                  </Table.Cell>
                                </Table.Row>
                              ))
                          )}
                        </Table.Body>
                      </Table>
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>

                {rankingsEventToShow && (
                  <div className="mt-4">
                    <Card className="text-center">
                      <h2 className="text-2xl font-bold">
                        🏆 {t("scoreboard")} {rankingsEventToShow.name}
                      </h2>
                      <Link
                        to={`/rankings/${rankingsEventToShow._id}`}
                        className="underline decoration-dotted hover:text-black transition-colors"
                      >
                        <Button className="text-md mt-4">
                          <FaExternalLinkAlt className="inline mr-1 mb-1" />{" "}
                          {t("visualizeScoreboard")}
                        </Button>
                      </Link>
                    </Card>
                  </div>
                )}
              </div>
              <div className="md:px-4">
                <div
                  id="eventi"
                  onClick={(e) => {
                    if (e.target.dataset.rmizContent) {
                      const img =
                        e.target?.parentNode?.parentNode?.parentNode?.querySelector(
                          "img"
                        )?.src;
                      console.log("setto zoomed img", img);
                      if (img) setZoomedImg(img);
                    }
                  }}
                  onMouseEnter={(e) => {
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
                    {t("ifNextStation")}
                  </h2>
                  <Button
                    className="text-lg mb-4"
                    color="blue"
                    onClick={() =>
                      user
                        ? setJoinOpen(true)
                        : navigate({
                            pathname: "/login",
                            search: createSearchParams({
                              to: "/#eventi"
                            }).toString()
                          })
                    }
                  >
                    {t("clickHere")}
                  </Button>
                </div>

                <Accordion
                  id="istruzioniflashmob"
                  alwaysOpen
                  flush
                  className="mt-8"
                >
                  <Accordion.Panel>
                    <Accordion.Title>{t("instructions")}</Accordion.Title>
                    <Accordion.Content className="text-gray-600 dark:text-gray-100">
                      <a
                        href="https://chat.whatsapp.com/FJ6HissbZwE47OWmpes7Pr"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="mx-auto flex items-center mb-4 text-lg bg-[#2BB741]">
                          <FaWhatsapp />{" "}
                          <span className="ml-1">{t("chat")}</span>
                        </Button>
                      </a>
                      <p className="font-bold text-lg text-black dark:text-white uppercase mt-2">
                        {t("whatIsRFM")}
                      </p>
                      <p>{t("intent")}</p>

                      <p>{t("stations")}</p>

                      <p>{t("eqsl")}</p>

                      <p className="font-bold text-lg text-black dark:text-white uppercase mt-2">
                        {t("howToConnectionsTitle")}
                      </p>

                      <p>{t("howToConnections")}</p>

                      <p className="font-bold text-lg text-black dark:text-white uppercase mt-2">
                        {t("bestPractices")}
                      </p>

                      <p>{t("bestPracticesChat")}</p>

                      <p>
                        <Trans
                          i18nKey="followChat"
                          components={{
                            1: (
                              <a
                                href="https://chat.whatsapp.com/FJ6HissbZwE47OWmpes7Pr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-dotted text-center hover:text-black hover:dark:text-white transition-colors"
                              />
                            )
                          }}
                        />
                      </p>

                      <p>{t("thankYouForParticipating")}</p>

                      <p className="italic uppercase mt-2">
                        {t("assignedFrequency")}
                      </p>
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>
                {cardEvent && Object.keys(cardEvent).length > 0 && (
                  <div className="mt-4">
                    {/* aggiungi link a /qsomanager/:idevento */}
                    <Card className="text-center">
                      <p className="text-gray-600 dark:text-gray-200">
                        {stationEventToShow
                          ? t("acceptedActivator")
                          : t("participateHunter")}{" "}
                        {t("for")}:
                      </p>

                      {cardEvent.logoUrl && (
                        <Link
                          to={`/qsomanager/${cardEvent._id}`}
                          className="underline decoration-dotted hover:text-black transition-colors"
                        >
                          <LazyLoadImage
                            src={cardEvent.eqslUrl || cardEvent.logoUrl}
                            alt={`Stazione attivatrice per ${cardEvent.name}`}
                            className={`w-full mx-auto mb-2 object-contain max-h-48 transition-all duration-300 drop-shadow hover:drop-shadow-xl`}
                          />
                        </Link>
                      )}
                      <h2 className="text-2xl font-bold">{cardEvent.name}</h2>

                      <Link
                        to={`/qsomanager/${cardEvent._id}`}
                        className="underline decoration-dotted hover:text-black transition-colors"
                      >
                        <Button color="blue" className="text-lg mt-4">
                          {t("sendEQSL")}
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
                      {t("admins")}
                    </h2>

                    <div className="mx-auto dark:pb-2 dark:px-4">
                      {admins ? (
                        admins.map((e) => (
                          <Link
                            to={`/u/${e.callsign}`}
                            key={e}
                            className="block font-bold text-lg text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white transition-colors"
                          >
                            {e.callsign} - {e.name}
                          </Link>
                        ))
                      ) : (
                        <ReactPlaceholder
                          showLoadingAnimation
                          type="text"
                          rows={8}
                        />
                      )}
                    </div>
                  </div>

                  {/* storia flash mob */}
                  <div className="text-justify text-gray-600 dark:text-gray-200">
                    <h3 className="text-center md:text-left text-3xl mb-2 font-bold text-red-600 tracking-tight uppercase">
                      {t("chatVhf")}
                    </h3>

                    <p>
                      <Trans
                        i18nKey="founding"
                        components={{ 1: <strong /> }}
                      />
                    </p>

                    <p>
                      <Trans
                        i18nKey="foundingChat"
                        components={{ 1: <strong /> }}
                      />
                    </p>

                    <p>{t("antennas")}</p>

                    <p>{t("latestYears")}</p>

                    <p>{t("nobodyOnVhf")}</p>

                    <p>{t("results")}</p>

                    <p>{t("adminsNominated")}</p>

                    <p>{t("stationsIncreasing")}</p>

                    <p>{t("websiteCreation")}</p>

                    <p className="font-semibold text-lg">
                      {t("thankYouForContributing")}
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
    </>
  );
};

export default Homepage;

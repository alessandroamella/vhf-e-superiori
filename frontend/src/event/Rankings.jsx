import axios from "axios";
import { isBefore } from "date-fns";
import { it } from "date-fns/locale";
import {
  Alert,
  Button,
  ListGroup,
  Modal,
  Spinner,
  Table,
  Tabs,
} from "flowbite-react";
import { orderBy } from "lodash";
import { useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle } from "react-icons/fa";
import ReactPlaceholder from "react-placeholder";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { UserContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import ShareMapBtn from "./ShareMapBtn";

const EventList = () => {
  const [events, setEvents] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [alertEvents, setAlertEvents] = useState(null);
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data } = await axios.get("/api/event");
        console.log("events:", data);
        setEvents(
          orderBy(
            // only past events
            data.filter((e) => isBefore(new Date(e.date), new Date())),
            ["date"],
            ["desc"],
          ),
        );
      } catch (err) {
        setAlertEvents({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEvents();
  }, []);

  if (alertEvents) {
    return (
      <Alert
        className="mb-4 dark:text-black"
        color={alertEvents.color}
        onDismiss={() => setAlertEvents(null)}
      >
        <span>{alertEvents.msg}</span>
      </Alert>
    );
  }

  if (loadingEvents) {
    return <Spinner />;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">
        {t("rankings.filterByEvent")}
      </h2>
      <ListGroup className="max-h-56 overflow-auto">
        <ListGroup.Item
          onClick={() => navigate("/rankings")}
          className="uppercase font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700 text-red-500 dark:text-red-400"
        >
          <span className="uppercase">
            {t("rankings.annualRankings", { year: new Date().getFullYear() })}
          </span>
        </ListGroup.Item>
        {events?.map((event) => (
          <ListGroup.Item
            key={event._id}
            onClick={() => navigate(`/rankings/${event._id}`)}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-white"
          >
            {event.name} -{" "}
            {formatInTimeZone(
              new Date(event.date),
              "Europe/Rome",
              "dd/MM/yyyy",
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

const Rankings = () => {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [stationRankings, setStationRankings] = useState(null);
  const [userRankings, setUserRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);

        const { data } = await axios.get(
          id ? `/api/rankings/${id}` : "/api/rankings",
        );
        console.log("event and rankings:", data);
        const { event, rankings } = data;
        if (event) {
          setEvent(event);
        } else {
          setEvent(null);
        }
        setStationRankings(rankings.stationRankings);
        setUserRankings(rankings.userRankings);
      } catch (err) {
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, [id]);

  const navigate = useNavigate();

  const year = new Date().getFullYear();

  const socialTitle = t("rankings.social.title", {
    context: event ? "event" : "year",
    name: event?.name,
    year,
  });
  const socialBody = event
    ? t("rankings.social.bodyEvent", {
        name: event.name,
        date: formatInTimeZone(
          new Date(event.date),
          "Europe/Rome",
          "dd MMMM yyyy",
          { locale: it },
        ),
      })
    : t("rankings.social.bodyYear", { year });

  const [showRankings, setShowRankings] = useState(null);

  const { user } = useContext(UserContext);

  const [qsos, setQsos] = useState(null);

  useEffect(() => {
    async function getQsos() {
      if (!event || !user) return;
      try {
        const { data } = await axios.get("/api/qso", {
          params: {
            event: event._id,
            callsignAnywhere: user.callsign,
          },
        });
        console.log("QSOs", data);
        data.sort((b, a) => new Date(a.qsoDate) - new Date(b.qsoDate));
        setQsos(data);
      } catch (err) {
        console.log(t("rankings.qsoLoadError"), err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });

        setQsos(null);
      }
    }
    getQsos();
  }, [event, user, t]);

  const { pathname } = useLocation();
  const curUrl = useMemo(() => {
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  const pageTitle = event
    ? t("rankings.pageTitle.event", { name: event.name })
    : t("rankings.pageTitle.year", { year });

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <Modal
        position="center"
        show={!!showRankings}
        onClose={() => setShowRankings(null)}
        size="6xl"
      >
        <Modal.Header>
          {t("rankings.qsoModal.title")} <strong>{showRankings}</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="w-full flex flex-col gap-4 max-h-[60vh]">
            {stationRankings &&
              userRankings &&
              [...stationRankings, ...userRankings]
                .filter(
                  (r) =>
                    r.callsign === showRankings ||
                    (r.fromStationCallsignOverride ||
                      r.fromStation?.callsign) === showRankings,
                )
                .map((r) => (
                  <Table striped key={r.callsign}>
                    <Table.Head>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.activator")}
                      </Table.HeadCell>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.callsign")}
                      </Table.HeadCell>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.date")}
                      </Table.HeadCell>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.frequency")}
                      </Table.HeadCell>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.mode")}
                      </Table.HeadCell>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.locator")}
                      </Table.HeadCell>
                      <Table.HeadCell>
                        {t("rankings.qsoModal.table.rst")}
                      </Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {r.qsos.map((qso) => (
                        <Table.Row
                          key={qso._id}
                          onClick={() => navigate(`/qso/${qso._id}`)}
                          className="dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Table.Cell>
                            {qso.fromStation?.callsign ||
                              t("rankings.qsoModal.table.error")}
                          </Table.Cell>
                          <Table.Cell className="font-semibold">
                            {qso.callsign}
                          </Table.Cell>
                          <Table.Cell>
                            {formatInTimeZone(
                              new Date(qso.qsoDate),
                              "Europe/Rome",
                              "dd/MM/yyyy HH:mm",
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {qso.frequency ? `${qso.frequency} MHz` : qso.band}
                          </Table.Cell>
                          <Table.Cell>{qso.mode}</Table.Cell>
                          <Table.Cell>{qso.locator}</Table.Cell>
                          <Table.Cell>{qso.rst}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center gap-2">
            <Button
              color="gray"
              type="button"
              onClick={() => setShowRankings(null)}
            >
              {t("rankings.qsoModal.close")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() =>
                stationRankings || userRankings ? setAlert(null) : navigate("/")
              }
            >
              <span>{alert.msg}</span>
            </Alert>
          )}
          <EventList />
          {/* visualizza classifiche */}

          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={10}
            ready={!loading}
          >
            {stationRankings && userRankings && (
              <div className="w-full flex flex-col gap-4">
                <h1 className="text-3xl md:text-4xl">
                  {t("rankings.mainTitle", {
                    context: event ? "event" : "year",
                  })}{" "}
                  <span className="font-bold">{event ? event.name : year}</span>
                  {event && (
                    <>
                      {" - "}
                      {formatInTimeZone(
                        new Date(event.date),
                        "Europe/Rome",
                        "dd/MM/yyyy",
                      )}
                    </>
                  )}
                </h1>

                <div className="w-fit mt-2 mx-auto -mb-4">
                  <ShareMapBtn
                    event={event}
                    user={user}
                    setAlert={setAlert}
                    qsos={qsos}
                  />
                </div>

                {/* <Tabs.Group> */}
                {[
                  t("rankings.tabs.hunters"),
                  t("rankings.tabs.activators"),
                ].map((tab, i) => (
                  <Tabs.Item title={tab} key={tab}>
                    <h1 className="text-4xl md:text-5xl uppercase text-red-500 font-bold text-center mt-8 mb-8 animate-pulse">
                      {t("rankings.rankingTitle", { type: tab })}
                    </h1>
                    {(i === 1 ? stationRankings : userRankings).length > 0 ? (
                      <div className="max-h-[60vh] md:max-h-[80vh] overflow-y-auto">
                        <Table striped className="text-2xl">
                          <Table.Head>
                            <Table.HeadCell>
                              {t("rankings.table.position")}
                            </Table.HeadCell>
                            <Table.HeadCell>
                              {t("rankings.table.callsign")}
                            </Table.HeadCell>
                            <Table.HeadCell>
                              {t("rankings.table.points")}
                            </Table.HeadCell>
                          </Table.Head>
                          <Table.Body>
                            {(i === 1 ? stationRankings : userRankings).map(
                              (r) => (
                                <Table.Row
                                  key={r.callsign}
                                  onClick={() => setShowRankings(r.callsign)}
                                  className="dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <Table.Cell>
                                    {["🥇", "🥈", "🥉"][r.position - 1] ||
                                      r.position}
                                  </Table.Cell>
                                  <Table.Cell className="font-semibold">
                                    {r.callsign}
                                  </Table.Cell>
                                  <Table.Cell>{r.points}</Table.Cell>
                                </Table.Row>
                              ),
                            )}
                          </Table.Body>
                        </Table>
                      </div>
                    ) : (
                      <Alert color="gray" className="text-center">
                        <FaExclamationTriangle className="inline-block mr-1 mb-1" />
                        {t("rankings.noQsosFound")}
                      </Alert>
                    )}
                  </Tabs.Item>
                ))}
                {/* </Tabs.Group> */}
              </div>
            )}
          </ReactPlaceholder>

          {/* visualizza immagine QSO */}
          {event !== null && (
            <div className="flex justify-end items-center mt-4 gap-1">
              {socialTitle && socialBody && (
                <>
                  <FacebookShareButton
                    url={curUrl}
                    quote={socialTitle}
                    hashtag="#vhfesuperiori"
                  >
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  <TwitterShareButton
                    url={curUrl}
                    title={socialTitle}
                    hashtags={["vhfesuperiori"]}
                  >
                    <TwitterIcon size={32} round />
                  </TwitterShareButton>
                  <WhatsappShareButton url={curUrl} title={socialTitle}>
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                  <TelegramShareButton url={curUrl} title={socialTitle}>
                    <TelegramIcon size={32} round />
                  </TelegramShareButton>
                  <EmailShareButton
                    url={curUrl}
                    subject={socialTitle}
                    body={socialBody}
                  >
                    <EmailIcon size={32} round />
                  </EmailShareButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Rankings;

import axios from "axios";
import { it } from "date-fns/locale";
import { Alert, Button, Modal, Spinner, Table, Tabs } from "flowbite-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
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
  WhatsappShareButton
} from "react-share";
import { UserContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import ShareMapBtn from "./ShareMapBtn";

const Rankings = () => {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [stationRankings, setStationRankings] = useState(null);
  const [userRankings, setUserRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function getData() {
      try {
        const { data } = await axios.get(
          id ? `/api/rankings/${id}` : "/api/rankings"
        );
        console.log("event and rankings:", data);
        const { event, rankings } = data;
        if (event) {
          setEvent(event);
        }
        setStationRankings(rankings.stationRankings);
        setUserRankings(rankings.userRankings);
      } catch (err) {
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, [id]);

  const navigate = useNavigate();

  const year = new Date().getFullYear();

  const socialTitle = `Classifiche ${event?.name || year} - VHF e superiori`;
  const socialBody = event
    ? `Classifiche dell'evento ${event.name} - ${formatInTimeZone(
        new Date(event.date),
        "Europe/Rome",
        "dd MMMM yyyy",
        { locale: it }
      )} - VHF e superiori`
    : `Classifiche dell'anno ${year} - VHF e superiori`;

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
            callsignAnywhere: user.callsign
          }
        });
        console.log("QSOs", data);
        data.sort((b, a) => new Date(a.qsoDate) - new Date(b.qsoDate));
        setQsos(data);
      } catch (err) {
        console.log("Errore nel caricamento dei QSO", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });

        setQsos(null);
      }
    }
    getQsos();
  }, [event, id, setAlert, user]);

  const { pathname } = useLocation();
  const curUrl = useMemo(() => {
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  return (
    <>
      <Helmet>
        <title>
          {event ? event.name : `Anno ${year}`} - Classifiche - VHF e superiori
        </title>
      </Helmet>
      <Modal
        position="center"
        show={!!showRankings}
        onClose={() => setShowRankings(null)}
        size="6xl"
      >
        <Modal.Header>
          QSO di <strong>{showRankings}</strong>
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
                      r.fromStation?.callsign) === showRankings
                )
                .map((r) => (
                  <Table striped key={r.callsign}>
                    <Table.Head>
                      <Table.HeadCell>Attivatore</Table.HeadCell>
                      <Table.HeadCell>Nominativo</Table.HeadCell>
                      <Table.HeadCell>Data</Table.HeadCell>
                      <Table.HeadCell>Frequenza</Table.HeadCell>
                      <Table.HeadCell>Modo</Table.HeadCell>
                      <Table.HeadCell>Locatore</Table.HeadCell>
                      <Table.HeadCell>RST</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {r.qsos.map((qso) => (
                        <Table.Row
                          key={qso._id}
                          onClick={() => navigate(`/qso/${qso._id}`)}
                          className="dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Table.Cell>
                            {qso.fromStation?.callsign || "-- errore --"}
                          </Table.Cell>
                          <Table.Cell className="font-semibold">
                            {qso.callsign}
                          </Table.Cell>
                          <Table.Cell>
                            {formatInTimeZone(
                              new Date(qso.qsoDate),
                              "Europe/Rome",
                              "dd/MM/yyyy HH:mm"
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
              Chiudi
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900 -mt-4">
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

          {loading && (
            <ReactPlaceholder
              showLoadingAnimation
              type="text"
              rows={3}
              ready={!!stationRankings && !!userRankings}
            >
              <Spinner />
            </ReactPlaceholder>
          )}

          {/* visualizza classifiche */}
          {stationRankings && userRankings && (
            <div className="w-full flex flex-col gap-4">
              <h1 className="text-3xl md:text-4xl">
                Classifiche {event ? "di" : "dell'anno"}{" "}
                <span className="font-bold">{event ? event.name : year}</span>
                {event && (
                  <>
                    {" - "}
                    {formatInTimeZone(
                      new Date(event.date),
                      "Europe/Rome",
                      "dd/MM/yyyy"
                    )}
                  </>
                )}
              </h1>

              <div className="w-fit mt-8 mx-auto -mb-4">
                <ShareMapBtn
                  event={event}
                  user={user}
                  setAlert={setAlert}
                  qsos={qsos}
                />
              </div>

              {/* <Tabs.Group> */}
              {["Cacciatori", "Attivatori"].map((tab, i) => (
                <Tabs.Item title={tab} key={i}>
                  <h1 className="text-4xl md:text-5xl uppercase text-red-500 font-bold text-center mt-8 mb-8 animate-pulse">
                    Classifica {tab}
                  </h1>
                  {(i === 1 ? stationRankings : userRankings).length > 0 ? (
                    <div className="max-h-[60vh] md:max-h-[80vh] overflow-y-auto">
                      <Table striped className="text-2xl">
                        <Table.Head>
                          <Table.HeadCell>Posizione</Table.HeadCell>
                          <Table.HeadCell>Nominativo</Table.HeadCell>
                          <Table.HeadCell>Punti</Table.HeadCell>
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
                                  {/* show 🥇, 🥈 or 🥉 if r.callsign === rankings[0,1,2].callsign, else i + 1 */}
                                  {["🥇", "🥈", "🥉"][r.position - 1] ||
                                    r.position}
                                </Table.Cell>
                                <Table.Cell className="font-semibold">
                                  {r.callsign}
                                </Table.Cell>
                                <Table.Cell>{r.points}</Table.Cell>
                              </Table.Row>
                            )
                          )}
                        </Table.Body>
                      </Table>
                    </div>
                  ) : (
                    <Alert color="gray" className="text-center">
                      <FaExclamationTriangle className="inline-block mr-1 mb-1" />
                      Nessun collegamento trovato
                    </Alert>
                  )}
                </Tabs.Item>
              ))}
              {/* </Tabs.Group> */}
            </div>
          )}

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

import axios from "axios";
import { Alert, Button, Modal, Spinner, Table, Tabs } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { getErrorStr } from "..";
import Layout from "../Layout";
import { useNavigate, useParams } from "react-router-dom";
import ReactPlaceholder from "react-placeholder";
import { it } from "date-fns/locale";
import {
  FacebookShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TelegramIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon
} from "react-share";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import { FaExclamationTriangle } from "react-icons/fa";
import { Helmet } from "react-helmet";

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
        const { data } = await axios.get(`/api/rankings/${id}`);
        console.log("event and rankings:", data);
        const { event, rankings } = data;
        setEvent(event);
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

  const socialTitle = event && `Classifiche ${event.name} - VHF e superiori`;
  const socialBody =
    event &&
    `Classifiche dell'evento ${event.name} - ${formatInTimeZone(
      new Date(event.date),
      "Europe/Rome",
      "dd MMMM yyyy",
      { locale: it }
    )} - VHF e superiori`;

  const [showRankings, setShowRankings] = useState(null);

  return (
    <Layout>
      <Helmet>
        <title>{event?.name || "Evento"} - Classifiche - VHF e superiori</title>
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
                  r =>
                    r.callsign === showRankings ||
                    (r.fromStationCallsignOverride ||
                      r.fromStation?.callsign) === showRankings
                )
                .map(r => (
                  <Table striped>
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
                      {r.qsos.map(qso => (
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
                          <Table.Cell>{qso.frequency} MHz</Table.Cell>
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
              className="mb-6"
              color={alert.color}
              onDismiss={() =>
                event !== null ? setAlert(null) : navigate("/")
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
              ready={!!event && !!stationRankings && !!userRankings}
            >
              <Spinner />
            </ReactPlaceholder>
          )}

          {/* visualizza classifiche */}
          {event !== null && (
            <div className="w-full flex flex-col gap-4">
              <h1 className="text-3xl md:text-4xl">
                Classifiche di <span className="font-bold">{event.name}</span>
                {" - "}
                {formatInTimeZone(
                  new Date(event.date),
                  "Europe/Rome",
                  "dd/MM/yyyy"
                )}
              </h1>

              {/* <div className="flex flex-col justify-center md:flex-row md:justify-between gap-4">
                <div>
                  <TextInput
                    type="text"
                    placeholder="Cerca per nominativo"
                    icon={FaSearch}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div> */}

              <Tabs.Group>
                {["Cacciatori", "Attivatori"].map((tab, i) => (
                  <Tabs.Item title={tab} key={i}>
                    <h1 className="text-4xl md:text-5xl uppercase text-red-500 font-bold text-center mt-4 mb-8 animate-pulse">
                      Classifica {tab}
                    </h1>
                    {(i === 1 ? stationRankings : userRankings).length > 0 ? (
                      <Table striped className="text-2xl">
                        <Table.Head>
                          <Table.HeadCell>Posizione</Table.HeadCell>
                          <Table.HeadCell>Nominativo</Table.HeadCell>
                          <Table.HeadCell>Punti</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                          {(i === 1 ? stationRankings : userRankings).map(r => (
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
                              <Table.Cell>{r.qsos.length}</Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    ) : (
                      <Alert color="gray" className="text-center">
                        <FaExclamationTriangle className="inline-block mr-1 mb-1" />
                        Nessun collegamento trovato
                      </Alert>
                    )}
                  </Tabs.Item>
                ))}
              </Tabs.Group>
            </div>
          )}

          {/* visualizza immagine QSO */}
          {event !== null && (
            <div className="flex justify-end items-center mt-4 gap-1">
              {event && event.logoUrl && (
                <>
                  <FacebookShareButton
                    url={event.logoUrl}
                    quote={socialTitle}
                    hashtag="#vhfesuperiori"
                  >
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  <TwitterShareButton
                    url={event.logoUrl}
                    title={socialTitle}
                    hashtags={["vhfesuperiori"]}
                  >
                    <TwitterIcon size={32} round />
                  </TwitterShareButton>
                  <WhatsappShareButton url={event.logoUrl} title={socialTitle}>
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                  <TelegramShareButton url={event.logoUrl} title={socialTitle}>
                    <TelegramIcon size={32} round />
                  </TelegramShareButton>
                  <EmailShareButton
                    url={event.logoUrl}
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
    </Layout>
  );
};

export default Rankings;

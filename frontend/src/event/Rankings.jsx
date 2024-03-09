import axios from "axios";
import {
  Alert,
  Button,
  Modal,
  Pagination,
  Spinner,
  Table,
  TextInput
} from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { FaExclamationTriangle, FaSearch } from "react-icons/fa";

const Rankings = () => {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function getData() {
      try {
        const { data } = await axios.get(`/api/rankings/${id}`);
        console.log("event and rankings:", data);
        const { event, rankings } = data;
        setEvent(event);
        setRankings(rankings);
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

  const [rankingsPage, setRankingsPage] = useState(1);
  const rankingsPerPage = 50;
  const [search, setSearch] = useState("");
  const [filteredRankings, setFilteredRankings] = useState(null);
  const [filteredTotPages, setFilteredTotPages] = useState(0);
  const [filteredInterval, setFilteredInterval] = useState([
    0,
    rankingsPerPage
  ]);

  useEffect(() => {
    if (rankings) {
      const filtered = rankings.filter(r =>
        r.callsign.toLowerCase().includes(search.trim().toLowerCase())
      );
      setFilteredRankings(filtered);
      setFilteredTotPages(Math.ceil(filtered.length / rankingsPerPage));

      setRankingsPage(1);
    }
  }, [rankings, search]);

  useEffect(() => {
    setFilteredInterval([
      (rankingsPage - 1) * rankingsPerPage,
      rankingsPage * rankingsPerPage
    ]);
  }, [rankingsPage, filteredRankings]);

  const rankingsToShow = useMemo(() => {
    if (filteredRankings) {
      return filteredRankings.slice(...filteredInterval);
    }
    return [];
  }, [filteredRankings, filteredInterval]);

  // useEffect(() => {
  //   console.log({rankingsPage, filteredTotPages})
  // }, [rankingsPage, filteredTotPages])

  const [showRankings, setShowRankings] = useState(null);

  return (
    <Layout>
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
          <div className="w-full flex flex-col gap-4">
            {rankings &&
              rankings
                .filter(r => r.callsign === showRankings)
                .map(r => (
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Stazione attivatrice</Table.HeadCell>
                      <Table.HeadCell>Data</Table.HeadCell>
                      <Table.HeadCell>Frequenza</Table.HeadCell>
                      <Table.HeadCell>Modo</Table.HeadCell>
                      <Table.HeadCell>Locatore</Table.HeadCell>
                      <Table.HeadCell>RST</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                      {r.qsos.map(qso => (
                        <Table.Row key={qso._id}>
                          <Table.Cell className="font-semibold">
                            {qso.fromStation?.callsign || "-- errore --"}
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
              ready={!!event}
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

              <div className="flex flex-col justify-center md:flex-row md:justify-between gap-4">
                <Pagination
                  className="pagination-ref"
                  showIcons
                  currentPage={rankingsPage}
                  totalPages={filteredTotPages}
                  onPageChange={e => setRankingsPage(e)}
                />
                <div>
                  <TextInput
                    type="text"
                    placeholder="Cerca per nominativo"
                    icon={FaSearch}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {rankingsToShow.length > 0 ? (
                <Table striped>
                  <Table.Head>
                    <Table.HeadCell>Posizione</Table.HeadCell>
                    <Table.HeadCell>Nominativo</Table.HeadCell>
                    <Table.HeadCell>Punti</Table.HeadCell>
                  </Table.Head>
                  <Table.Body>
                    {rankingsToShow.map((r, i) => (
                      <Table.Row
                        key={r.callsign}
                        onClick={() => setShowRankings(r.callsign)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Table.Cell>
                          {rankingsPage === 1
                            ? i === 0
                              ? "🥇 "
                              : i === 1
                              ? "🥈 "
                              : i === 2
                              ? "🥉 "
                              : i + 1
                            : i + 1 + (rankingsPage - 1) * rankingsPerPage}
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
                  Nessun collegamento{" "}
                  {search && (
                    <span>
                      di <strong>{search.toUpperCase()}</strong>
                    </span>
                  )}{" "}
                  trovato
                </Alert>
              )}

              <Pagination
                showIcons
                currentPage={rankingsPage}
                totalPages={filteredTotPages}
                onPageChange={e => setRankingsPage(e)}
              />
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

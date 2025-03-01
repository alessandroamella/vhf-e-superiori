import { useContext, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router";
import { ReadyContext, SplashContext } from "../App";
import Layout from "../Layout";
import Splash from "../Splash";

import FeedCard from "./FeedCard";

import axios from "axios";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Dropdown,
  Label,
  Modal,
  Spinner,
  Table,
  Tooltip
} from "flowbite-react";
import { Helmet } from "react-helmet";
import { FaArrowLeft, FaBackward, FaExternalLinkAlt } from "react-icons/fa";
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

import { MapContainer, Polyline, TileLayer } from "react-leaflet";

import { getDate } from "date-fns";
import ReactPlaceholder from "react-placeholder";
import { getErrorStr } from "../shared";
import CallsignLoading from "../shared/CallsignLoading";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import MapPrint from "../shared/MapPrint";
import StationMapMarker from "../shared/StationMapMarker";

const ViewPublished = () => {
  const { splashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [searchParams, setSearchParams] = useSearchParams();

  const [alert, setAlert] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const { callsign } = useParams();

  const [showMap, setShowMap] = useState(false);
  const [isFakeLoading, setIsFakeLoading] = useState(false);

  useEffect(() => {
    if (isFakeLoading) {
      setTimeout(() => {
        setShowMap(true);
        setIsFakeLoading(false);
        setTimeout(() => {
          document.getElementById("user-map-container")?.scrollIntoView();
        }, 200);
      }, 100 + Math.floor(Math.random() * 900));
    }
  }, [isFakeLoading]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data } = await axios.get("/api/auth/" + callsign);
        console.log("user", data);
        setUser(data);
      } catch (err) {
        console.error(err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } finally {
        setLoaded(true);
      }
    }
    fetchPosts();
  }, [callsign]);

  const [mappedEvents, setMappedEvents] = useState(null);

  const validQsos = useMemo(() => {
    if (!user?.qsos) return null;
    return user.qsos.filter(
      e =>
        e.fromStationLat && e.fromStationLon && e.toStationLat && e.toStationLon
    );
  }, [user]);

  useEffect(() => {
    if (!validQsos) return;
    const events = [...new Set(validQsos.map(e => e.event._id))].map(
      e => validQsos.find(q => q.event._id === e).event
    );
    setMappedEvents(events);
  }, [validQsos]);

  const _eventToFilter = searchParams.get("event");

  const setEventToFilter = _id => {
    if (_id === null) {
      searchParams.delete("event");
    } else {
      searchParams.set("event", _id);
    }
    setSearchParams(searchParams);
    setShowMap(false);
    setIsFakeLoading(true);
  };

  // on start
  useEffect(() => {
    if (searchParams.get("event")) {
      setIsFakeLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qsoPoints = useMemo(() => {
    if (!validQsos) return null;

    const _points = []; // {callsign, locator, lat, lon}[]
    const filtered = validQsos.filter(e =>
      !_eventToFilter ? true : e.event._id === _eventToFilter
    );

    for (const qso of filtered) {
      const from = [qso.fromStationLat, qso.fromStationLon];
      const to = [qso.toStationLat, qso.toStationLon];

      if (from.every(e => !isNaN(e))) {
        _points.push({
          callsign:
            qso.fromStationCallsignOverride ||
            qso.fromStationCallsignOverride ||
            qso.fromStation?.callsign ||
            qso.callsign,
          locator: qso.fromLocator || qso.locator,
          lat: from[0],
          lon: from[1]
        });
      }
      if (to.every(e => !isNaN(e))) {
        _points.push({
          callsign: qso.callsign,
          locator: qso.locator,
          lat: to[0],
          lon: to[1]
        });
      }
    }

    // remove duplicates (same lat and lon)
    const points = _points.filter(
      (e, i, a) => a.findIndex(t => t.lat === e.lat && t.lon === e.lon) === i
    );

    return points;
  }, [_eventToFilter, validQsos]);

  const qsoLines = useMemo(() => {
    if (!validQsos) return null;

    const lines = validQsos
      ?.filter(e => (!_eventToFilter ? true : e.event._id === _eventToFilter))
      .filter(
        e =>
          e.fromStationLat &&
          e.fromStationLon &&
          e.toStationLat &&
          e.toStationLon
      );

    return lines;
  }, [_eventToFilter, validQsos]);

  const showQsosModal = searchParams.get("showQsosModal");
  const setShowQsosModal = show => {
    if (show) {
      searchParams.set("showQsosModal", true);
    } else {
      searchParams.delete("showQsosModal");
    }
    setSearchParams(searchParams);
  };

  // const [showQsosModal, setShowQsosModal] = useState(false);

  const socialTitle = user ? `QSO di ${user?.callsign}` : "Visualizza QSO";
  const socialBody =
    socialTitle +
    " " +
    (validQsos?.length
      ? `Visualizza i ${validQsos?.length} QSO di ${user?.callsign}`
      : "Visualizza tutti i QSO");

  const location = useLocation();
  const curUrl = "https://" + window.location.hostname + location.pathname;

  return (
    <Layout>
      <Helmet>
        <title>{user?.callsign || callsign} - VHF e superiori</title>
      </Helmet>
      {!splashPlayed && <Splash ready={ready} />}

      <Modal
        position="center"
        size="7xl"
        show={showQsosModal}
        onClose={() => setShowQsosModal(false)}
      >
        <Modal.Header>
          <CallsignLoading
            prefix="QSO di"
            user={user}
            className="font-bold"
            suffix={
              validQsos && (
                <span>
                  {" "}
                  (<strong>{validQsos.length}</strong> registrati)
                </span>
              )
            }
          />
        </Modal.Header>
        <Modal.Body>
          <div className="max-h-[69vh] -m-6 overflow-y-auto">
            <Table striped>
              <Table.Head>
                <Table.HeadCell className="hidden md:block">
                  Numero
                </Table.HeadCell>
                <Table.HeadCell>Attivatore</Table.HeadCell>
                <Table.HeadCell>Nominativo</Table.HeadCell>
                <Table.HeadCell>Data</Table.HeadCell>
                <Table.HeadCell>Banda</Table.HeadCell>
                <Table.HeadCell>Modo</Table.HeadCell>
                <Table.HeadCell>Locatore</Table.HeadCell>
                <Table.HeadCell>RST</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {validQsos?.map((qso, i) => (
                  <Table.Row
                    key={qso._id}
                    onClick={() => navigate(`/qso/${qso._id}`)}
                    className="dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Table.Cell className="font-light hidden md:block">
                      {i + 1}
                    </Table.Cell>
                    <Table.Cell
                      className={
                        (qso.fromStationCallsignOverride ||
                          qso.fromStation?.callsign) &&
                        user?.callsign &&
                        (
                          qso.fromStationCallsignOverride ||
                          qso.fromStation?.callsign ||
                          ""
                        ).includes(user?.callsign)
                          ? "font-bold"
                          : ""
                      }
                    >
                      {qso.fromStationCallsignOverride ||
                        qso.fromStation?.callsign || (
                          <span className="text-red-500">--</span>
                        )}
                    </Table.Cell>
                    <Table.Cell
                      className={
                        qso.callsign &&
                        user?.callsign &&
                        qso.callsign.includes(user?.callsign)
                          ? "font-bold"
                          : ""
                      }
                    >
                      {qso.callsign}
                    </Table.Cell>
                    <Table.Cell>
                      {formatInTimeZone(
                        new Date(qso.qsoDate),
                        "Europe/Rome",
                        "dd/MM/yyyy HH:mm"
                      )}
                    </Table.Cell>
                    <Table.Cell>{qso.band || qso.frequency}</Table.Cell>
                    <Table.Cell>{qso.mode}</Table.Cell>
                    <Table.Cell>{qso.locator}</Table.Cell>
                    <Table.Cell>{qso.rst}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="w-full flex justify-center gap-2">
            <Button
              color="gray"
              type="button"
              onClick={() => setShowQsosModal(false)}
            >
              Chiudi
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <div className="px-0 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        {alert && (
          <Alert
            className="mb-6 dark:text-black"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        {searchParams?.get("created") && (
          <Alert
            className="mb-6 dark:text-black"
            color="success"
            onDismiss={() => navigate("/social")}
          >
            <p>
              Post{" "}
              <span className="font-semibold">
                {searchParams?.get("created")}
              </span>{" "}
              creato con successo!
            </p>
            {/* <p>Dovrà essere approvato prima di essere visibile pubblicamente</p> */}
          </Alert>
        )}
        <Button className="mb-4" onClick={() => navigate(-1)}>
          <FaBackward />
        </Button>

        <Button
          onClick={() => navigate("new")}
          // className="flex rounded-full w-16 h-16 aspect-square items-center fixed bottom-8 right-8 z-40"
          className="flex rounded-full uppercase items-center fixed bottom-8 right-8 z-40"
        >
          <Link to="new" className="text-xl text-white font-bold">
            {/* <FaPlus /> */}
            Inserisci foto / video
          </Link>
          {/* <span className="ml-1">Nuovo post</span> */}
        </Button>

        <div className="col-span-2">
          {user?.callsign && (
            // card of user
            <div className="flex w-full justify-center">
              <Card className="bg-gray-50 dark:bg-gray-600 md:px-12 mb-8 md:mb-0">
                <div className="flex gap-4 items-center flex-row justify-center w-full">
                  <Avatar size="lg" img={user?.pp} alt="Profile" />
                  <div className="flex flex-col gap-0">
                    <CallsignLoading
                      user={user}
                      className="font-bold text-lg"
                    />
                    <p>{user?.name}</p>
                    {user?.createdAt && (
                      <p className="text-gray-500 dark:text-gray-300 text-sm">
                        Membro dal
                        {[1, 8].includes(getDate(new Date(user.createdAt)))
                          ? "l'"
                          : " "}
                        {formatInTimeZone(
                          user.createdAt,
                          "Europe/Rome",
                          "d MMMM yyyy"
                        )}
                      </p>
                    )}
                    <a
                      href={`https://www.qrz.com/db/${user.callsign}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      qrz.com/{user.callsign}
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          )}
          {loaded ? (
            <div>
              {user?.posts ? (
                <div className="p-0 md:p-5 gap-2 grid grid-cols-1 md:grid-cols-2">
                  {user.posts.map(p => (
                    <FeedCard
                      setAlert={setAlert}
                      key={p._id}
                      post={p}
                      pp={user.pp}
                      posts={user.posts}
                      setPosts={user.setPosts}
                    />
                  ))}
                </div>
              ) : (
                <></>
              )}
              {!showMap && (
                <div className="my-2 flex justify-center">
                  {user ? (
                    <Button
                      onClick={() => setIsFakeLoading(true)}
                      size="lg"
                      disabled={isFakeLoading}
                    >
                      Crea mappa
                      {isFakeLoading && (
                        <Spinner className="ml-1 dark:text-white dark:fill-white" />
                      )}
                    </Button>
                  ) : (
                    <Tooltip
                      content={`Non ci sono QSO registrati con nominativo ${callsign}`}
                    >
                      <Button size="lg" disabled>
                        Crea mappa
                      </Button>
                    </Tooltip>
                  )}
                </div>
              )}
              <ReactPlaceholder
                showLoadingAnimation
                type="rect"
                className="w-full h-96"
                rows={10}
                ready={!isFakeLoading}
              />
              {user && showMap ? (
                <div
                  id="user-map-container"
                  className="drop-shadow-lg flex flex-col items-center gap-2 relative"
                >
                  <div className="border-y w-full flex flex-col md:flex-row justify-center items-end gap-6 py-2">
                    <div>
                      <Label
                        htmlFor="filterByEvent"
                        value="Filtra per evento"
                      />
                      <Dropdown
                        label={
                          (
                            _eventToFilter &&
                            validQsos?.find(e => e.event._id === _eventToFilter)
                          )?.event?.name || "Tutti i miei QSO"
                        }
                        id="filterByEvent"
                        className="w-full z-50"
                        required
                        color="light"
                      >
                        <Dropdown.Item onClick={() => setEventToFilter(null)}>
                          Tutti ({validQsos?.length})
                        </Dropdown.Item>
                        {mappedEvents?.map(e => (
                          <Dropdown.Item
                            key={e._id}
                            onClick={() => setEventToFilter(e._id)}
                          >
                            {e.name} (
                            {
                              validQsos?.filter(q => q.event._id === e._id)
                                ?.length
                            }
                            )
                          </Dropdown.Item>
                        ))}
                      </Dropdown>
                    </div>
                    <Button onClick={() => setShowQsosModal(true)}>
                      <FaExternalLinkAlt className="inline mr-1" />
                      <span className="mr-1">Visualizza QSO di</span>{" "}
                      <CallsignLoading user={user} />
                    </Button>
                  </div>
                  {qsoLines && qsoLines.length > 0 ? (
                    <>
                      <MapContainer center={[41.895643, 12.4831082]} zoom={5}>
                        <MapPrint
                          position="topleft"
                          sizeModes={["A4Portrait", "A4Landscape"]}
                          hideControlContainer={false}
                          title="Print"
                          exportOnly
                          filename={`mappa-${user.callsign.toLowerCase()}`}
                        />

                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {qsoPoints?.map((point, i) => (
                          <StationMapMarker
                            key={i}
                            callsign={point.callsign}
                            locator={point.locator}
                            lat={point.lat}
                            lon={point.lon}
                            iconRescaleFactor={0.69}
                          />
                        ))}

                        {qsoLines?.map(line => (
                          <Polyline
                            key={line._id}
                            positions={[
                              [line.fromStationLat, line.fromStationLon],
                              [line.toStationLat, line.toStationLon]
                            ]}
                            color="blue"
                            weight={2} // make a bit thinner
                          />
                        ))}
                      </MapContainer>
                      <div className="flex items-center gap-1 w-full mt-2 justify-center md:justify-end">
                        <div className="flex items-center gap-1 w-full mt-2 justify-center md:justify-end">
                          {/* <Button onClick={() => setExportMap(true)}>
                            Condividi
                          </Button> */}
                          {/* Share buttons */}
                        </div>

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
                      </div>
                    </>
                  ) : (
                    <Card className="mt-4">
                      <div className="flex flex-col items-center gap-4">
                        <p>
                          Nessun QSO registato con nominativo {user?.callsign}
                          {_eventToFilter && (
                            <span>
                              {" "}
                              per l&apos;evento{" "}
                              <strong>
                                {
                                  mappedEvents?.find(
                                    e => e._id === _eventToFilter
                                  )?.name
                                }
                              </strong>
                            </span>
                          )}
                        </p>
                        <Button onClick={() => setEventToFilter(null)}>
                          <FaArrowLeft className="inline mr-1" />
                          Torna alla mappa senza filtro
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <></>
              )}
            </div>
          ) : (
            <div className="p-5">
              {[...Array(10).keys()].map(e => (
                <FeedCard key={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ViewPublished;

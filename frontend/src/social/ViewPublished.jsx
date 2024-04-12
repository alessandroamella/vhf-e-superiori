import Layout from "../Layout";
import React, { useEffect, useMemo, useState } from "react";
import { ReadyContext, SplashContext, getErrorStr } from "..";
import { useContext } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import Splash from "../Splash";

import "react-medium-image-zoom/dist/styles.css";
import FeedCard from "./FeedCard";

import "react-placeholder/lib/reactPlaceholder.css";
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
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import StationMapMarker from "../shared/StationMapMarker";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import { getDate } from "date-fns";
import MapWatermark from "../shared/MapWatermark";
import ReactPlaceholder from "react-placeholder";

const CallsignLoading = ({ user }) => {
  return (
    <ReactPlaceholder showLoadingAnimation type="text" ready={!!user?.callsign}>
      {user?.callsign}
    </ReactPlaceholder>
  );
};

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

  const [userLatLon, setUserLatLon] = useState(null);
  const qsosToShow = useMemo(() => {
    if (!user) return;
    const pushedQsos = [];
    let _userLatLon;
    user.qsos.forEach(qso => {
      if (!qso?.fromStation?.callsign) {
        console.log("No qso.fromStation.callsign in qso", qso);
        return;
      }
      const isFromUser = qso.fromStation.callsign.includes(user.callsign);

      const lats = [qso.fromStationLat, qso.toStationLat];
      const lons = [qso.fromStationLon, qso.toStationLon];
      const locators = [qso.fromLocator, qso.toLocator];
      const callsigns = [qso.fromStation?.callsign, qso.callsign];

      if (!isFromUser) {
        lats.reverse();
        lons.reverse();
        locators.reverse();
        callsigns.reverse();
      }

      if (lats[0] && lons[0] && !_userLatLon) {
        _userLatLon = [lats[0], lons[0], locators[0]];
      }

      if (!lats[1] || !lons[1]) return;

      pushedQsos.push({
        ...qso,
        fromStationLat: lats[0],
        fromStationLon: lons[0],
        fromLocator: locators[0],
        toStationLat: lats[1],
        toStationLon: lons[1],
        toLocator: locators[1],

        callsign: callsigns[1]
      });
    });
    console.log("qsos to show:", pushedQsos);

    if (!userLatLon && _userLatLon) {
      setUserLatLon(_userLatLon);
    }

    return pushedQsos;
  }, [user, userLatLon]);

  const [mappedEvents, setMappedEvents] = useState(null);

  useEffect(() => {
    if (!qsosToShow) return;
    const events = [...new Set(qsosToShow.map(e => e.event._id))].map(
      e => qsosToShow.find(q => q.event._id === e).event
    );
    setMappedEvents(events);
  }, [qsosToShow]);

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

  console.log(
    "_eventToFilter",
    _eventToFilter,
    "qsostoshow",
    qsosToShow?.filter(e =>
      !_eventToFilter ? true : e.event._id === _eventToFilter
    ).length
  );

  const mappedQsosToShow = useMemo(
    () =>
      qsosToShow?.filter(e =>
        !_eventToFilter ? true : e.event._id === _eventToFilter
      ),
    [_eventToFilter, qsosToShow]
  );

  const [showQsosModal, setShowQsosModal] = useState(false);

  const socialTitle = user ? `QSO di ${user?.callsign}` : "Visualizza QSO";
  const socialBody =
    socialTitle +
    " " +
    (user?.qsos?.length
      ? `Visualizza i ${user?.qsos?.length} QSO di ${user?.callsign}`
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
          QSO di <CallsignLoading user={user} />
          {user?.qsos && (
            <span>
              {" "}
              (<strong>{user.qsos.length}</strong> registrati)
            </span>
          )}
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
                {user?.qsos.map((qso, i) => (
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
                        qso.fromStation?.callsign &&
                        user?.callsign &&
                        qso.fromStation?.callsign.includes(user?.callsign)
                          ? "font-bold"
                          : ""
                      }
                    >
                      {qso.fromStation?.callsign || (
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
            className="mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        {searchParams?.get("created") && (
          <Alert
            className="mb-6"
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
          <FaArrowLeft />
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
                    <h2 className="font-bold text-xl">{user.callsign}</h2>
                    <p>{user?.name}</p>
                    {user?.createdAt && (
                      <p className="text-gray-500 text-sm">
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
                  {qsosToShow && userLatLon ? (
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
                    <Tooltip content="Non ci sono QSO registrati col tuo nominativo">
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
              {qsosToShow && userLatLon && showMap ? (
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
                            qsosToShow.find(e => e.event._id === _eventToFilter)
                          )?.event?.name || "Tutti i miei QSO"
                        }
                        id="filterByEvent"
                        className="w-full z-50"
                        required
                        color="light"
                      >
                        <Dropdown.Item onClick={() => setEventToFilter(null)}>
                          Tutti
                        </Dropdown.Item>
                        {mappedEvents?.map(e => (
                          <Dropdown.Item
                            key={e._id}
                            onClick={() => setEventToFilter(e._id)}
                          >
                            {e.name}
                          </Dropdown.Item>
                        ))}
                      </Dropdown>
                    </div>
                    <Button onClick={() => setShowQsosModal(true)}>
                      <FaExternalLinkAlt className="inline mr-1" />
                      Visualizza QSO di <CallsignLoading user={user} />
                    </Button>
                  </div>
                  {mappedQsosToShow && mappedQsosToShow.length > 0 ? (
                    <>
                      <MapContainer center={[41.895643, 12.4831082]} zoom={5}>
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        <StationMapMarker
                          callsign={user.callsign}
                          lat={userLatLon[0]}
                          lon={userLatLon[1]}
                          locator={userLatLon[2]}
                        />
                        {mappedQsosToShow?.map(qso => (
                          <React.Fragment key={qso._id}>
                            <Polyline
                              positions={[
                                [userLatLon[0], userLatLon[1]],
                                [qso.toStationLat, qso.toStationLon]
                              ]}
                              color="blue"
                            />
                            <StationMapMarker
                              key={qso._id}
                              callsign={qso.callsign}
                              lat={qso.toStationLat}
                              lon={qso.toStationLon}
                              locator={qso.toLocator}
                              createUrl={
                                qso.isRegistered &&
                                qso.callsign !== user.callsign
                              }
                            />
                          </React.Fragment>
                        ))}

                        <MapWatermark />
                      </MapContainer>
                      <div className="flex items-center gap-1 w-full mt-2 justify-center md:justify-end">
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
                    <Card>
                      <p>
                        Nessun QSO registato con nominativo {user?.callsign}
                      </p>
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

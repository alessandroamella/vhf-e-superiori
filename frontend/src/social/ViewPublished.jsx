import Layout from "../Layout";
import { useEffect, useMemo, useState } from "react";
import { ReadyContext, SplashContext, getErrorStr } from "..";
import { useContext } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import Splash from "../Splash";

import "react-medium-image-zoom/dist/styles.css";
import FeedCard from "./FeedCard";

import "react-placeholder/lib/reactPlaceholder.css";
import axios from "axios";
import { Alert, Avatar, Button, Card } from "flowbite-react";
import { FaArrowLeft } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import StationMapMarker from "../shared/StationMapMarker";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import { getDate } from "date-fns";

const ViewPublished = () => {
  const { splashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [searchParams] = useSearchParams();

  const [alert, setAlert] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const { callsign } = useParams();

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
      const isFromUser = qso.fromStation.callsign === user.callsign;

      const lats = [qso.fromStationLat, qso.toStationLat];
      const lons = [qso.fromStationLon, qso.toStationLon];
      const locators = [qso.fromLocator, qso.toLocator];

      if (!isFromUser) {
        lats.reverse();
        lons.reverse();
        locators.reverse();
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
        toLocator: locators[1]
      });
    });
    console.log("qsos to show:", pushedQsos);

    if (!userLatLon && _userLatLon) {
      setUserLatLon(_userLatLon);
    }

    return pushedQsos;
  }, [user, userLatLon]);

  return (
    <Layout>
      <Helmet>
        <title>{user?.callsign || callsign} - VHF e superiori</title>
      </Helmet>
      {!splashPlayed && <Splash ready={ready} />}

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
              <Card className="bg-gray-50 dark:bg-gray-600 md:px-12">
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
                <div className="p-0 md:p-5 grid grid-cols-1 md:grid-cols-2">
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
              {qsosToShow && userLatLon ? (
                <div className="drop-shadow-lg flex justify-center">
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
                    {qsosToShow.map(qso => (
                      <>
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
                            qso.isRegistered && qso.callsign !== user.callsign
                          }
                        />
                      </>
                    ))}
                  </MapContainer>
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

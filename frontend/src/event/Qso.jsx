import axios from "axios";
import { Alert, Button, Table } from "flowbite-react";
import React, { useEffect, useMemo, useState } from "react";
import { getErrorStr } from "..";
import Layout from "../Layout";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlaceholder from "react-placeholder";
import Zoom from "react-medium-image-zoom";
import { Card } from "@material-tailwind/react";
import { FaHome, FaInfoCircle } from "react-icons/fa";
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
import { Helmet } from "react-helmet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap
} from "react-leaflet";
import L, { latLngBounds } from "leaflet";

/*
{
_id: "65b5a20e7c0494ddfae021ec",
fromStation: {
_id: "6411a662b9a8fb81079d54b8",
callsign: "IU4QSG"
},
callsign: "IU4LAU",
event: {
_id: "645903e1b898537ef29664e7",
name: "Radio flash mob 22",
date: "2024-02-21T09:00:00.000Z"
},
frequency: 123.123,
mode: "SSB",
qsoDate: "2024-01-28T00:38:00.000Z",
imageHref: "https://vhfesuperiori.s3.eu-central-1.amazonaws.com/eqsl/6411a662b9a8fb81079d54b8-1706967067926-4d043e5087ab2b21.jpeg"
}
*/

function ChangeView({ center, markers }) {
  const map = useMap();
  map.setView({ lng: center.lon, lat: center.lat }, 5);

  let markerBounds = latLngBounds([]);
  if (markers.length && markers.length > 0) {
    markers.forEach(marker => {
      markerBounds.extend([marker.lat, marker.lon]);
    });
    map.fitBounds(markerBounds);
  }
  return null;
}

const Qso = () => {
  const { id } = useParams();

  const [qso, setQso] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function getQso() {
      try {
        const { data } = await axios.get("/api/qso/" + id);
        console.log("qso", data);
        setQso(data);
      } catch (err) {
        console.log("Errore nel caricamento dell'evento", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        setQso(null);
      }
    }
    getQso();
  }, [id]);

  const navigate = useNavigate();

  const socialTitle = qso && `QSO ${qso?.callsign} - ${qso?.event?.name}`;
  const socialBody =
    qso &&
    `QSO ${qso?.callsign} - ${qso?.fromStation?.callsign} - ${qso?.event?.name} - ${qso?.qsoDate} UTC - ${qso?.frequency} MHz - ${qso?.mode} - VHF e superiori`;

  const icon = useMemo(
    () =>
      L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-shadow.png"
      }),
    []
  );

  return (
    <Layout>
      <Helmet>
        <title>{socialTitle || "QSO"} - VHF e superiori</title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900 -mt-4">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          {alert && (
            <Alert
              className="mb-6"
              color={alert.color}
              onDismiss={() => (qso !== null ? setAlert(null) : navigate("/"))}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          {/* visualizza immagine QSO */}
          {qso !== null && (
            <div className="flex flex-col gap-8">
              <div>
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={3}
                  ready={!!qso}
                >
                  <h1 className="text-3xl text-center mb-6">
                    QSO di <strong>{qso?.callsign}</strong>
                    {" - "}
                    {qso?.event?.name}
                  </h1>
                  <Card>
                    <Table>
                      <Table.Head>
                        <Table.HeadCell>Evento</Table.HeadCell>
                        <Table.HeadCell>Nominativo</Table.HeadCell>
                        <Table.HeadCell>Stazione</Table.HeadCell>
                        <Table.HeadCell>Data</Table.HeadCell>
                        <Table.HeadCell>Frequenza</Table.HeadCell>
                        <Table.HeadCell>Modo</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        <Table.Row className="dark:text-white dark:bg-gray-800">
                          <Table.Cell>{qso?.event?.name}</Table.Cell>
                          <Table.Cell>{qso?.callsign}</Table.Cell>
                          <Table.Cell>{qso?.fromStation?.callsign}</Table.Cell>
                          <Table.Cell>
                            {qso?.qsoDate &&
                              formatInTimeZone(
                                new Date(qso.qsoDate),
                                "UTC",
                                "dd/MM/yyyy HH:mm"
                              )}{" "}
                            UTC
                          </Table.Cell>
                          <Table.Cell>{qso?.frequency} MHz</Table.Cell>
                          <Table.Cell>{qso?.mode}</Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  </Card>
                </ReactPlaceholder>
              </div>

              <ReactPlaceholder
                showLoadingAnimation
                type="media"
                rows={3}
                ready={!!qso}
              >
                {qso?.imageHref && (
                  <>
                    <Zoom>
                      <LazyLoadImage
                        className="w-full h-full object-contain shadow-xl mx-auto"
                        src={qso?.imageHref}
                        alt="QSO"
                      />
                    </Zoom>
                    {/* share */}
                    <div className="flex justify-end items-center mt-4 gap-1">
                      {qso && (
                        <>
                          <FacebookShareButton
                            url={qso.imageHref}
                            quote={socialTitle}
                            hashtag="#vhfesuperiori"
                          >
                            <FacebookIcon size={32} round />
                          </FacebookShareButton>
                          <TwitterShareButton
                            url={qso.imageHref}
                            title={socialTitle}
                            hashtags={["vhfesuperiori"]}
                          >
                            <TwitterIcon size={32} round />
                          </TwitterShareButton>
                          <WhatsappShareButton
                            url={qso.imageHref}
                            title={socialTitle}
                          >
                            <WhatsappIcon size={32} round />
                          </WhatsappShareButton>
                          <TelegramShareButton
                            url={qso.imageHref}
                            title={socialTitle}
                          >
                            <TelegramIcon size={32} round />
                          </TelegramShareButton>
                          <EmailShareButton
                            url={qso.imageHref}
                            subject={socialTitle}
                            body={socialBody}
                          >
                            <EmailIcon size={32} round />
                          </EmailShareButton>
                        </>
                      )}
                    </div>
                  </>
                )}
              </ReactPlaceholder>

              {qso &&
              qso.fromStationLat &&
              qso.fromStationLon &&
              qso.toStationLat &&
              qso.toStationLon ? (
                <div className="drop-shadow-lg flex justify-center">
                  <MapContainer
                    center={[qso.fromStationLat, qso.fromStationLon]}
                    zoom={5}
                  >
                    <ChangeView
                      center={{
                        lat: qso.fromStationLat,
                        lon: qso.fromStationLon
                      }}
                      markers={[
                        { lat: qso.fromStationLat, lon: qso.fromStationLon },
                        { lat: qso.toStationLat, lon: qso.toStationLon }
                      ]}
                    />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Polyline
                      positions={[
                        [qso.fromStationLat, qso.fromStationLon],
                        [qso.toStationLat, qso.toStationLon]
                      ]}
                      color="blue"
                    />

                    <Marker
                      position={[qso.fromStationLat, qso.fromStationLon]}
                      icon={icon}
                    >
                      <Popup>
                        <div className="text-center">
                          <h3>{qso.fromStation?.callsign}</h3>
                          <p>
                            {qso.fromStationLat}, {qso.fromStationLon}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    <Marker
                      position={[qso.toStationLat, qso.toStationLon]}
                      icon={icon}
                    >
                      <Popup>
                        <div>
                          <h3>{qso.callsign}</h3>
                          <p>
                            {qso.toStationLat}, {qso.toStationLon}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <Alert color="warning">
                  <div className="flex items-center gap-2">
                    <FaInfoCircle />
                    <span>Coordinate non disponibili</span>
                  </div>
                </Alert>
              )}

              {qso && (
                <div className="mt-8 text-lg">
                  Grazie <span className="font-bold">{qso?.callsign}</span> per
                  aver partecipato all'evento{" "}
                  <span className="font-bold">{qso?.event?.name}</span>!
                  <Link to="/">
                    <Button>
                      <FaHome />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Qso;

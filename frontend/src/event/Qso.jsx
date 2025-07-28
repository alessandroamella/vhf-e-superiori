import { Card } from "@material-tailwind/react";
import axios from "axios";
import { Alert, Button, Table } from "flowbite-react";
import { latLngBounds } from "leaflet";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { FaBackward, FaHome, FaInfoCircle } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import Zoom from "react-medium-image-zoom";
import ReactPlaceholder from "react-placeholder";
import { Link, useNavigate, useParams } from "react-router";
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
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import MapWatermark from "../shared/MapWatermark";
import StationMapMarker from "../shared/StationMapMarker";

function ChangeView({ center, markers }) {
  const map = useMap();
  map.setView({ lng: center.lon, lat: center.lat }, 5);

  let markerBounds = latLngBounds([]);
  if (markers.length && markers.length > 0) {
    markers.forEach((marker) => {
      markerBounds.extend([marker.lat, marker.lon]);
    });
    map.fitBounds(markerBounds);
  }

  return null;
}

ChangeView.propTypes = {
  center: PropTypes.object,
  markers: PropTypes.array,
};

const Qso = () => {
  const { id } = useParams();

  const [qso, setQso] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function getQso() {
      try {
        const { data } = await axios.get("/api/qso/" + id);
        console.log("qso", data);
        if (!data || !data?.callsign) {
          throw new Error("QSO non trovato");
        }
        setQso(data);
      } catch (err) {
        console.log(
          "Errore nel caricamento dell'evento",
          err?.response?.data || err,
        );
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err || err),
        });
        setQso(null);
      }
    }
    getQso();
  }, [id]);

  const navigate = useNavigate();

  const fromCallsign =
    qso?.fromStationCallsignOverride || qso?.fromStation?.callsign;

  const socialTitle = qso && `QSO ${qso?.callsign} - ${qso?.event?.name}`;
  const socialBody =
    qso &&
    `QSO ${qso?.callsign} - ${fromCallsign} - ${qso?.event?.name} - ${qso?.qsoDate} UTC - ${qso?.frequency} MHz - ${qso?.mode} - VHF e superiori`;

  return (
    <>
      <Helmet>
        <title>{socialTitle || "QSO"} - VHF e superiori</title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          <div className="mb-4 md:-ml-4 md:-mt-4">
            <Link to={-1}>
              <Button color="gray" outline>
                <FaBackward />
              </Button>
            </Link>
          </div>
          {alert && (
            <Alert
              className="mb-6 dark:text-black"
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
                        <Table.HeadCell>Banda</Table.HeadCell>
                        <Table.HeadCell>Modo</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        <Table.Row className="dark:text-white dark:bg-gray-800">
                          <Table.Cell>{qso?.event?.name}</Table.Cell>
                          <Table.Cell>{qso?.callsign}</Table.Cell>
                          <Table.Cell>{fromCallsign}</Table.Cell>
                          <Table.Cell>
                            {qso?.qsoDate &&
                              formatInTimeZone(
                                new Date(qso.qsoDate),
                                "UTC",
                                "dd/MM/yyyy HH:mm",
                              )}{" "}
                            UTC
                          </Table.Cell>
                          <Table.Cell>{qso?.band || qso?.frequency}</Table.Cell>
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
              qso.fromStation &&
              qso.fromStationLat &&
              qso.fromStationLon &&
              qso.toStationLat &&
              qso.toStationLon ? (
                <div className="drop-shadow-lg flex justify-center relative">
                  <MapContainer
                    center={[qso.fromStationLat, qso.fromStationLon]}
                    zoom={5}
                  >
                    <ChangeView
                      center={{
                        lat: qso.fromStationLat,
                        lon: qso.fromStationLon,
                      }}
                      markers={[
                        { lat: qso.fromStationLat, lon: qso.fromStationLon },
                        { lat: qso.toStationLat, lon: qso.toStationLon },
                      ]}
                    />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Polyline
                      positions={[
                        [qso.fromStationLat, qso.fromStationLon],
                        [qso.toStationLat, qso.toStationLon],
                      ]}
                      color="blue"
                    />

                    <StationMapMarker
                      callsign={fromCallsign}
                      lat={qso.fromStationLat}
                      lon={qso.fromStationLon}
                      locator={qso.fromLocator}
                    />
                    <StationMapMarker
                      callsign={qso.callsign}
                      lat={qso.toStationLat}
                      lon={qso.toStationLon}
                      locator={qso.toLocator}
                    />

                    <MapWatermark />
                  </MapContainer>
                </div>
              ) : (
                <Alert color="warning">
                  <div className="flex items-center gap-2">
                    <FaInfoCircle />
                    <span>
                      Purtroppo non è possibile creare la mappa in quanto non
                      sono disponibili le coordinate del QSO
                    </span>
                  </div>
                </Alert>
              )}

              {qso && (
                <div className="mt-8 text-lg">
                  Grazie <span className="font-bold">{qso?.callsign}</span> per
                  aver partecipato all&apos;evento{" "}
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
    </>
  );
};

export default Qso;

import axios from "axios";
import { Alert, Button, Card, Pagination, Tooltip } from "flowbite-react";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import {
  FaBackward,
  FaCheckCircle,
  FaInfoCircle,
  FaPen,
  FaTrash,
} from "react-icons/fa";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import ReactPlaceholder from "react-placeholder";
import { Link, useNavigate, useParams } from "react-router";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import MapWatermark from "../shared/MapWatermark";
import useUserStore from "../stores/userStore";

const ViewBeacon = () => {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  const [beacon, setBeacon] = useState(null);
  const [_properties, setProperties] = useState(null);
  const [propIndex, setPropIndex] = useState(0);

  const properties = _properties ? _properties[propIndex] : null;

  const { id } = useParams();

  const icon = useMemo(
    () =>
      L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: "/mapicon/marker-icon.png",
        shadowUrl: "/mapicon/marker-shadow.png",
      }),
    [],
  );

  useEffect(() => {
    if (beacon) return;

    async function getBeacon() {
      try {
        const { data } = await axios.get(`/api/beacon/${id}`);
        console.log("beacon", data);
        setBeacon(data);
        setProperties(data.properties);
        setPropIndex(data.properties.length - 1);
      } catch (err) {
        console.log("Errore nel caricamento del beacon", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setLoading(false);
      }
    }
    getBeacon();
  }, [beacon, id]);

  const user = useUserStore((store) => store.user);

  const navigate = useNavigate();

  async function deleteBeacon(id) {
    const confirmText =
      _properties.length === 1
        ? t("beaconViewer.deleteConfirmation.single", {
            count: _properties.length,
          })
        : t("beaconViewer.deleteConfirmation.plural", {
            count: _properties.length || "-",
          });

    const confirm = window.confirm(confirmText);
    if (!confirm) return;

    try {
      await axios.delete(`/api/beacon/${id}`);
      navigate("/beacon");
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    }
  }

  const [disabled, setDisabled] = useState(false);

  async function deleteEdit(properties) {
    const { _id, editAuthor } = properties;
    const confirm = window.confirm(
      t("beaconViewer.deleteEditConfirmation", {
        author: editAuthor?.callsign,
      }),
    );
    if (!confirm) return;

    setDisabled(true);

    try {
      await axios.delete(`/api/beacon/property/${_id}`);
      setProperties(_properties.filter((p) => p._id !== _id));
      setPropIndex(0);
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDisabled(false);
    }
  }

  async function approveEdit(properties) {
    const { _id, editAuthor } = properties;
    const confirm = window.confirm(
      t("beaconViewer.approveEditConfirmation", {
        author: editAuthor?.callsign,
      }),
    );
    if (!confirm) return;

    setDisabled(true);

    try {
      await axios.put(`/api/beacon/approve/${_id}`);
      const { data } = await axios.get(`/api/beacon/${id}`);
      setProperties(data.properties);
      setPropIndex(data.properties.length - 1);
    } catch (err) {
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {t("beaconViewer.pageTitle", { callsign: beacon?.callsign || "" })}
        </title>
      </Helmet>
      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900">
        <div className="mx-auto px-4 w-full md:w-5/6 py-12">
          <div className="mb-4 md:-ml-4 md:-mt-4">
            <Link to={"/beacon"}>
              <Button color="gray" outline>
                <FaBackward />
              </Button>
            </Link>
          </div>

          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}

          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={3}
            ready={!loading}
          >
            {beacon && properties && (
              <>
                <h1 className="text-3xl md:text-4xl text-center font-bold mb-4">
                  {t("beaconViewer.header", { callsign: beacon.callsign })}
                </h1>

                <div className="flex flex-col md:flex-row md:justify-between mb-4">
                  <div className="flex gap-1">
                    <Link to={`/beacon/editor?id=${beacon._id}`}>
                      <Button color="light">
                        <FaPen className="inline mr-2" />
                        {t("beaconViewer.editButton")}
                      </Button>
                    </Link>
                    {user?.isAdmin && (
                      <Tooltip content={t("beaconViewer.adminTooltip")}>
                        <Button
                          color="failure"
                          onClick={() => deleteBeacon(beacon._id)}
                        >
                          <FaTrash className="inline mr-2" />
                          {t("beaconViewer.deleteBeaconButton")}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                  {_properties.length !== 1 && (
                    <div className="flex gap-1 justify-center items-center">
                      <p className="text-gray-600 dark:text-gray-200 -mr-8 mb-2">
                        {t("beaconViewer.historyLabel")}
                      </p>
                      <Pagination
                        currentPage={propIndex + 1}
                        totalPages={_properties.length}
                        onPageChange={(p) => setPropIndex(p - 1)}
                      />
                    </div>
                  )}
                </div>

                <Card className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p>
                        <strong>{t("beaconViewer.callsignLabel")}:</strong>{" "}
                        {beacon.callsign}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.nameLabel")}:</strong>{" "}
                        {properties.name}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.frequencyLabel")}:</strong>{" "}
                        {properties.frequency.toFixed(3)} MHz
                      </p>
                      <p>
                        <strong>{t("beaconViewer.antennaLabel")}:</strong>{" "}
                        {properties.antenna}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.powerLabel")}:</strong>{" "}
                        {properties.power}W
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>{t("beaconViewer.qthLabel")}:</strong>{" "}
                        {properties.qthStr}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.locatorLabel")}:</strong>{" "}
                        {properties.locator}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.altitudeLabel")}:</strong>{" "}
                        {properties.hamsl}m
                      </p>
                      <p>
                        <strong>{t("beaconViewer.modeLabel")}:</strong>{" "}
                        {properties.mode}
                      </p>
                      <p>
                        <strong>{t("beaconViewer.qtfLabel")}:</strong>{" "}
                        {properties.qtf}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 md:justify-between">
                    <Alert
                      className="w-fit"
                      color={properties.verifiedBy ? "success" : "warning"}
                    >
                      <div className="flex flex-col md:flex-row md:justify-around">
                        <div>
                          {properties.verifiedBy ? (
                            <span>✅ </span>
                          ) : (
                            <FaInfoCircle className="inline mr-2 mb-[2px]" />
                          )}
                          {t("beaconViewer.changesByText")}
                          <Link
                            className="font-bold"
                            to={`/u/${properties.editAuthor.callsign}`}
                          >
                            {properties.editAuthor.callsign}
                          </Link>{" "}
                          {t("beaconViewer.onDateText")}{" "}
                          {formatInTimeZone(
                            new Date(properties.editDate),
                            "Europe/Rome",
                            `dd/MM/yyyy '${t("beaconViewer.atTimeText")}' HH:mm`,
                          )}
                        </div>
                      </div>
                    </Alert>
                    {user?.isAdmin && (
                      <div className="flex gap-2 items-center">
                        {!properties.verifiedBy && (
                          <Tooltip content={t("beaconViewer.adminTooltip")}>
                            <Button
                              color="warning"
                              disabled={disabled}
                              onClick={() => approveEdit(properties)}
                            >
                              <FaCheckCircle className="inline mr-2" />
                              {t("beaconViewer.approveButton")}
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip
                          content={
                            _properties?.length === 1
                              ? t("beaconViewer.deleteSingleEditTooltip")
                              : t("beaconViewer.adminTooltip")
                          }
                        >
                          <Button
                            color="failure"
                            disabled={_properties?.length === 1 || disabled}
                            onClick={() => deleteEdit(properties)}
                          >
                            <FaTrash className="inline mr-2" />
                            {t("beaconViewer.deleteEditButton")}
                          </Button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </Card>

                {properties.lat && properties.lon && (
                  <div className="drop-shadow-lg flex justify-center relative">
                    <MapContainer
                      center={[properties.lat, properties.lon]}
                      zoom={13}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />

                      <Marker
                        position={[properties.lat, properties.lon]}
                        icon={icon}
                      >
                        <Popup>
                          <p className="m-0 p-0">
                            <strong>{beacon.callsign}</strong>:<br />
                            <span className="text-center">
                              {properties.lat.toFixed(6)},{" "}
                              {properties.lon.toFixed(6)}
                            </span>
                          </p>
                        </Popup>
                      </Marker>

                      <MapWatermark />
                    </MapContainer>
                  </div>
                )}
              </>
            )}
          </ReactPlaceholder>
        </div>
      </div>
    </>
  );
};

export default ViewBeacon;

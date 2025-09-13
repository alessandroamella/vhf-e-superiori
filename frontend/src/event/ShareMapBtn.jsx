import axios from "axios";
import { saveAs } from "file-saver";
import { Button, Spinner } from "flowbite-react";
import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";
import { FaShareAlt, FaWhatsapp } from "react-icons/fa";
import { getErrorStr } from "../shared";

const ShareMapBtn = ({ event, qsos, user, setAlert }) => {
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [mustClickAgain, setMustClickAgain] = useState(false);

  const canShare = useMemo(() => {
    return !!navigator.canShare;
  }, []);

  const shareMap = useCallback(async () => {
    console.log("Getting map of event", event);

    if (!event) return;

    setIsLoadingShare(true);
    setMustClickAgain(false);

    try {
      const { data } = await axios.get(`/api/map/export-map/${event._id}`, {
        responseType: "blob",
      });

      // use share API
      const file = new File(
        [data],
        `mappa-${user?.callsign || "collegamenti"}-${event.name
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase()}.jpg`,
        {
          type: "image/jpeg",
        },
      );
      if ("userActivation" in navigator && !navigator.userActivation.isActive) {
        setMustClickAgain(true);
        return;
      }
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        navigator.share({
          title: `Mappa collegamenti di ${user?.callsign} per ${event.name}`,
          text: `Ho fatto ${qsos?.length || "-"} collegamenti all'evento ${
            event.name
          }! Partecipa anche tu al Radio Flash Mob su www.vhfesuperiori.eu`,
          files: [file],
        });
      } else {
        // instead, download the file
        saveAs(file);
      }
    } catch (err) {
      console.log("Error while capturing map", err);
      setAlert({
        color: "failure",
        msg:
          "Errore nel download della mappa - " +
          getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setIsLoadingShare(false);
    }
  }, [event, qsos?.length, setAlert, user?.callsign]);

  return (
    event &&
    user &&
    !!qsos?.length && (
      <div className="relative">
        <Button
          color="green"
          size="lg"
          disabled={isLoadingShare}
          className={`uppercase font-bold ${
            isLoadingShare ? "animate-pulse" : ""
          }`}
          onClick={shareMap}
        >
          {isLoadingShare ? (
            <Spinner className="mb-[1px] mr-2" />
          ) : canShare ? (
            <FaWhatsapp className="mr-2 scale-125 mt-[4px]" />
          ) : (
            <FaShareAlt className="mr-2 mt-[4px]" />
          )}{" "}
          {isLoadingShare
            ? "Caricamento..."
            : mustClickAgain
              ? "Clicca di nuovo"
              : "Condividi mappa"}
        </Button>
      </div>
    )
  );
};

// PropTypes definition
ShareMapBtn.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }),
  qsos: PropTypes.array,
  user: PropTypes.shape({
    callsign: PropTypes.string,
  }),
  setAlert: PropTypes.func,
};

export default ShareMapBtn;

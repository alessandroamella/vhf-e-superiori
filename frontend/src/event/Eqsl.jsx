import axios from "axios";
import { Alert, Button } from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import React, { useEffect, useState } from "react";
import { getErrorStr } from "..";
import Layout from "../Layout";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlaceholder from "react-placeholder";
import Zoom from "react-medium-image-zoom";
import { Card } from "@material-tailwind/react";
import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";
import { FaHome } from "react-icons/fa";
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

const Eqsl = () => {
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
    `QSO ${qso?.callsign} - ${qso?.fromStation?.callsign} - ${qso?.event?.name} - ${qso?.qsoDate} UTC - ${qso?.frequency} MHz - ${qso?.mode} - #vhfesuperiori`;

  return (
    <Layout>
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
            <>
              <div>
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={1}
                  ready={!!qso}
                >
                  {/* qso card */}
                  <Card>
                    <div className="p-4">
                      <h1 className="text-2xl">
                        <span className="font-bold">{qso?.event?.name}</span> -{" "}
                        {qso?.event?.date &&
                          formatInTimeZone(
                            new Date(qso.event.date),
                            "Europe/Rome",
                            "dd MMMM yyyy",
                            { locale: it }
                          )}
                      </h1>
                      <p>
                        <span className="font-bold">Nominativo:</span>{" "}
                        {qso?.callsign}
                      </p>
                      <p>
                        <span className="font-bold">Stazione:</span>{" "}
                        {qso?.fromStation?.callsign}
                      </p>
                      <p>
                        <span className="font-bold">Data:</span>{" "}
                        {qso?.qsoDate &&
                          formatInTimeZone(
                            new Date(qso.qsoDate),
                            "Europe/Rome",
                            "dd/MM/yyyy HH:mm",
                            { locale: it }
                          )}{" "}
                        <span className="font-light italic">
                          ({qso?.qsoDate} UTC)
                        </span>
                      </p>
                      <p>
                        <span className="font-bold">Frequenza:</span>{" "}
                        {qso?.frequency}
                      </p>
                      <p>
                        <span className="font-bold">Modo:</span> {qso?.mode}
                      </p>
                    </div>
                  </Card>
                </ReactPlaceholder>
              </div>
              <div className="mt-3">
                <ReactPlaceholder
                  showLoadingAnimation
                  type="media"
                  rows={3}
                  ready={!!qso}
                >
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
                </ReactPlaceholder>
              </div>

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
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Eqsl;

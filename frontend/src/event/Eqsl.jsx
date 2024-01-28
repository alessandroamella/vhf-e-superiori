import axios from "axios";
import { Alert } from "flowbite-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import React, { useEffect, useState } from "react";
import { getErrorStr } from "..";
import Layout from "../Layout";
import { useNavigate, useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";

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

  return (
    <Layout>
      <div className="w-full h-full pb-4 dark:text-white dark:bg-gray-900">
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
          {qso && (
            <LazyLoadImage
              className="w-full h-full object-contain shadow-xl mx-auto"
              src={qso.imageHref}
              alt="QSO"
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Eqsl;

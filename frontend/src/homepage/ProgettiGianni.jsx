import { Button } from "@material-tailwind/react";
import React from "react";
import { FaHome } from "react-icons/fa";
import { trackWindowScroll } from "react-lazy-load-image-component";
import { Link } from "react-router";
import SwiperCore, { Navigation, Pagination } from "swiper/core";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import LazyPDFViewer from "../PdfViewer";

const ProgettiGianni = () => {
  const { t } = useTranslation();
  SwiperCore.use([Navigation, Pagination]);
  const documents = [
    "10wi4gbz",
    "11KK4GBZ",
    "11wx4gbz",
    "7NFBI4GBZ",
    "11DX4GBZ",
    "11ww4gbz",
    "11XX4GBZ",
  ].map((e) => `/gianni/${e}.pdf`);

  const [currentSlide, setCurrentSlide] = React.useState(0);

  const handleSlideChange = (swiper) => {
    setCurrentSlide(swiper.realIndex);
  };

  return (
    <div className="px-4 select-none md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
      <Link to="/">
        <Button className="mb-2">
          <FaHome />
        </Button>
      </Link>

      <h2 className="text-lg font-semibold dark:text-gray-200 mb-4">
        {t("giannisProjects")}
      </h2>
      <Swiper
        navigation
        pagination
        spaceBetween={10}
        slidesPerView={1}
        loop={true}
        className="mx-auto"
        onSlideChange={handleSlideChange}
        currentSlide={currentSlide}
      >
        {documents.map((pdf, i) => (
          <SwiperSlide key={pdf}>
            <LazyPDFViewer
              pdfName={pdf}
              shouldRender={Math.abs(currentSlide - i) < 2}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const TrackedProgettiGianni = trackWindowScroll(ProgettiGianni);
export default TrackedProgettiGianni;

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore, { Navigation, Pagination } from "swiper/core";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Layout from "../Layout";
import Zoom from "react-medium-image-zoom";
import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { Button } from "@material-tailwind/react";

SwiperCore.use([Navigation, Pagination]);

const ProgettiGianni = () => {
  const images = [
    { src: "/gianni/1.jpeg", subtitle: "16 ELEMENTI UHF" },
    { src: "/gianni/2.jpeg", subtitle: "7 ELEMENTI VHF" },
    { src: "/gianni/3.jpeg", subtitle: "7 ELEMENTI VHF" }
  ];

  return (
    <Layout>
      <div className="px-4 select-none md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        <Link to="/">
          <Button className="mb-2">
            <FaHome />
          </Button>
        </Link>

        <h2 className="text-lg font-semibold dark:text-gray-200 mb-4">
          Progetti di Gianni (I4GBZ)
        </h2>
        <Swiper
          navigation
          pagination
          spaceBetween={10}
          slidesPerView={1}
          loop={true}
          className="max-w-xl mx-auto"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative">
                <Zoom>
                  <img
                    src={image.src}
                    alt={`Progetto ${index + 1}`}
                    className="max-h-screen object-contain w-full"
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gray-800 bg-opacity-60 text-white p-2 text-center">
                    {image.subtitle}
                  </div>
                </Zoom>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Layout>
  );
};

export default ProgettiGianni;

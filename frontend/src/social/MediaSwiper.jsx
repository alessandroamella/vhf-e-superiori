import "react-medium-image-zoom/dist/styles.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";
import Zoom from "react-medium-image-zoom";
import ReactPlayer from "react-player";
import React from "react";

const MediaSwiper = React.memo(({ postPictures, postVideos }) => (
  <Swiper
    spaceBetween={30}
    slidesPerView="auto"
    navigation
    pagination={{
      clickable: true
    }}
    modules={[Navigation, Pagination]}
  >
    {postPictures?.map(p => (
      <SwiperSlide className="my-auto" key={p}>
        <Zoom>
          <img
            loading="lazy"
            className="select-none w-full max-h-[30rem] object-contain"
            src={p}
            alt="Post pic"
          />
        </Zoom>
      </SwiperSlide>
    ))}
    {postVideos?.map(v => (
      <SwiperSlide className="my-auto" key={v}>
        <ReactPlayer controls width="100%" url={v} />
      </SwiperSlide>
    ))}
  </Swiper>
));

export default MediaSwiper;

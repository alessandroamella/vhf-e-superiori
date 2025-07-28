import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import PropTypes from "prop-types";
import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Zoom from "react-medium-image-zoom";
import ReactPlayer from "react-player";
import { Navigation, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

const MediaSwiper = React.memo(({ postPictures, postVideos }) => (
  <Swiper
    spaceBetween={30}
    slidesPerView="auto"
    navigation
    pagination={{
      clickable: true,
    }}
    modules={[Navigation, Pagination]}
  >
    {postPictures?.map((p) => (
      <SwiperSlide className="my-auto" key={p}>
        <Zoom>
          <LazyLoadImage
            className="select-none w-full max-h-[30rem] object-contain"
            src={p}
            alt="Post pic"
          />
        </Zoom>
      </SwiperSlide>
    ))}
    {postVideos?.map((v) => (
      <SwiperSlide className="my-auto" key={v}>
        <ReactPlayer controls width="100%" url={v} />
      </SwiperSlide>
    ))}
  </Swiper>
));

MediaSwiper.propTypes = {
  postPictures: PropTypes.array,
  postVideos: PropTypes.array,
};

MediaSwiper.displayName = "MediaSwiper";

export default MediaSwiper;

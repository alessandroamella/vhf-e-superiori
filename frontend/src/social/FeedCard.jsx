import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlaceholder from "react-placeholder";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
// import "swiper/css/navigation";
// import "swiper/css/scrollbar";
import TimeAgo from "./TimeAgo";
import { Spinner } from "flowbite-react";

/**
 * @typedef {object} BasePost
 * @property {string} fromUser - The ObjectId of the user who made the post.
 * @property {string[]} pictures - An array of file paths for the pictures uploaded by the user.
 * @property {string[]} videos - An array of file paths for the videos uploaded by the user.
 * @property {boolean} isApproved - Whether the post has been approved.
 * @property {string} createdAt - The date and time the post was created.
 * @property {string} updatedAt - The date and time the post was last updated.
 */

/**
 * @typedef {object} Props
 * @property {BasePost} post - The post content
 * @property {string|undefined} pp - The post picture
 *
 * @param {Props} props
 */
const FeedCard = ({ post, pp }) => {
  const navigate = useNavigate();
  const pic = pp && pp.find(p => p.callsign === post?.fromUser?.callsign)?.url;

  return (
    <div
      onClick={() => post && navigate(post?._id)}
      className="transition-transform hover:scale-105 cursor-pointer relative max-w-md mx-auto bg-white dark:bg-gray-800 md:rounded-xl shadow-md overflow-hidden mb-8"
    >
      {/* Header */}
      <div className="flex items-center p-4">
        {/* Avatar */}
        {pic ? (
          <img className="h-10 w-10 rounded-full" src={pic} alt="Profile" />
        ) : (
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
        )}

        {/* Username */}
        <div className="ml-4">
          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={1}
            ready={!!post?.fromUser?.callsign}
          >
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {post?.fromUser?.callsign}
            </p>
          </ReactPlaceholder>
        </div>

        {/* Time Ago */}
        <div className="ml-auto">
          {post?.createdAt ? (
            <TimeAgo createdAt={post?.createdAt} />
          ) : (
            <Spinner />
          )}
        </div>
      </div>

      {/* Image & Video Slider */}
      <ReactPlaceholder
        showLoadingAnimation
        type="rect"
        className="h-64 object-cover w-full"
        ready={!!post}
      >
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          loop={false}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false
          }}
        >
          {post?.pictures?.map((picture, index) => (
            <SwiperSlide key={index}>
              <LazyLoadImage
                src={picture || "/no-image.png"}
                className="h-64 object-cover w-full"
                alt="Feed card"
              />
            </SwiperSlide>
          ))}
          {post?.videos?.map((video, index) => (
            <SwiperSlide key={index}>
              <video className="h-64 object-cover w-full" controls>
                <source src={video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </SwiperSlide>
          ))}
        </Swiper>
      </ReactPlaceholder>

      {/* Description */}
      <div className="p-4">
        <ReactPlaceholder
          showLoadingAnimation
          type="text"
          rows={1}
          ready={!!post?.description}
        >
          <p className="text-base font-medium text-gray-800 dark:text-gray-200">
            {post?.description}
          </p>
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export default FeedCard;

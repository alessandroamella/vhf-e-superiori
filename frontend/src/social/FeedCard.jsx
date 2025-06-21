import { useContext, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlaceholder from "react-placeholder";
import { Link } from "react-router";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css/navigation";
// import "swiper/css/scrollbar";
import axios from "axios";
import { Avatar, Button, Spinner } from "flowbite-react";
import PropTypes from "prop-types";
import { FaTrash } from "react-icons/fa";
import { UserContext } from "../App";
import { getErrorStr } from "../shared";
import CallsignLoading from "../shared/CallsignLoading";
import TimeAgo from "./TimeAgo";

/**
 * @typedef {object} BasePost
 * @property {string} fromUser - The ObjectId of the user who made the post.
 * @property {string[]} pictures - An array of file paths for the pictures uploaded by the user.
 * @property {string[]} videos - An array of file paths for the videos uploaded by the user.
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
const FeedCard = ({ posts, setPosts, post, pp, setAlert, id }) => {
  const { user, setUser } = useContext(UserContext);

  const pic =
    pp &&
    (typeof pp === "string"
      ? pp
      : pp.find((p) => p.callsign === post?.fromUser?.callsign)?.url);

  const [deleteDisabled, setDeleteDisabled] = useState(false);

  async function deletePost(e, p) {
    e.stopPropagation(); // Fermare la propagazione del click

    if (
      !window.confirm(
        `Vuoi davvero eliminare il post "${p.description}"${
          user?.isAdmin && p.fromUser._id !== user._id
            ? ` di ${p.fromUser.callsign}`
            : ""
        }?`
      )
    ) {
      return;
    }

    setDeleteDisabled(true);

    try {
      await axios.delete("/api/post/" + p._id);
      setAlert({
        color: "success",
        msg: "Post eliminato con successo"
      });
      setUser({ ...user, posts: user.posts.filter((_p) => _p._id !== p._id) });
      setPosts(posts.filter((_p) => _p._id !== p._id));
    } catch (err) {
      console.log("error in post delete", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDeleteDisabled(false);
    }
  }

  const lastComment =
    Array.isArray(post?.comments) &&
    post.comments.length > 0 &&
    post.comments[post.comments.length - 1];

  return (
    <div
      id={id}
      className="w-full transition-transform hover:scale-105 cursor-pointer relative max-w-md mx-auto bg-white dark:bg-gray-800 md:rounded-xl shadow-md overflow-hidden mb-8"
    >
      <Link to={`/social/${post?._id}`}>
        {/* Header */}
        <div className="flex items-center p-4">
          {/* Avatar */}
          {pic ? (
            <Avatar rounded img={pic} />
          ) : (
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
          )}

          {/* Username */}
          <div className="ml-4 flex items-center gap-2">
            <ReactPlaceholder
              showLoadingAnimation
              type="text"
              rows={1}
              ready={!!post?.fromUser?.callsign}
            >
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                <CallsignLoading user={post?.fromUser} />
              </p>
            </ReactPlaceholder>
          </div>

          {/* Time Ago */}
          <div className="ml-auto flex items-center gap-2">
            {post?.createdAt ? (
              <TimeAgo createdAt={post?.createdAt} />
            ) : (
              <Spinner />
            )}

            {user &&
              post &&
              (user.callsign === post.fromUser?.callsign || user.isAdmin) && (
                <Button
                  color="failure"
                  onClick={(e) => deletePost(e, post)}
                  disabled={deleteDisabled}
                >
                  <FaTrash className="p-0" />
                </Button>
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
            {post?.pictures?.map((picture) => (
              <SwiperSlide key={picture}>
                <LazyLoadImage
                  src={picture || "/images/no-image.png"}
                  className="h-64 object-cover w-full"
                  alt="Feed card"
                />
              </SwiperSlide>
            ))}
            {post?.videos?.map((video) => (
              <SwiperSlide key={video}>
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

        {/* Comments */}
        {Array.isArray(post?.comments) && post?.comments.length > 0 && (
          <div className="border-t p-2 border-gray-100 dark:border-gray-700">
            {/* <p className="text-sm font-bold tracking-tighter">Commenti</p> */}
            <div key={lastComment._id} className="flex items-center gap-2 p-2">
              <div className="flex flex-col w-full">
                <div className="flex justify-between w-full">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {lastComment.fromUser?.callsign}
                  </p>
                  <p className="text-sm text-gray-600 darkt:text-gray-400">
                    <TimeAgo createdAt={lastComment.createdAt} />
                  </p>
                </div>

                <p className="text-xs font-medium text-gray-500 dark:text-gray-300">
                  {lastComment.content}
                </p>
              </div>
            </div>

            {/* <pre>
        <code>{JSON.stringify(post?.comments)}</code>
      </pre> */}
          </div>
        )}
      </Link>
    </div>
  );
};

FeedCard.propTypes = {
  posts: PropTypes.array,
  setPosts: PropTypes.func,
  post: PropTypes.object,
  pp: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  setAlert: PropTypes.func,
  id: PropTypes.string
};

FeedCard.displayName = "FeedCard";

export default FeedCard;

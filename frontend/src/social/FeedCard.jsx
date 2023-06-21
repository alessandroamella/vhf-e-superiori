import { Avatar } from "flowbite-react";
import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlaceholder from "react-placeholder";
import { useNavigate } from "react-router-dom";

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
  const pic = pp && pp.find(p => p.callsign === post?.fromUser?.callsign)?.url;

  const navigate = useNavigate();

  return (
    <div
      onClick={() => post && navigate(post?._id)}
      className="transition-transform hover:scale-105 cursor-pointer relative max-h-[50vh] rounded-xl border border-gray-200 dark:border-gray-800 mb-4 overflow-hidden"
    >
      <ReactPlaceholder
        showLoadingAnimation
        type="rect"
        className="h-64 object-cover w-full"
        ready={!!post}
      >
        <LazyLoadImage
          src={post?.pictures[0] || "/no-image.png"}
          className="h-64 object-cover w-full"
          alt="Feed card"
        />
      </ReactPlaceholder>
      <div className="p-4 absolute flex bottom-0 bg-[rgba(0,0,0,0.33)] w-full">
        <div className="w-full">
          <h5 className="line-clamp-1 text-2xl font-bold tracking-tight text-white">
            <ReactPlaceholder
              showLoadingAnimation
              type="text"
              rows={1}
              ready={!!post?.description}
            >
              {post?.description}
            </ReactPlaceholder>
          </h5>
        </div>
        <div className="flex items-center gap-2">
          {pic && <Avatar img={pic} rounded />}
          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={1}
            ready={!!post?.fromUser?.callsign}
          >
            {/* <div className="flex items-center gap-2"> */}
            <p className="uppercase tracking-tight font-semibold text-lg text-gray-100">
              {post?.fromUser?.callsign}
            </p>
            {/* </div> */}
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;

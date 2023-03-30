import { Avatar } from "flowbite-react";
import React from "react";
import ReactPlaceholder from "react-placeholder";
import { useNavigate } from "react-router-dom";

const FeedCard = ({ post, pp }) => {
  const pic = pp && pp.find(p => p.callsign === post?.fromUser?.callsign)?.url;
  console.log({ pic });

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
        <img
          src={post?.pictures[0] || "/no-image.png"}
          className="h-64 object-cover w-full"
          alt="Feed card"
        />
      </ReactPlaceholder>
      <div className="p-4 absolute flex bottom-0 h-28 bg-[rgba(0,0,0,0.33)] w-full">
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
          <p className="font-normal text-gray-200 line-clamp-2">
            <ReactPlaceholder
              showLoadingAnimation
              type="text"
              rows={2}
              ready={!!post?.description}
            >
              <div className="flex items-center gap-2">
                <span>{post?.band} MHz</span>
                <span>{post?.brand}</span>
                <span>{post?.numberOfElements} elementi</span>
              </div>
            </ReactPlaceholder>
          </p>
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

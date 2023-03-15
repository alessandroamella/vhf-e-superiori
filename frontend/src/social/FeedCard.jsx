import { Avatar } from "flowbite-react";
import React from "react";
import ReactPlaceholder from "react-placeholder";

const FeedCard = ({ post }) => {
  return (
    <div className="transition-transform hover:scale-105 cursor-pointer relative max-h-[50vh] rounded-xl border border-gray-200 dark:border-gray-600 mb-4 overflow-hidden">
      <img
        src="https://flowbite.com/docs/images/blog/image-1.jpg"
        className="h-64 object-cover w-full"
        alt="Feed card"
      />
      <div className="p-4 absolute flex bottom-0 h-28 bg-[rgba(0,0,0,0.33)] w-full">
        <div className="w-full">
          <h5 className="line-clamp-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <ReactPlaceholder type="text" rows={1} ready={!!post?.description}>
              {post?.description}
            </ReactPlaceholder>
          </h5>
          <p className="font-normal text-gray-200 line-clamp-2">
            <ReactPlaceholder type="text" rows={3} ready={!!post?.description}>
              <div className="flex items-center gap-2">
                <span>{post?.band} MHz</span>
                <span>{post?.brand}</span>
                <span>{post?.numberOfElements} elementi</span>
              </div>
            </ReactPlaceholder>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar img="https://flowbite.com/docs/images/people/profile-picture-5.jpg" />
          <ReactPlaceholder type="text" rows={1} ready={!!post?.callsign}>
            {/* <div className="flex items-center gap-2"> */}
            <p className="uppercase tracking-tight font-semibold text-lg">
              {post?.callsign}
            </p>
            {/* </div> */}
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;

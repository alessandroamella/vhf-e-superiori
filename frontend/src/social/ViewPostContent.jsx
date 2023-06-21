import React, { useMemo } from "react";

import "react-placeholder/lib/reactPlaceholder.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

import ReactPlaceholder from "react-placeholder/lib";
import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";
import {
  LazyLoadImage,
  trackWindowScroll
} from "react-lazy-load-image-component";

import MediaSwiper from "./MediaSwiper";
import Description from "./Description";

/**
 * @typedef {import('./NewPost').PostType} PostType
 * @typedef {import('./FeedCard').BasePost} BasePost
 *
 * @typedef {object} Props
 * @property {PostType} type - The type of the post
 * @property {BasePost} post - The post content
 * @property {string} pic - The user profile picture
 *
 * @param {Props} props
 */
const ViewPostContent = React.memo(({ post, pic, scrollPosition }) => {
  const postPictures = useMemo(() => post?.pictures || [], [post?.pictures]);
  const postVideos = useMemo(() => post?.videos || [], [post?.videos]);

  return (
    <div className="w-full px-4 md:px-0 md:w-4/5 rounded-xl border border-gray-200 dark:border-gray-800 mb-4 overflow-hidden">
      <ReactPlaceholder
        showLoadingAnimation
        type="rect"
        className="h-96 object-cover w-full"
        ready={!!post}
      >
        <MediaSwiper postPictures={postPictures} postVideos={postVideos} />
      </ReactPlaceholder>
      <div className="p-4 flex w-full">
        <div className="w-full">
          <div className="mb-8 flex flex-col items-center gap-2 md:flex-row justify-center md:justify-between">
            <Description description={post?.description} />
            <div className="px-2 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-center gap-2">
                {pic && (
                  <LazyLoadImage
                    loading="lazy"
                    src={pic}
                    alt="Avatar"
                    className="object-cover w-10 h-10 rounded-full"
                    scrollPosition={scrollPosition}
                  />
                )}
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={1}
                  ready={!!post?.fromUser?.callsign}
                >
                  <p className="uppercase tracking-tight font-semibold text-lg text-gray-700">
                    {post?.fromUser?.callsign && (
                      <a
                        href={
                          "https://www.qrz.com/db/" + post?.fromUser?.callsign
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {post?.fromUser?.callsign}
                      </a>
                    )}
                  </p>
                </ReactPlaceholder>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={1}
                  ready={!!post?.createdAt}
                >
                  <span className="min-w-[12rem] text-gray-600 dark:text-gray-400">
                    {post?.createdAt &&
                      formatInTimeZone(
                        post?.createdAt,
                        "Europe/Rome",
                        "d MMMM yyyy 'alle' HH:mm",
                        { locale: it }
                      )}
                  </span>
                </ReactPlaceholder>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default trackWindowScroll(ViewPostContent);

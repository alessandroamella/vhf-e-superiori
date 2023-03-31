import "react-medium-image-zoom/dist/styles.css";
import "react-placeholder/lib/reactPlaceholder.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

import { Table } from "flowbite-react";
import ReactPlaceholder from "react-placeholder/lib";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";
import Zoom from "react-medium-image-zoom";
import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";
import ReactPlayer from "react-player/lazy";

const ViewPostContent = ({ post, pic }) => {
  const fields = post
    ? [
        ["Banda", post.band + "MHz"],
        ["Marca", post.brand],
        [
          "Autocostruita",
          post.isSelfBuilt ? (
            <FaCheck className="text-green-500" />
          ) : (
            <FaTimes className="text-red-500" />
          )
        ],
        ["Metri dal mare (S.L.M.)", post.metersFromSea + "m"],
        ["Lunghezza boom", post.boomLengthCm + "cm"],
        ["Numero di elementi", post.numberOfElements],
        ["Antenne accoppiate", post.numberOfAntennas || "unica antenna"],
        ["Cavo", post.cable]
      ]
    : null;

  return (
    <div className="w-full px-4 md:px-0 md:w-4/5 rounded-xl border border-gray-200 dark:border-gray-800 mb-4 overflow-hidden">
      <ReactPlaceholder
        showLoadingAnimation
        type="rect"
        className="h-64 object-cover w-full"
        ready={!!post}
      >
        {post && (
          <Swiper
            spaceBetween={30}
            slidesPerView="auto"
            navigation
            pagination={{
              clickable: true
            }}
            modules={[Navigation, Pagination]}
          >
            {post?.pictures.map(p => (
              <SwiperSlide className="my-auto" key={p}>
                <Zoom>
                  <img
                    className="select-none w-full max-h-96 object-cover"
                    src={p}
                    alt="Post pic"
                  />
                </Zoom>
              </SwiperSlide>
            ))}
            {post?.videos.map(v => (
              <SwiperSlide className="my-auto" key={v}>
                <ReactPlayer controls width="100%" url={v} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </ReactPlaceholder>
      <div className="p-4 flex w-full">
        <div className="w-full">
          <div className="mb-8 flex flex-col items-center gap-2 md:flex-row justify-center md:justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              <ReactPlaceholder
                showLoadingAnimation
                type="text"
                rows={1}
                ready={!!post?.description}
              >
                {post?.description}
              </ReactPlaceholder>
            </h5>
            <div className="px-2 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-center gap-2">
                {pic && (
                  <img
                    loading="lazy"
                    src={pic}
                    alt="Avatar"
                    className="object-cover w-10 h-10 rounded-full"
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
          <div className="flex flex-col md:flex-row justify-center md:justify-between">
            <div className="flex justify-center font-normal text-gray-700 w-full">
              <ReactPlaceholder
                showLoadingAnimation
                type="text"
                rows={2}
                ready={!!post}
              >
                {fields && (
                  <Table className="w-full mx-auto" hoverable>
                    <Table.Body className="divide-y w-full mx-auto">
                      <div className="block md:hidden">
                        {fields.map(e => (
                          <Table.Row
                            key={e.toString()}
                            className="w-full bg-white dark:border-gray-700 dark:bg-gray-800"
                          >
                            <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              {e[0]}
                            </Table.Cell>
                            <Table.Cell>{e[1]}</Table.Cell>
                          </Table.Row>
                        ))}
                      </div>
                      <div className="hidden md:block">
                        {[...Array(Math.floor(fields.length / 2)).keys()]
                          .map((_, i) => [
                            ...fields[i],
                            ...fields[i + Math.floor(fields.length / 2)]
                          ])
                          .map(e => (
                            <Table.Row
                              key={e.toString()}
                              className="w-full bg-white dark:border-gray-700 dark:bg-gray-800"
                            >
                              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                {e[0]}
                              </Table.Cell>
                              <Table.Cell className="w-full md:w-1/2">
                                {e[1]}
                              </Table.Cell>
                              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                {e[2]}
                              </Table.Cell>
                              <Table.Cell className="w-full md:w-1/2">
                                {e[3]}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                      </div>
                    </Table.Body>
                  </Table>
                )}
              </ReactPlaceholder>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPostContent;

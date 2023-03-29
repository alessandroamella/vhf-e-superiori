import Layout from "../Layout";
import { useEffect, useState } from "react";
import { getErrorStr } from "..";

import "react-medium-image-zoom/dist/styles.css";
import "react-placeholder/lib/reactPlaceholder.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

import axios from "axios";
import { Alert, Button, Table } from "flowbite-react";
import { Link, useParams } from "react-router-dom";
import ReactPlaceholder from "react-placeholder/lib";
import { FaBackward, FaCheck, FaTimes } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";
import Zoom from "react-medium-image-zoom";
import { formatInTimeZone } from "date-fns-tz";
import { it } from "date-fns/locale";

const ViewPost = () => {
  const { id } = useParams();

  const [alert, setAlert] = useState(null);

  const [post, setPost] = useState(null);
  const [pic, setPic] = useState(null);

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

  useEffect(() => {
    async function loadPost() {
      try {
        const { data } = await axios.get("/api/post/" + id);
        console.log("post", data);
        setPost(data.post);
        if (data.pp) setPic(data.pp);
      } catch (err) {
        console.log(err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    }
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        <Link to={-1}>
          <Button color="light">
            <FaBackward />
          </Button>
        </Link>
        {alert && (
          <Alert
            className="mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <div className="flex justify-center">
          <div className="w-4/5 rounded-xl border border-gray-200 dark:border-gray-600 mb-4 overflow-hidden">
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
                  {post.pictures.map(p => (
                    <SwiperSlide key={p}>
                      <Zoom>
                        <img
                          className="select-none w-full max-h-96 object-cover"
                          src={p}
                          alt="Post pic"
                        />
                      </Zoom>
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
                    <div className="flex items-center gap-2">
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
                          {pic && post?.fromUser?.callsign ? (
                            <a
                              href={
                                "https://www.qrz.com/db/" +
                                post.fromUser.callsign
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {post?.fromUser?.callsign}
                            </a>
                          ) : (
                            post?.fromUser?.callsign
                          )}
                        </p>
                      </ReactPlaceholder>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReactPlaceholder
                        showLoadingAnimation
                        type="text"
                        rows={1}
                        ready={!!post?.createdAt}
                      >
                        <span className="min-w-[12rem] text-gray-600">
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
                  <div className="font-normal text-gray-700 w-full">
                    <ReactPlaceholder
                      showLoadingAnimation
                      type="text"
                      rows={2}
                      ready={!!post}
                    >
                      {fields && (
                        <Table className="w-full" hoverable>
                          <Table.Body className="divide-y">
                            <div className="block md:hidden">
                              {fields.map(e => (
                                <Table.Row
                                  key={e.toString()}
                                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
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
                                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
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
        </div>
      </div>
    </Layout>
  );
};

export default ViewPost;

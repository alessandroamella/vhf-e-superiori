import { Button, Pagination, Spinner, Table, Tooltip } from "flowbite-react";
import PropTypes from "prop-types";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Zoom from "react-medium-image-zoom";
import ReactPlayer from "react-player";
import { Link } from "react-router";
import { Navigation, Pagination as SwiperPagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { formatInTimeZone } from "../shared/formatInTimeZone";

const PostsTable = ({
  posts,
  postsInterval,
  isDeleting,
  deletePost,
  postPage,
  postsCurPage,
  setPostPage
}) => {
  return posts ? (
    <div>
      <Table striped>
        <Table.Head>
          <Table.HeadCell>
            <span className="sr-only">Azioni</span>
          </Table.HeadCell>
          <Table.HeadCell>Autore</Table.HeadCell>
          <Table.HeadCell>Descrizione</Table.HeadCell>
          <Table.HeadCell>Foto</Table.HeadCell>
          <Table.HeadCell>Video</Table.HeadCell>
          <Table.HeadCell>Creazione</Table.HeadCell>
        </Table.Head>
        <Table.Body>
          {posts?.slice(...postsInterval)?.map(u => (
            <Table.Row key={u._id}>
              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Button
                    color="failure"
                    disabled={isDeleting}
                    onClick={() => deletePost(u)}
                  >
                    {isDeleting ? <Spinner /> : <span>Elimina</span>}
                  </Button>
                </div>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                {u.fromUser.callsign}
              </Table.Cell>
              <Table.Cell>
                <Tooltip content={u.description}>
                  <Link to={"/social/" + u._id}>
                    <span className="line-clamp-3">{u.description}</span>
                  </Link>
                </Tooltip>
              </Table.Cell>
              <Table.Cell>
                <Swiper
                  spaceBetween={30}
                  slidesPerView="auto"
                  navigation
                  pagination={{
                    clickable: true
                  }}
                  modules={[Navigation, SwiperPagination]}
                >
                  {u.pictures.map(p => (
                    <SwiperSlide key={p}>
                      <Zoom>
                        <LazyLoadImage
                          className="select-none w-full max-h-32 object-center object-contain"
                          src={p}
                          alt="Post pic"
                        />
                      </Zoom>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Table.Cell>
              <Table.Cell>
                <div className="w-[228px]">
                  <Swiper
                    spaceBetween={30}
                    slidesPerView="auto"
                    navigation
                    pagination={{
                      clickable: true
                    }}
                    modules={[Navigation, SwiperPagination]}
                  >
                    {u.videos.map(v => (
                      <SwiperSlide key={v}>
                        <ReactPlayer
                          controls
                          height={128}
                          width={228}
                          url={v}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </Table.Cell>
              <Table.Cell>
                {formatInTimeZone(
                  u.createdAt,
                  "Europe/Rome",
                  "dd/MM/yyyy HH:mm:ss"
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Pagination
        showIcons
        currentPage={postPage}
        totalPages={postsCurPage}
        onPageChange={setPostPage}
      />
    </div>
  ) : posts === false ? (
    <Spinner />
  ) : (
    <p>Errore nel caricamento dei post</p>
  );
};

PostsTable.propTypes = {
  posts: PropTypes.array,
  postsInterval: PropTypes.array,
  isDeleting: PropTypes.bool,
  deletePost: PropTypes.func,
  postPage: PropTypes.number,
  postsCurPage: PropTypes.number,
  setPostPage: PropTypes.func
};
PostsTable.displayName = "PostsTable";

export default PostsTable;

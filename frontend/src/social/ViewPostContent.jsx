import React, { useContext, useEffect, useMemo, useState } from "react";

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
import { UserContext, getErrorStr } from "..";
import { Alert, Card, Spinner, Textarea } from "flowbite-react";
import { Button } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

/**
 * @typedef {import('./NewPost').PostType} PostType
 * @typedef {import('./FeedCard').BasePost} BasePost
 *
 * @typedef {object} Props
 * @property {PostType} type - The type of the post
 * @property {BasePost} post - The post content
 * @property {string} pic - The user profile picture
 * @property {number} scrollPosition - The scroll position
 * @property {boolean} hideComments - Whether to hide comments or not
 *
 * @param {Props} props
 */
const ViewPostContent = React.memo(
  ({ post, pic, scrollPosition, hideComments }) => {
    const postPictures = useMemo(() => post?.pictures || [], [post?.pictures]);
    const postVideos = useMemo(() => post?.videos || [], [post?.videos]);

    const { user } = useContext(UserContext);

    const navigate = useNavigate();

    const [content, setContent] = useState("");
    const [disabled, setDisabled] = useState(false);
    const [alert, setAlert] = useState(null);

    const [comments, setComments] = useState([]);

    useEffect(() => {
      if (!Array.isArray(post?.comments)) return;
      console.log("setting comments for post", post);
      const _comments = [...post.comments];
      _comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setComments(_comments);
    }, [post]);

    async function sendComment(e) {
      e.preventDefault();
      setDisabled(true);
      try {
        const { data } = await axios.post("/api/comment", {
          content,
          forPost: post._id
        });
        const _comments = [...comments, data];
        _comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setComments(_comments);
        setAlert({
          color: "success",
          msg: "Commento inviato con successo!"
        });
        console.log("comment", data);
      } catch (err) {
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setContent("");
        setDisabled(false);
      }
    }

    async function deleteComment(e, comment) {
      e.preventDefault();
      if (
        !window.confirm(
          `Vuoi davvero eliminare il commento "${comment.content}"?`
        )
      ) {
        return;
      }

      setDisabled(true);

      try {
        await axios.delete("/api/comment/" + comment._id);
        setAlert({
          color: "success",
          msg: "Commento eliminato con successo"
        });
        setComments(comments.filter(_c => _c._id !== comment._id));
      } catch (err) {
        console.log("error in comment delete", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setDisabled(false);
      }
    }

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
                        <Link
                          to={`/social/by/${post?.fromUser?._id}?callsign=${post?.fromUser?.callsign}&name=${post?.fromUser?.name}`}
                        >
                          {post?.fromUser?.callsign}
                        </Link>
                        // <a
                        //   href={
                        //     "https://www.qrz.com/db/" + post?.fromUser?.callsign
                        //   }
                        //   target="_blank"
                        //   rel="noopener noreferrer"
                        // >
                        //   {post?.fromUser?.callsign}
                        // </a>
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
                    <span className="min-w-[12rem] text-gray-600 text-center dark:text-gray-400">
                      {post?.createdAt &&
                        formatInTimeZone(
                          post?.createdAt,
                          "Europe/Rome",
                          "d MMM yyyy HH:mm",
                          { locale: it }
                        )}
                    </span>
                  </ReactPlaceholder>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!hideComments && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col w-full">
            <h2 className="mb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Commenti
            </h2>
            {alert && (
              <Alert
                className="mb-6"
                color={alert.color}
                onDismiss={() => setAlert(null)}
              >
                <span>{alert.msg}</span>
              </Alert>
            )}
            {user ? (
              <div className="w-full">
                <form
                  onSubmit={sendComment}
                  className="w-full flex flex-row gap-2 items-center"
                >
                  <Textarea
                    id="comment-content"
                    name="comment-content"
                    type="text"
                    required={true}
                    className="w-full"
                    placeholder="Scrivi un commento"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    disabled={disabled}
                  />
                  <Button
                    type="submit"
                    disabled={disabled || !content}
                    color="blue"
                  >
                    {disabled ? <Spinner /> : <span>Invia</span>}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="px-2">
                <p>Fai il login per commentare</p>
                <Button color="blue" onClick={() => navigate("/login")}>
                  Login
                </Button>
              </div>
            )}
            {Array.isArray(post?.comments) &&
              comments.map(comment => (
                <Card
                  key={comment._id}
                  className="mt-2"
                  id={`comment-${comment._id}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center">
                      {/* <LazyLoadImage
                    loading="lazy"
                    src={comment?.fromUser?.profilePic}
                    alt="Avatar"
                    className="object-cover w-10 h-10 rounded-full"
                    scrollPosition={scrollPosition}
                  /> */}
                      <div className="flex justify-between w-full">
                        <div className="flex flex-col">
                          <Link
                            to={`/social/by/${comment?.fromUser?._id}`}
                            className="text-blue-500 hover:text-blue-700 transition-colors dark:text-gray-300 font-semibold"
                          >
                            {comment?.fromUser?.callsign || "Anonimo"}
                          </Link>
                          <p className="text-gray-600 dark:text-gray-400">
                            {comment?.content}
                          </p>
                        </div>
                        <div>
                          {user &&
                            post &&
                            (user.callsign === comment.fromUser.allsign ||
                              user.isAdmin) && (
                              <Button
                                size="sm"
                                color="red"
                                onClick={e => deleteComment(e, comment)}
                                disabled={disabled}
                              >
                                <FaTrash className="p-0" />
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {comment?.createdAt &&
                        formatInTimeZone(
                          comment?.createdAt,
                          "Europe/Rome",
                          "d MMM yyyy HH:mm",
                          { locale: it }
                        )}
                    </p>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  }
);

export default trackWindowScroll(ViewPostContent);

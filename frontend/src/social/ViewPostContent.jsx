import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

import { it } from "date-fns/locale";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlaceholder from "react-placeholder/lib";

import axios from "axios";
import PropTypes from "prop-types";
import { Link } from "react-router";
import { UserContext } from "../App";
import { getErrorStr } from "../shared";
import CallsignLoading from "../shared/CallsignLoading";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import CommentsSection from "./CommentSection";
import Description from "./Description";
import MediaSwiper from "./MediaSwiper";

const ViewPostContent = React.memo(({ postExtended, hideComments }) => {
  const { post, pics } = useMemo(() => postExtended || {}, [postExtended]);

  const postPictures = useMemo(() => post?.pictures || [], [post?.pictures]);
  const postVideos = useMemo(() => post?.videos || [], [post?.videos]);

  const { user } = useContext(UserContext);

  const [content, setContent] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [alert, setAlert] = useState(null);

  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!Array.isArray(post?.comments)) return;
    const _comments = [...post.comments];
    _comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setComments(_comments);
    console.log("setting comments for post", post, _comments);
  }, [post]);

  const commentContainerRef = useRef(null);

  const [highlightedComment, setHighlightedComment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const sendComment = useCallback(
    async (e) => {
      e?.preventDefault();
      setDisabled(true);
      try {
        const payload = {
          content,
          forPost: post._id,
          ...(replyTo && { parentComment: replyTo })
        };
        console.log("sending comment with payload", payload);
        const { data } = await axios.post("/api/comment", payload);
        const _comments = data.parentComment
          ? comments.map((c) =>
              c._id === data.parentComment
                ? { ...c, replies: [...c.replies, data] }
                : c
            )
          : [...comments, data];
        _comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setComments(_comments);
        setAlert({
          color: "success",
          msg: "Commento inviato con successo!"
        });
        console.log("comment", data);
        commentContainerRef.current?.scrollIntoView({
          behavior: "smooth"
        });
        document.querySelector(".comments-card").scrollTop = 0;
        setTimeout(() => {
          document.querySelector(`#comment-${data._id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 100);

        setContent("");
        setReplyTo(null);

        let times = 0;
        const interval = setInterval(() => {
          if (times === 2) {
            clearInterval(interval);
          }
          setHighlightedComment(data._id);
          setTimeout(() => setHighlightedComment(null), 300);
          times++;
        }, 300 * 2);
      } catch (err) {
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setContent("");
        setDisabled(false);
      }
    },
    [comments, content, post, replyTo]
  );

  const deleteComment = useCallback(
    async (e, comment) => {
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
        const { data } = await axios.delete("/api/comment/" + comment._id);
        setAlert({
          color: "success",
          msg: "Commento eliminato con successo"
        });
        if (data.parentComment) {
          setComments(
            comments.map((c) =>
              c._id === data.parentComment
                ? {
                    ...c,
                    replies: c.replies.filter((_c) => _c._id !== comment._id)
                  }
                : c
            )
          );
        } else {
          setComments(comments.filter((_c) => _c._id !== comment._id));
        }
      } catch (err) {
        console.log("error in comment delete", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setDisabled(false);
      }
    },
    [comments]
  );

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
              <div className="flex min-w-fit items-center justify-center gap-2">
                {post?.fromUser?.callsign &&
                  pics &&
                  post.fromUser.callsign in pics && (
                    <LazyLoadImage
                      loading="lazy"
                      src={pics[post.fromUser.callsign]}
                      alt="Avatar"
                      className="object-cover w-10 h-10 aspect-square rounded-full"
                    />
                  )}
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={1}
                  ready={!!post?.fromUser?.callsign}
                >
                  <div className="min-w-fit uppercase tracking-tight font-semibold text-lg text-gray-700">
                    {post?.fromUser?.callsign && (
                      <Link to={`/u/${post?.fromUser?.callsign}`}>
                        {post?.fromUser ? (
                          <CallsignLoading user={post.fromUser} />
                        ) : (
                          <span className="text-gray-500 dark:text-gray-300">
                            Utente non trovato
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
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
      {typeof user !== "boolean" && (
        <CommentsSection
          alert={alert}
          comments={comments}
          content={content}
          deleteComment={deleteComment}
          disabled={disabled}
          hideComments={hideComments}
          highlightedComment={highlightedComment}
          postExtended={postExtended}
          replyTo={replyTo}
          sendComment={sendComment}
          setAlert={setAlert}
          setContent={setContent}
          setReplyTo={setReplyTo}
          user={user}
        />
      )}
    </div>
  );
});
ViewPostContent.propTypes = {
  postExtended: PropTypes.object,
  hideComments: PropTypes.bool
};

ViewPostContent.displayName = "ViewPostContent";

export default ViewPostContent;

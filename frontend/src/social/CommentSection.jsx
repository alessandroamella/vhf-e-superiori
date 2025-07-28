import { Button, Card, Spinner, Textarea } from "@material-tailwind/react";
import { formatInTimeZone } from "date-fns-tz";
import { Alert, Button as FlowbiteButton } from "flowbite-react";
import PropTypes from "prop-types";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaInfoCircle, FaTrash } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactMarkdown from "react-markdown";
import { createSearchParams, Link } from "react-router";
import remarkGfm from "remark-gfm";
import CallsignLoading from "../shared/CallsignLoading";

// Function to process mentions and create links
const processMentions = (text) => {
  if (!text) return text;
  const mentionRegex = /@([a-zA-Z0-9]{5,6})\b/g;
  return text.replace(mentionRegex, (match, callsign) => {
    return `[@${callsign}](/u/${callsign})`;
  });
};

const Comment = ({
  comment,
  user,
  postExtended,
  deleteComment,
  disabled,
  highlightedComment,
  replyTo,
  setReplyTo,
  setContent,
  formatInTimeZone,
  onReply,
}) => {
  const { post, pics } = useMemo(() => postExtended || {}, [postExtended]);

  const [isRepliesCollapsed, setIsRepliesCollapsed] = useState(false);

  const handleReplyClick = () => {
    setReplyTo(comment._id);
    setContent(`@${comment.fromUser.callsign} `);
    onReply();
  };

  const { t } = useTranslation();

  const toggleReplies = () => {
    setIsRepliesCollapsed(!isRepliesCollapsed);
  };

  const renderContent = useMemo(() => {
    const contentWithMentions = processMentions(comment?.content || "");
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="markdown-body break-words"
        components={{
          a: ({
            node: {
              properties: { href },
            },
            ...props
          }) => (
            <Link
              to={href}
              {...props}
              className="text-blue-500 hover:text-blue-700 transition-colors font-semibold dark:text-red-500 dark:hover:text-red-400"
            />
          ),
        }}
      >
        {contentWithMentions}
      </ReactMarkdown>
    );
  }, [comment?.content]);

  return (
    <div key={comment._id} className="mb-4 p-4">
      {/* Added mb-4 for spacing between comments */}
      <div
        className={`transition-colors ${
          [highlightedComment, replyTo].includes(comment._id)
            ? "bg-yellow-100 dark:bg-gray-700 -m-4 p-4"
            : ""
        }`}
        id={`comment-${comment._id}`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 items-center">
            <div className="flex justify-between w-full">
              <div className="flex flex-col md:flex-row gap-2 items-center">
                {pics &&
                  comment?.fromUser?.callsign &&
                  comment.fromUser.callsign in pics && (
                    <LazyLoadImage
                      loading="lazy"
                      src={pics[comment.fromUser.callsign]}
                      alt="Avatar"
                      className="inline-block object-cover w-10 h-10 aspect-square rounded-full"
                    />
                  )}
                <div className="flex flex-col">
                  <Link
                    to={`/u/${comment?.fromUser?.callsign}`}
                    className="text-blue-500 hover:text-blue-700 transition-colors dark:text-white font-semibold"
                  >
                    {comment?.fromUser ? (
                      <CallsignLoading user={comment.fromUser} />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-300">
                        {t("userNotFound")}
                      </span>
                    )}
                  </Link>
                  <div className="text-gray-800 dark:text-gray-200">
                    {renderContent}
                  </div>
                </div>
              </div>
              <div>
                {user &&
                  post &&
                  (user.callsign === comment.fromUser?.callsign ||
                    user.isAdmin) && (
                    <Button
                      size="sm"
                      color="red"
                      onClick={(e) => deleteComment(e, comment)}
                      disabled={disabled}
                    >
                      <FaTrash className="p-0" />
                    </Button>
                  )}
              </div>
            </div>
          </div>
          <div className="flex flex-row md:justify-between mt-2 gap-2 items-center">
            <button
              size="sm"
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              onClick={handleReplyClick}
            >
              {t("reply")}
            </button>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {comment?.createdAt &&
                formatInTimeZone(
                  comment?.createdAt,
                  "Europe/Rome",
                  "dd/MM/yyyy HH:mm",
                )}
            </p>
          </div>
        </div>
      </div>
      {/* Replies Section */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={toggleReplies}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            {isRepliesCollapsed ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 011.06 1.06l-7.5 7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("showReplies")}({comment.replies.length})
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("hideReplies")}({comment.replies.length})
              </>
            )}
          </button>

          {!isRepliesCollapsed && (
            <div className="ml-4 mt-2 border-l border-gray-200 dark:border-gray-700">
              {/* Indentation for replies */}
              {comment.replies.map((reply) => (
                <div key={reply._id} className="pl-4">
                  {/* Further indentation for each reply */}
                  <Comment
                    onReply={onReply}
                    comment={reply}
                    user={user}
                    deleteComment={deleteComment}
                    disabled={disabled}
                    highlightedComment={highlightedComment}
                    replyTo={replyTo}
                    postExtended={postExtended}
                    setReplyTo={setReplyTo}
                    setContent={setContent}
                    formatInTimeZone={formatInTimeZone}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <hr className="mt-4" />
      {/* Separator after each main comment and its replies */}
    </div>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    fromUser: PropTypes.shape({
      callsign: PropTypes.string,
      profilePic: PropTypes.string,
    }),
    content: PropTypes.string,
    createdAt: PropTypes.string,
    replies: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
      }),
    ),
  }).isRequired,
  user: PropTypes.shape({
    callsign: PropTypes.string,
    isAdmin: PropTypes.bool,
  }),
  postExtended: PropTypes.object,
  deleteComment: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  highlightedComment: PropTypes.string,
  replyTo: PropTypes.string,
  setReplyTo: PropTypes.func.isRequired,
  setContent: PropTypes.func.isRequired,
  formatInTimeZone: PropTypes.func.isRequired,
  onReply: PropTypes.func,
};

const CommentsSection = ({
  hideComments,
  postExtended,
  comments,
  alert,
  setAlert,
  user,
  disabled,
  deleteComment,
  sendComment,
  content,
  setContent,
  highlightedComment,
  replyTo,
  setReplyTo,
}) => {
  const commentContainerRef = useRef(null);
  const commentInputRef = useRef(null);
  const { t } = useTranslation();

  function onReply() {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    !hideComments && (
      <div
        ref={commentContainerRef}
        className="comment-section p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col w-full"
      >
        <h2 className="mb-1 text-xl font-semibold text-gray-700 dark:text-gray-300">
          {t("comments")}
        </h2>
        {alert && (
          <Alert
            className="mb-6 dark:text-black"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <Card className="comments-card max-h-[60vh] lg:max-h-[80vh] border-none bg-gray-50 dark:bg-gray-800 -mx-2 md:mx-0 overflow-y-auto">
          {comments?.map((comment) => (
            <Comment
              onReply={onReply}
              key={comment._id}
              comment={comment}
              user={user}
              postExtended={postExtended}
              deleteComment={deleteComment}
              disabled={disabled}
              highlightedComment={highlightedComment}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              setContent={setContent}
              formatInTimeZone={formatInTimeZone}
            />
          ))}
        </Card>

        {user ? (
          <div className="w-full">
            <hr className="my-2" />

            {replyTo && (
              <div className="flex gap-4 items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  <FaInfoCircle className="inline-block mr-1 mb-[2px]" />
                  {t("respondingToCommentOf")}{" "}
                  <span className="font-semibold">
                    {comments.find((c) => c._id === replyTo)?.fromUser.callsign}
                  </span>
                </span>

                <Button size="sm" color="red" onClick={() => setReplyTo(null)}>
                  {t("cancel")}
                </Button>
              </div>
            )}
            <form
              onSubmit={sendComment}
              className="w-full flex flex-row gap-2 items-center"
            >
              <Textarea
                type="text"
                ref={commentInputRef}
                className="comment-content w-full text-black dark:text-white"
                placeholder="Scrivi un commento"
                value={content}
                maxLength={300}
                onChange={(e) => setContent(e.target.value)}
                disabled={disabled}
                // handle ctrl+enter
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    sendComment();
                  }
                }}
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
          <div
            ref={commentInputRef}
            className="mt-4 mb-2 flex justify-center gap-2 bg-gray-50 dark:bg-gray-800 px-2 py-3 rounded items-center flex-col"
          >
            <p>{t("loginForCommenting")}</p>
            <FlowbiteButton
              as={Link}
              to={{
                pathname: "/login",
                search: createSearchParams({
                  to: location.pathname,
                }).toString(),
              }}
              className="w-fit"
              size="lg"
              color="blue"
            >
              {t("login")}
            </FlowbiteButton>
          </div>
        )}
      </div>
    )
  );
};

CommentsSection.propTypes = {
  hideComments: PropTypes.bool,
  postExtended: PropTypes.object, // Define a more specific shape if possible
  comments: PropTypes.arrayOf(PropTypes.object).isRequired, // Define a more specific shape if possible
  alert: PropTypes.shape({
    color: PropTypes.string,
    msg: PropTypes.string,
  }),
  setAlert: PropTypes.func.isRequired,
  user: PropTypes.shape({
    callsign: PropTypes.string,
    isAdmin: PropTypes.bool,
  }),
  disabled: PropTypes.bool.isRequired,
  deleteComment: PropTypes.func.isRequired,
  sendComment: PropTypes.func.isRequired,
  content: PropTypes.string.isRequired,
  setContent: PropTypes.func.isRequired,
  highlightedComment: PropTypes.string,
  replyTo: PropTypes.string,
  setReplyTo: PropTypes.func.isRequired,
};

export default CommentsSection;

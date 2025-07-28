import axios from "axios";
import { it } from "date-fns/locale";
import { Alert, Button, Spinner } from "flowbite-react";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { FaBackward, FaTrash } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Markdown from "react-markdown";
import Zoom from "react-medium-image-zoom";
import ReactPlaceholder from "react-placeholder";
import { Link, useNavigate, useParams } from "react-router";
import { UserContext } from "../App";
import { getErrorStr } from "../shared";
import { formatInTimeZone } from "../shared/formatInTimeZone";

const BlogPostViewer = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const { t } = useTranslation();

  const { id } = useParams();

  useEffect(() => {
    async function getBlogPost() {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/blog/" + id);
        setPost(data);
      } catch (err) {
        console.log("Errore nel caricamento del post", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err),
        });
      } finally {
        setLoading(false);
      }
    }

    getBlogPost();
  }, [id]);

  const { user } = useContext(UserContext);

  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);

  async function deletePost() {
    if (disabled) return;

    const ok = window.confirm("Sei sicuro di voler eliminare questo post?");
    {
      t("callsign");
    }
    if (!ok) return;

    setDisabled(true);
    try {
      await axios.delete("/api/blog/" + id);
      window.alert("Post eliminato con successo");
      navigate(-1);
    } catch (err) {
      console.log("Errore nell'eliminazione del post", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setDisabled(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>{post ? post.title : "Blog"} - VHF e superiori</title>
      </Helmet>
      <div className="mx-auto px-4 w-full md:w-5/6 pt-8 pb-2">
        <div className="md:-ml-4 md:-mt-4 flex justify-between">
          <Link to={-1}>
            <Button color="gray" outline>
              <FaBackward />
            </Button>
          </Link>

          {user?.isAdmin && (
            <Button color="failure" onClick={deletePost} disabled={disabled}>
              <FaTrash className="inline mr-1" />
              {disabled ? <Spinner /> : "Elimina post"}
            </Button>
          )}
        </div>
      </div>

      <div className="w-full h-full dark:bg-gray-900 dark:text-white">
        <div className="mx-auto px-4 w-full md:w-5/6 my-4">
          {alert && (
            <Alert
              className="mb-6 dark:text-black"
              color={alert.color}
              onDismiss={() => setAlert(null)}
            >
              <span>{alert.msg}</span>
            </Alert>
          )}
        </div>
      </div>

      <ReactPlaceholder
        type="text"
        rows={10}
        ready={!loading}
        showLoadingAnimation
      >
        <div className="mx-auto px-4 w-full md:w-5/6 my-4">
          {post ? (
            <>
              <h1 className="text-4xl font-bold dark:text-white">
                {post.title}
              </h1>

              {post.image && (
                <div className="my-4">
                  <Zoom>
                    <LazyLoadImage
                      className="w-full max-h-56 drop-shadow-lg object-center object-contain"
                      src={post.image}
                      alt={post.title}
                    />
                  </Zoom>
                </div>
              )}

              <Markdown className="markdown">{post.contentMd}</Markdown>

              <p className="text-sm text-gray-500 mt-24 dark:text-gray-400">
                Pubblicato il{" "}
                {formatInTimeZone(
                  new Date(post.createdAt),
                  "Europe/Rome",
                  "dd MMMM yyyy 'alle' HH:mm",
                  { locale: it },
                )}{" "}
                da {post.fromUser?.callsign || "--"}
              </p>
            </>
          ) : (
            <p>Errore nel caricamento</p>
          )}
        </div>
      </ReactPlaceholder>
    </>
  );
};

export default BlogPostViewer;

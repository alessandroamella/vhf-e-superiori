import axios, { isAxiosError } from "axios";
import { Alert, Button, Spinner } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { FaBackward, FaTrash } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { getErrorStr } from "../shared";
import useUserStore from "../stores/userStore";
import ViewPostContent from "./ViewPostContent";

const ViewPost = () => {
  const { id } = useParams();

  const { user, setUser } = useUserStore(
    useShallow((store) => ({
      user: store.user,
      setUser: store.setUser,
    })),
  );
  const [deleteDisabled, setDeleteDisabled] = useState(false);

  const [alert, setAlert] = useState(null);

  const [postExtended, setPostExtended] = useState(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to run this only once
  useEffect(() => {
    async function loadPost() {
      try {
        const { data } = await axios.get(`/api/post/${id}`);
        console.log("post", data);
        setPostExtended({ post: data.post, pics: data.pps || {} });
      } catch (err) {
        console.log(err);
        if (isAxiosError(err) && err.response.status === 404) {
          setAlert({
            color: "failure",
            msg: "Post non trovato",
          });
        } else {
          setAlert({
            color: "failure",
            msg: getErrorStr(err?.response?.data?.err),
          });
        }
        setPostExtended(null);
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
    loadPost();
  }, []);

  const navigate = useNavigate();

  async function deletePost(p) {
    if (!window.confirm(`Vuoi davvero eliminare il post "${p.description}"?`)) {
      return;
    }

    setDeleteDisabled(true);

    try {
      await axios.delete(`/api/post/${p._id}`);
      setAlert({
        color: "success",
        msg: "Post eliminato con successo",
      });
      setUser({ ...user, posts: user.posts.filter((_p) => _p._id !== p._id) });
      navigate("/social");
    } catch (err) {
      console.log("error in post delete", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
    } finally {
      setDeleteDisabled(false);
    }
  }

  const post = useMemo(() => postExtended?.post, [postExtended]);

  return (
    <>
      <Helmet>
        <title>{post?.description || "Post"} - VHF e superiori</title>
      </Helmet>
      <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        <div className="flex justify-between items-center">
          <Link to={-1}>
            <Button color="gray" outline>
              <FaBackward />
            </Button>
          </Link>
          {post && user && post.fromUser === user._id && (
            <Button
              disabled={deleteDisabled}
              color="failure"
              onClick={() => deletePost(post)}
            >
              {deleteDisabled ? <Spinner /> : <FaTrash />}
            </Button>
          )}
        </div>
        {alert && (
          <Alert
            className="my-6 dark:text-black"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <div className="mt-2 flex justify-center w-full">
          <ViewPostContent postExtended={postExtended} />
        </div>
      </div>
    </>
  );
};

export default ViewPost;

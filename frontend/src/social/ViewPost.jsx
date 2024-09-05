import Layout from "../Layout";
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";

import axios from "axios";
import { Alert, Button, Spinner } from "flowbite-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ViewPostContent from "./ViewPostContent";
import { FaBackward, FaTrash } from "react-icons/fa";
import { Helmet } from "react-helmet";
import { getErrorStr } from "../shared";

const ViewPost = () => {
  const { id } = useParams();

  const { user, setUser } = useContext(UserContext);

  const [deleteDisabled, setDeleteDisabled] = useState(false);

  const [alert, setAlert] = useState(null);

  const [post, setPost] = useState(null);
  const [pic, setPic] = useState(null);

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

  const navigate = useNavigate();

  async function deletePost(p) {
    if (!window.confirm(`Vuoi davvero eliminare il post "${p.description}"?`)) {
      return;
    }

    setDeleteDisabled(true);

    try {
      await axios.delete("/api/post/" + p._id);
      setAlert({
        color: "success",
        msg: "Post eliminato con successo"
      });
      setUser({ ...user, posts: user.posts.filter(_p => _p._id !== p._id) });
      navigate("/social");
    } catch (err) {
      console.log("error in post delete", err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err)
      });
    } finally {
      setDeleteDisabled(false);
    }
  }

  return (
    <Layout>
      <Helmet>
        <title>{post?.description || "Post"} - VHF e superiori</title>
      </Helmet>
      <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        <div className="flex justify-between items-center">
          <Link to={-1}>
            <Button color="light">
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
            className="mb-6 dark:text-black"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        <div className="mt-2 flex justify-center w-full">
          <ViewPostContent post={post} pic={pic} />
        </div>
      </div>
    </Layout>
  );
};

export default ViewPost;

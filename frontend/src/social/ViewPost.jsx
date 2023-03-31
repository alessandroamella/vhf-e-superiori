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
import { Alert, Button } from "flowbite-react";
import { Link, useParams } from "react-router-dom";
import ViewPostContent from "./ViewPostContent";
import { FaBackward } from "react-icons/fa";

const ViewPost = () => {
  const { id } = useParams();

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

        <div className="mt-2 flex justify-center w-full">
          <ViewPostContent post={post} pic={pic} />
        </div>
      </div>
    </Layout>
  );
};

export default ViewPost;

import Layout from "../Layout";
import { useEffect, useState } from "react";
import { getErrorStr } from "..";

import "react-medium-image-zoom/dist/styles.css";
import "react-placeholder/lib/reactPlaceholder.css";

import axios from "axios";
import { Alert, Avatar, Button } from "flowbite-react";
import { Link, useParams } from "react-router-dom";
import ReactPlaceholder from "react-placeholder/lib";
import { FaBackward } from "react-icons/fa";
import { Carousel } from "react-responsive-carousel";

const ViewPost = () => {
  const { id } = useParams();

  const [alert, setAlert] = useState(null);

  const [post, setPost] = useState(null);
  const [pic, setPic] = useState(null);

  useEffect(() => {
    async function loadPost() {
      try {
        const { data } = await axios.get("/api/post/" + id);
        setPost(data.post);
        if (pic) setPic(data.pic);
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
                <Carousel>
                  {post.pictures.map(p => (
                    <div key={p}>
                      <img src={p} alt="Post pic" />
                    </div>
                  ))}
                </Carousel>
              )}
              <img
                src={post?.pictures[0] || "/no-image.png"}
                className="h-64 object-cover w-full"
                alt="Post main"
              />
            </ReactPlaceholder>
            <div className="p-4 flex bg-[rgba(0,0,0,0.33)] w-full">
              <div className="w-full">
                <h5 className="line-clamp-1 text-2xl font-bold tracking-tight text-white">
                  <ReactPlaceholder
                    showLoadingAnimation
                    type="text"
                    rows={1}
                    ready={!!post?.description}
                  >
                    {post?.description}
                  </ReactPlaceholder>
                </h5>
                <p className="font-normal text-gray-200 line-clamp-2">
                  <ReactPlaceholder
                    showLoadingAnimation
                    type="text"
                    rows={2}
                    ready={!!post?.description}
                  >
                    <div className="flex items-center gap-2">
                      <span>{post?.band} MHz</span>
                      <span>{post?.brand}</span>
                      <span>{post?.numberOfElements} elementi</span>
                    </div>
                  </ReactPlaceholder>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pic && <Avatar img={pic} rounded />}
                <ReactPlaceholder
                  showLoadingAnimation
                  type="text"
                  rows={1}
                  ready={!!post?.fromUser?.callsign}
                >
                  <p className="uppercase tracking-tight font-semibold text-lg text-gray-100">
                    {post?.fromUser?.callsign}
                  </p>
                </ReactPlaceholder>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewPost;

import React, { useContext, useEffect, useState } from "react";
import Layout from "../Layout";
import { Helmet } from "react-helmet";
import axios from "axios";
import { UserContext } from "../App";
import { Alert, Button, Card, Tooltip } from "flowbite-react";
import ReactPlaceholder from "react-placeholder";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Link } from "react-router-dom";
import { FaCircle, FaPlus } from "react-icons/fa";
import Markdown from "react-markdown";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";
import { getErrorStr } from "../shared";

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const { user } = useContext(UserContext);

  useEffect(() => {
    async function getBlogPosts() {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/blog");
        setBlogPosts(data);
      } catch (err) {
        console.log("Errore nel caricamento dei post", err);
        setAlert({
          color: "failure",
          msg: getErrorStr(err?.response?.data?.err)
        });
      } finally {
        setLoading(false);
      }
    }

    getBlogPosts();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Blog - VHF e superiori</title>
      </Helmet>
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

      {user?.isAdmin && (
        <div className="w-full flex justify-center">
          <Tooltip content="Vedi questo in quanto sei un amministratore">
            <Link to="/blog/editor">
              <Button>
                <FaPlus className="mr-2" /> Nuovo post
              </Button>
            </Link>
          </Tooltip>
        </div>
      )}

      <ReactPlaceholder
        type="text"
        rows={10}
        ready={!loading}
        showLoadingAnimation
      >
        {blogPosts ? (
          <div className="mx-auto px-4 w-full md:w-5/6 mt-4 mb-24 min-h-[20vh]">
            {blogPosts.map(post => (
              <div className="mb-4" key={post._id}>
                <Link to={`/blog/${post._id}`}>
                  <Card
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    color="white"
                  >
                    <div className="flex justify-center md:justify-start gap-4 md:gap-8 flex-col md:flex-row">
                      {post.image && (
                        <LazyLoadImage
                          src={post.image}
                          alt={post.title}
                          className="w-24 h-24 object-cover"
                        />
                      )}
                      <div className="w-full">
                        <div className="flex w-full">
                          <h2 className="w-full text-2xl text-gray-800 dark:text-white font-bold">
                            {post.title}
                          </h2>
                          <p className="text-gray-500 text-sm min-w-[12rem] text-right dark:text-gray-400">
                            {formatDistance(
                              new Date(post.createdAt),
                              new Date(),
                              {
                                addSuffix: true,
                                locale: it
                              }
                            )}
                            {post.fromUser?.callsign && (
                              <>
                                <FaCircle className="scale-[.25] inline mx-1" />
                                {post.fromUser.callsign}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="relative max-h-[4rem] overflow-hidden">
                          <Markdown className="markdown overflow-hidden text-gray-700 dark:text-gray-300">
                            {post.contentMd}
                          </Markdown>
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-800" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
            {blogPosts.length === 0 && (
              <p className="dark:text-white mt-8">
                Non ci sono post da visualizzare.
              </p>
            )}
          </div>
        ) : (
          <p>Errore nel caricamento</p>
        )}
      </ReactPlaceholder>
    </Layout>
  );
};

export default Blog;

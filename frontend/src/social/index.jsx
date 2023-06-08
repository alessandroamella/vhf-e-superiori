import Layout from "../Layout";
import { useEffect, useState } from "react";
import { ReadyContext, SplashContext } from "..";
import { useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Splash from "../Splash";

import "react-medium-image-zoom/dist/styles.css";
import FeedCard from "./FeedCard";

import "react-placeholder/lib/reactPlaceholder.css";
import axios from "axios";
import { Alert, Button, Spinner } from "flowbite-react";
import InfiniteScroll from "react-infinite-scroll-component";
import MenuContent from "../sideMenu/MenuContent";
import { FaPlus } from "react-icons/fa";

const Social = () => {
  const { splashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [searchParams] = useSearchParams();

  const [alert, setAlert] = useState(null);

  const [posts, setPosts] = useState([]);
  const [profilePictures, setProfilePictures] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const [cursor, setCursor] = useState(0);

  const navigate = useNavigate();

  const cursorLimit = 10;

  useEffect(() => {
    async function fetchPosts() {
      console.log(
        "fetching posts from " + cursor + " to " + (cursor + cursorLimit)
      );
      const { data } = await axios.get("/api/post", {
        params: {
          limit: cursorLimit,
          offset: cursor
        }
      });
      console.log("new posts", data, "\nall posts", [...posts, ...data.posts]);
      setPosts([...posts, ...data.posts]);
      setProfilePictures([...profilePictures, ...data.pp]);
      console.log("new pps", profilePictures, "\nall pps", [
        ...profilePictures,
        ...data.pp
      ]);
      setHasMore(data.posts.length > 0);
      setPostsLoaded(true);
    }
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  function fetchMorePosts() {
    setCursor(cursor + cursorLimit);
  }

  const [hasMore, setHasMore] = useState(true);

  return (
    <Layout>
      {!splashPlayed && <Splash ready={ready} />}

      <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        {alert && (
          <Alert
            className="mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        {searchParams?.get("created") && (
          <Alert
            className="mb-6"
            color="success"
            onDismiss={() => navigate("/social")}
          >
            <p>
              Post{" "}
              <span className="font-semibold">
                {searchParams?.get("created")}
              </span>{" "}
              creato con successo!
            </p>
            {/* <p>Dovrà essere approvato prima di essere visibile pubblicamente</p> */}
          </Alert>
        )}

        <Button
          onClick={() => navigate("new")}
          className="flex rounded-full w-16 h-16 aspect-square items-center fixed bottom-8 right-8 z-40"
        >
          <Link to="new" className="text-xl text-white">
            <FaPlus />
          </Link>
          {/* <span className="ml-1">Nuovo post</span> */}
        </Button>

        <div className="grid md:gap-8 grid-cols-1 md:grid-cols-3">
          <div className="hidden h-screen sticky top-0 md:block dark:bg-gray-700 rounded-xl px-8 pt-4">
            <div className="overflow-y-scroll overflow-x-hidden h-[95vh] hide-scrollbar">
              <MenuContent isSideBar />
            </div>
          </div>
          <div className="col-span-2">
            {postsLoaded ? (
              posts.length > 0 ? (
                <InfiniteScroll
                  dataLength={posts.length}
                  next={fetchMorePosts}
                  hasMore={hasMore}
                  className="overflow-hidden"
                  loader={
                    <h4 className="w-full text-center">
                      <Spinner />
                    </h4>
                  }
                  endMessage={
                    <p style={{ textAlign: "center", display: "none" }}>
                      <b>Per ora è tutto!</b>
                    </p>
                  }
                >
                  <div className="p-5">
                    {posts.map(p => (
                      <FeedCard key={p._id} post={p} pp={profilePictures} />
                    ))}
                  </div>
                </InfiniteScroll>
              ) : (
                <div className="p-5">
                  <p>Ancora nessun post</p>
                  <p className="text-gray-500 italic">Tutto tace...</p>
                </div>
              )
            ) : (
              <div className="p-5">
                {[...Array(10).keys()].map(e => (
                  <FeedCard key={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Social;

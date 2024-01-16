import Layout from "../Layout";
import { useEffect, useState } from "react";
import { ReadyContext, SplashContext } from "..";
import { useContext } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import Splash from "../Splash";

import "react-medium-image-zoom/dist/styles.css";
import FeedCard from "./FeedCard";

import "react-placeholder/lib/reactPlaceholder.css";
import axios from "axios";
import { Alert, Button, Card, Spinner } from "flowbite-react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FaArrowLeft } from "react-icons/fa";

const ViewPublished = () => {
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

  const { id } = useParams();
  const callsign = searchParams.get("callsign");
  const name = searchParams.get("name");

  useEffect(() => {
    async function fetchPosts() {
      console.log(
        "fetching posts from " + cursor + " to " + (cursor + cursorLimit)
      );
      const { data } = await axios.get("/api/post", {
        params: {
          limit: cursorLimit,
          offset: cursor,
          fromUser: id
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

      <div className="px-0 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
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
        <Button className="mb-4" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </Button>

        <Button
          onClick={() => navigate("new")}
          // className="flex rounded-full w-16 h-16 aspect-square items-center fixed bottom-8 right-8 z-40"
          className="flex rounded-full uppercase items-center fixed bottom-8 right-8 z-40"
        >
          <Link to="new" className="text-xl text-white font-bold">
            {/* <FaPlus /> */}
            Inserisci foto / video
          </Link>
          {/* <span className="ml-1">Nuovo post</span> */}
        </Button>

        <div className="col-span-2">
          {callsign && (
            // card of user
            <div className="flex w-full justify-center">
              <Card className="bg-gray-50 dark:bg-gray-600 md:px-12">
                <div className="flex gap-4 items-center flex-row justify-center w-full">
                  {profilePictures.length > 0 && (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={profilePictures[0].url}
                      alt="Profile"
                    />
                  )}
                  <div className="flex flex-col gap-0">
                    {callsign && (
                      <h2 className="font-bold text-xl">{callsign}</h2>
                    )}
                    {name && <p>{name}</p>}
                  </div>
                </div>
              </Card>
            </div>
          )}
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
                <div className="p-0 md:p-5 grid grid-cols-1 md:grid-cols-2">
                  {posts.map(p => (
                    <FeedCard
                      setAlert={setAlert}
                      key={p._id}
                      post={p}
                      pp={profilePictures}
                      posts={posts}
                      setPosts={setPosts}
                    />
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
    </Layout>
  );
};

export default ViewPublished;

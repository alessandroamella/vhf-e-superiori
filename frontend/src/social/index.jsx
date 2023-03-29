import Layout from "../Layout";
import { useEffect, useState } from "react";
import { EventsContext, ReadyContext, SplashContext, UserContext } from "..";
import { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Splash from "../Splash";

import "react-medium-image-zoom/dist/styles.css";
import { Card } from "@material-tailwind/react";
import FeedCard from "./FeedCard";

import "react-placeholder/lib/reactPlaceholder.css";
import axios from "axios";
import { Alert, Button } from "flowbite-react";
import { FaPlus } from "react-icons/fa";

const Social = () => {
  const { user } = useContext(UserContext);
  const { events } = useContext(EventsContext);
  const { splashPlayed, setSplashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [searchParams] = useSearchParams();

  const [alert, setAlert] = useState(null);

  const [posts, setPosts] = useState();
  const [profilePictures, setProfilePictures] = useState();
  const [postsLoaded, setPostsLoaded] = useState(false);

  const [cursor, setCursor] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await axios.get("/api/post", {
        params: {
          limit: 10,
          offset: cursor
        }
      });
      console.log("posts", data);
      setPosts(data.posts);
      setProfilePictures(data.pp);
    }
    fetchPosts();
  }, [cursor]);

  useEffect(() => {
    if (posts) {
      setPostsLoaded(true);
    }
  }, [posts]);

  // const navigate = useNavigate();

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
            <p>Dovrà essere approvato prima di essere visibile pubblicamente</p>
          </Alert>
        )}

        <div className="grid md:gap-8 grid-cols-1 md:grid-cols-3">
          <div className="hidden md:block h-full bg-gray-100 dark:bg-gray-700 rounded-xl p-8">
            <Button
              onClick={() => navigate("new")}
              className="flex items-center"
            >
              <FaPlus /> <span className="ml-1">Nuovo post</span>
            </Button>
          </div>
          <div className="col-span-2">
            {postsLoaded ? (
              posts.map(p => (
                <FeedCard key={p._id} post={p} pp={profilePictures} />
              ))
            ) : (
              <FeedCard />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Social;

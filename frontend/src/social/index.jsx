import Layout from "../Layout";
import { useEffect, useState } from "react";
import { EventsContext, ReadyContext, SplashContext, UserContext } from "..";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Splash from "../Splash";

import "react-medium-image-zoom/dist/styles.css";
import { Card } from "@material-tailwind/react";
import FeedCard from "./FeedCard";

import "react-placeholder/lib/reactPlaceholder.css";
import axios from "axios";
import { Alert } from "flowbite-react";

const Social = () => {
  const { user } = useContext(UserContext);
  const { events } = useContext(EventsContext);
  const { splashPlayed, setSplashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [alert, setAlert] = useState(null);

  const posts = useState(null);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await axios.get("/api/post", {
        params: {
          limit: 10,
          offset: cursor
        }
      });
      console.log("posts", data);
    }
    fetchPosts();
  }, []);

  const navigate = useNavigate();

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

        <div className="grid md:gap-8 grid-cols-1 md:grid-cols-3">
          <div className="hidden md:block h-full bg-gray-700 rounded-xl p-8">
            <p>i sassi</p>
          </div>
          <div className="col-span-2">
            <FeedCard />
            <FeedCard />
            <FeedCard />
            <FeedCard />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Social;

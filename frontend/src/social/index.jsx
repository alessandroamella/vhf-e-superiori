import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ReadyContext, SplashContext } from "../App";
import Splash from "../Splash";

import FeedCard from "./FeedCard";

import axios from "axios";
import { Alert, Button, Spinner, TextInput } from "flowbite-react";
import { uniqBy } from "lodash";
import { FaPlus, FaUserTag } from "react-icons/fa";
import InfiniteScroll from "react-infinite-scroll-component";
import MenuContent from "../sideMenu/MenuContent";

const Social = () => {
  const { splashPlayed } = useContext(SplashContext);
  const { ready } = useContext(ReadyContext);

  const [searchParams] = useSearchParams();

  const [alert, setAlert] = useState(null);

  const [posts, setPosts] = useState([]);
  const [profilePictures, setProfilePictures] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const [cursor, setCursor] = useState(0);

  const [filterCallsign, setFilterCallsign] = useState(null);

  const navigate = useNavigate();

  const cursorLimit = 100;

  const fetchPosts = useCallback(
    async (fromDate) => {
      console.log(
        "fetching posts from " + cursor + " to " + (cursor + cursorLimit),
        " fromDate: ",
        fromDate
      );
      const { data } = await axios.get("/api/post", {
        params: {
          limit: cursorLimit,
          offset: cursor,
          ...(fromDate && { fromDate })
        }
      });
      console.log("new posts", data, "\nall posts", [...posts, ...data.posts]);
      if (data.posts.length > 0) {
        console.log("setting posts");
        setPosts(
          uniqBy(
            fromDate ? [...data.posts, ...posts] : [...posts, ...data.posts]
          ),
          "_id"
        );
      } else {
        console.log("no new posts");
      }
      if (data.pp.length) {
        setProfilePictures(
          uniqBy([...profilePictures, ...data.pp], "callsign")
        );
        console.log("new pps", profilePictures, "\nall pps", [
          ...profilePictures,
          ...data.pp
        ]);
      } else {
        console.log("no new profile pictures");
      }
      setHasMore(data.posts.length > 0);
      setPostsLoaded(true);
    },
    [cursor, posts, profilePictures]
  );

  useEffect(() => {
    fetchPosts();
    // don't listen for orderBy: there will be a useEffect to reset cursor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  useEffect(() => {
    if (!posts || posts.length === 0) return;
    let didFirstFetch = false;
    const fetchPostsInterval = setInterval(() => {
      if (!didFirstFetch) {
        // skip first fetch
        didFirstFetch = true;
        return;
      }
      fetchPosts(posts[0].createdAt);
      // every 4 sec
    }, 4 * 1000);

    return () => clearInterval(fetchPostsInterval);
  }, [fetchPosts, posts]);

  function fetchMorePosts() {
    setCursor(cursor + cursorLimit);
  }

  const [hasMore, setHasMore] = useState(true);

  const scrollTo = searchParams.get("scrollTo");
  useEffect(() => {
    if (!posts || !scrollTo) return;

    document.getElementById("post-" + scrollTo)?.scrollIntoView();
    searchParams.delete("scrollTo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTo, posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter(
      (p) =>
        !filterCallsign ||
        p.fromUser.callsign.includes(
          filterCallsign
            ?.replace(/[^a-zA-Z0-9/]/g, "")
            ?.trim()
            .toUpperCase()
        )
    );
  }, [filterCallsign, posts]);

  return (
    <>
      {!splashPlayed && <Splash ready={ready} />}

      <Helmet>
        <title>Social</title>
        <meta
          name="description"
          content="Visualizza e condividi foto e video con gli altri piloti"
        />
      </Helmet>

      <div className="px-0 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        {alert && (
          <Alert
            className="mb-6 dark:text-black"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        {searchParams?.get("created") && (
          <Alert
            className="mb-6 dark:text-black"
            color="success"
            onDismiss={() => navigate("/social")}
          >
            <p>
              Post{" "}
              <span className="font-semibold">
                {searchParams?.get("created")}
              </span>{" "}
              creato con successo! 🎉
            </p>

            <p>
              I contenuti sono in fase di elaborazione, il post sarà visibile
              tra pochi minuti.
            </p>
          </Alert>
        )}

        <div className="flex justify-center gap-4">
          <TextInput
            value={filterCallsign}
            onChange={(e) => setFilterCallsign(e.target.value || null)}
            placeholder="Cerca per nominativo..."
            icon={FaUserTag}
          />
        </div>

        <Button
          className="flex rounded-full uppercase items-center fixed bottom-8 right-8 z-40"
          as={Link}
          to="/social/new"
        >
          <Link
            to="/social/new"
            className="text-xl text-white font-bold flex items-center gap-2"
          >
            <FaPlus />
            Inserisci foto / video
          </Link>
        </Button>

        <div className="grid md:gap-8 grid-cols-1 md:grid-cols-3">
          <div className="hidden h-screen sticky top-0 md:block dark:bg-gray-700 rounded-xl px-8 pt-4">
            <div className="overflow-y-scroll overflow-x-hidden hide-scrollbar">
              <MenuContent isSideBar />
            </div>
          </div>
          <div className="col-span-2">
            {/* DEBUG */}
            {/* <Alert className="mb-6 dark:text-black" color="warning">
              <div className="flex items-center gap-1">
                <FaExclamationTriangle />{" "}
                <h3 className="text-lg font-semibold">
                  Sospensione temporanea
                </h3>
              </div>
              <p>
                Questa sezione è temporaneamente sospesa per manutenzione.
                Prevediamo di rinnovare e riaprire il caricamento di contenuti
                al più presto. Grazie per la comprensione.
              </p>
            </Alert> */}
            {postsLoaded ? (
              filteredPosts.length > 0 ? (
                <InfiniteScroll
                  dataLength={filteredPosts.length}
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
                  <div className="p-0 md:p-5">
                    {filteredPosts.map((p) => (
                      <FeedCard
                        id={"post-" + p._id}
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
                  {filteredPosts?.length === posts?.length ? (
                    <p>Ancora nessun post</p>
                  ) : (
                    <p>
                      Nessun post trovato con nominativo &quot;
                      <strong>{filterCallsign}</strong>&quot;
                    </p>
                  )}
                </div>
              )
            ) : (
              <div className="p-5">
                {[...Array(10).keys()].map((e) => (
                  <FeedCard key={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Social;

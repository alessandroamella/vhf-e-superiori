import Layout from "../Layout";
import React, { useEffect, useMemo, useState } from "react";
import { getErrorStr, UserContext } from "..";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import "react-medium-image-zoom/dist/styles.css";

import axios from "axios";
import {
  Alert,
  Button,
  Label,
  Progress,
  Spinner,
  Textarea
} from "flowbite-react";
import { FaBackward, FaInfoCircle, FaPlus } from "react-icons/fa";
import { createSearchParams, useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import ViewPostContent from "./ViewPostContent";
import BMF from "browser-md5-file";
import FileUploader from "./FileUploader";

let statusInterval = null;

const FileUploaderMemo = React.memo(
  ({ files, setFiles, disabled, maxPhotos, maxVideos }) => {
    const pictures = useMemo(() => {
      return files.filter(file => file.type.includes("image"));
    }, [files]);

    return (
      <FileUploader
        disabled={disabled}
        color={!pictures.length && "failure"}
        setFiles={setFiles}
        files={files}
        maxPhotos={maxPhotos}
        maxVideos={maxVideos}
      />
    );
  }
);

const NewPost = () => {
  const maxPhotos = 5;
  const maxVideos = 2;

  const { user } = useContext(UserContext);

  const [uploadMap, setUploadMap] = useState(new Map());

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeunload", e => {
      e?.preventDefault();
      if (e) {
        e.returnValue = ""; // Legacy method for cross browser support
      }
      return ""; // Legacy method for cross browser support
    });
  }, []);

  const { register, handleSubmit, formState, watch } = useForm();

  const watchedDescription = watch("description");

  async function calculateMd5(f) {
    return new Promise((resolve, reject) => {
      const bmf = new BMF();
      bmf.md5(
        f,
        (err, md5) => {
          if (err) {
            console.log("err in md5 calculation:", err);
            return reject(err);
          } else {
            return resolve(md5);
          }
        },
        progress => {
          // console.log("progress number:", progress);
        }
      );
    });
  }

  useEffect(() => {
    if (user === null)
      return navigate({
        pathname: "/login",
        search: createSearchParams({
          to: "/social/new"
        }).toString()
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const navigate = useNavigate();

  const [pictures, setPictures] = useState([]);
  const [videos, setVideos] = useState([]);

  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!files || files.length === 0) return;
    const newPictures = [];
    const newVideos = [];
    for (const f of files) {
      if (f.type.includes("image")) newPictures.push(f);
      else if (f.type.includes("video")) newVideos.push(f);
    }
    setPictures(newPictures);
    setVideos(newVideos);
  }, [files]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [createdAt, setCreatedAt] = useState(null);

  const onSubmit = async data => {
    console.log(data);

    if (!pictures || pictures.length === 0) {
      setAlert({
        color: "failure",
        msg: "Devi aggiungere almeno una foto"
      });

      return;
    }

    setDisabled(true);
    setIsSubmitting(true);

    uploadMap.clear();
    setUploadMap(new Map());

    for (const f of [...pictures, ...videos]) {
      try {
        const md5 = await calculateMd5(f);

        setUploadMap(new Map(uploadMap.set(md5, { name: f.name, percent: 0 })));

        console.log("md5 string of " + f.name + ":", md5);
      } catch (err) {
        console.log("err in md5 calculation:", err);
      }
    }

    setIsUploadingFiles(true);
    setCreatedAt(new Date());

    // This will take a very long time to complete
    const filesPath = await uploadPicturesAndVideos();

    setIsUploadingFiles(false);
    uploadMap.clear();
    setUploadMap(new Map());

    if (!filesPath) {
      setDisabled(false);
      setIsSubmitting(false);
      setCreatedAt(null);
      return;
    }

    const postCreated = await createPost({ filesPath, formValues: data });
    if (!postCreated) {
      setDisabled(false);
      setIsSubmitting(false);
      setCreatedAt(null);
      return;
    }

    navigate({
      pathname: "/social",
      search: createSearchParams({
        created: data.description
      }).toString()
    });
  };

  const uploadPicturesAndVideos = async () => {
    const formData = new FormData();
    console.log(pictures);
    const content = [...pictures, ...videos];
    content.forEach(f => formData.append("content", f));

    try {
      const { data } = await axios.post("/api/post/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        timeout: 5 * 60 * 1000 // 5 minutes timeout
      });
      console.log("filesPath", data);
      return data;
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
      return null;
    }
  };

  /**
   * Creates a post with the specified file paths and URL type.
   *
   * @param {Object} options - The options for the post.
   * @param {string[]} options.filesPath - An array of file paths to be sent with the post.
   * @returns {Promise<any>} A Promise that resolves to any value.
   */
  const createPost = async ({ filesPath, formValues }) => {
    try {
      const { data } = await axios.post(`/api/post`, {
        ...formValues,
        filesPath
      });
      console.log(data);
      return true;
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
      return false;
    }
  };

  useEffect(() => {
    if (!isUploadingFiles) {
      clearInterval(statusInterval);
      statusInterval = null;
      return;
    }

    // emit a upload status socket event every 5 seconds
    if (!statusInterval) {
      statusInterval = setInterval(async () => {
        console.log(
          "emit upload status",
          [...uploadMap.keys()],
          [...uploadMap.values()]
        );
        try {
          const { data } = await axios.post("/api/post/uploadstatus", {
            md5s: [...uploadMap.keys()]
          });
          for (const e of data) {
            setUploadMap(
              new Map(
                uploadMap.set(e.md5, {
                  ...uploadMap.get(e.md5),
                  percent: e.percent
                })
              )
            );
          }
        } catch (err) {}
      }, 1000);
      console.log("Starting emit status interval");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploadingFiles]);

  function navigateBack() {
    window.confirm(
      "Sei sicuro di voler tornare indietro? Tutti i dati inseriti verranno persi."
    )
      ? navigate("/social")
      : window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
  }

  const { errors, isValid } = formState;

  const postDescription = watchedDescription;
  const postPictures = useMemo(
    () =>
      [...Array(pictures.length).keys()].map(e =>
        window.URL.createObjectURL(pictures[e])
      ),
    [pictures]
  );
  const postVideos = useMemo(
    () =>
      [...Array(videos.length).keys()].map(e =>
        window.URL.createObjectURL(videos[e])
      ),
    [videos]
  );
  const postUser = user;

  const post = useMemo(() => {
    const postCreatedAt = createdAt || new Date(); // Spostato qui

    return {
      description: postDescription,
      createdAt: postCreatedAt,
      pictures: postPictures,
      videos: postVideos,
      fromUser: postUser
    };
  }, [createdAt, postDescription, postPictures, postVideos, postUser]);

  return (
    <Layout>
      {!user &&
        navigate({
          pathname: "/login",
          search: createSearchParams({
            to: "/social/new"
          }).toString()
        })}
      <div className="px-4 md:px-12 max-w-full pt-2 md:pt-4 pb-12 min-h-[80vh] bg-white dark:bg-gray-900 dark:text-white">
        <Button
          onClick={navigateBack}
          disabled={isSubmitting || isUploadingFiles}
          color="light"
        >
          <FaBackward />
        </Button>
        {alert && (
          <Alert
            className="mt-2 mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}
        {user && !user.isVerified && (
          <Alert className="mt-2 mb-6" color="warning">
            <span className="font-bold">Attenzione!</span> La tua email non è
            verificata. Per favore clicca il link di verifica che ti abbiamo
            inviato per email per creare un post.
          </Alert>
        )}
        {user ? (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="h2" className="mt-3">
                Nuovo post
              </Typography>
              <FileUploaderMemo
                files={files}
                setFiles={setFiles}
                disabled={disabled}
                maxPhotos={maxPhotos}
                maxVideos={maxVideos}
              />
              <div className="my-4">
                <Label
                  htmlFor="description"
                  value="Descrizione (max 300 caratteri)"
                />
                <Textarea
                  rows={3}
                  type="text"
                  {...register("description", {
                    required: true,
                    maxLength: 300,
                    minLength: 1
                  })}
                  minLength={1}
                  maxLength={300}
                  name="description"
                  id="description"
                  color={errors.description ? "failure" : undefined}
                  placeholder="La mia Yagi 6 elementi..."
                />
              </div>

              <div className="flex justify-center items-center flex-col">
                <Button disabled={disabled} type="submit" className="mb-2">
                  {isSubmitting ? (
                    <Spinner className="dark:text-white dark:fill-white" />
                  ) : (
                    <FaPlus className="dark:text-white dark:fill-white" />
                  )}
                  <span className="ml-1 font-semibold">
                    {!isSubmitting
                      ? "Crea post"
                      : isUploadingFiles
                      ? "Caricamento dei file"
                      : "Creazione post"}
                  </span>
                </Button>
                {[...uploadMap.keys()].length > 0 && (
                  <>
                    <p className="text-center">È normale che ci metta un po'</p>
                    {[...uploadMap.entries()].map(
                      ([md5, { name, percent }]) => (
                        <div key={md5} className="mb-2 w-56">
                          <Typography
                            variant="h5"
                            className="text-center truncate max-w-full dark:text-gray-200"
                            style={{ maxWidth: "calc(100% - 3rem)" }}
                            title={name}
                          >
                            {name}: {Math.round(percent)}%
                          </Typography>
                          <Progress
                            progress={percent || 0}
                            size="sm"
                            className="w-full"
                            color="dark"
                          />
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </form>

            <div className="mt-8">
              <Typography variant="h2" className="text-center mb-2">
                Anteprima
              </Typography>
              <div className="flex justify-center">
                {pictures.length && isValid ? (
                  <ViewPostContent post={post} />
                ) : (
                  <Alert color="info">
                    <Typography
                      variant="h5"
                      className="text-center text-red flex gap-2 items-center"
                    >
                      <FaInfoCircle />
                      Compila tutti i campi per vedere l'anteprima
                    </Typography>
                  </Alert>
                )}
              </div>
            </div>
          </>
        ) : (
          <Spinner />
        )}
      </div>
    </Layout>
  );
};

export default NewPost;

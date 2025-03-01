import { Typography } from "@material-tailwind/react";
import axios from "axios";
import {
  Alert,
  Button,
  Label,
  Progress,
  Spinner,
  Textarea
} from "flowbite-react";
import PropTypes from "prop-types";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FaBackward, FaInfoCircle, FaPlus } from "react-icons/fa";
import { createSearchParams, useNavigate } from "react-router";
import { UserContext } from "../App";
import Layout from "../Layout";
import { getErrorStr } from "../shared";
import FileUploader from "./FileUploader";
import ViewPostContent from "./ViewPostContent";

const FileUploaderMemo = React.memo(
  ({ files, setFiles, disabled, maxPhotos, maxVideos }) => {
    return (
      <FileUploader
        disabled={disabled}
        // color={!pictures.length && "failure"}
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
  const [createdAt, setCreatedAt] = useState(null);

  const [uploadPercent, setUploadPercent] = useState(0);

  const onSubmit = async data => {
    console.log(data);

    if (
      (!pictures || pictures.length === 0) &&
      (!videos || videos.length === 0)
    ) {
      setAlert({
        color: "failure",
        msg: "Devi aggiungere almeno una foto o un video per creare un post."
      });

      return;
    }

    setDisabled(true);
    setIsSubmitting(true);

    setCreatedAt(new Date());

    const formData = new FormData();
    formData.append("description", data.description);

    // append "content" files
    for (const f of files) {
      formData.append("content", f);
    }

    try {
      const res1 = await axios.post("/api/post", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: e => {
          const percent = (e.loaded / e.total) * 100;
          console.log("uploading...", percent);
          setUploadPercent(percent);
        }
      });
      console.log(res1.data);
      const res2 = await axios.get(`/api/post/${res1.data._id}`);
      console.log(res2.data);
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
    } finally {
      setDisabled(false);
      setIsSubmitting(false);
      setCreatedAt(null);
    }

    navigate({
      pathname: "/social",
      search: createSearchParams({
        created: data.description
      }).toString()
    });
  };

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
        <Button onClick={navigateBack} disabled={isSubmitting} color="light">
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
              <Typography variant="h2" className="dark:text-white mt-3">
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
                <Button
                  disabled={disabled || (!pictures.length && !videos.length)}
                  type="submit"
                  className="mb-2"
                >
                  {isSubmitting ? (
                    <Spinner className="dark:text-white dark:fill-white" />
                  ) : (
                    <FaPlus className="dark:text-white dark:fill-white" />
                  )}
                  <span className="ml-1 font-semibold">
                    {!isSubmitting ? "Inserisci" : "Inserimento in corso..."}
                  </span>
                </Button>
                {isSubmitting && (
                  <div className="mt-4 mb-2 w-56">
                    <Typography
                      variant="h5"
                      className="text-center truncate max-w-full dark:text-gray-200"
                      style={{ maxWidth: "calc(100% - 3rem)" }}
                    >
                      Caricamento file: {Math.round(uploadPercent)}%
                    </Typography>
                    <Progress
                      progress={uploadPercent || 0}
                      // size="sm"
                      className="w-full"
                      color="dark"
                    />
                  </div>
                )}
              </div>
            </form>

            <div className="mt-8">
              <Typography
                variant="h2"
                className="dark:text-white text-center mb-2"
              >
                Anteprima
              </Typography>
              <div className="flex justify-center">
                {(pictures.length || videos.length) && isValid ? (
                  <ViewPostContent post={post} hideComments />
                ) : (
                  <Alert color="info">
                    <Typography
                      variant="h5"
                      className="text-center text-red flex gap-2 items-center dark:text-gray-200"
                    >
                      <FaInfoCircle />
                      Compila tutti i campi per vedere l&apos;anteprima
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

FileUploaderMemo.propTypes = {
  files: PropTypes.array,
  setFiles: PropTypes.func,
  disabled: PropTypes.bool,
  maxPhotos: PropTypes.number,
  maxVideos: PropTypes.number
};

FileUploaderMemo.displayName = "FileUploaderMemo";

export default NewPost;

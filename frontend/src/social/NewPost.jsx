import Layout from "../Layout";
import { createRef, useEffect, useState } from "react";
import { getErrorStr, UserContext } from "..";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import Compressor from "compressorjs";
import "react-medium-image-zoom/dist/styles.css";

import axios from "axios";
import {
  Alert,
  Button,
  Checkbox,
  FileInput,
  Label,
  Progress,
  Radio,
  Spinner,
  TextInput,
  Textarea
} from "flowbite-react";
import { FaBackward, FaInfoCircle, FaPlus, FaUndo } from "react-icons/fa";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import ViewPostContent from "./ViewPostContent";
import BMF from "browser-md5-file";

let statusInterval = null;

/**
 * @typedef {'radioStationPost' | 'antennaPost' | 'myFlashMobPost'} PostType
 */

const NewPost = () => {
  const { user } = useContext(UserContext);

  const [uploadMap, setUploadMap] = useState(new Map());

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [isCompressingPic, setIsCompressingPic] = useState(false);

  const pictureInputRef = createRef(null);
  const videoInputRef = createRef(null);

  useEffect(() => {
    window.addEventListener("beforeunload", event => {
      const e = event || window.event;
      e.preventDefault();
      if (e) {
        e.returnValue = ""; // Legacy method for cross browser support
      }
      return ""; // Legacy method for cross browser support
    });
  }, []);

  const { register, handleSubmit, formState, watch } = useForm();

  const watchSelfBuilt = watch("isSelfBuilt", false);

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

  const [formValues, setFormValues] = useState({
    description: "",
    band: "144",
    brand: "",
    isSelfBuilt: false,
    metersFromSea: 0,
    boomLengthCm: 0,
    numberOfElements: 0,
    numberOfAntennas: 0,
    cable: ""
  });
  const navigate = useNavigate();

  const compressPic = f => {
    return new Promise((resolve, reject) => {
      new Compressor(f, {
        quality: 0.6,
        success(result) {
          console.log("compressed img", result);
          return resolve(result);
        },
        error(err) {
          console.log("compress img error");
          console.log(err.message);
          return reject(err);
        }
      });
    });
  };

  const handlePictureChange = async event => {
    const { files } = event.target;
    if (!files || files.length <= 0) return;
    else if (files.length > 5) {
      setAlert({
        color: "failure",
        msg: "Puoi aggiungere al massimo 5 foto"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      resetPictures();
      return;
    }
    setDisabled(true);
    setIsCompressingPic(true);
    const promises = [];
    try {
      for (const f of files) {
        promises.push(compressPic(f));
      }
      const pics = await Promise.all(promises);
      console.log("pics", pics);
      setPictures(pics);
    } catch (err) {
      console.log("compress pic err", err);
      setAlert({
        color: "failure",
        msg: "Errore durante la compressione delle foto"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } finally {
      setDisabled(false);
      setIsCompressingPic(false);
    }
  };

  const handleVideoChange = event => {
    const { files } = event.target;
    if (!files || files.length <= 0) return;
    else if (files.length > 2) {
      setAlert({
        color: "failure",
        msg: "Puoi aggiungere al massimo 2 video"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      resetVideos();
      return;
    }
    setVideos(files);
  };

  const [pictures, setPictures] = useState([]);
  const [videos, setVideos] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [createdAt, setCreatedAt] = useState(null);

  const onSubmit = async data => {
    console.log(formValues);
    if (!pictures || pictures.length === 0) {
      setAlert({
        color: "failure",
        msg: "Devi aggiungere almeno una foto"
      });

      return;
    } else if (
      postType === "antennaPost" &&
      !watchSelfBuilt &&
      formValues.brand.trim().length < 1
    ) {
      setAlert({
        color: "failure",
        msg: "Inserisci la marca dell'antenna (o impostala come autocostruita)"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }

    const urlType =
      postType === "antennaPost"
        ? "antenna"
        : postType === "myFlashMobPost"
        ? "myflashmob"
        : postType === "radioStationPost"
        ? "radiostation"
        : null;
    if (!urlType) {
      setAlert({
        color: "failure",
        msg: "Errore nella creazione dell'URL"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
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

    const postCreated = await createPost({ filesPath, urlType });
    if (!postCreated) {
      setDisabled(false);
      setIsSubmitting(false);
      setCreatedAt(null);
      return;
    }

    navigate({
      pathname: "/social",
      search: createSearchParams({
        created: formValues.description
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
   * @param {string} options.urlType - The type of URL to be sent with the post.
   * @returns {Promise<any>} A Promise that resolves to any value.
   */
  const createPost = async ({ filesPath, urlType }) => {
    try {
      const { data } = await axios.post(`/api/post/${urlType}`, {
        ...formValues,
        isSelfBuilt: watchSelfBuilt,
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

  const handleChange = event => {
    const { name, value, type, checked } = event.target;
    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value
    });
  };

  function resetPictures() {
    pictureInputRef.current.value = null;
    setPictures([]);
  }

  function resetVideos() {
    videoInputRef.current.value = null;
    setVideos([]);
  }

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
          // console.log("AAAAAAAAAAAAA", data, uploadMap);
        } catch (err) {}
      }, 1000);
      console.log("Starting emit status interval");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploadingFiles]);

  const { errors, isValid } = formState;

  /** @type {[PostType, (postType: PostType) => void]} */
  const [postType, setPostType] = useState(null);

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
        {!postType && (
          <Link to="/social">
            <Button disabled={isSubmitting || isUploadingFiles} color="light">
              <FaBackward />
            </Button>
          </Link>
        )}
        {alert && (
          <Alert
            className="mt-2 mb-6"
            color={alert.color}
            onDismiss={() => setAlert(null)}
          >
            <span>{alert.msg}</span>
          </Alert>
        )}

        {user ? (
          <>
            {postType === null ? (
              <>
                <Typography variant="h2" className="mt-3 mb-2">
                  Che tipo di post vuoi creare?
                </Typography>
                <Button.Group>
                  <Button
                    color="gray"
                    onClick={() => setPostType("radioStationPost")}
                  >
                    LA MIA STAZIONE
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setPostType("antennaPost")}
                  >
                    LE MIE ANTENNE
                  </Button>
                  <Button
                    color="gray"
                    onClick={() => setPostType("myFlashMobPost")}
                  >
                    IL MIO FLASH MOB
                  </Button>
                </Button.Group>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Typography variant="h2" className="mt-3">
                    {postType === "antennaPost"
                      ? "Le mie antenne"
                      : postType === "myFlashMobPost"
                      ? "Il mio flash mob"
                      : postType === "radioStationPost"
                      ? "La mia stazione"
                      : "Errore"}
                  </Typography>
                  <div className="my-4">
                    <Label
                      htmlFor="description"
                      value={`Descrizione (max ${
                        postType === "antennaPost" ? "30" : "300"
                      } caratteri)`}
                    />
                    <Textarea
                      rows={postType === "antennaPost" ? 1 : 3}
                      type="text"
                      {...register("description", {
                        required: true,
                        maxLength: postType === "antennaPost" ? 30 : 300,
                        minLength: 1
                      })}
                      minLength={1}
                      maxLength={postType === "antennaPost" ? 30 : 300}
                      onChange={handleChange}
                      name="description"
                      id="description"
                      color={errors.description ? "failure" : undefined}
                      placeholder="La mia Yagi 6 elementi..."
                    />
                  </div>

                  {postType === "antennaPost" && (
                    <>
                      <div className="flex items-center mx-auto w-fit flex-col md:flex-row md:gap-4">
                        <div className="my-4">
                          <Label htmlFor="band" value="Banda radio" />
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Radio
                                {...register("band", { required: true })}
                                defaultChecked
                                id="144"
                                name="band"
                                value="144"
                              />
                              <Label htmlFor="144">144 MHz</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <Radio
                                {...register("band", { required: true })}
                                id="432"
                                name="band"
                                value="432"
                              />
                              <Label htmlFor="432">432 MHz</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <Radio
                                {...register("band", { required: true })}
                                id="1200"
                                name="band"
                                value="1200"
                              />
                              <Label htmlFor="1200">1200 MHz</Label>
                            </div>
                          </div>
                          {/* {errors.band && <span>This field is required</span>} */}
                        </div>

                        <div className="my-4 flex items-center gap-4">
                          <div
                            className={`${watchSelfBuilt ? "hidden" : "block"}`}
                          >
                            <Label htmlFor="brand" value="Marca" />
                            <TextInput
                              type="text"
                              name="brand"
                              {...register("brand", {
                                maxLength: 30,
                                required: false
                              })}
                              id="brand"
                              maxLength={30}
                              color={errors.brand ? "failure" : undefined}
                              onChange={handleChange}
                              placeholder="Diamond"
                            />
                          </div>
                          <div className="flex gap-2 mt-4 items-center">
                            <Label
                              htmlFor="isSelfBuilt"
                              value="Autocostruita?"
                            />
                            <Checkbox
                              type="checkbox"
                              name="isSelfBuilt"
                              id="isSelfBuilt"
                              className="checked:bg-blue-500"
                              {...register("isSelfBuilt")}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 items-end ">
                        <div>
                          <Label
                            htmlFor="metersFromSea"
                            value="Altezza dal mare (S.L.M.)"
                          />
                          <TextInput
                            type="number"
                            name="metersFromSea"
                            {...register("metersFromSea", {
                              required: true,
                              max: 10000
                            })}
                            max={10000}
                            disabled={disabled}
                            id="metersFromSea"
                            color={errors.metersFromSea ? "failure" : undefined}
                            value={formValues.metersFromSea}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="boomLengthCm"
                            value="Lunghezza del boom (cm)"
                          />
                          <TextInput
                            type="number"
                            name="boomLengthCm"
                            color={errors.boomLengthCm ? "failure" : undefined}
                            {...register("boomLengthCm", {
                              required: true,
                              min: 1,
                              max: 100000
                            })}
                            disabled={disabled}
                            id="boomLengthCm"
                            min={1}
                            max={100000}
                            value={formValues.boomLengthCm}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="numberOfElements"
                            value="Numero di elementi"
                          />
                          <TextInput
                            type="number"
                            name="numberOfElements"
                            color={
                              errors.numberOfElements ? "failure" : undefined
                            }
                            {...register("numberOfElements", {
                              required: true,
                              min: 1,
                              max: 300
                            })}
                            disabled={disabled}
                            min={1}
                            max={300}
                            id="numberOfElements"
                            value={formValues.numberOfElements}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="numberOfAntennas"
                            value="Numero di antenne coppiate (1 se unica antenna)"
                          />
                          <TextInput
                            type="number"
                            name="numberOfAntennas"
                            color={
                              errors.numberOfAntennas ? "failure" : undefined
                            }
                            {...register("numberOfAntennas", {
                              required: true,
                              min: 1,
                              max: 100
                            })}
                            disabled={disabled}
                            min={1}
                            max={100}
                            id="numberOfAntennas"
                            value={formValues.numberOfAntennas}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="my-4">
                        <Label htmlFor="cable" value="Informazioni sul cavo" />
                        <TextInput
                          type="text"
                          name="cable"
                          color={errors.cable ? "failure" : undefined}
                          {...register("cable", {
                            maxLength: 100,
                            required: true
                          })}
                          disabled={disabled}
                          id="cable"
                          maxLength={100}
                          value={formValues.cable}
                          onChange={handleChange}
                          placeholder="Cavo RG-58, ~10 metri"
                        />
                      </div>
                    </>
                  )}

                  <div className="my-4">
                    <Label
                      htmlFor="pictures"
                      value="Foto antenna (min. 1, max. 5)"
                    />
                    <div className="flex items-center gap-2">
                      <FileInput
                        disabled={disabled}
                        helperText={isCompressingPic && <Spinner />}
                        color={!pictures.length ? "failure" : undefined}
                        id="pictures"
                        multiple
                        accept="image/*"
                        onChange={handlePictureChange}
                        className="w-full"
                        ref={pictureInputRef}
                      />
                      <Button
                        color="dark"
                        onClick={resetPictures}
                        disabled={
                          disabled ||
                          isUploadingFiles ||
                          isSubmitting ||
                          !pictures?.length
                        }
                      >
                        <FaUndo />
                      </Button>
                    </div>
                  </div>

                  <div className="my-4">
                    <Label htmlFor="videos" value="Video antenna (max. 2)" />
                    <div className="flex items-center gap-2">
                      <FileInput
                        id="videos"
                        color={errors.videos ? "failure" : undefined}
                        multiple
                        disabled={disabled}
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="w-full"
                        ref={videoInputRef}
                      />
                      <Button
                        color="dark"
                        onClick={resetVideos}
                        disabled={
                          disabled ||
                          isUploadingFiles ||
                          isSubmitting ||
                          !videos?.length
                        }
                      >
                        <FaUndo />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center items-center flex-col">
                    <Button disabled={disabled} type="submit" className="mb-2">
                      {isSubmitting ? (
                        <Spinner className="dark:text-white" />
                      ) : (
                        <FaPlus className="dark:text-white" />
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
                        <p className="text-center">
                          È normale che ci metta un po'
                        </p>
                        {[...uploadMap.entries()].map(
                          ([md5, { name, percent }]) => (
                            <div key={md5} className="mb-2 w-56">
                              <Typography variant="h5" className="text-center">
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
                      <ViewPostContent
                        post={{
                          ...formValues,
                          createdAt: createdAt || new Date(),
                          pictures: [...Array(pictures.length).keys()].map(e =>
                            window.URL.createObjectURL(pictures[e])
                          ),
                          videos: [...Array(videos.length).keys()].map(e =>
                            window.URL.createObjectURL(videos[e])
                          ),
                          fromUser: user,
                          isSelfBuilt: watchSelfBuilt
                        }}
                      />
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
            )}
          </>
        ) : (
          <Spinner />
        )}
      </div>
    </Layout>
  );
};

export default NewPost;

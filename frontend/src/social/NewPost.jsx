import Layout from "../Layout";
import { createRef, useEffect, useState } from "react";
import { getErrorStr, UserContext } from "..";
import { useContext } from "react";
import { useForm } from "react-hook-form";

import "react-medium-image-zoom/dist/styles.css";

import axios from "axios";
import {
  Alert,
  Button,
  Checkbox,
  FileInput,
  Label,
  Radio,
  Spinner,
  TextInput
} from "flowbite-react";
import { FaBackward, FaInfoCircle, FaPlus, FaUndo } from "react-icons/fa";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import ViewPostContent from "./ViewPostContent";

const NewPost = () => {
  const { user } = useContext(UserContext);

  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const pictureInputRef = createRef(null);
  const videoInputRef = createRef(null);

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

  const handlePictureChange = event => {
    const { files } = event.target;
    if (!files || files.length < 0) return;
    setPictures(files);
  };
  const handleVideoChange = event => {
    const { files } = event.target;
    if (!files || files.length < 0) return;
    setVideos(files);
  };

  const [pictures, setPictures] = useState([]);
  const [videos, setVideos] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const onSubmit = async data => {
    console.log(formValues);
    if (!pictures || pictures.length === 0) {
      setAlert({
        color: "failure",
        msg: "Devi aggiungere almeno una foto"
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }

    setDisabled(true);
    setIsSubmitting(true);
    setIsUploadingFiles(true);

    const filesPath = await sendPicturesAndVideos();
    setIsUploadingFiles(false);
    if (!filesPath) {
      setDisabled(false);
      setIsSubmitting(false);
      return;
    }

    const postCreated = await sendPost({ filesPath });
    if (!postCreated) {
      setDisabled(false);
      setIsSubmitting(false);
      return;
    }
    navigate({
      pathname: "/social",
      search: createSearchParams({
        created: formValues.description
      }).toString()
    });
  };

  const sendPicturesAndVideos = async () => {
    const formData = new FormData();
    console.log(pictures);
    const content = [...pictures, ...videos];
    content.forEach(f => formData.append("content", f));

    try {
      const { data } = await axios.post("/api/post/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
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

  const sendPost = async ({ filesPath }) => {
    try {
      const { data } = await axios.post("/api/post", {
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

  const { register, handleSubmit, formState } = useForm();

  const { errors, isValid } = formState;

  return (
    <Layout>
      {/* {!user &&
        navigate({
          pathname: "/login",
          search: createSearchParams({
            to: "/social/new"
          }).toString()
        })}
      ) */}
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

        {user ? (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="my-4">
                <Label
                  htmlFor="description"
                  value="Descrizione (max 30 caratteri)"
                />
                <TextInput
                  type="text"
                  {...register("description", {
                    required: true,
                    maxLength: 30,
                    minLength: 1
                  })}
                  minLength={1}
                  maxLength={30}
                  onChange={handleChange}
                  name="description"
                  id="description"
                  color={errors.description ? "failure" : undefined}
                  placeholder="La mia Yagi 6 elementi..."
                />
              </div>

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
                  <div>
                    <Label htmlFor="brand" value="Marca" />
                    <TextInput
                      type="text"
                      name="brand"
                      {...register("brand", {
                        maxLength: 30,
                        required: true
                      })}
                      id="brand"
                      maxLength={30}
                      color={errors.brand ? "failure" : undefined}
                      onChange={handleChange}
                      placeholder="Diamond"
                    />
                  </div>
                  <div className="flex gap-2 mt-4 items-center">
                    <Label htmlFor="isSelfBuilt" value="Autocostruita?" />
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
                    color={errors.numberOfElements ? "failure" : undefined}
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
                    value="Numero di antenne coppiate (0 se nessuna)"
                  />
                  <TextInput
                    type="number"
                    name="numberOfAntennas"
                    color={errors.numberOfAntennas ? "failure" : undefined}
                    {...register("numberOfAntennas", {
                      required: true,
                      min: 0,
                      max: 100
                    })}
                    disabled={disabled}
                    min={0}
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
                  {...register("cable", { maxLength: 100, required: true })}
                  disabled={disabled}
                  id="cable"
                  maxLength={100}
                  value={formValues.cable}
                  onChange={handleChange}
                  placeholder="Cavo RG-58, ~10 metri"
                />
              </div>

              <div className="my-4">
                <Label htmlFor="pictures" value="Foto antenna (min. 1)" />
                <div className="flex items-center gap-2">
                  <FileInput
                    disabled={disabled}
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

              <div className="flex justify-center">
                <Button disabled={disabled} type="submit">
                  {isSubmitting ? <Spinner /> : <FaPlus />}
                  <span className="ml-1 font-semibold">
                    {!isSubmitting
                      ? "Crea post"
                      : isUploadingFiles
                      ? "Caricamento dei file"
                      : "Creazione post"}
                  </span>
                </Button>
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
                      createdAt: new Date(),
                      pictures: [...Array(pictures.length).keys()].map(e =>
                        window.URL.createObjectURL(pictures[e])
                      ),
                      videos: [...Array(videos.length).keys()].map(e =>
                        window.URL.createObjectURL(videos[e])
                      ),
                      fromUser: user
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
        ) : (
          <Spinner />
        )}
      </div>
    </Layout>
  );
};

export default NewPost;

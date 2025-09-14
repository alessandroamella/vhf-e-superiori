import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
  headingsPlugin,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  listsPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import axios from "axios";
import {
  Alert,
  Badge,
  Button,
  FileInput,
  Spinner,
  TextInput,
  Tooltip,
} from "flowbite-react";
import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { Helmet } from "react-helmet";
import { FaExclamationTriangle, FaPlus, FaTrash, FaUndo } from "react-icons/fa";
import { createSearchParams, useNavigate } from "react-router";
import { getErrorStr } from "../shared";
import useUserStore from "../stores/userStore";

const BlogPostEditor = ({ blogPost }) => {
  const [alert, setAlert] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const user = useUserStore((store) => store.user);
  const navigate = useNavigate();

  const isEditing = useMemo(() => !!blogPost, [blogPost]);

  const [cookies, setCookie] = useCookies(["blogCache"]);

  const [title, setTitle] = useState(blogPost?.title || cookies.title || "");
  const [contentMd, setContentMd] = useState(
    blogPost?.contentMd || cookies.contentMd || "",
  );
  const [_tag, _setTag] = useState("");
  const [tags, setTags] = useState(blogPost?.tags || cookies.tags || []);

  const [postPics, setPostPics] = useState();

  useEffect(() => {
    // set cookies on change
    setCookie("title", title, { path: "/" });
    setCookie("contentMd", contentMd, { path: "/" });
    setCookie("tags", tags, { path: "/" });
  }, [title, contentMd, tags, setCookie]);

  useEffect(() => {
    console.log("check user", user);
    if (user === null) {
      return navigate({
        pathname: "/login",
        search: createSearchParams({
          to: "/blog/editor",
        }).toString(),
      });
    } else if (user && !user.isAdmin) {
      navigate("/blog", { replace: true });
    }
  }, [user, navigate]);

  async function submit(e) {
    e.preventDefault();

    if (disabled) return;
    setDisabled(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("contentMd", contentMd);
    formData.append("tags", JSON.stringify(tags));
    if (postPics) {
      postPics.forEach((pic) => {
        formData.append("content", pic);
      });
    }
    if (postPic) {
      formData.append("postPic", postPic);
    } else {
      const ok = window.confirm(
        "Non hai caricato un'immagine di copertina. Continuare?",
      );
      if (!ok) {
        setDisabled(false);
        return;
      }
    }

    try {
      const { data } = await axios.post("/api/blog", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // delete cookies by making them expire
      setCookie("title", "", { path: "/", expires: new Date(0) });
      setCookie("contentMd", "", { path: "/", expires: new Date(0) });
      setCookie("tags", "", { path: "/", expires: new Date(0) });

      navigate(`/blog/${data._id}`, { replace: true });
    } catch (err) {
      console.error(err?.response?.data?.err || err);
      setAlert({
        color: "failure",
        msg: getErrorStr(err?.response?.data?.err),
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setDisabled(false);
    }
  }

  async function imageUploadHandler(image, isPostPic = false) {
    console.log("setting image", image);

    if (isPostPic) {
      setPostPic(image);
      return image;
    } else {
      setPostPics([...postPics, image]);
      return window.URL.createObjectURL(image);
    }
  }

  function tagSubmit(e) {
    e.preventDefault();
    setTags([...new Set([...tags, _tag])]);
    _setTag("");
  }

  const [postPic, setPostPic] = useState(null);
  const pictureInputRef = useRef();

  function resetPicture() {
    pictureInputRef.current.value = null;
    setPostPic(null);
  }

  const handlePostPicChange = async (event) => {
    const { files } = event.target;
    if (!files || files.length <= 0) return;
    else if (files.length > 1) {
      window.alert("Solo una foto per post");
      resetPicture();
      return;
    }
    setDisabled(true);

    // TODO set param is blogpost pic
    const path = await imageUploadHandler(files[0], true);
    if (path) {
      console.log("imageUploadHandler path", path);
      setPostPic(path);
    } else {
      console.error("imageUploadHandler null");
    }

    setDisabled(false);
  };

  const _postPic = useMemo(() => {
    if (!postPic) return null;
    return window.URL.createObjectURL(postPic);
  }, [postPic]);

  return (
    <>
      <Helmet>
        <title>Blog post editor - VHF e superiori</title>
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

      {user ? (
        <div className="w-full md:w-5/6 mx-auto">
          <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <form
                onSubmit={tagSubmit}
                className="flex justify-center md:justify-end items-center gap-2"
              >
                <TextInput
                  id="tags"
                  type="text"
                  placeholder="Tags"
                  required
                  value={_tag}
                  onChange={(e) =>
                    _setTag(e.target.value.replace(/[^0-9a-zA-Z\-.]/g, ""))
                  }
                  disabled={disabled}
                  minLength={1}
                  maxLength={20}
                />
                <Button
                  type="submit"
                  color="dark"
                  disabled={disabled}
                  className="h-10"
                >
                  <FaPlus />
                </Button>
              </form>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 items-center">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="cursor-pointer"
                    icon={() => <FaTrash className="scale-75" />}
                    size="lg"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="font-semibold dark:text-gray-200 flex items-center gap-2">
                    <FaExclamationTriangle /> Aggiungi dei tag al post
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <FileInput
                    disabled={disabled}
                    helperText={disabled && <Spinner />}
                    id="postPic"
                    accept="image/*"
                    onChange={handlePostPicChange}
                    className="w-full"
                    ref={pictureInputRef}
                  />
                  <Button
                    color="dark"
                    onClick={resetPicture}
                    disabled={disabled || !postPic}
                  >
                    <FaUndo />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {_postPic && (
            <div className="mt-6 mb-12 w-full md:w-4/5 lg:w-4/5 mx-auto h-48 md:h-56">
              <img
                src={_postPic}
                alt="Post pic"
                className="object-contain w-full h-full"
              />
              <small className="text-center block mt-2">
                Immagine di copertina
              </small>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="my-6">
              <TextInput
                id="post-title"
                type="text"
                placeholder="Titolo"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={disabled}
                minLength={1}
                maxLength={100}
              />
            </div>

            <div className="mb-8 bg-white dark:bg-gray-600 dark:text-white drop-shadow-lg markdown-2">
              <MDXEditor
                onChange={setContentMd}
                markdown={contentMd}
                plugins={[
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  thematicBreakPlugin(),
                  linkDialogPlugin(),
                  imagePlugin({ imageUploadHandler }),
                  diffSourcePlugin(),
                  tablePlugin(),
                  toolbarPlugin({
                    toolbarContents: () => (
                      <>
                        {" "}
                        <UndoRedo />
                        <BoldItalicUnderlineToggles />
                        <BlockTypeSelect />
                        <BoldItalicUnderlineToggles />
                        <CodeToggle />
                        <CreateLink />
                        <DiffSourceToggleWrapper />
                        <InsertImage />
                        <InsertTable />
                        <InsertThematicBreak />
                        <ListsToggle />
                      </>
                    ),
                  }),
                ]}
              />
            </div>

            <div className="flex justify-center">
              <Tooltip
                content={
                  tags.length === 0
                    ? "Aggiungi dei tag al post"
                    : title.length === 0
                      ? "Il titolo non può essere vuoto"
                      : contentMd.length === 0
                        ? "Il contenuto non può essere vuoto"
                        : "Clicca per pubblicare il post"
                }
              >
                <Button
                  type="submit"
                  color="info"
                  className="h-12"
                  disabled={
                    disabled ||
                    tags.length === 0 ||
                    title.length === 0 ||
                    contentMd.length === 0
                  }
                >
                  {isEditing ? "Salva" : "Pubblica"}
                </Button>
              </Tooltip>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex w-full justify-center mt-4">
          <Spinner size="xl" />
        </div>
      )}
    </>
  );
};

BlogPostEditor.propTypes = {
  blogPost: PropTypes.object,
};

BlogPostEditor.displayName = "BlogPostEditor";

export default BlogPostEditor;

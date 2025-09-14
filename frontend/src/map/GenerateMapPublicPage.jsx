import { Turnstile } from "@marsidev/react-turnstile";
import axios from "axios";
import { saveAs } from "file-saver";
import { Alert, Button, Spinner, TextInput } from "flowbite-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationCircle,
  FaFileAlt,
  FaRegCheckCircle,
  FaRegTimesCircle,
  FaShareAlt,
} from "react-icons/fa";
import { MdRepeat } from "react-icons/md";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { UserContext } from "../App";
import { recaptchaSiteKey } from "../constants/recaptchaSiteKey";
import { getErrorStr } from "../shared";
import useDarkModeStore from "../stores/darkModeStore";

const GenerateMapPublicPage = () => {
  const { i18n, t } = useTranslation();
  const turnstileRef = useRef(null); // Ref per il componente Turnstile

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      operatorCallsign: "",
      qth: "",
      eventTitle: "",
    },
    mode: "onBlur",
  });

  const callsign = watch("operatorCallsign").trim();
  if (
    errors.operatorCallsign &&
    callsign.length >= 1 &&
    callsign.length <= 10
  ) {
    trigger("operatorCallsign");
  }

  const locator = watch("qth").trim();
  if (errors.qth && (locator.length === 4 || locator.length === 6)) {
    trigger("qth");
  }

  const [adifFile, setAdifFile] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [generatedMapUrl, setGeneratedMapUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, _setAlert] = useState(null);

  // Use Zustand store for dark mode
  const isDarkMode = useDarkModeStore((state) => state.isDarkMode);

  const [canShare, setCanShare] = useState(false);
  const [shareData, setShareData] = useState(null);

  // Saved values for the generated map (snapshot when map was created)
  const [savedValues, setSavedValues] = useState({
    operatorCallsign: "",
    qth: "",
    eventTitle: "",
    adifFileName: "",
  });

  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user?.callsign) {
      setValue("operatorCallsign", user.callsign);
    }
    if (user?.locator) {
      setValue("qth", user.locator);
    }
  }, [user, setValue]);

  // Check if sharing is supported and prepare share data when map is generated
  useEffect(() => {
    const checkShareCapabilityAndPrepareData = async () => {
      if (!generatedMapUrl) {
        setCanShare(false);
        setShareData(null);
        return;
      }

      try {
        // Convert blob URL to File for testing sharing capability
        const response = await fetch(generatedMapUrl);
        const blob = await response.blob();
        const file = new File(
          [blob],
          `mappa-${savedValues.adifFileName.split(".").slice(0, -1).join(".")}.jpg`,
          { type: "image/jpeg" },
        );

        const testShareData = {
          title: savedValues.eventTitle || t("generateMap.generatedMap"),
          text: t("generateMap.shareMapText", {
            callsign: savedValues.operatorCallsign || "utente",
            site: "vhfesuperiori.eu",
          }),
          files: [file],
        };

        // Check if the browser supports sharing with files
        const canShareFiles =
          navigator.share && navigator.canShare?.(testShareData);

        if (canShareFiles) {
          setCanShare(true);
          setShareData(testShareData);
        } else {
          setCanShare(false);
          setShareData(null);
        }
      } catch (error) {
        console.error("Error preparing share data:", error);
        setCanShare(false);
        setShareData(null);
      }
    };

    checkShareCapabilityAndPrepareData();
  }, [generatedMapUrl, savedValues, t]);

  const mainRef = useRef();

  const setAlert = useCallback((alert) => {
    _setAlert(alert);
    if (alert && alert.color !== "success") {
      mainRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setAdifFile(acceptedFiles[0]);
        setAlert(null); // Resetta eventuali alert precedenti
      } else {
        setAdifFile(null);
        setAlert({
          color: "failure",
          msg: t("errors.INVALID_ADIF_FILE"),
        }); // Aggiungi questa traduzione
      }
    },
    [t, setAlert],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/octet-stream": [".adi", ".adif"], // Tipo MIME comune per i file ADIF
      "text/plain": [".adi", ".adif"], // Potrebbe essere anche testo semplice
    },
    multiple: false,
  });

  const resetForm = useCallback(() => {
    setAdifFile(null);
    reset({
      operatorCallsign: "",
      qth: "",
      eventTitle: "",
    });
    setGeneratedMapUrl(null);
    setAlert(null);
    setSavedValues({
      operatorCallsign: user?.callsign || "",
      qth: user?.locator || "",
      eventTitle: "",
      adifFileName: "",
    });
    // Scroll back to top of form
    mainRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reset, setAlert, user]);

  const onSubmit = async (data) => {
    setAlert(null);
    setGeneratedMapUrl(null);

    if (!adifFile) {
      setAlert({ color: "failure", msg: t("errors.NO_ADIF_FILE") });
      return;
    }

    if (!turnstileToken) {
      setAlert({
        color: "failure",
        msg: t("errors.TURNSTILE_REQUIRED"),
      });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("adif", adifFile);
    formData.append("qth", data.qth.trim());
    formData.append("turnstileToken", turnstileToken);
    if (data.operatorCallsign) {
      formData.append("operatorCallsign", data.operatorCallsign);
    }
    if (data.eventTitle) {
      formData.append("eventTitle", data.eventTitle);
    }

    try {
      const response = await axios.post(
        "/api/map/generate-adif-public",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob", // Il backend restituisce un blob immagine
        },
      );

      const imageUrl = URL.createObjectURL(response.data);
      setGeneratedMapUrl(imageUrl);

      // Save the current form values as they were when the map was generated
      setSavedValues({
        operatorCallsign: data.operatorCallsign || "",
        qth: data.qth.trim() || "",
        eventTitle: data.eventTitle || "",
        adifFileName: adifFile.name || "",
      });

      setAlert({ color: "success", msg: t("generateMap.mapGeneratedSuccess") });

      // Scroll to the generated map section after a short delay
      setTimeout(() => {
        document.getElementById("generated-map-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    } catch (err) {
      console.error("Error generating map:", err?.response?.data);

      let errorMsg = t("errors.UNKNOWN_ERROR");

      // If response data is a blob (JSON error), parse it
      if (err?.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorData = JSON.parse(errorText);
          errorMsg = getErrorStr(
            errorData?.err || errorData?.message || errorMsg,
          );
        } catch (parseError) {
          console.error("Error parsing blob error response:", parseError);
          errorMsg = getErrorStr(err?.message || errorMsg);
        }
      } else {
        // Handle regular error responses
        errorMsg = getErrorStr(
          err?.response?.data?.err || err?.message || errorMsg,
        );
      }

      setAlert({
        color: "failure",
        msg: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMap = () => {
    if (generatedMapUrl && savedValues.adifFileName) {
      saveAs(
        generatedMapUrl,
        `mappa-${savedValues.adifFileName.split(".").slice(0, -1).join(".")}.jpg`,
      );
    }
  };

  const handleShare = async () => {
    if (!shareData || !canShare) return;

    try {
      await navigator.share(shareData);
    } catch (error) {
      console.error("Error sharing:", error);
      setAlert({ color: "failure", msg: t("generateMap.shareError") });
    }
  };

  const handleTurnstileVerify = (token) => {
    setTurnstileToken(token);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  const handleTurnstileError = (error) => {
    console.error("Turnstile error:", error);
    setAlert({
      color: "failure",
      msg: t("errors.CAPTCHA_FAILED"),
    });
    setTurnstileToken(null);
  };

  const resetCaptcha = () => {
    turnstileRef.current?.reset();
    setTurnstileToken(null);
    setAlert(null);
  };

  return (
    <>
      <Helmet>
        <title>{t("generateMap.generateYourMap")} - VHF e Superiori</title>
      </Helmet>

      <div
        ref={mainRef}
        className="min-h-[80vh] dark:bg-gray-900 dark:text-white p-4 md:p-8"
      >
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            {t("generateMap.generateYourMapTitle")}
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            {t("generateMap.generateYourMapDescription")}
          </p>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="text-red-500">*</span>{" "}
            {t("generateMap.requiredFields")}
          </div>

          {alert && (
            <div className="mb-4">
              <Alert
                className="mb-4 dark:text-black"
                color={alert.color}
                onDismiss={() => setAlert(null)}
              >
                <FaExclamationCircle className="inline mr-2 scale-110 mb-[1px]" />
                <span>{alert.msg}</span>

                {alert.msg === t("errors.CAPTCHA_FAILED") && (
                  <Button className="inline-block ml-4" onClick={resetCaptcha}>
                    <MdRepeat />{" "}
                  </Button>
                )}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <div className="mb-2 block">
                <label
                  htmlFor="adif-file"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-200"
                >
                  <FaFileAlt className="inline mr-2" />
                  {t("generateMap.adifFile")}{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"} ${adifFile ? "border-green-500" : ""}`}
              >
                <input {...getInputProps()} disabled={isLoading} />
                {isDragActive ? (
                  <p className="text-blue-600 dark:text-blue-300">
                    {t("generateMap.dropAdifFile")}
                  </p>
                ) : adifFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaRegCheckCircle className="text-green-500 text-lg" />
                    <p className="text-green-600 dark:text-green-300">
                      {t("generateMap.fileSelected", {
                        fileName: adifFile.name,
                      })}
                    </p>
                    <Button
                      size="xs"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdifFile(null);
                      }}
                    >
                      <FaRegTimesCircle />
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("generateMap.dragOrClickAdif")}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {t("generateMap.adifFileHelper")}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 block">
                <label
                  htmlFor="operator-callsign"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-200"
                >
                  {t("generateMap.operatorCallsign")}{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              <TextInput
                id="operator-callsign"
                type="text"
                {...register("operatorCallsign", {
                  required: t("errors.OPERATOR_CALLSIGN_REQUIRED"),
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (trimmed === "") {
                      return t("errors.OPERATOR_CALLSIGN_REQUIRED");
                    }
                    if (
                      trimmed.includes(" ") ||
                      trimmed.length < 1 ||
                      trimmed.length > 10
                    ) {
                      return t("errors.INVALID_CALLSIGN");
                    }
                    return true;
                  },
                  setValueAs: (value) => value.trim().toUpperCase(),
                })}
                placeholder="IZ0XYZ"
                disabled={isLoading}
                color={errors.operatorCallsign ? "failure" : "gray"}
                helperText={errors.operatorCallsign?.message}
              />
            </div>

            <div>
              <div className="mb-2 block">
                <label
                  htmlFor="qth"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-200"
                >
                  {t("generateMap.locator")}{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              <TextInput
                id="qth"
                type="text"
                {...register("qth", {
                  required: t("errors.LOCATOR_REQUIRED"),
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (trimmed === "") {
                      return t("errors.LOCATOR_REQUIRED");
                    }
                    // validate length 4 or 6
                    if (trimmed.length !== 4 && trimmed.length !== 6) {
                      return t("errors.INVALID_LOCATOR");
                    }
                    return true;
                  },
                  setValueAs: (value) => value.trim(),
                })}
                placeholder="JN54mn"
                disabled={isLoading}
                color={errors.qth ? "failure" : "gray"}
                helperText={errors.qth?.message}
              />
            </div>

            <div>
              <div className="mb-2 block">
                <label
                  htmlFor="event-title"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-200"
                >
                  {t("generateMap.mapTitle")}
                </label>
              </div>
              <TextInput
                id="event-title"
                type="text"
                {...register("eventTitle")}
                placeholder={t("generateMap.myAdifMap")}
                disabled={isLoading}
              />
            </div>

            {/* Turnstile Widget */}
            <div className="flex justify-center">
              <Turnstile
                options={{
                  language: i18n.language || "en",
                  theme: isDarkMode ? "dark" : "light",
                }}
                siteKey={recaptchaSiteKey}
                onSuccess={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
                onError={handleTurnstileError}
                ref={turnstileRef}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !adifFile || !turnstileToken}
              className="w-full"
            >
              {isLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <FaCloudUploadAlt className="mr-2" />
              )}
              {isLoading
                ? t("generateMap.generatingMap")
                : t("generateMap.generateMap")}
            </Button>
          </form>
        </div>

        {/* Generated Map Display Section */}
        {generatedMapUrl && (
          <>
            {/* Elegant separator */}
            <div className="relative my-12">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t-2 border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-900 px-6 text-lg font-medium text-gray-500 dark:text-gray-400">
                  ✨ {t("generateMap.yourGeneratedMap")} ✨
                </span>
              </div>
            </div>

            {/* Map Display Section */}
            <div
              id="generated-map-section"
              className="max-w-6xl -mx-2 md:mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 px-8 py-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      {savedValues.eventTitle ||
                        t("generateMap.generatedQsoMap")}
                    </h2>
                    {savedValues.operatorCallsign && (
                      <p className="text-blue-100 text-lg">
                        📡 {t("generateMap.operatorCallsign")}:{" "}
                        <span className="font-semibold">
                          {savedValues.operatorCallsign}
                        </span>
                      </p>
                    )}
                    {savedValues.qth && (
                      <p className="text-blue-100 text-sm mt-1">
                        📍 {t("generateMap.locator")}:{" "}
                        <span className="font-mono font-semibold">
                          {savedValues.qth}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button
                      onClick={resetForm}
                      color="blue"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30"
                    >
                      🔄 {t("generateMap.generateNewMap")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Map Image Section */}
              <div className="p-2 mt-2 md:mt-0 md:p-4 lg:p-8">
                <div className="flex justify-center mb-8">
                  <div className="relative group inline-block">
                    {/* Simplified frame with elegant styling - adapts to image size */}
                    <div className="relative p-3 bg-gradient-to-br from-amber-100 via-white to-amber-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl shadow-2xl">
                      {/* Inner frame with gold accent */}
                      <div className="relative p-2 bg-gradient-to-br from-yellow-300/30 via-amber-200/40 to-yellow-400/30 dark:from-amber-600/20 dark:via-yellow-700/25 dark:to-amber-800/20 rounded-lg border border-amber-300/50 dark:border-amber-600/30">
                        {/* Image container - tight fit */}
                        <div className="relative bg-white dark:bg-gray-800 rounded-md shadow-inner overflow-hidden">
                          <LazyLoadImage
                            src={generatedMapUrl}
                            alt={t("generateMap.generatedQsoMap")}
                            className="max-w-full md:max-h-[90vh] h-auto w-auto rounded-md object-contain transition-transform duration-300 group-hover:scale-[1.01] block"
                          />
                          {/* Subtle glass effect overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-black/5 dark:to-black/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                      {/* Corner decorations */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-amber-400/60 dark:border-amber-600/60 rounded-tl-md"></div>
                      <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-amber-400/60 dark:border-amber-600/60 rounded-tr-md"></div>
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-amber-400/60 dark:border-amber-600/60 rounded-bl-md"></div>
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-amber-400/60 dark:border-amber-600/60 rounded-br-md"></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {/* Primary Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleDownloadMap}
                      color="success"
                      size="lg"
                      className="flex-1 sm:flex-none"
                    >
                      <FaDownload className="mr-2 mt-[3px]" />
                      {t("generateMap.downloadMap")}
                    </Button>
                    {canShare && shareData && (
                      <Button
                        onClick={handleShare}
                        color="blue"
                        size="lg"
                        className="flex-1 sm:flex-none"
                      >
                        <FaShareAlt className="mr-2 mt-[3px]" />
                        {t("shareMap")}
                      </Button>
                    )}
                  </div>

                  {/* Footer Note */}
                  <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🏆 {t("generateMap.poweredBy")}{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        VHF e Superiori
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default GenerateMapPublicPage;

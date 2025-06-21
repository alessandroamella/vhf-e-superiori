import heic2any from "heic2any";
import PropTypes from "prop-types";
import { useDropzone } from "react-dropzone";
import { FaTrash } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlayer from "react-player";
import { v4 as uuidv4 } from "uuid";

const FileUploader = ({
  files,
  setFiles,
  disabled,
  color,
  maxPhotos = 5,
  maxVideos = 2
}) => {
  /**
   * @param {File[]} acceptedFiles
   * @param {File[]} rejectedFiles
   */
  const handleDrop = async (acceptedFiles) => {
    const currentPhotos = files.filter((file) =>
      file.type.startsWith("image")
    ).length;
    const currentVideos = files.filter((file) =>
      file.type.startsWith("video")
    ).length;

    let newPhotos = 0;
    let newVideos = 0;

    const filteredFiles = acceptedFiles.filter((file) => {
      if (file.type.startsWith("image")) {
        newPhotos++;
        return currentPhotos + newPhotos <= maxPhotos;
      } else if (file.type.startsWith("video")) {
        newVideos++;
        return currentVideos + newVideos <= maxVideos;
      }
      return false;
    });

    // check if any heic file
    const heicFiles = filteredFiles.filter(
      (file) =>
        file.type === "image/heic" ||
        file.name.endsWith(".heic") ||
        file.name.endsWith(".heif")
    );
    const notHeicFiles = filteredFiles.filter(
      (file) =>
        file.type !== "image/heic" &&
        !file.name.endsWith(".heic") &&
        !file.name.endsWith(".heif")
    );

    // convert heic files to jpg
    const convertedFiles = [];
    for (const file of heicFiles) {
      const convertedFile = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8
      });
      const heic = [];
      Array.isArray(convertedFile)
        ? heic.push(...convertedFile)
        : heic.push(convertedFile);
      heic.forEach((f) => (f.name = uuidv4() + ".jpg"));
      convertedFiles.push(...heic);
    }

    setFiles((prevFiles) => [...prevFiles, ...notHeicFiles, ...convertedFiles]);
  };

  const handleDelete = (e, index) => {
    e.stopPropagation(); // Fermare la propagazione del click
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
      "video/x-ms-wmv": [".wmv"]
    },
    onDrop: handleDrop
  });

  return (
    <div className="p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed ${
          color === "failure" ? "border-red-400" : "border-gray-400"
        } rounded-lg p-4 mb-4 cursor-pointer max-w-full`}
      >
        <input {...getInputProps()} disabled={disabled} />
        {files.length === 0 && (
          <p className="text-center text-gray-500">
            Trascina qui i tuoi file o clicca per selezionarli.
          </p>
        )}

        <div className="grid grid-cols-3 gap-4">
          {files.map((file, i) => (
            <div key={i} className="relative max-w-full">
              {file.type.includes("image") ? (
                <LazyLoadImage
                  src={URL.createObjectURL(file)}
                  alt="Immagine"
                  className="w-full h-auto max-h-64 object-contain rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <ReactPlayer
                  className="w-full h-auto max-h-64 object-contain rounded"
                  controls
                  height={128}
                  width={384}
                  url={URL.createObjectURL(file)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <button
                type="button"
                onClick={(e) => handleDelete(e, i)}
                className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-1"
              >
                <FaTrash className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FileUploader.propTypes = {
  files: PropTypes.array.isRequired,
  setFiles: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  color: PropTypes.string,
  maxPhotos: PropTypes.number,
  maxVideos: PropTypes.number
};

FileUploader.displayName = "FileUploader";

export default FileUploader;

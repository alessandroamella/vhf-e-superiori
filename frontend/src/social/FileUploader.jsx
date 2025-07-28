import { Toast } from "flowbite-react";
import heic2any from "heic2any";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaExclamationTriangle, FaTrash } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReactPlayer from "react-player";
import { v4 as uuidv4 } from "uuid";

const FileItem = React.memo(({ file, index, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(e, index);
  };

  return (
    <div className="relative max-w-full">
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
        onClick={handleDelete}
        className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-1"
      >
        <FaTrash className="text-red-500" />
      </button>
    </div>
  );
});

FileItem.propTypes = {
  file: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
};

FileItem.displayName = "FileItem";

const FileUploader = ({
  files,
  setFiles,
  disabled,
  color,
  maxPhotos,
  maxVideos,
}) => {
  const [toast, setToast] = useState(null);

  /**
   * @param {File[]} acceptedFiles
   * @param {File[]} rejectedFiles
   */
  const handleDrop = async (acceptedFiles) => {
    const currentPhotos = files.filter((file) =>
      file.type.startsWith("image"),
    ).length;
    const currentVideos = files.filter((file) =>
      file.type.startsWith("video"),
    ).length;

    let newPhotos = 0;
    let newVideos = 0;

    // Calculate current total size of existing files
    const currentTotalSize = files.reduce(
      (total, file) => total + file.size,
      0,
    );
    const maxTotalSize = 99.5 * 1024 * 1024; // 99.5MB in bytes

    // Filter files by count limits first
    const countFilteredFiles = acceptedFiles.filter((file) => {
      if (file.type.startsWith("image")) {
        newPhotos++;
        return currentPhotos + newPhotos <= maxPhotos;
      } else if (file.type.startsWith("video")) {
        newVideos++;
        return currentVideos + newVideos <= maxVideos;
      }
      return false;
    });

    // Then filter by total size limit
    const sizeFilteredFiles = [];
    const rejectedFiles = [];
    let runningTotalSize = currentTotalSize;

    for (const file of countFilteredFiles) {
      if (runningTotalSize + file.size <= maxTotalSize) {
        sizeFilteredFiles.push(file);
        runningTotalSize += file.size;
      } else {
        rejectedFiles.push(file);
      }
    }

    // Show toast if files were rejected due to size limit
    if (rejectedFiles.length > 0) {
      const rejectedNames = rejectedFiles.map((f) => f.name).join(", ");
      const remainingSpace = Math.max(0, maxTotalSize - currentTotalSize);
      const remainingSpaceMB = (remainingSpace / (1024 * 1024)).toFixed(1);

      setToast({
        type: "error",
        message: `I seguenti file superano il limite totale di 99.5MB: ${rejectedNames}. Spazio rimanente: ${remainingSpaceMB}MB`,
        files: rejectedFiles.length,
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setToast(null), 5000);
    }

    // check if any heic file
    const heicFiles = sizeFilteredFiles.filter(
      (file) =>
        file.type === "image/heic" ||
        file.name.endsWith(".heic") ||
        file.name.endsWith(".heif"),
    );
    const notHeicFiles = sizeFilteredFiles.filter(
      (file) =>
        file.type !== "image/heic" &&
        !file.name.endsWith(".heic") &&
        !file.name.endsWith(".heif"),
    );

    // convert heic files to jpg
    const convertedFiles = [];
    for (const file of heicFiles) {
      const convertedFile = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      });
      const heic = [];
      Array.isArray(convertedFile)
        ? heic.push(...convertedFile)
        : heic.push(convertedFile);
      for (const f of heic) {
        f.name = `${uuidv4()}.jpg`;
      }
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
      "video/x-ms-wmv": [".wmv"],
    },
    onDrop: handleDrop,
  });

  // Calculate current total size for display
  const currentTotalSize = files.reduce((total, file) => total + file.size, 0);
  const currentTotalSizeMB = (currentTotalSize / (1024 * 1024)).toFixed(1);
  const maxTotalSizeMB = 99.5;

  return (
    <div className="p-4">
      {/* Toast for file size errors */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200">
              <FaExclamationTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              <div className="font-semibold text-gray-900 dark:text-white">
                Limite totale superato ({toast.files} file rifiutati)
              </div>
              <div className="text-gray-500 dark:text-gray-300 text-xs mt-1">
                {toast.message}
              </div>
            </div>
            <Toast.Toggle onDismiss={() => setToast(null)} />
          </Toast>
        </div>
      )}

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

        {/* Display current total size */}
        {files.length > 0 && (
          <div className="text-sm text-gray-600 mb-2 text-center">
            Dimensione totale: {currentTotalSizeMB}MB / {maxTotalSizeMB}MB
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {files.map((file, i) => (
            <FileItem
              key={file.path || i}
              file={file}
              index={i}
              onDelete={handleDelete}
            />
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
  maxVideos: PropTypes.number,
};

FileUploader.displayName = "FileUploader";

export default FileUploader;

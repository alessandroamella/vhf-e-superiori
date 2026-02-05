import axios from "axios";
import { Alert, Button, Select, Spinner, TextInput } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaDownload, FaSync } from "react-icons/fa";
import { getErrorStr } from "../shared";

const LogViewer = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [logContent, setLogContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const logContainerRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/logs");
      setFiles(data);
    } catch (err) {
      setError(getErrorStr(err?.response?.data?.err));
    }
  }, []);

  const fetchContent = useCallback(async () => {
    if (!selectedFile) return;
    setLoading(true);
    setHasFetched(true);
    setLogContent(null);
    setError(null);
    try {
      const { data } = await axios.get(`/api/logs/${selectedFile}`);
      // Handle axios parsing JSON automatically if the whole file is valid JSON,
      // but logs are usually line-delimited JSON or raw text.
      // We want string representation.
      setLogContent(
        typeof data === "object" ? JSON.stringify(data, null, 2) : data
      );
    } catch (err) {
      setError(getErrorStr(err?.response?.data?.err));
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const handleExport = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const response = await axios.get(`/api/logs/${selectedFile}/export`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", selectedFile);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorStr(err?.response?.data?.err));
    }
  }, [selectedFile]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (logContent && logContainerRef.current) {
      logContainerRef.current.scrollTo({
        top: logContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [logContent]);

  useEffect(() => {
    if (selectedFile) {
      fetchContent();
    }
  }, [selectedFile, fetchContent]);

  // Filter content based on search term
  const getFilteredContent = () => {
    if (!logContent) return [];
    const lines = logContent.split("\n");
    if (!searchTerm) return lines;

    return lines.filter((line) =>
      line.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredLines = getFilteredContent();

  return (
    <div className="space-y-4">
      {error && <Alert color="failure">{error}</Alert>}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="w-full md:w-1/3"
        >
          <option value="">Seleziona un file</option>
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>

        <TextInput
          placeholder="Cerca nei log..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />

        <Button
          color="light"
          onClick={fetchContent}
          disabled={loading || !selectedFile}
        >
          <FaSync className={loading ? "animate-spin" : ""} />
        </Button>

        <Button color="light" onClick={handleExport} disabled={!selectedFile}>
          <FaDownload />
        </Button>
      </div>

      <div
        ref={logContainerRef}
        className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto h-[60vh] overflow-y-scroll shadow-inner"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="xl" />
          </div>
        ) : filteredLines.length > 0 ? (
          filteredLines.map((line, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static
              key={idx}
              className="whitespace-pre-wrap border-b border-gray-800 py-0.5 hover:bg-gray-800"
            >
              {line}
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">
            {hasFetched ? (
              "Nessun log trovato o file vuoto."
            ) : (
              <span>
                Clicca il pulsante <FaSync className="inline-block mx-1" /> per
                caricare i log.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;

import axios from "axios";
import {
  Alert,
  Button,
  Select,
  Spinner,
  Tabs,
  TextInput,
} from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaDownload, FaSync } from "react-icons/fa";
import { getErrorStr } from "../shared";

const ClickToLoad = ({ hasFetched }) => {
  return (
    <div className="text-gray-500 italic p-4">
      {hasFetched ? (
        "Nessun log trovato o file vuoto."
      ) : (
        <span>
          Seleziona un file per caricare i log (se l'hai già selezionato, clicca
          il pulsante <FaSync className="inline-block mx-1" /> per ricaricarli).
        </span>
      )}
    </div>
  );
};

const LogViewer = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [logContent, setLogContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const logContainerRef = useRef(null);
  const structuredContainerRef = useRef(null);

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
        typeof data === "object" ? JSON.stringify(data, null, 2) : data,
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
        responseType: "blob",
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
    if (logContent) {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTo({
          top: logContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
      if (structuredContainerRef.current) {
        structuredContainerRef.current.scrollTo({
          top: structuredContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
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
      line.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const getParsedLogs = () => {
    if (!logContent) return [];
    const lines = logContent.split("\n");
    const parsed = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return {
          raw: line,
          timestamp: "",
          level: "",
          label: "",
          message: line,
        };
      }
    });
    if (!searchTerm) return parsed;
    return parsed.filter(
      (log) =>
        (log.message || log.raw || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (log.timestamp || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (log.level || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.label || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const filteredLines = getFilteredContent();
  const parsedLogs = getParsedLogs();

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

      <Tabs>
        <Tabs.Item title="Raw">
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
              <ClickToLoad hasFetched={hasFetched} />
            )}
          </div>
        </Tabs.Item>
        <Tabs.Item title="Structured">
          <div
            ref={structuredContainerRef}
            className="overflow-x-auto h-[60vh] overflow-y-scroll"
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner size="xl" />
              </div>
            ) : parsedLogs.length > 0 ? (
              <table className="w-full text-xs bg-gray-900 text-green-400 rounded-lg shadow-inner">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-2 text-left">Timestamp</th>
                    <th className="p-2 text-left">Level</th>
                    <th className="p-2 text-left">Label</th>
                    <th className="p-2 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLogs.map((log, idx) => (
                    <tr
                      // biome-ignore lint/suspicious/noArrayIndexKey: static
                      key={idx}
                      className="border-b border-gray-800 hover:bg-gray-800"
                    >
                      <td className="p-2 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-2 whitespace-nowrap">{log.level}</td>
                      <td className="p-2 whitespace-nowrap">{log.label}</td>
                      <td className="p-2 whitespace-pre-wrap">
                        {typeof log.message === "string"
                          ? log.message
                          : JSON.stringify(log.message, null, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ClickToLoad hasFetched={hasFetched} />
            )}
          </div>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};

export default LogViewer;

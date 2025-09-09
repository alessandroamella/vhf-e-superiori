import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiDownload, FiExternalLink, FiEye } from "react-icons/fi";

const AntenneGianni = () => {
  const [selectedBand, setSelectedBand] = useState("144");
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pdfViewerSupported, setPdfViewerSupported] = useState(true);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  // Check if device is mobile and PDF viewer support
  useEffect(() => {
    const checkMobileAndPdfSupport = () => {
      // Check if device is mobile
      const mobileCheck =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobile(mobileCheck);

      // Check if PDF viewer is supported (basic check)
      const pdfSupported = navigator.mimeTypes?.["application/pdf"];
      setPdfViewerSupported(!!pdfSupported);
    };

    checkMobileAndPdfSupport();
  }, []);

  // PDF files for each band
  const pdfFiles = {
    144: [
      "6.pdf",
      "6.1.pdf",
      "6.2.pdf",
      "6.3.pdf",
      "6.4.pdf",
      "6.5.pdf",
      "6.6.pdf",
      "6.7.pdf",
      "6.8.pdf",
      "6.9.pdf",
      "6.10.pdf",
      "6.11.pdf",
      "6.12.pdf",
      "6.13.pdf",
      "6.14.pdf",
      "6.15.pdf",
      "6.16.pdf",
      "7.pdf",
      "7.1.pdf",
      "7.2.pdf",
      "7.3.pdf",
      "7.4.pdf",
      "7.5.pdf",
      "7.6.pdf",
      "8.pdf",
      "8.1.pdf",
      "8.2.pdf",
      "8.3.pdf",
      "8.4.pdf",
      "8.5.pdf",
      "8.6.pdf",
      "9.pdf",
      "9.1.pdf",
      "9.2.pdf",
      "9.3.pdf",
      "9.4.pdf",
      "10.pdf",
      "10.1.pdf",
      "10.2.pdf",
      "11.pdf",
      "11.1.pdf",
      "11.2.pdf",
      "11.3.pdf",
      "11.4.pdf",
      "11.5.pdf",
      "11.6.pdf",
      "11.7.pdf",
      "12.pdf",
      "12.1.pdf",
      "12.2.pdf",
      "13.pdf",
      "13.1.pdf",
      "13.2.pdf",
      "13.3.pdf",
      "13.4.pdf",
      "13.5.pdf",
      "13.6.pdf",
      "13.7.pdf",
      "14.pdf",
      "14.1.pdf",
      "14.2.pdf",
      "15.pdf",
      "15.1.pdf",
      "15.2.pdf",
      "16.pdf",
      "16.1.pdf",
      "16.2.pdf",
      "17.pdf",
      "17.1.pdf",
      "17.2.pdf",
      "17.3.pdf",
      "18.pdf",
      "18.1.pdf",
      "19.pdf",
      "20.pdf",
      "21.pdf",
      "21.1.pdf",
      "22.pdf",
      "22 (2).pdf",
      "22 (3).pdf",
      "23.pdf",
      "24.pdf",
      "24.1.pdf",
      "24.2.pdf",
    ],
    432: [
      "5.pdf",
      "7.pdf",
      "7.1.pdf",
      "9.pdf",
      "9.1.pdf",
      "9.2.pdf",
      "9.3.pdf",
      "9.4.pdf",
      "10.pdf",
      "10.1.pdf",
      "10.2.pdf",
      "10.3.pdf",
      "13.pdf",
      "13.1.pdf",
      "14.pdf",
      "14.1.pdf",
      "15.pdf",
      "16.pdf",
      "16.1.pdf",
      "16.3.pdf",
      "18.pdf",
      "18.1.pdf",
      "18.3.pdf",
      "19.pdf",
      "19.1.pdf",
      "20.pdf",
      "20.1.pdf",
      "20.2.pdf",
      "30.pdf",
      "34.pdf",
      "34.1.pdf",
      "36.pdf",
      "36.1.pdf",
      "40.pdf",
      "40.1.pdf",
      "43.pdf",
      "43.1.pdf",
      "49.pdf",
    ],
    1296: [
      "7.pdf",
      "9.pdf",
      "17.pdf",
      "26.pdf",
      "26.1.pdf",
      "26.2.pdf",
      "31.pdf",
      "35.1.pdf",
      "42.pdf",
      "50.pdf",
      "50.1.pdf",
      "50.2.pdf",
    ],
  };

  const handlePdfSelect = (filename) => {
    // Reset error state
    setPdfLoadError(false);

    // On mobile or when PDF viewer is not supported, open externally
    if (isMobile || !pdfViewerSupported) {
      openPdfExternal(filename);
    } else {
      setSelectedPdf(filename);
    }
  };

  const openPdfExternal = (filename) => {
    const pdfUrl = `https://vhfesuperiori.s3.eu-central-1.amazonaws.com/antenne-gianni/${selectedBand}/${filename}`;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = (filename) => {
    const link = document.createElement("a");
    link.href = `https://vhfesuperiori.s3.eu-central-1.amazonaws.com/antenne-gianni/${selectedBand}/${filename}`;
    link.download = filename;
    link.click();
  };

  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>
          {t("gianniAntennas") || "Antenne Gianni I4GBZ"} - VHF e Superiori
        </title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Dedication */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
              PROGETTI ANTENNE YAGI I4GBZ
            </h1>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-6 rounded">
              <p className="text-lg font-semibold text-center text-gray-700 dark:text-gray-200 italic">
                NEL VIVO RICORDO DI UN AMICO CHE HA DEDICATO LA VITA CON
                PASSIONE ALLA PROGETTAZIONE DI ANTENNE YAGI, CERTI DI FARE LA
                SUA VOLONTÀ, CONDIVIDIAMO CON TUTTI I SUOI PROGETTI
              </p>
            </div>
          </div>

          {/* Band Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
              Seleziona la frequenza
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.keys(pdfFiles).map((band) => (
                <Button
                  key={band}
                  onClick={() => {
                    setSelectedBand(band);
                    setSelectedPdf(null);
                  }}
                  color={selectedBand === band ? "blue" : "gray"}
                  size="lg"
                  className="min-w-[150px]"
                >
                  Antenne {band} MHz
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PDF List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                Progetti per {selectedBand} MHz ({pdfFiles[selectedBand].length}{" "}
                file)
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {pdfFiles[selectedBand].map((filename) => (
                    <div
                      key={filename}
                      className={`flex items-center justify-between p-3 rounded border ${
                        selectedPdf === filename
                          ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {filename}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="blue"
                          onClick={() => handlePdfSelect(filename)}
                        >
                          {isMobile || !pdfViewerSupported ? (
                            <FiExternalLink className="w-3 h-3 mr-1" />
                          ) : (
                            <FiEye className="w-3 h-3 mr-1" />
                          )}
                          {isMobile || !pdfViewerSupported
                            ? "Apri"
                            : "Visualizza"}
                        </Button>
                        <Button
                          size="xs"
                          color="green"
                          onClick={() => downloadPdf(filename)}
                        >
                          <FiDownload className="w-3 h-3 mr-1" />
                          Scarica
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {isMobile || !pdfViewerSupported ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <FiExternalLink className="w-12 h-12 mb-4" />
                  <p className="text-center">
                    Su dispositivi mobili o quando il visualizzatore PDF non è
                    supportato, i PDF si apriranno in una nuova scheda
                  </p>
                  <p className="text-sm text-center mt-2">
                    Clicca su "Apri" per visualizzare un PDF
                  </p>
                </div>
              ) : selectedPdf ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {selectedPdf}
                    </h3>
                    <Button
                      size="xs"
                      color="gray"
                      onClick={() => openPdfExternal(selectedPdf)}
                    >
                      <FiExternalLink className="w-3 h-3 mr-1" />
                      Apri in nuova scheda
                    </Button>
                  </div>
                  <div className="border rounded overflow-hidden">
                    {pdfLoadError ? (
                      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-gray-700">
                        <FiExternalLink className="w-12 h-12 mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                          Impossibile visualizzare il PDF nel browser
                        </p>
                        <Button
                          color="blue"
                          onClick={() => openPdfExternal(selectedPdf)}
                        >
                          <FiExternalLink className="w-4 h-4 mr-2" />
                          Apri in nuova scheda
                        </Button>
                      </div>
                    ) : (
                      <iframe
                        src={`https://vhfesuperiori.s3.eu-central-1.amazonaws.com/antenne-gianni/${selectedBand}/${selectedPdf}`}
                        className="w-full h-96"
                        title={`PDF Viewer - ${selectedPdf}`}
                        onError={() => setPdfLoadError(true)}
                        onLoad={(e) => {
                          // Check if iframe content loaded successfully
                          try {
                            const iframeDoc = e.target.contentDocument;
                            if (
                              !iframeDoc ||
                              iframeDoc.title.includes("404") ||
                              iframeDoc.title.includes("Error")
                            ) {
                              console.log(
                                "PDF load error detected:",
                                iframeDoc.title,
                                selectedPdf,
                              );
                              setPdfLoadError(true);
                            }
                          } catch (error) {
                            // Cross-origin restrictions prevent access, but that's expected
                            // PDF likely loaded successfully if we get here
                            console.log(
                              "PDF loaded, cross-origin access restricted,",
                              error,
                            );
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  Seleziona un PDF per visualizzarlo
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AntenneGianni;

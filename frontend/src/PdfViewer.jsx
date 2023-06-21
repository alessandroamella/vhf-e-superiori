import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { MediaBlock } from "react-placeholder/lib/placeholders";
import "react-placeholder/lib/reactPlaceholder.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const LazyPDFViewer = ({ pdfName, shouldRender }) => {
  const [numPages, setNumPages] = useState(null);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {shouldRender ? (
        <Document
          file={pdfName}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              className="border border-gray-300 rounded-lg shadow-md my-4 overflow-auto max-h-[69vh] max-w-[80vw] min-w-full mx-auto p-1"
            />
          ))}
        </Document>
      ) : (
        <MediaBlock
          type="media"
          className="w-full max-w-[80vw] h-full max-h-[69vh]"
        />
      )}
    </div>
  );
};

export default LazyPDFViewer;

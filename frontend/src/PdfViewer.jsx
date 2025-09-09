import PropTypes from "prop-types";
import { MediaBlock } from "react-placeholder/lib/placeholders";

const LazyPDFViewer = ({ pdfName, shouldRender }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {shouldRender ? (
        <iframe
          src={pdfName}
          className="w-full h-[69vh] border border-gray-300 rounded-lg"
          title="PDF Viewer"
        />
      ) : (
        <MediaBlock
          type="media"
          className="w-full max-w-[80vw] h-full max-h-[69vh]"
        />
      )}
    </div>
  );
};

LazyPDFViewer.propTypes = {
  pdfName: PropTypes.string.isRequired,
  shouldRender: PropTypes.bool.isRequired,
};

LazyPDFViewer.displayName = "LazyPDFViewer";

export default LazyPDFViewer;

import { useEffect, useState } from "react";
import Layout from "../Layout";
import Markdown from "react-markdown";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Alert, Card } from "flowbite-react";
import ReactPlaceholder from "react-placeholder";
import { getErrorStr } from "../shared";

const MdViewer = () => {
  const { name } = useParams();

  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDoc() {
      try {
        const { data } = await axios.get(`/api/document/${name}`);
        setDoc(data);
      } catch (err) {
        setError(getErrorStr(err?.response?.data?.err || err));
      }
    }
    fetchDoc();
  }, [name]);

  return (
    <Layout>
      <Card className="md:mx-4 lg:mx-6 shadow">
        {error ? (
          <Alert color="failure">{error}</Alert>
        ) : (
          <ReactPlaceholder
            showLoadingAnimation
            type="text"
            rows={10}
            ready={!!doc}
          >
            <Markdown className="markdown dark:text-white">{doc}</Markdown>
          </ReactPlaceholder>
        )}
      </Card>
    </Layout>
  );
};

export default MdViewer;

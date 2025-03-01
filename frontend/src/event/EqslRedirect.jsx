import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

// redirect to /qso/:id

const EqslRedirect = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    console.log("Redirecting to /qso/" + id);
    navigate("/qso/" + id);
  }, [id, navigate]);

  return <></>;
};

export default EqslRedirect;

import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useLocation } from "react-router";

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname });
  }, [location]);
}

export default usePageTracking;

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import Splash from "./Splash";

const SplashWrapper = ({ children }) => {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const { i18n } = useTranslation();

  // Check if translations are loaded
  useEffect(() => {
    if (i18n.isInitialized) {
      setTranslationsLoaded(true);
    }
  }, [i18n.isInitialized]);

  useEffect(() => {
    const isHomepage = location.pathname === "/";
    const minDisplayTime = 1000 * (isHomepage ? 3 : 2); // 3 seconds for homepage, 2 seconds for others

    // Prevent scrolling during splash
    if (showSplash) {
      document.body.style.overflow = "hidden";
    }

    const timer = setTimeout(() => {
      setReady(true); // Start the slide-out animation

      // Wait for the animation to complete before removing the splash
      setTimeout(() => {
        setShowSplash(false);
        // Re-enable scrolling
        document.body.style.overflow = "unset";
      }, 1000); // Give 1 second for the slide animation to complete
    }, minDisplayTime);

    return () => {
      clearTimeout(timer);
      // Cleanup: ensure scrolling is re-enabled
      document.body.style.overflow = "unset";
    };
  }, [location.pathname, showSplash]);

  return (
    <>
      {/* Show children when translations are loaded AND animation starts (ready=true) */}
      {translationsLoaded && ready && children}
      {/* Show splash overlay on top */}
      {showSplash && <Splash ready={ready} />}
    </>
  );
};

// This is the fallback component for Suspense (shown while translations are loading)
const SplashLoader = () => {
  return <Splash ready={false} />;
};

export default SplashLoader;
export { SplashWrapper };

import Header from "./Header";
import Footer from "./Footer";
import BurgerMenu from "./sideMenu/BurgerMenu";
// import { Helmet } from "react-helmet";

const Layout = ({ children }) => (
  <div className="m-0 p-0 dark:bg-gray-700" id="outer-container">
    {/* <Helmet>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin=""
      />
      <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""
      ></script>
    </Helmet> */}
    <BurgerMenu />
    <div id="page-wrap" className="m-0 p-0">
      <Header />
      {children}
      <Footer />
    </div>
  </div>
);

export default Layout;

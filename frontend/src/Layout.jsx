import Header from "./Header";
import Footer from "./Footer";
import BurgerMenu from "./sideMenu/BurgerMenu";
import PropTypes from "prop-types";

const Layout = ({ children }) => (
  <div className="m-0 p-0 dark:bg-gray-700" id="outer-container">
    <BurgerMenu />
    <div id="page-wrap" className="m-0 p-0">
      <Header />
      {children}
      <Footer />
    </div>
  </div>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

Layout.displayName = "Layout";

export default Layout;

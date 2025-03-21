import { Outlet } from "react-router";
import Footer from "./Footer";
import Header from "./Header";
import BurgerMenu from "./sideMenu/BurgerMenu";

const Layout = () => (
  <div className="m-0 p-0 dark:bg-gray-700" id="outer-container">
    <BurgerMenu />
    <div id="page-wrap" className="m-0 p-0">
      <Header />
      <Outlet />
      <Footer />
    </div>
  </div>
);

Layout.displayName = "Layout";

export default Layout;

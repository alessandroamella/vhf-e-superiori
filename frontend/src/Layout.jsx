import Header from "./Header";
import Footer from "./Footer";
import BurgerMenu from "./sideMenu/BurgerMenu";

const Layout = ({ children }) => (
  <div className="m-0 p-0" id="outer-container">
    <BurgerMenu />
    <div id="page-wrap" className="m-0 p-0">
      <Header />
      {children}
      <Footer />
    </div>
  </div>
);

export default Layout;

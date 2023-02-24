import Header from "./Header";
import Footer from "./Footer";
import BurgerMenu from "./BurgerMenu";

const Layout = ({ children }) => (
  <div className="m-0 p-0 min-h-screen" id="outer-container">
    <BurgerMenu />
    <div className="m-0 p-0">
      <Header />
      {children}
      <Footer />
    </div>
  </div>
);

export default Layout;

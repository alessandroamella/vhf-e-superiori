import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => (
  <div className="m-0 p-0 min-h-screen">
    <Header />
    {children}
    <Footer />
  </div>
);

export default Layout;

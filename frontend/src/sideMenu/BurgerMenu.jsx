import { useContext, useEffect } from "react";
import { reveal as BurgerMenuComponent } from "react-burger-menu";
import { useLocation } from "react-router";
import { JoinOpenContext, SidebarOpenContext } from "../App";
import MenuContent from "./MenuContent";

const BurgerMenu = () => {
  const { sidebarOpen, setSidebarOpen } = useContext(SidebarOpenContext);
  const { joinOpen } = useContext(JoinOpenContext);

  const location = useLocation();

  useEffect(() => {
    console.log({ location: location });
  }, [location]);

  useEffect(() => {
    if (joinOpen) {
      setSidebarOpen(false);
    }
  }, [joinOpen, setSidebarOpen]);

  return (
    <div
      className={`${window.location.pathname === "/social" ? "md:hidden" : ""}`}
    >
      <BurgerMenuComponent
        right
        pageWrapId={"page-wrap"}
        outerContainerId={"outer-container"}
        isOpen={sidebarOpen}
        onStateChange={(state) => setSidebarOpen(state.isOpen)}
      >
        <MenuContent />
      </BurgerMenuComponent>
    </div>
  );
};

export default BurgerMenu;

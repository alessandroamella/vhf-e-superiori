import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { JoinOpenContext, ReadyContext } from "..";
import { reveal as BurgerMenuComponent } from "react-burger-menu";
import MenuContent from "./MenuContent";

const MenuOpenContext = createContext(false);

const BurgerMenu = () => {
  const { ready } = useContext(ReadyContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const { joinOpen } = useContext(JoinOpenContext);

  useEffect(() => {
    if (joinOpen) {
      setMenuOpen(false);
      if (window.location.pathname !== "/") navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinOpen]);

  const navigate = useNavigate();

  return (
    <div
      className={`${window.location.pathname === "/social" ? "md:hidden" : ""}`}
    >
      <MenuOpenContext.Provider value={{ menuOpen, setMenuOpen }}>
        {ready && (
          <BurgerMenuComponent
            right
            pageWrapId={"page-wrap"}
            outerContainerId={"outer-container"}
            isOpen={menuOpen}
            onStateChange={state => setMenuOpen(state.isOpen)}
          >
            <MenuContent />
          </BurgerMenuComponent>
        )}
      </MenuOpenContext.Provider>
    </div>
  );
};

export default BurgerMenu;

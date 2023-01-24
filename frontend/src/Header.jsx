import { Link, useNavigate } from "react-router-dom";
import { FaCaretDown, FaUserAlt } from "react-icons/fa";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  Typography
} from "@material-tailwind/react";
import { useContext, useState } from "react";
import { getErrorStr, UserContext } from ".";
import { Spinner, Toast } from "flowbite-react";
import axios from "axios";

const Header = () => {
  const { user, setUser } = useContext(UserContext);

  const [toast, setToast] = useState("");

  const navigate = useNavigate();

  async function logout() {
    try {
      await axios.post("/api/auth/logout");
      setToast("✅ Logout avvenuto con successo");
      setUser(null);
    } catch (err) {
      setToast(getErrorStr(err?.response?.data?.err));
    }
  }

  return (
    <header className="bg-white py-4 px-8 flex items-center">
      <Link
        to="/"
        className="flex items-center hover:scale-105 transition-transform"
      >
        <img className="w-14" src="/logo-min.png" alt="Logo" loading="lazy" />
        <Typography
          variant="h3"
          className="font-bold ml-3 hidden md:block text-blue-500"
        >
          vhfesuperiori
        </Typography>
      </Link>
      {user?.isAdmin && (
        <Link
          to="/eventmanager"
          className="bg-red-600 text-white p-2 ml-6 rounded font-medium"
        >
          Gestione eventi (admin)
        </Link>
      )}
      <div className="ml-auto p-2 rounded flex items-center">
        {toast && (
          <Toast className="mr-8">
            <div className="text-sm font-normal">{toast}</div>
            <Toast.Toggle />
          </Toast>
        )}
        {user === null ? (
          <Menu>
            <MenuHandler>
              <Button>Login</Button>
            </MenuHandler>
            <MenuList>
              <MenuItem onClick={() => navigate("/login")}>Login</MenuItem>
              <MenuItem onClick={() => navigate("/signup")}>
                Registrati
              </MenuItem>
            </MenuList>
          </Menu>
        ) : user ? (
          <Menu>
            <MenuHandler>
              <p className="flex items-center font-bold text-xl tracking-tighter cursor-pointer hover:underline hover:animate-pulse transition-all">
                <FaCaretDown />
                <span className="ml-1">{user.callsign}</span>
              </p>
            </MenuHandler>
            <MenuList>
              <MenuItem onClick={() => navigate("/profile")}>
                <div className="flex items-center">
                  <FaUserAlt className="mr-1" />
                  <span className="font-medium">
                    Profilo di {user.callsign}
                  </span>
                </div>
              </MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Spinner />
        )}
      </div>
    </header>
  );
};

export default Header;

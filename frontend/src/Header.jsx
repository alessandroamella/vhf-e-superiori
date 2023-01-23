import { Link, useNavigate } from "react-router-dom";
import { FaUserAlt } from "react-icons/fa";
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
    <header className="bg-black py-4 px-8 text-white flex items-center">
      <Link to="/" className="flex items-center">
        <img className="w-16" src="/logo-min.png" alt="Logo" />
        <Typography variant="h3" className="ml-2">
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
              <Button>{user.callsign}</Button>
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

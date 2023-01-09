import { Link, useNavigate } from "react-router-dom";
import { FaUserAlt } from "react-icons/fa";
import { Button, Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { UserContext } from ".";
import { Spinner } from "flowbite-react";

const Header = () => {
    const navigate = useNavigate();

    const { user } = useContext(UserContext);

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
                    to="/event"
                    className="bg-red-600 text-white p-2 ml-6 rounded font-medium"
                >
                    Gestione eventi (admin)
                </Link>
            )}
            <div className="ml-auto p-2 rounded flex items-center">
                {user === null ? (
                    <Button onClick={() => navigate("/login")}>Login</Button>
                ) : user ? (
                    <Link to="/profile" className="flex items-center">
                        <FaUserAlt className="mr-1" />
                        <span className="font-medium">{user.callsign}</span>
                    </Link>
                ) : (
                    <Spinner />
                )}
            </div>
        </header>
    );
};

export default Header;

import { Link, useNavigate } from "react-router-dom";
import { FaUserAlt } from "react-icons/fa";
import { Button, Typography } from "@material-tailwind/react";

const Header = ({ user }) => {
    const navigate = useNavigate();

    return (
        <header className="bg-black py-4 px-8 text-white flex items-center">
            <Link to="/" className="flex items-center">
                <img className="w-16" src="/logo-min.png" alt="Logo" />
                <Typography variant="h3" className="ml-2">
                    vhfesuperiori
                </Typography>
            </Link>
            <div className="ml-auto p-2 rounded cursor-pointer flex items-center">
                {user ? (
                    <>
                        <FaUserAlt className="mr-1" />
                        <span>ciao</span>
                    </>
                ) : (
                    <Button onClick={() => navigate("/login")}>Login</Button>
                    // <button className="bg-white text-black py-1 px-2 rounded">
                    //     Login
                    // </button>
                )}
            </div>
        </header>
    );
};

export default Header;

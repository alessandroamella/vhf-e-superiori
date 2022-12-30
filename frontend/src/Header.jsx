import { Link } from "react-router-dom";
import { FaUserAlt, FaUserAltSlash } from "react-icons/fa";

const Header = ({ user }) => {
    return (
        <header className="bg-black py-4 px-8 text-white flex items-center">
            <Link to="/" className="flex items-center">
                <img className="w-16" src="/logo-min.png" alt="Logo" />
                <p className="ml-4 uppercase text-2xl font-semibold tracking-tighter">
                    vhfesuperiori
                </p>
            </Link>
            <div className="ml-auto p-2 rounded cursor-pointer flex items-center">
                {user ? (
                    <>
                        <FaUserAlt className="mr-1" />
                        <span>ciao</span>
                    </>
                ) : (
                    <button className="bg-white text-black py-1 px-2 rounded">
                        Login
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;

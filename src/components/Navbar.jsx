import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Car } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdminLoggedIn");
    const userStatus = sessionStorage.getItem("isUserLoggedIn");
    if (adminStatus === "true" || userStatus === "true") {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    sessionStorage.removeItem("isUserLoggedIn");
    sessionStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-black text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
          <Car className="h-6 w-6 text-blue-500" />
          <span className="text-blue-500 font-bold">ParkSense</span>
        </div>
        {!isLoggedIn ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-black border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-gray-800 transition-all"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all"
            >
              Register
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-transparent border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white transition-all"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

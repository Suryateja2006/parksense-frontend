import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car } from "lucide-react";

// Utility function to check if token is expired
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000; // Convert exp to ms
  } catch (e) {
    return true; // If token is invalid
  }
}

function UserLogin() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Check token expiry on mount
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
      // Already logged in and token valid
      navigate("/customerdashboard");
    } else {
      // Clear expired session
      sessionStorage.clear();
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const data = { phone: phoneNumber, password };
    console.log("Data being sent to backend: ", data);

    try {
      const response = await fetch("https://parksense-backend-production-cc04.up.railway.app/api/facultylogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.status === 200) {
        sessionStorage.setItem("token", result.token);
        sessionStorage.setItem("user", JSON.stringify(result.user));
        sessionStorage.setItem("isUserLoggedIn", "true");
        sessionStorage.setItem("userPhoneNumber", result.user.phone);
        sessionStorage.setItem("role", "faculty");

        navigate("/customerdashboard");
      } else {
        setError(result.msg || "An error occurred during login.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-8 shadow-md">
        <div className="text-center mb-6">
          <Car className="mx-auto h-10 w-10 text-blue-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Login to ParkSense</h2>
          <p className="mt-1 text-gray-400">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-4 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="Enter your phone number"
              className="mt-1 w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="mt-1 w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 hover:bg-blue-700 p-2 font-semibold text-white transition"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </div>

        <div className="mt-2 text-center text-sm text-gray-400">
          <Link to="/admin-login" className="text-blue-500 hover:underline">
            Login as Admin
          </Link>
          <br />
          <Link to="/studentlogin" className="text-blue-500 hover:underline">Are you a student?</Link>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;

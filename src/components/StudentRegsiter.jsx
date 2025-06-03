import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car } from "lucide-react";

function StudentRegister() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    const data = { phone: phoneNumber, password, carNumber };

    try {
      const response = await fetch("https://parksense-backend-x5a2.onrender.com/api/studentregister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.status === 200) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("isUserLoggedIn", "true");
        navigate("/studentlogin"); 
      } else {
        setError(result.message || "An error occurred during registration.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-8 shadow-md">
        <div className="text-center mb-6">
          <Car className="mx-auto h-10 w-10 text-blue-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Student Register for ParkSense</h2>
          <p className="mt-1 text-gray-400">Create an account to park your vehicle</p>
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
            <label htmlFor="carNumber" className="block text-sm font-medium text-gray-300">
              Car Number
            </label>
            <input
              id="carNumber"
              type="text"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              required
              placeholder="Enter your car number"
              className="mt-1 w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              className="mt-1 w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
              I agree to the Terms and Conditions
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 hover:bg-blue-700 p-2 font-semibold text-white transition"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/studentlogin" className="text-blue-500 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StudentRegister;

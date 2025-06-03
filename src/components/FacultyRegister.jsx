import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("https://parksense-backend-x5a2.onrender.com/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          carNumber: carNumber,
          password: password,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.msg); 
        setTimeout(() => navigate("/login"), 2000); 
      } else {
        setError(data.msg); 
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-8 shadow-md">
        <div className="text-center mb-6">
          <Car className="mx-auto h-10 w-10 text-blue-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Create an Account</h2>
          <p className="mt-1 text-gray-400">Sign up to start using ParkSense</p>
        </div>

        {error && (
          <div className="mb-4 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 text-center text-sm text-green-500">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300" htmlFor="car-number">
              Car Number
            </label>
            <input
              id="car-number"
              type="text"
              className="w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your car number"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-400">
              I agree to the{" "}
              <Link to="/terms" className="text-blue-500 hover:underline">
                Terms & Conditions
              </Link>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 hover:bg-blue-700 p-2 text-white font-semibold disabled:bg-gray-600"
            disabled={!agreeTerms}
          >
            Register Now
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;

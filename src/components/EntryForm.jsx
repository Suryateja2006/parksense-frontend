import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Car } from "lucide-react";

function EntryForm() {
  const navigate = useNavigate();
  const { carNumber } = useParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidPhoneNumber = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidPhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    const data = {
      car_number: carNumber,
      phone: phoneNumber,
    };

    try {
      const response = await fetch("https://parksense-backend-production-cc04.up.railway.app/api/entry/confirm_booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // const result = await response.json();
      const text = await response.text();
console.log("Raw response from server:", text);
const result = JSON.parse(text);


      if (!response.ok) {
        throw new Error(result.msg || result.message || "Booking failed");
      }

      // Store booking information
      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("userPhoneNumber", phoneNumber);
      sessionStorage.setItem("carNumber", carNumber);
      sessionStorage.setItem("assignedSlot", result.slot); // Store the assigned slot
      sessionStorage.setItem("isUserLoggedIn", "true");

      navigate("/customerdashboard", {
        state: { 
          slot: result.slot,
          bookingDetails: result.bookingDetails 
        }
      });

    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-8 shadow-md">
        <div className="text-center mb-6">
          <Car className="mx-auto h-10 w-10 text-blue-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Faculty Parking</h2>
          <p className="mt-1 text-gray-400">Confirm your phone number to get a slot</p>
        </div>

        <div className="mb-4 text-center text-white">
          <strong>Car Number:</strong> {carNumber || "Not provided"}
        </div>

        {error && (
          <div className="mb-4 p-3 text-center text-sm text-red-500 bg-red-900/50 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
              Faculty Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                setPhoneNumber(value.slice(0, 10)); // Limit to 10 digits
              }}
              required
              placeholder="Enter 10-digit phone number"
              className="mt-1 w-full rounded-md bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              maxLength={10}
              pattern="\d{10}"
              inputMode="numeric"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md p-2 font-semibold text-white transition flex items-center justify-center ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : "Confirm & Get Faculty Slot"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EntryForm;
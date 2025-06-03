// import { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// function ForgotPassword() {
//   const [phone, setPhone] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");

//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/forgot-password", {
//         phone,
//         newPassword,
//       });

//       setMessage(res.data.message);
//       setTimeout(() => navigate("/login"), 2000); // after 2 seconds, go to login page
//     } catch (error) {
//       setMessage(error.response.data.message || "Something went wrong");
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-black">
//       <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-96">
//         <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
//         {message && <p className="text-center mb-4 text-sm text-blue-400">{message}</p>}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block mb-1">Phone Number</label>
//             <input
//               type="text"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               required
//               className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
//             />
//           </div>
//           <div>
//             <label className="block mb-1">New Password</label>
//             <input
//               type="password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               required
//               className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-4"
//           >
//             Reset Password
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ForgotPassword;



import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';

function ForgotPassword() {
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post("https://parksense-backend-x5a2.onrender.com/api/auth/forgot-password", {
        phone,
        newPassword,
        confirmPassword,
      });

      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000); // after 2 seconds, go to login page
    } catch (error) {
      setMessage(error.response.data.message || "Something went wrong");
    }
  };

  return (
    <div>
    <Navbar/>
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Reset Password</h2>
        {message && <p className="text-center mb-4 text-sm text-blue-400">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-white">
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="p-2 w-full bg-black border border-gray-700 rounded"
            />
          </div>
          <div className="text-white">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="p-2 w-full bg-black border border-gray-700 rounded"
            />
          </div>
          <div className="text-white">
            <input
              type="password"
              value={confirmPassword}
              placeholder="Confirm password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="p-2 w-full bg-black border border-gray-700 rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-4"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}

export default ForgotPassword;

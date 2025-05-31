import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const generateInitialSlots = () => {
  const slots = [];
  const rows = ["E", "F", "G", "H"];

  rows.forEach((row) => {
    for (let i = 1; i <= 6; i++) {
      slots.push({
        id: `${row}${i}`,
        status: "available",
      });
    }
  });

  return slots;
};

export default function StudentDashboard() {
  const [slots, setSlots] = useState(generateInitialSlots());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userBookedSlot, setUserBookedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userData, setUserData] = useState({
    carNumber: "",
    phoneNumber: "",
  });
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const phone = sessionStorage.getItem("phone");
        const token = sessionStorage.getItem("token");
  
        if (!phone || !token) {
          navigate("/login");
          return;
        }
  
        const userRaw = sessionStorage.getItem("user");
        const storedUser = userRaw && userRaw !== "undefined" ? JSON.parse(userRaw) : null;
  
        setUserData({
          carNumber: storedUser?.carNumber || "Not available",
          phoneNumber: phone,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
  
        let fallbackUser = null;
        try {
          const fallbackRaw = sessionStorage.getItem("user");
          fallbackUser = fallbackRaw && fallbackRaw !== "undefined" ? JSON.parse(fallbackRaw) : null;
        } catch (err) {
          fallbackUser = null;
        }
  
        setUserData({
          carNumber: fallbackUser?.carNumber || "Not available",
          phoneNumber: sessionStorage.getItem("phone") || "Not available",
        });
      }
    };
  
    fetchUserData().then(() => {
      try {
        initializeParkingLot();
      } catch (err) {
        console.error("Error initializing parking lot:", err);
      }
    });
  }, [navigate]);
  
  
  const initializeParkingLot = async () => {
    const initialSlots = generateInitialSlots(); 
    
    try {
      const utcDate = new Date();
      
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      
      const formattedISTTime = istDate.toISOString().slice(0, 19).replace("T", " ");
      
      const userPhoneNumber = sessionStorage.getItem("phone");
      const user = JSON.parse(sessionStorage.getItem("user"));
  
      if (!userPhoneNumber || !user?.carNumber) {
        console.error("User data missing from localStorage");
        return;
      }
  
      const response = await fetch("http://localhost:5000/api/auto-book-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: userPhoneNumber,
          carNumber: user.carNumber,
          userType: "student",
          bookedAt: formattedISTTime, 
        }),
      });
  
      const data = await response.json();
      console.log("Response from backend:", data);
    
      if (data.success) {
        const allocatedSlot = data.slot.slotNumber;
    
        const updatedSlots = initialSlots.map(slot =>
          slot.id === allocatedSlot ? { ...slot, status: "booked" } : slot
        );
    
        setSlots(updatedSlots);
        setUserBookedSlot({ id: allocatedSlot, status: "booked" });
        console.log("Slot booked:", data.slot);
      } else {
        console.error("Booking error:", data.message);
        setSlots(initialSlots); 
      }
    } catch (error) {
      console.error("Error contacting backend:", error);
      setSlots(initialSlots); 
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleUnbookRequest = () => {
    if (userBookedSlot) {
      setSelectedSlot(userBookedSlot);
      setIsDialogOpen(true);
    }
  };

  const handleUnbookSlot = async () => {
    if (selectedSlot && userBookedSlot && userBookedSlot.id === selectedSlot.id) {
      try {
        const response = await fetch('https://parksense-backend-production.up.railway.app/api/release-slot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slotNumber: selectedSlot.id }),
        });
  
        const data = await response.json();
  
        if (data.success) {
          setSlots(slots.map(slot =>
            slot.id === selectedSlot.id ? { ...slot, status: "available" } : slot
          ));
          setUserBookedSlot(null);
          setIsDialogOpen(false);
        } else {
          console.error("Failed to release slot:", data.message);
        }
      } catch (error) {
        console.error("Error releasing slot:", error);
      }
    }
  };
   

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
          <p className="text-gray-400">Allocating a parking slot for your vehicle...</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-16 w-16 bg-blue-500 rounded-full mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
        <p className="text-gray-400">Your parking slot has been automatically allocated</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8 text-white">
        <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Car Number:</span>
              <span className="font-medium">{userData.carNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone Number:</span>
              <span>{userData.phoneNumber}</span>
            </div>
          </div>
        </div>

        <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Parking Status</h2>
          {userBookedSlot ? (
            <div className="space-y-4">
              <div className="bg-blue-900/10 border border-blue-500 text-blue-400 px-4 py-3 rounded">
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold">Slot Allocated</p>
                    <p>Slot {userBookedSlot.id} has been allocated for your vehicle</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400">Allocated Slot:</p>
                  <p className="text-2xl font-bold text-blue-500">{userBookedSlot.id}</p>
                </div>
                <button 
                  onClick={handleUnbookRequest}
                  className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-700"
                >
                  Release Slot
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 border border-gray-600 text-gray-300 px-4 py-3 rounded">
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold">No Active Allocation</p>
                  <p>You currently don't have an allocated parking slot.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl text-white font-semibold">Parking Lot Map</h2>
        <p className="text-gray-400 text-sm mt-1">View all parking slots and their current status</p>
      </div>

      <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {slots.map((slot) => (
            <ParkingSlotCard key={slot.id} slot={slot} isUserSlot={userBookedSlot?.id === slot.id} />
          ))}
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold">Release Parking Slot {selectedSlot?.id}</h3>
              <p className="text-gray-400 text-sm mt-1">Confirm you want to release your allocated parking slot.</p>
            </div>
            <div className="p-6 border-t border-b border-zinc-800">
              <p className="text-white">
                You are about to release your allocated parking slot{" "}
                <span className="font-bold">{selectedSlot?.id}</span>. This will make the slot available for other
                users.
              </p>
              <p className="text-red-400 mt-2">
                Warning: Once released, a new slot will need to be allocated to you upon your next login.
              </p>
            </div>
            <div className="p-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 border border-zinc-700 rounded-md hover:bg-zinc-800 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUnbookSlot}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Release Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ParkingSlotCard = ({ slot, isUserSlot }) => (
  <div className={`w-full bg-black-900 p-4 rounded-lg ${slot.status === "available" ? "bg-gray-700" : "bg-gray-600"} ${isUserSlot ? 'border-4 border-blue-500' : ''}`}>
    <div className="text-white text-lg text-center font-semibold">{slot.id}</div>
  </div>
);

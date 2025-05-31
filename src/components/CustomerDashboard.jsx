import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Generate parking slots A1–D6
const generateInitialSlots = () => {
  const slots = [];
  const rows = ["A", "B", "C", "D"];
  rows.forEach(row => {
    for (let i = 1; i <= 6; i++) {
      slots.push({ id: `${row}${i}`, status: "available" });
    }
  });
  return slots;
};

// Slot component
const ParkingSlotCard = ({ slot, isUserSlot, carNumber }) => (
  <div className={`relative w-full p-4 rounded-lg 
    ${slot.status === "available" ? "bg-gray-700" : "bg-gray-600"} 
    ${isUserSlot ? "border-4 border-blue-500" : ""}`}>
    <div className="text-white text-lg text-center font-semibold">{slot.id}</div>
    {isUserSlot && carNumber && (
      <div className="mt-2 text-xs text-center text-gray-300 truncate">
        {carNumber}
      </div>
    )}
  </div>
);

// Main Dashboard component
export default function Dashboard() {
  const [slots, setSlots] = useState(generateInitialSlots());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userBookedSlot, setUserBookedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({ carNumber: "", phoneNumber: "" });
  const navigate = useNavigate();

  // Load user info from sessionStorage
  useEffect(() => {
    const fetchUserData = () => {
      try {
        const phone = sessionStorage.getItem("userPhoneNumber");
        const car = sessionStorage.getItem("carNumber");
        const slot = sessionStorage.getItem("assignedSlot");
        const token = sessionStorage.getItem("token");

        if (!phone || !token) return navigate("/login");

        setUserData({ carNumber: car || "", phoneNumber: phone || "" });

        if (slot) {
          setUserBookedSlot({ id: slot, status: "booked" });
          setSlots(prev =>
            prev.map(s => (s.id === slot ? { ...s, status: "booked" } : s))
          );
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Open confirmation modal
  const handleUnbookRequest = () => {
    if (userBookedSlot) {
      setSelectedSlot(userBookedSlot);
      setIsDialogOpen(true);
    }
  };

  // Release the booked slot
  const handleUnbookSlot = async () => {
    if (!selectedSlot) return;

    try {
      const res = await fetch("https://parksense-backend-production-cc04.up.railway.app/api/release-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotNumber: selectedSlot.id }),
      });

      const data = await res.json();
      if (data.success) {
        // Free the slot
        setSlots(prev =>
          prev.map(s => (s.id === selectedSlot.id ? { ...s, status: "available" } : s))
        );
        setUserBookedSlot(null);
        sessionStorage.removeItem("assignedSlot");
      }
    } catch (error) {
      console.error("Error releasing slot:", error);
    } finally {
      setIsDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Loading Dashboard</h1>
        <p className="text-gray-400">Please wait while we load your data...</p>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* HEADER */}
      <div className="mb-8 pt-16 text-white">
        <h1 className="text-3xl font-bold">Faculty Parking Dashboard</h1>
        <p className="text-gray-400">Your current parking allocation</p>
      </div>

      {/* USER INFO & STATUS */}
      <div className="grid md:grid-cols-2 gap-6 mb-8 text-white">
        <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Your Information</h2>
          <div className="space-y-4">
            <InfoRow label="Car Number" value={userData.carNumber} />
            <InfoRow label="Phone Number" value={userData.phoneNumber} />
            {userBookedSlot && <InfoRow label="Allocated Slot" value={userBookedSlot.id} bold />}
          </div>
        </div>

        <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Parking Status</h2>
          {userBookedSlot ? (
            <ActiveAllocation slotId={userBookedSlot.id} onRelease={handleUnbookRequest} />
          ) : (
            <NoAllocation />
          )}
        </div>
      </div>

      {/* SLOT MAP */}
      <div className="mb-4">
        <h2 className="text-xl text-white font-semibold">Parking Lot Map</h2>
        <p className="text-gray-400 text-sm mt-1">Faculty parking slots (A1–D6)</p>
      </div>

      <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {slots.map(slot => (
            <ParkingSlotCard
              key={slot.id}
              slot={slot}
              isUserSlot={userBookedSlot?.id === slot.id}
              carNumber={userBookedSlot?.id === slot.id ? userData.carNumber : ""}
            />
          ))}
        </div>
      </div>

      {/* DIALOG */}
      {isDialogOpen && (
        <ConfirmDialog
          slot={selectedSlot}
          userData={userData}
          onCancel={() => setIsDialogOpen(false)}
          onConfirm={handleUnbookSlot}
        />
      )}
    </div>
  );
}

// Small reusable row component
const InfoRow = ({ label, value, bold = false }) => (
  <div className="flex justify-between items-center border-b border-gray-700 pb-3">
    <span className="text-gray-400">{label}:</span>
    <span className={bold ? "text-2xl font-bold text-blue-500" : "text-lg"}>{value}</span>
  </div>
);

// Component shown when slot is booked
const ActiveAllocation = ({ slotId, onRelease }) => (
  <div className="space-y-4">
    <div className="bg-blue-900/10 border border-blue-500 text-blue-400 px-4 py-3 rounded">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
        </svg>
        <div>
          <p className="font-bold">Active Parking Allocation</p>
          <p>You have slot {slotId} assigned</p>
        </div>
      </div>
    </div>
    <button onClick={onRelease} className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
      Release Parking Slot
    </button>
  </div>
);

// Component shown when no slot is booked
const NoAllocation = () => (
  <div className="bg-gray-700 border border-gray-600 text-gray-300 px-4 py-3 rounded">
    <div className="flex items-center gap-2">
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
      </svg>
      <div>
        <p className="font-bold">No Active Allocation</p>
        <p>You currently don't have an allocated parking slot.</p>
      </div>
    </div>
  </div>
);

// Dialog modal for releasing slot
const ConfirmDialog = ({ slot, userData, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full">
      <div className="p-6">
        <h3 className="text-xl font-semibold">Release Parking Slot {slot?.id}</h3>
        <p className="text-gray-400 text-sm mt-1">This will make the slot available for others</p>
      </div>
      <div className="p-6 border-t border-b border-zinc-800">
        <p className="text-white mb-2">You are releasing:</p>
        <div className="bg-gray-800 p-3 rounded-md space-y-1">
          <DialogRow label="Slot" value={slot?.id} />
          <DialogRow label="Car" value={userData.carNumber} />
          <DialogRow label="Phone" value={userData.phoneNumber} />
        </div>
        <p className="text-red-400 mt-3 text-sm">Note: You'll need to book again for your next visit</p>
      </div>
      <div className="p-4 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border border-zinc-700 rounded-md hover:bg-zinc-800 text-white">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">Confirm Release</button>
      </div>
    </div>
  </div>
);

// Reusable row for confirm dialog
const DialogRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}:</span>
    <span className="font-medium text-white">{value}</span>
  </div>
);

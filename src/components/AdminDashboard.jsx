import { useState, useEffect } from "react";
import { Car, LogOut, X, Check, Info } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("faculty");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUnauthorized, setSelectedUnauthorized] = useState(null);
  const [isUnauthorizedDetailsOpen, setIsUnauthorizedDetailsOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  
  const [facultyStats, setFacultyStats] = useState({ totalSlots: 24, bookedSlots: 0, availableSlots: 24 });
  const [studentStats, setStudentStats] = useState({ totalSlots: 24, bookedSlots: 0, availableSlots: 24 });
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [unauthorizedVehicles, setUnauthorizedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCarNumberVerified, setIsCarNumberVerified] = useState(null);
  const [correctCarNumber, setCorrectCarNumber] = useState("");
  const [showCarNumberInput, setShowCarNumberInput] = useState(false);
  useEffect(() => {

const fetchData = async () => {
  try {
    setLoading(true);
    
    const [facultyRes, studentRes, occupiedRes, unauthorizedRes] = await Promise.all([
      fetch('http://localhost:5000/api/getBookedSlots?type=faculty'),
      fetch('http://localhost:5000/api/getBookedSlots?type=student'),
      fetch('http://localhost:5000/api/slots/occupied'),
      fetch('http://localhost:5000/check-plates') 
    ]);
    if (!facultyRes.ok || !studentRes.ok || !occupiedRes.ok || !unauthorizedRes.ok) {
      throw new Error('Failed to fetch data');
    }
    setFacultyStats(await facultyRes.json());
    setStudentStats(await studentRes.json());
    setOccupiedSlots(await occupiedRes.json());
    
    const unauthorizedData = await unauthorizedRes.json();
    setUnauthorizedVehicles(unauthorizedData.unauthorized || []);
    console.log(unauthorizedData);
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to load data. Please try again.");
  } finally {
    setLoading(false);
  }
};
    fetchData();
    
    // const interval = setInterval(fetchData, 30000);
    // return () => clearInterval(interval);
  }, []);
const generateSlots = () => {
  const startRow = activeTab === "faculty" ? 'A' : 'E';
  return Array.from({ length: 24 }, (_, i) => {
    const row = String.fromCharCode(startRow.charCodeAt(0) + Math.floor(i / 6));
    const col = (i % 6) + 1;
    const slotId = `${row}${col}`;
    
    const slotData = occupiedSlots.find(s => 
      s.slotNumber === slotId && s.userType === activeTab
    );

    return {
      id: slotId,
      status: slotData ? "allocated" : "available",
      carDetails: slotData ? {
        carNumber: slotData.carNumber,
        contactNumber: slotData.phoneNumber,
        
      } : null
    };
  });
};
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = "/admin/login";
  };

const handleSlotClick = (slot) => {
  console.log("Clicked slot ID:", slot.id);
  const occupiedSlot = occupiedSlots.find(s => 
    s.slotNumber === slot.id && 
    s.userType === activeTab
  );

  console.log("Found occupied slot:", occupiedSlot); 
    const formatToIST = (utcDateString) => {
  const date = new Date(utcDateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};
  if (occupiedSlot) {
    setSelectedSlot({
      id: slot.id,
      carDetails: {
        carNumber: occupiedSlot.carNumber,
        contactNumber: occupiedSlot.phoneNumber,
        slot:slot.id,
        imageUrl: "/placeholder.svg",
        bookedAt:formatToIST(occupiedSlot.bookedAt),
        updatedByAdmin:occupiedSlot.updatedByAdmin,
      }
    });
    setIsDetailsDialogOpen(true);
  } else {
    console.log("No matching occupied slot found");
  }
};

  const handleUnauthorizedDetails = (vehicle) => {
    setSelectedUnauthorized(vehicle);
    setIsUnauthorizedDetailsOpen(true);
  };

  const handleTakeAction = (vehicle) => {
    setSelectedUnauthorized(vehicle);
    setIsActionDialogOpen(true);
  };

  const handleActionSelect = (type) => {
    setSelectedAction(type);
    setIsActionDialogOpen(false);
    setIsConfirmationOpen(true);
  };

const handleConfirmAction = async () => {
  try {
    let carNumberToUpdate = selectedUnauthorized.license_plate;
    
    // If admin said the detected number was wrong and provided a correct one
    if (isCarNumberVerified === false && correctCarNumber) {
      carNumberToUpdate = correctCarNumber;
    }

    const response = await fetch(`http://localhost:5000/check-plates/${selectedUnauthorized.license_plate}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ 
        action: selectedAction,
        status: 'resolved',
        correctedCarNumber: isCarNumberVerified === false ? correctCarNumber : null
      })
    });

    if (response.ok) {
      const updatedResponse = await fetch('http://localhost:5000/check-plates');
      const data = await updatedResponse.json();
      
      if (data.success) {
        setUnauthorizedVehicles(data.unauthorized);
        alert(`Vehicle has been moved to ${selectedAction} parking.`);
        
        // Reset verification states
        setIsCarNumberVerified(null);
        setCorrectCarNumber("");
        setShowCarNumberInput(false);
      } else {
        throw new Error('Failed to refresh unauthorized vehicles list');
      }
    } else {
      throw new Error('Failed to update vehicle status');
    }
  } catch (error) {
    console.error("Error taking action:", error);
    alert("Failed to take action. Please try again.");
  } finally {
    setIsConfirmationOpen(false);
  }
};



  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-black flex items-center justify-center">
  //       <div className="text-white">Loading dashboard...</div>
  //     </div>
  //   );
  // }

  const currentSlots = generateSlots();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">ParkSense Admin</span>
          </div>
          <button 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-100 h-10 px-4 py-2 text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Manage parking slots and monitor activity</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-semibold text-white">Faculty Parking</h2>
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold text-blue-500">
                {facultyStats.bookedSlots} / {facultyStats.totalSlots}
              </div>
              <p className="text-sm text-gray-400">Slots currently occupied</p>
            </div>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-semibold text-white">Student Parking</h2>
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold text-blue-500">
                {studentStats.bookedSlots} / {studentStats.totalSlots}
              </div>
              <p className="text-sm text-gray-400">Slots currently occupied</p>
            </div>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-semibold text-white">Unauthorized Parking</h2>
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold text-red-500">
                {unauthorizedVehicles.length}
              </div>
              <p className="text-sm text-gray-400">Requires attention</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="grid w-full grid-cols-3 bg-zinc-900 rounded-md p-1 gap-1 mb-6">
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                activeTab === "faculty" ? "bg-zinc-950 text-white" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("faculty")}
            >
              Faculty
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                activeTab === "student" ? "bg-zinc-950 text-white" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("student")}
            >
              Student
            </button>
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                activeTab === "unauthorized" ? "bg-zinc-950 text-white" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("unauthorized")}
            >
              Unauthorized
            </button>
          </div>

          {activeTab !== "unauthorized" ? (
            <div className="mt-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white">
                    {activeTab === "faculty" ? "Faculty" : "Student"} Parking Lot
                  </h2>
                </div>
                <div className="p-4 pt-0 flex justify-center">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5 h-200 w-200 ">
                    {currentSlots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`
                          flex items-center justify-center aspect-square rounded-md border cursor-pointer
                          ${
                            slot.status === "allocated"
                              ? "bg-red-900/30 border-red-600 hover:bg-red-900/50"
                              : "bg-green-900/30 border-green-600 hover:bg-green-900/50"
                          }
                        `}
                      >
                        <div className="text-center">
                          <span className="font-bold text-lg text-white">{slot.id}</span>
                          {slot.status === "allocated" && (
                            <div className="text-[10px] text-red-400 mt-1">Occupied</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white">Unauthorized Vehicles</h2>
                </div>
                <div className="p-6 pt-0">
                  {unauthorizedVehicles.length > 0 ? (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="w-full">
                        <div className="border-b border-zinc-800 bg-zinc-900">
                          <div className="grid grid-cols-12 h-12 items-center px-6">
                            {/* <div className="col-span-2 font-medium text-white">ID</div> */}
                            <div className="col-span-3 font-medium text-white">Car Number</div>
                            <div className="col-span-3 font-medium text-white">Slot</div>
                            <div className="col-span-2 font-medium text-white">Reported At</div>
                            <div className="col-span-2 font-medium text-white">Actions</div>
                          </div>
                        </div>
                        <div>
                          {unauthorizedVehicles.map((vehicle) => (
                            <div key={vehicle._id} className="border-b border-zinc-800 hover:bg-zinc-900">
                              <div className="grid grid-cols-12 h-14 items-center px-6">
                                {/* <div className="col-span-2 text-white">{vehicle._id.substring(0, 6)}</div> */}
                                <div className="col-span-3 text-white">{vehicle.license_plate}</div>
                                <div className="col-span-3 text-white">{vehicle.slot}</div>
                                <div className="col-span-2 text-white">
                                  {new Date(vehicle.reportedAt).toLocaleTimeString()}
                                </div>
                                <div className="col-span-2 flex gap-2">
                                  <button
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 h-9 px-3 py-1 text-white"
                                    onClick={() => handleUnauthorizedDetails(vehicle)}
                                  >
                                    <Info className="h-4 w-4 mr-1" />
                                    Details
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-900 text-red-50 hover:bg-red-900/90 h-9 px-3 py-1"
                                    onClick={() => handleTakeAction(vehicle)}
                                  >
                                    Take Action
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No unauthorized parking detected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedSlot && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDetailsDialogOpen ? "" : "hidden"}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDetailsDialogOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white">
                Vehicle Details - Slot {selectedSlot.id}
              </h2>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedSlot.carDetails.imageUrl}
                    alt="Car"
                    className="rounded-md object-cover w-full h-auto"
                  />
                </div>
                <div className="space-y-4 text-white">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Car Number</h3>
                    <p className="text-lg font-semibold">{selectedSlot.carDetails.carNumber}</p>
                  </div >
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Slot Number</h3>
                    <p className="text-lg font-semibold">{selectedSlot.carDetails.slot}</p>
                  </div>
                  <div>
  <h3 className="text-sm font-medium text-gray-400">Booked At</h3>
  <p>{(selectedSlot.carDetails.bookedAt)}</p>
</div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Contact</h3>
                    <p>{selectedSlot.carDetails.contactNumber || selectedSlot.carDetails.updatedByAdmin}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                onClick={() => setIsDetailsDialogOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUnauthorized && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isUnauthorizedDetailsOpen ? "" : "hidden"}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsUnauthorizedDetailsOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white">
                Unauthorized Vehicle - {selectedUnauthorized.license_plate}
              </h2>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <img
                src={selectedUnauthorized.imageUrl || '/placeholder.svg'}
                alt="Unauthorized Car"
                className="rounded-md object-cover w-full h-auto"
              />
              <div className="grid grid-cols-2 gap-4 text-white">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Car Number</h3>
                  <p className="text-lg font-semibold">{selectedUnauthorized.license_plate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Slot</h3>
                  <p>{selectedUnauthorized.slot}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Reported At</h3>
                  <p>{new Date(selectedUnauthorized.reportedAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Status</h3>
                  <p className="capitalize">{selectedUnauthorized.status}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                onClick={() => setIsUnauthorizedDetailsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUnauthorized && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isActionDialogOpen ? "" : "hidden"}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsActionDialogOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white">
                Take Action - {selectedUnauthorized.license_plate}
              </h2>
              <p className="text-gray-400 mt-2">
                Select where this vehicle should be assigned
              </p>
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
              <button
                className="h-24 flex flex-col items-center justify-center bg-blue-900/30 hover:bg-blue-900/50 border border-blue-600 rounded-md text-white"
                onClick={() => handleActionSelect("faculty")}
              >
                <Car className="h-8 w-8 mb-2" />
                <span>Faculty</span>
              </button>
              <button
                className="h-24 flex flex-col items-center justify-center bg-green-900/30 hover:bg-green-900/50 border border-green-600 rounded-md text-white"
                onClick={() => handleActionSelect("student")}
              >
                <Car className="h-8 w-8 mb-2" />
                <span>Student</span>
              </button>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 h-10 px-4 py-2 text-white"
                onClick={() => setIsActionDialogOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
{selectedUnauthorized && selectedAction && (
  <div className={`fixed inset-0 z-50 flex items-center justify-center ${isConfirmationOpen ? "" : "hidden"}`}>
    <div className="fixed inset-0 bg-black/50" onClick={() => {
      setIsConfirmationOpen(false);
      setIsCarNumberVerified(null);
      setShowCarNumberInput(false);
    }}></div>
    
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white">
          {isCarNumberVerified === null ? "Verify Car Number" : 
           showCarNumberInput ? "Enter Correct Car Number" : "Confirm Action"}
        </h2>
      </div>
      
      <div className="px-6 pb-6 text-white">
        {/* Step 1: Verify Car Number */}
        {isCarNumberVerified === null && (
          <div className="space-y-6">
            <div>
              <p className="text-gray-400 mb-1">Was the detected car number correct?</p>
              <p className="text-lg font-bold">Detected Car Number: <span className="text-blue-400">{selectedUnauthorized.license_plate}</span></p>
            </div>
            
            <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
              <p>Please verify if the car number <span className="font-bold">{selectedUnauthorized.license_plate}</span> is correct before proceeding to assign it to the <span className="font-bold capitalize">{selectedAction}</span> parking area.</p>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2"
                onClick={() => {
                  setIsCarNumberVerified(false);
                  setShowCarNumberInput(true);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                No, Wrong Number
              </button>
              <button
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
                onClick={() => setIsCarNumberVerified(true)}
              >
                <Check className="h-4 w-4 mr-2" />
                Yes, Correct
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter Correct Number */}
        {showCarNumberInput && (
          <div className="space-y-6">
            <p>Please enter the correct car number for this vehicle</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Correct Car Number
              </label>
              <input
                type="text"
                value={correctCarNumber}
                onChange={(e) => setCorrectCarNumber(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white mb-2"
                placeholder="Enter the correct car number"
              />
              <p className="text-sm text-gray-400">Original detected number: {selectedUnauthorized.license_plate}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 h-10 px-4 py-2 text-white"
                onClick={() => {
                  setShowCarNumberInput(false);
                  setIsCarNumberVerified(null);
                }}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                onClick={() => {
                  if (!correctCarNumber) {
                    alert("Please enter the correct car number");
                    return;
                  }
                  setShowCarNumberInput(false);
                }}
                disabled={!correctCarNumber}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final Confirmation */}
        {isCarNumberVerified !== null && !showCarNumberInput && (
          <div className="space-y-6">
            <p>
              Are you sure you want to move vehicle{" "}
              <span className="font-bold">
                {isCarNumberVerified ? selectedUnauthorized.license_plate : correctCarNumber}
              </span>{" "}
              to the{" "}
              <span className="font-bold capitalize">{selectedAction}</span> parking area?
            </p>

            {!isCarNumberVerified && (
              <div className="bg-zinc-800/50 p-3 rounded-md border border-zinc-700 text-sm">
                <p>Note: Car number was corrected from <span className="line-through">{selectedUnauthorized.license_plate}</span> to <span className="font-bold">{correctCarNumber}</span></p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 h-10 px-4 py-2 text-white"
                onClick={() => {
                  setIsConfirmationOpen(false);
                  setIsCarNumberVerified(null);
                  setCorrectCarNumber("");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
                onClick={handleConfirmAction}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}
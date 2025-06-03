import { useState, useEffect } from "react"
import { Car, LogOut, Check, Info, Trash2, Edit } from "lucide-react"
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("parking")
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedUnauthorized, setSelectedUnauthorized] = useState(null)
  const [isUnauthorizedDetailsOpen, setIsUnauthorizedDetailsOpen] = useState(false)
  const [occupiedSlots, setOccupiedSlots] = useState([])
  const [unauthorizedVehicles, setUnauthorizedVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  // New state for confirmation dialogs
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [isAuthorizeConfirmOpen, setIsAuthorizeConfirmOpen] = useState(false)
  const [vehicleToAuthorize, setVehicleToAuthorize] = useState(null)
  const [isEditCarNumberOpen, setIsEditCarNumberOpen] = useState(false)
  const [editedCarNumber, setEditedCarNumber] = useState("")
  const [isFinalAuthorizeConfirmOpen, setIsFinalAuthorizeConfirmOpen] = useState(false)

  const API_BASE_URL = "https://parksense-backend-x5a2.onrender.com/api/admin"
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("adminToken")
        const response = await fetch(`${API_BASE_URL}/parking-data`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to fetch data")

        const data = await response.json()
        console.log("API data:", data)

        setOccupiedSlots(data.occupiedSlots || [])
        setUnauthorizedVehicles(data.unauthorizedPlates || [])
      } catch (error) {
        console.error("Error:", error)
        alert("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    window.location.href = "/admin-login"
  }

  const handleSlotClick = (slot) => {
    setSelectedSlot({
      id: slot.slotNumber,
      carDetails: {
        carNumber: slot.carNumber,
        slot: slot.slotNumber,
        detectedAt: new Date(slot.bookedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  }})
    setIsDetailsDialogOpen(true)
  }

  const handleDeleteUnauthorized = (vehicle) => {
    setVehicleToDelete(vehicle)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDeleteUnauthorized = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/unauthorized/${vehicleToDelete._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Delete failed:", errorText)
        throw new Error("Failed to delete")
      }

      setUnauthorizedVehicles((prev) => prev.filter((v) => v._id !== vehicleToDelete._id))
      alert("Unauthorized vehicle deleted successfully")
      setIsDeleteConfirmOpen(false)
      setVehicleToDelete(null)
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete. Please try again.")
    }
  }

  const handleAuthorizeVehicle = (vehicle) => {
    setVehicleToAuthorize(vehicle)
    setEditedCarNumber(vehicle.license_plate)
    setIsAuthorizeConfirmOpen(true)
  }

const handleCorrectNumber = async () => {
  try {
    const token = localStorage.getItem("adminToken")
    const response = await fetch(`${API_BASE_URL}/plates/${vehicleToAuthorize._id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "authorize",
        slotNumber: vehicleToAuthorize.slot || 'UNKNOWN', // Use slot from vehicle data
        carNumber: editedCarNumber // Send the car number
      }),
    })

    if (!response.ok) throw new Error("Failed to authorize")

    const data = await response.json()
    alert(data.message)

    // Refresh data
    const updatedResponse = await fetch(`${API_BASE_URL}/parking-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const updatedData = await updatedResponse.json()
    setOccupiedSlots(updatedData.occupiedSlots || [])
    setUnauthorizedVehicles(updatedData.unauthorizedPlates || [])

    // Close all dialogs
    setIsAuthorizeConfirmOpen(false)
    setIsEditCarNumberOpen(false)
    setIsFinalAuthorizeConfirmOpen(false)
    setVehicleToAuthorize(null)
  } catch (error) {
    console.error("Authorization error:", error)
    alert("Failed to authorize vehicle. Please try again.")
  }
}

  const handleEditNumber = () => {
    setIsAuthorizeConfirmOpen(false)
    setIsEditCarNumberOpen(true)
  }

  const handleEditSubmit = () => {
    setIsEditCarNumberOpen(false)
    setIsFinalAuthorizeConfirmOpen(true)
  }
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj)) return "Invalid Date";
  return dateObj.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    )
  }

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

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-semibold text-white">Parking Lot</h2>
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold text-blue-500">{occupiedSlots.length}</div>
              <p className="text-sm text-gray-400">Occupied slots</p>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-semibold text-white">Unauthorized Parking</h2>
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold text-red-500">{unauthorizedVehicles.length}</div>
              <p className="text-sm text-gray-400">Requires attention</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="grid w-full grid-cols-2 bg-zinc-900 rounded-md p-1 gap-1 mb-6">
            <button
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                activeTab === "parking" ? "bg-zinc-950 text-white" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("parking")}
            >
              Parking Lot
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

          {activeTab === "parking" ? (
            <div className="mt-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white">Parking Lot Status</h2>
                </div>
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-6 gap-3 p-4">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const row = String.fromCharCode(65 + Math.floor(i / 6))
                      const col = (i % 6) + 1
                      const slotId = `${row}${col}`
                      const slotData = occupiedSlots.find((s) => s.slotNumber === slotId)

                      return (
                        <div
                          key={slotId}
                          onClick={() => slotData && handleSlotClick(slotData)}
                          className={`
                            flex flex-col items-center justify-center 
                            h-20 rounded-md border-2 cursor-pointer
                            ${slotData ? "bg-red-900/20 border-red-600" : "bg-green-900/20 border-green-600"}
                          `}
                        >
                          <span className="font-bold text-white">{slotId}</span>
                          {slotData && <span className="text-[10px] text-white mt-1 truncate w-full px-1"></span>}
                        </div>
                      )
                    })}
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
                            <div className="col-span-3 font-medium text-white">Car Number</div>
                            <div className="col-span-3 font-medium text-white">Slot</div>
                            <div className="col-span-2 font-medium text-white">Detected At</div>
                            <div className="col-span-4 font-medium text-white">Actions</div>
                          </div>
                        </div>
                        <div>
                          {unauthorizedVehicles.map((vehicle) => (
                            <div key={vehicle._id} className="border-b border-zinc-800 hover:bg-zinc-900">
                              <div className="grid grid-cols-12 h-14 items-center px-6">
                                <div className="col-span-3 text-white">{vehicle.license_plate}</div>
                                <div className="col-span-3 text-white">{vehicle.slot || "N/A"}</div>
                                <div className="col-span-2 text-white">
                                  {formatDate(vehicle.timestamp)}
                                </div>
                                <div className="col-span-4 flex gap-2">
                                  <button
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-3 py-1"
                                    onClick={() => handleAuthorizeVehicle(vehicle)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Authorize
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 h-9 px-3 py-1 text-white"
                                    onClick={() => {
                                      setSelectedUnauthorized(vehicle)
                                      setIsUnauthorizedDetailsOpen(true)
                                    }}
                                  >
                                    <Info className="h-4 w-4 mr-1" />
                                    Details
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-900 text-red-50 hover:bg-red-900/90 h-9 px-3 py-1"
                                    onClick={() => handleDeleteUnauthorized(vehicle)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
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

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDeleteConfirmOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Confirm Delete</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this unauthorized vehicle from database?
              </p>
              <div className="bg-zinc-800 p-4 rounded-lg mb-6">
                <p className="text-white font-medium">Car Number: {vehicleToDelete.license_plate}</p>
                <p className="text-gray-400 text-sm">Slot: {vehicleToDelete.slot || "N/A"}</p>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-700 text-white hover:bg-zinc-800 h-10 px-4 py-2"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteUnauthorized} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white h-10 px-4 py-2"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorize Confirmation Dialog */}
      {isAuthorizeConfirmOpen && vehicleToAuthorize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsAuthorizeConfirmOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Confirm Car Number</h2>
              <p className="text-gray-300 mb-6">Is this the correct car number?</p>
              <div className="bg-zinc-800 p-4 rounded-lg mb-6">
                <p className="text-white font-medium text-lg">{vehicleToAuthorize.license_plate}</p>
                <p className="text-gray-400 text-sm">Slot: {vehicleToAuthorize.slot || "N/A"}</p>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-700 text-white hover:bg-zinc-800 h-10 px-4 py-2"
                onClick={() => setIsAuthorizeConfirmOpen(false)}
              >
                Cancel
              </button>
              <button 
                onClick={handleEditNumber} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-yellow-600 hover:bg-yellow-700 text-white h-10 px-4 py-2"
              >
                <Edit className="h-4 w-4 mr-2" />
                No, Edit
              </button>
              <button 
                onClick={handleCorrectNumber} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white h-10 px-4 py-2"
              >
                Yes, Correct
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Car Number Dialog */}
      {isEditCarNumberOpen && vehicleToAuthorize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsEditCarNumberOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Edit Car Number</h2>
              <p className="text-gray-300 mb-4">Please enter the correct car number:</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="carNumber" className="block text-sm font-medium text-white mb-1">
                    Car Number
                  </label>
                  <input
                    id="carNumber"
                    type="text"
                    value={editedCarNumber}
                    onChange={(e) => setEditedCarNumber(e.target.value)}
                    className="block w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
                    placeholder="Enter car number"
                  />
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Slot: {vehicleToAuthorize.slot || "N/A"}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-700 text-white hover:bg-zinc-800 h-10 px-4 py-2"
                onClick={() => setIsEditCarNumberOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editedCarNumber.trim()}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white h-10 px-4 py-2 ${
                  !editedCarNumber.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Authorize Confirmation Dialog */}
      {isFinalAuthorizeConfirmOpen && vehicleToAuthorize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsFinalAuthorizeConfirmOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Final Confirmation</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to make this car number authorized in this slot?
              </p>
              <div className="bg-zinc-800 p-4 rounded-lg mb-6">
                <p className="text-white font-medium text-lg">{editedCarNumber}</p>
                <p className="text-gray-400 text-sm">Slot: {vehicleToAuthorize.slot || "N/A"}</p>
              </div>
            </div>
            <div className="border-t border-zinc-800 px-6 py-4 flex justify-end gap-3">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-700 text-white hover:bg-zinc-800 h-10 px-4 py-2"
                onClick={() => setIsFinalAuthorizeConfirmOpen(false)}
              >
                Cancel
              </button>
              <button 
                onClick={handleCorrectNumber} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white h-10 px-4 py-2"
              >
                Yes, Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Details Dialog */}
      {selectedSlot && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDetailsDialogOpen ? "" : "hidden"}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDetailsDialogOpen(false)}></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full relative z-10 overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white">Vehicle Details - Slot {selectedSlot.id}</h2>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div></div>
                <div className="space-y-4 text-white">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Car Number</h3>
                    <p className="text-lg font-semibold">{selectedSlot.carDetails.carNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Slot Number</h3>
                    <p className="text-lg font-semibold">{selectedSlot.carDetails.slot}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Detected At</h3>
                    <p>{selectedSlot.carDetails.detectedAt}</p>
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
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center ${
      isUnauthorizedDetailsOpen ? "" : "hidden"
    }`}
  >
    <div
      className="fixed inset-0 bg-black/50"
      onClick={() => setIsUnauthorizedDetailsOpen(false)}
    ></div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md relative z-10 overflow-hidden mx-4">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white">
          Unauthorized Vehicle - {selectedUnauthorized.license_plate}
        </h2>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="bg-zinc-800 rounded-md w-full h-48 flex items-center justify-center overflow-hidden">
          {selectedUnauthorized.imageBase64 ? (
            <img
              src={`data:image/jpeg;base64,${selectedUnauthorized.imageBase64}`}
              alt={`Unauthorized vehicle ${selectedUnauthorized.license_plate}`}
              className="object-contain h-full w-full"
            />
          ) : (
            <Car className="h-24 w-24 text-zinc-600" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-white">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Car Number</h3>
            <p className="text-lg font-semibold">
              {selectedUnauthorized.license_plate}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Slot</h3>
            <p>{selectedUnauthorized.slot || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Detected At</h3>
<p>{formatDate(selectedUnauthorized.timestamp)}</p>


          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Confidence</h3>
            <p>
              {selectedUnauthorized.confidence
                ? `${(selectedUnauthorized.confidence * 100).toFixed(2)}%`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-6 py-4 flex justify-end gap-2">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          onClick={() => {
            handleAuthorizeVehicle(selectedUnauthorized);
            setIsUnauthorizedDetailsOpen(false);
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          Authorize
        </button>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 h-10 px-4 py-2 text-white"
          onClick={() => setIsUnauthorizedDetailsOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}
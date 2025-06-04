"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import QRCode from "qrcode"

const generateInitialSlots = () => {
  const slots = []
  const rows = ["A", "B", "C", "D"]
  rows.forEach((row) => {
    for (let i = 1; i <= 6; i++) {
      slots.push({ id: `${row}${i}`, status: "available" })
    }
  })
  return slots
}

const ParkingSlotCard = ({ slot, isUserSlot, carNumber }) => (
  <div
    className={`relative w-full p-4 rounded-lg 
    ${slot.status === "available" ? "bg-gray-700" : "bg-gray-600"} 
    ${isUserSlot ? "border-4 border-blue-500" : ""}`}
  >
    <div className="text-white text-lg text-center font-semibold">{slot.id}</div>
    {isUserSlot && carNumber && <div className="mt-2 text-xs text-center text-gray-300 truncate">{carNumber}</div>}
  </div>
)

const QRDisplay = ({ qrCode, carNumber, onScan, scanCount }) => {
  if (!qrCode) return null

  return (
    <div className="flex flex-col items-center">
      <img
        src={qrCode || "/placeholder.svg"}
        alt={`Parking QR Code for ${carNumber || "your vehicle"}`}
        className="w-40 h-40 border-2 border-gray-600 rounded-lg bg-white p-1 cursor-pointer"
        onClick={onScan}
      />
      <p className="mt-2 text-xs text-gray-400">
        {scanCount === 0 ? "Show this at parking entry/exit" : "Scan again to release slot"}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [slots, setSlots] = useState(generateInitialSlots())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [userBookedSlot, setUserBookedSlot] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState({ carNumber: "", phoneNumber: "" })
  const [qrCode, setQrCode] = useState(null)
  const [paymentQrCode, setPaymentQrCode] = useState(null)
  const [qrError, setQrError] = useState("")
  const [scanCount, setScanCount] = useState(0)
  const [releaseMessage, setReleaseMessage] = useState("")
  const [entryTimestamp, setEntryTimestamp] = useState(null)
  const [parkingAmount, setParkingAmount] = useState(0)
  const [parkingDuration, setParkingDuration] = useState("")
  const navigate = useNavigate()

  const calculateParkingFee = (entryTime) => {
    if (!entryTime) return { amount: 20, duration: "0 minutes" }

    const now = new Date()
    const entry = new Date(entryTime)
    const diffInMs = now - entry
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    // Calculate 30-minute intervals
    const intervals = Math.floor(diffInMinutes / 30)

    // Base amount is 20, doubles for each 30-minute interval
    let amount = 20
    for (let i = 0; i < intervals; i++) {
      amount *= 2
    }

    // Format duration
    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    let durationText = ""
    if (hours > 0) {
      durationText += `${hours} hour${hours > 1 ? "s" : ""}`
      if (minutes > 0) {
        durationText += ` ${minutes} minute${minutes > 1 ? "s" : ""}`
      }
    } else {
      durationText = `${minutes} minute${minutes !== 1 ? "s" : ""}`
    }

    return { amount, duration: durationText }
  }

  const generatePaymentQR = async (amount, carNumber) => {
    try {
      const paymentData = {
        amount: amount,
        carNumber: carNumber,
        timestamp: new Date().toISOString(),
        type: "parking_payment",
      }

      const qrData = await QRCode.toDataURL(JSON.stringify(paymentData), {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      return qrData
    } catch (err) {
      console.error("Failed to generate payment QR:", err)
      return null
    }
  }

  const generateFallbackQR = async (text) => {
    try {
      const qrData = await QRCode.toDataURL(text || "ParkSense", {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      return qrData
    } catch (err) {
      console.error("Failed to generate fallback QR:", err)
      return null
    }
  }

  const handleCheckoutRequest = async () => {
    if (userBookedSlot) {
      // Get entry timestamp from sessionStorage or use current time as fallback
      const storedEntryTime = sessionStorage.getItem("entryTimestamp")
      const entryTime = storedEntryTime ? new Date(storedEntryTime) : new Date(Date.now() - 30 * 60 * 1000) // Default to 30 minutes ago

      setEntryTimestamp(entryTime)

      // Calculate parking fee
      const { amount, duration } = calculateParkingFee(entryTime)
      setParkingAmount(amount)
      setParkingDuration(duration)

      // Generate payment QR code
      const paymentQR = await generatePaymentQR(amount, userData.carNumber)
      setPaymentQrCode(paymentQR)

      setIsPaymentDialogOpen(true)
    }
  }

  const handlePaymentDone = async () => {
    try {
      const response = await fetch("https://parksense-backend-x5a2.onrender.com/api/release-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          slotNumber: userBookedSlot.id, // <-- pass slotNumber here
          plate_number: userData.carNumber,
          payment_amount: parkingAmount,
          parking_duration: parkingDuration,
        }),
      })
      console.log("Releasing slot:", {
        slotNumber: userBookedSlot?.slotNumber,
        plate_number: userData.carNumber,
        payment_amount: parkingAmount,
        parking_duration: parkingDuration,
      })

      if (response.ok) {
        setSlots((prev) => prev.map((s) => (s.id === userBookedSlot.id ? { ...s, status: "available" } : s)))
        setUserBookedSlot(null)
        sessionStorage.removeItem("assignedSlot")
        sessionStorage.removeItem("qrCode")
        sessionStorage.removeItem("qrCarNumber")
        sessionStorage.removeItem("entryTimestamp")
        setQrCode(null)
        setReleaseMessage(`Payment of ₹${parkingAmount} completed. Slot released successfully!`)
        setTimeout(() => setReleaseMessage(""), 5000)
      } else {
        console.error("Failed to release slot")
      }
    } catch (error) {
      console.error("Error releasing slot:", error)
    } finally {
      setIsPaymentDialogOpen(false)
    }
  }

  const handleUnbookRequest = () => {
    if (userBookedSlot) {
      setSelectedSlot(userBookedSlot)
      setIsDialogOpen(true)
    }
  }

  const handleUnbookSlot = async () => {
    try {
      const response = await fetch("https://parksense-backend-x5a2.onrender.com/api/release-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ plate_number: userData.carNumber }),
      })

      if (response.ok) {
        setSlots((prev) => prev.map((s) => (s.id === userBookedSlot.id ? { ...s, status: "available" } : s)))
        setUserBookedSlot(null)
        sessionStorage.removeItem("assignedSlot")
        sessionStorage.removeItem("qrCode")
        sessionStorage.removeItem("qrCarNumber")
        sessionStorage.removeItem("entryTimestamp")
        setQrCode(null)
      } else {
        console.error("Failed to release slot")
      }
    } catch (error) {
      console.error("Error releasing slot:", error)
    } finally {
      setIsDialogOpen(false)
    }
  }

  const fetchQRCode = async (carNumber) => {
    try {
      if (!carNumber) {
        console.log("No car number provided for QR generation")
        return await generateFallbackQR("guest")
      }

      // Try to get from sessionStorage first
      const storedQr = sessionStorage.getItem(`qr_${carNumber}`)
      if (storedQr) {
        console.log("Using cached QR code")
        return { qr_image: storedQr, fromCache: true }
      }

      // Fetch from server
      const timestamp = Date.now()
      const response = await fetch(
        `https://4323-2409-40f0-100a-5ec7-c103-cfc2-799-ad01.ngrok-free.app/get-qr?plate_number=${encodeURIComponent(carNumber)}&t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "ngrok-skip-browser-warning": "true",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const qrData = await response.json()

      // Validate and normalize QR image data
      let qrImage = qrData.qr_image?.trim()
      if (!qrImage) {
        throw new Error("Empty QR image data")
      }

      // Ensure proper data URL format
      if (!qrImage.startsWith("data:")) {
        qrImage = `data:image/png;base64,${qrImage}`
      } else if (!qrImage.startsWith("data:image/png")) {
        // Convert any data URL to PNG format
        const base64Data = qrImage.split(",")[1] || qrImage
        qrImage = `data:image/png;base64,${base64Data}`
      }

      // Cache the QR code
      sessionStorage.setItem(`qr_${carNumber}`, qrImage)

      return { qr_image: qrImage }
    } catch (error) {
      console.error("QR fetch failed:", error.message)
      // Generate fallback QR
      const fallback = await generateFallbackQR(carNumber || "ParkSense")
      return { qr_image: fallback, isFallback: true }
    }
  }

  const handleQRScan = async () => {
    try {
      const response = await fetch("https://4323-2409-40f0-100a-5ec7-c103-cfc2-799-ad01.ngrok-free.app/check-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate_number: userData.carNumber }),
      })

      const result = await response.json()

      if (result.status === "released") {
        // Update local state
        setSlots((prev) => prev.map((s) => (s.id === userBookedSlot.id ? { ...s, status: "available" } : s)))
        setUserBookedSlot(null)
        sessionStorage.removeItem("assignedSlot")
        sessionStorage.removeItem("qrCode")
        sessionStorage.removeItem("qrCarNumber")
        sessionStorage.removeItem("entryTimestamp")
        setReleaseMessage(result.message)
        setTimeout(() => setReleaseMessage(""), 3000)

        // Optional: Fetch updated slot status
        const statusResponse = await fetch(
          `https://4323-2409-40f0-100a-5ec7-c103-cfc2-799-ad01.ngrok-free.app/slot-status?plate_number=${encodeURIComponent(userData.carNumber)}`,
        )
        const statusData = await statusResponse.json()
        console.log("Updated slot status:", statusData)
      }
      setScanCount((prev) => prev + 1)
    } catch (error) {
      console.error("Scan processing failed:", error)
    }
  }

  const handleDownloadQR = () => {
    if (!qrCode) return
    const link = document.createElement("a")
    link.href = qrCode
    link.download = `parking-qr-${userData.carNumber || "user"}.png`
    link.click()
  }

  const refreshQRCode = async () => {
    try {
      const newQr = await fetchQRCode(userData.carNumber)
      if (newQr?.qr_image) {
        setQrCode(newQr.qr_image)
        sessionStorage.setItem("qrCode", newQr.qr_image)
        sessionStorage.setItem("qrCarNumber", userData.carNumber)
        setQrError("")
      }
    } catch (error) {
      console.error("Failed to refresh QR code:", error)
      setQrError("Failed to refresh QR code")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const phone = sessionStorage.getItem("userPhoneNumber")
        const car = sessionStorage.getItem("carNumber")?.trim().toUpperCase()
        const slot = sessionStorage.getItem("assignedSlot")
        const token = sessionStorage.getItem("token")

        if (!phone || !token) {
          navigate("/login")
          return
        }

        setUserData({ carNumber: car || "", phoneNumber: phone || "" })

        if (slot) {
          setUserBookedSlot({ id: slot, status: "booked" })
          setSlots((prev) => prev.map((s) => (s.id === slot ? { ...s, status: "booked" } : s)))

          // Set entry timestamp if not already set
          if (!sessionStorage.getItem("entryTimestamp")) {
            sessionStorage.setItem("entryTimestamp", new Date().toISOString())
          }
        }

        // Always fetch fresh QR code but fallback to cached if available
        if (car) {
          const qrData = await fetchQRCode(car)
          if (qrData?.qr_image) {
            setQrCode(qrData.qr_image)
            sessionStorage.setItem("qrCode", qrData.qr_image)
            sessionStorage.setItem("qrCarNumber", car)
            if (qrData.isFallback) {
              setQrError("Using fallback QR code")
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [navigate, scanCount])

  if (isLoading) {
    return (
      <div className="container py-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Loading Dashboard</h1>
        <p className="text-gray-400">Please wait while we load your data...</p>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* HEADER */}
      <div className="mb-8 pt-16 text-white">
        <h1 className="text-3xl font-bold">User Parking Dashboard</h1>
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

            {/* QR Code Section */}
            {qrCode && userBookedSlot && (
              <div className="pt-4 border-t border-gray-700">
                {/* <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Your Parking QR Code</h3>
                  <button onClick={refreshQRCode} className="text-xs text-blue-400 hover:text-blue-300">
                    Refresh
                  </button>
                </div> */}
                {qrError && (
                  <div className="text-yellow-400 text-xs mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12zm0-9a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" />
                    </svg>
                    {qrError}
                  </div>
                )}
                <QRDisplay qrCode={qrCode} carNumber={userData.carNumber} onScan={handleQRScan} scanCount={scanCount} />
                {releaseMessage && <div className="mt-2 text-green-400 text-sm text-center">{releaseMessage}</div>}
                <button
                  onClick={handleDownloadQR}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Download QR Code
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Parking Status</h2>
          {userBookedSlot ? (
            <ActiveAllocation
              slotId={userBookedSlot.id}
              onCheckout={handleCheckoutRequest}
              onRelease={handleUnbookRequest}
              hasQr={!!qrCode}
            />
          ) : (
            <NoAllocation />
          )}
        </div>
      </div>

      {/* SLOT MAP */}
      <div className="mb-4">
        <h2 className="text-xl text-white font-semibold">Parking Lot Map</h2>
        <p className="text-gray-400 text-sm mt-1">User parking slots (A1–D6)</p>
      </div>

      <div className="bg-black-900 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {slots.map((slot) => (
            <ParkingSlotCard
              key={slot.id}
              slot={slot}
              isUserSlot={userBookedSlot?.id === slot.id}
              carNumber={userBookedSlot?.id === slot.id ? userData.carNumber : ""}
            />
          ))}
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      {isPaymentDialogOpen && (
        <PaymentDialog
          slot={userBookedSlot}
          userData={userData}
          amount={parkingAmount}
          duration={parkingDuration}
          entryTime={entryTimestamp}
          paymentQrCode={paymentQrCode}
          onCancel={() => setIsPaymentDialogOpen(false)}
          onPaymentDone={handlePaymentDone}
        />
      )}

      {/* RELEASE DIALOG */}
      {isDialogOpen && (
        <ConfirmDialog
          slot={selectedSlot}
          userData={userData}
          onCancel={() => setIsDialogOpen(false)}
          onConfirm={handleUnbookSlot}
        />
      )}
    </div>
  )
}

// Helper Components
const InfoRow = ({ label, value, bold = false }) => (
  <div className="flex justify-between items-center border-b border-gray-700 pb-3">
    <span className="text-gray-400">{label}:</span>
    <span className={bold ? "text-2xl font-bold text-blue-500" : "text-lg"}>{value}</span>
  </div>
)

const ActiveAllocation = ({ slotId, onCheckout, onRelease, hasQr }) => (
  <div className="space-y-4">
    <div className="bg-blue-900/10 border border-blue-500 text-blue-400 px-4 py-3 rounded">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
        </svg>
        <div>
          <p className="font-bold">Active Parking Allocation</p>
          <p>You have slot {slotId} assigned</p>
          {hasQr && <p className="text-xs mt-1">QR code available in your information panel</p>}
        </div>
      </div>
    </div>

    {/* Add SlotDirections component here */}
    <SlotDirections slotId={slotId} />

    <div className="space-y-2">
      <button
        onClick={onCheckout}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        Check Out Parking Slot
      </button>
    </div>
  </div>
)

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
)

const PaymentDialog = ({ slot, userData, amount, duration, entryTime, paymentQrCode, onCancel, onPaymentDone }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white">Parking Payment</h3>
        <p className="text-gray-400 text-sm mt-1">Complete your parking payment</p>
      </div>

      <div className="p-6 border-t border-b border-zinc-800">
        {/* Payment QR Code */}
        <div className="flex justify-center mb-6">
          {paymentQrCode ? (
            <img
              src={paymentQrCode || "/placeholder.svg"}
              alt="Payment QR Code"
              className="w-48 h-48 border-2 border-gray-600 rounded-lg bg-white p-2"
            />
          ) : (
            <div className="w-48 h-48 border-2 border-gray-600 rounded-lg bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400">Loading QR...</span>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-gray-800 p-4 rounded-md space-y-3">
          <DialogRow label="Slot" value={slot?.id} />
          <DialogRow label="Car Number" value={userData.carNumber} />
          <DialogRow label="Entry Time" value={entryTime ? entryTime.toLocaleString() : "N/A"} />
          <DialogRow label="Parking Duration" value={duration} />
          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
            <span className="text-gray-400 font-semibold">Total Amount:</span>
            <span className="font-bold text-green-400 text-xl">₹{amount}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md">
          <p className="text-blue-400 text-sm">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Scan the QR code to complete payment. Minimum charge: ₹20, doubles every 30 minutes.
          </p>
        </div>
      </div>

      <div className="p-4 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 border border-zinc-700 rounded-md hover:bg-zinc-800 text-white">
          Cancel
        </button>
        <button onClick={onPaymentDone} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
          Payment Done
        </button>
      </div>
    </div>
  </div>
)

const ConfirmDialog = ({ slot, userData, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white">Release Parking Slot {slot?.id}</h3>
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
        <button onClick={onCancel} className="px-4 py-2 border border-zinc-700 rounded-md hover:bg-zinc-800 text-white">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
          Confirm Release
        </button>
      </div>
    </div>
  </div>
)

const DialogRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}:</span>
    <span className="font-medium text-white">{value}</span>
  </div>
)

const SlotDirections = ({ slotId }) => {
  if (!slotId) return null

  const row = slotId.charAt(0)
  const column = Number.parseInt(slotId.substring(1))

  // Generate directions based on slot ID
  const getDirections = () => {
    const directions = []

    // Base directions for all slots
    directions.push("Enter through the main gate")
    directions.push("Go straight for 25m")

    // Row-specific directions
    if (row === "A") {
      directions.push("Stay in the first row")
    } else if (row === "B") {
      directions.push("Go right for 15m")
      directions.push("Take the second row")
    } else if (row === "C") {
      directions.push("Go right for 30m")
      directions.push("Take the third row")
    } else if (row === "D") {
      directions.push("Go right for 45m")
      directions.push("Take the fourth row")
    }

    // Column-specific directions
    directions.push(`Your slot is ${getOrdinal(column)} from the left (${row}${column})`)

    return directions
  }

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinal = (n) => {
    const suffixes = ["th", "st", "nd", "rd"]
    const v = n % 100
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  }

  return (
    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-medium flex items-center gap-2 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        Directions to Slot {slotId}
      </h3>
      <ol className="space-y-2 pl-6 list-decimal">
        {getDirections().map((direction, index) => (
          <li key={index} className="text-gray-300 text-sm">
            {direction}
          </li>
        ))}
      </ol>
    </div>
  )
}

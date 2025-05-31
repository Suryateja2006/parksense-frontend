import { useEffect, useRef, useState } from "react"
import axios from "axios"
import {
  Camera,
  QrCode,
  Car,
  Scan,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"

const AutoScanQR = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [numberPlate, setNumberPlate] = useState("")
  const [qrImage, setQrImage] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [error, setError] = useState("")
  const [cameraReady, setCameraReady] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(null)

  useEffect(() => {
    const startVideo = async () => {
      try {
        setError("")
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment",
          },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setCameraReady(true)
        }
      } catch (err) {
        console.error("Camera access error:", err)
        setError("Camera access denied. Please allow permissions.")
      }
    }
    startVideo()

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const compressImage = async (dataUrl, quality = 0.7, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxWidth / img.width, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = dataUrl
    })
  }

  const captureAndSend = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsScanning(true)
    setScanProgress(0)
    setError("")

    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 10, 100))
    }, 300)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      const fullQuality = canvas.toDataURL('image/jpeg', 0.8)
      const compressed = await compressImage(fullQuality)

      // Use your computer's IP for local testing
      const response = await axios.post('http://172.168.0.152:5000/detect', {
        image: compressed
      }, {
        timeout: 10000,
        maxContentLength: 16 * 1024 * 1024
      })

      if (response.data) {
        setNumberPlate(response.data.number_plate || "")
        setQrImage(response.data.qr_image || "")
        setLastScanTime(new Date())
      }
    } catch (err) {
      console.error("Detection error:", err)
      if (err.response?.status === 413) {
        setError("Image too large. Please try again.")
      } else if (err.response?.status === 404) {
        setError("Endpoint not found. Check server connection.")
      } else {
        setError("Detection failed. Check server connection.")
      }
    } finally {
      clearInterval(progressInterval)
      setIsScanning(false)
    }
  }

  const handleManualScan = () => {
    if (!isScanning && cameraReady) {
      captureAndSend()
    }
  }

  const handleDownloadQR = () => {
    if (!qrImage) return
    const link = document.createElement("a")
    link.href = qrImage
    link.download = `qr-code-${numberPlate || "parking"}.png`
    link.click()
  }

  const resetScan = () => {
    setNumberPlate("")
    setQrImage("")
    setError("")
    setLastScanTime(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ParkSense Scanner</h1>
          <p className="text-gray-500">Auto number plate detection and QR code generation</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center mb-2 text-lg font-semibold">
            <Camera className="h-5 w-5 mr-2" />
            Live Camera Feed
          </div>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg border border-gray-300"
              style={{ aspectRatio: "16/9" }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 w-80 h-20 -translate-x-1/2 -translate-y-1/2 border-2 border-blue-500 rounded" />
            </div>
            <div className="absolute top-4 right-4">
              {cameraReady ? (
                <span className="flex items-center text-green-600 text-sm bg-green-100 px-2 py-1 rounded">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Camera Ready
                </span>
              ) : (
                <span className="flex items-center text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Initializing...
                </span>
              )}
            </div>
          </div>

          {isScanning && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center">
                  <Scan className="h-4 w-4 mr-1 animate-pulse" />
                  Scanning...
                </span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              className="px-4 py-2 border rounded text-blue-600 hover:bg-blue-100 disabled:opacity-50"
              onClick={handleManualScan}
              disabled={isScanning || !cameraReady}
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
              ) : (
                <Scan className="h-4 w-4 mr-2 inline" />
              )}
              Manual Scan
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow space-y-2">
            <div className="flex items-center text-lg font-semibold mb-2">
              <Car className="h-5 w-5 mr-2" />
              Detection Results
            </div>
            {numberPlate ? (
              <div className="text-center">
                <div className="text-sm text-gray-500">Detected Number Plate</div>
                <div className="text-2xl font-mono border rounded px-4 py-2 inline-block mt-2 text-black">
                  {numberPlate}
                </div>
                {lastScanTime && (
                  <p className="text-xs text-black mt-1">
                    Last detected: {lastScanTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-black py-6">
                <Car className="h-10 w-10 mx-auto opacity-40" />
                <p>No number plate detected</p>
              </div>
            )}
            {numberPlate && (
              <button
                onClick={resetScan}
                className="w-full mt-2 text-sm border rounded px-4 py-2 hover:bg-gray-100 text-black"
              >
                <RefreshCw className="h-4 w-4 inline mr-2 text-black" />
                Reset Scan
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded shadow space-y-2">
            <div className="flex items-center text-lg font-semibold mb-2">
              <QrCode className="h-5 w-5 mr-2" />
              Generated QR Code
            </div>
            {qrImage ? (
              <div className="text-center">
                <img src={qrImage} alt="QR Code" className="w-40 h-40 mx-auto border p-2 bg-white" />
                <button
                  onClick={handleDownloadQR}
                  className="mt-2 w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download QR Code
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                <QrCode className="h-10 w-10 mx-auto opacity-40" />
                <p>QR code will appear here</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <div className="flex items-start">
            <Scan className="h-5 w-5 mr-3 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900">How it works</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Click "Manual Scan" to capture plate</li>
                <li>• Ensure the plate is in the blue box</li>
                <li>• QR is generated only on successful detection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoScanQR
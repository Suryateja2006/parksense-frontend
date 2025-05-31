import React from "react";
import { Link } from "react-router-dom";
import { Clock, Shield, Bell } from "lucide-react";
import Navbar from "./Navbar";
import carImage from "../assets/image.webp"

const Home = () => {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
                  Welcome to ParkSense — Your Smart Parking Assistant
                </h1>
                <p className="max-w-[600px] text-gray-400 md:text-xl">
                  No more searching for parking. Book your spot in seconds.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="/register">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg">
                    Register
                  </button>
                </Link>
                <Link to="/login">
                  <button className="bg-black border border-blue-500 text-blue-500 hover:bg-gray-800 px-6 py-3 rounded-md text-lg">
                    Login
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={carImage}
                alt="Smart parking illustration"
                className="rounded-xl object-cover w-full h-auto max-w-[600px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-zinc-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                Smart Features for Seamless Parking
              </h2>
              <p className="max-w-[900px] text-gray-400 md:text-xl">
                ParkSense makes parking hassle-free with innovative technology and user-friendly features.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Real-time Slot Availability</h3>
                <p className="text-gray-400">
                  View available parking slots in real-time and book instantly without any delays.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Book in Seconds</h3>
                <p className="text-gray-400">
                  Simple and fast booking process that takes just seconds to complete.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Bell className="h-6 w-6 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Unauthorized Parking Alerts</h3>
                <p className="text-gray-400">
                  Get instant notifications when unauthorized vehicles occupy your reserved spot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Need Access to Student Parking?
            </h2>
            <p className="max-w-[600px] md:text-xl">
              Students can easily login to book their parking slots. Click below to get started!
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link to="/student-register">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg">
                    Register
                  </button>
                </Link>

              <Link to="/studentlogin">
                <button className="bg-black border border-blue-500 text-blue-500 hover:bg-gray-800 px-6 py-3 rounded-md text-lg">
                  Student Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Ready to Transform Your Parking Experience?
              </h2>
              <p className="max-w-[600px] text-gray-400 md:text-xl">
                Join thousands of users who have simplified their parking routine with ParkSense.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link to="/register">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

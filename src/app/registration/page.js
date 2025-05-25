"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterStepper() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("tenant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/login");
    } else {
      setErrorMessage(data.message || "Registration failed, please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-green-900 to-gray-800 px-4">
        <div className="w-full max-w-md p-8 bg-[#0f1f1a] border border-green-800 rounded-2xl shadow-lg shadow-green-900/30 backdrop-blur-xl">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-green-200">Register</h2>

          {/* Stepper Indicator */}
          <div className="flex justify-center mb-6 space-x-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? "bg-green-500 text-white" : "bg-green-900 text-green-300 border border-green-600"
                }`}
              >
                {s}
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="bg-red-500/20 text-red-400 p-2 rounded mb-4 border border-red-500/30">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-600/10 text-green-300 p-2 rounded mb-4 border border-green-500/30">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1 */}
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-green-100">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full px-4 py-2 bg-green-900/20 text-green-100 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-300/50"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-green-100">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full px-4 py-2 bg-green-900/20 text-green-100 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-300/50"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-green-100">Password</label>
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full px-4 py-2 bg-green-900/20 text-green-100 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-300/50"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-4 w-full bg-green-700 hover:bg-green-800 text-green-50 py-2 px-4 rounded-lg border border-green-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300"
                >
                  Next
                </button>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <p className="text-green-100 text-sm mb-2 font-medium">Register as</p>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center text-green-100">
                    <input
                      type="radio"
                      value="tenant"
                      checked={role === "tenant"}
                      onChange={() => setRole("tenant")}
                      className="form-radio text-green-600"
                    />
                    <span className="ml-2">Tenant</span>
                  </label>
                  <label className="inline-flex items-center text-green-100">
                    <input
                      type="radio"
                      value="owner"
                      checked={role === "owner"}
                      onChange={() => setRole("owner")}
                      className="form-radio text-green-600"
                    />
                    <span className="ml-2">Property Owner</span>
                  </label>
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-green-300 hover:text-green-200 underline"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-green-700 hover:bg-green-800 text-green-50 py-2 px-4 rounded-lg border border-green-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300"
                  >
                    Register
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-green-300/80">
            Already have an account?{" "}
            <Link href="/login" className="text-green-400 hover:text-green-300 underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Footer - Consistent with login page */}
      <footer className="bg-[#0a1612] border-t border-green-800/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-green-400">Rento</span>
              </Link>
              <p className="text-sm text-green-300/70 mt-1">
                Your Bhutanese rental platform
              </p>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 md:gap-8">
              <Link href="/about" className="text-green-300 hover:text-green-400 text-sm transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="text-green-300 hover:text-green-400 text-sm transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="text-green-300 hover:text-green-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-green-300 hover:text-green-400 text-sm transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>
          
          <div className="mt-6 pt-6 border-t border-green-800/30 text-center">
            <p className="text-xs text-green-300/50">
              © {new Date().getFullYear()} Rento. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
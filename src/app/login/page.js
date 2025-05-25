"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      if (data.user?.role === "OWNER") {
        router.push("/dashboard/owner");
      } else if (data.user?.role === "TENANT") {
        router.push("/dashboard/tenant");
      } else {
        setErrorMessage("Unknown role. Cannot redirect.");
      }
    } else {
      setErrorMessage(data.message || "Login failed, please try again.");
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data.role === "OWNER") {
            router.push("/dashboard/owner");
          } else if (data.role === "TENANT") {
            router.push("/dashboard/tenant");
          }
        }
      } catch (err) {
        // User is not logged in, stay on login page
        console.log('User not logged in');
      }
    };
    
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-green-900 to-gray px-4">
        <div className="w-full max-w-md p-8 bg-[#0f1f1a] border border-green-800 rounded-2xl shadow-lg shadow-green-900/30 backdrop-blur-xl">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-green-200">
            Login to your account
          </h2>

          {errorMessage && (
            <div className="bg-red-500/20 text-red-400 p-2 rounded mb-4 border border-red-500/30">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-green-100">
                Email Address
              </label>
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
              <label htmlFor="password" className="block text-sm font-medium text-green-100">
                Password
              </label>
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
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-green-50 py-2 px-4 rounded-lg transition-all duration-300 border border-green-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-green-300/80">
            Don&apos;t have an account?{" "}
            <Link href="/registration" className="text-green-400 hover:text-green-300 underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
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
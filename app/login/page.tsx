"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image"; // Import Image component
import { User, Lock, Loader2 } from "lucide-react";
import FlowchartBackground from "@/components/auth/FlowchartBackground";
import { Badge } from "@/components/ui/badge"; // Import Badge component
import { ExperimentalBadge } from "@/components/experimental-badge"; // Import ExperimentalBadge component

// Preset users for demo
const PRESET_USERS = [
  { username: "Lean", password: "Lean2026", role: "technician", name: "Lean Andersson" },
  { username: "Admin", password: "Admin2026", role: "admin", name: "Admin User" },
  { username: "Demo", password: "Demo2026", role: "viewer", name: "Demo User" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      router.push("/");
    }

  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check credentials
    const user = PRESET_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password
    );

    if (user) {
      // Success animation
      setLoginSuccess(true);

      // Store auth data
      const authData = {
        token: btoa(`${user.username}:${Date.now()}`),
        user: {
          username: user.username,
          name: user.name,
          role: user.role,
        },
        timestamp: Date.now(),
      };

      localStorage.setItem("auth-token", authData.token);
      localStorage.setItem("auth-user", JSON.stringify(authData.user));

      // Also set cookie for middleware
      document.cookie = `auth-token=${authData.token}; path=/; max-age=${rememberMe ? 604800 : 86400}`; // 7 days if remember me, else 1 day

      if (rememberMe) {
        localStorage.setItem("remember-me", "true");
      }

      // Redirect after animation
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      setError("Invalid username or password");
      setIsLoading(false);
      // Shake animation will trigger via error state
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-black opacity-70" />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="relative w-full max-w-md">
          {/* Login Card - Always centered */}
          <Card className={`
            relative overflow-hidden border-white/10 bg-black/30 backdrop-blur-lg shadow-2xl
            ${error ? 'animate-shake' : ''}
            ${loginSuccess ? 'scale-95 opacity-0 transition-all duration-500' : 'scale-100 opacity-100'}
          `}>

            <form onSubmit={handleLogin} className="space-y-6 p-8">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-white">Welcome to Flowy</h1>
                <p className="text-sm text-white/60">
                  Dynamic Flowchart Management System
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                    className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-white/60 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="flex items-center justify-center mt-4">
                <Badge variant="outline" className="text-xs text-white/60 border-white/20 bg-white/5 hover:bg-white/10 transition-colors">
                  <svg
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Powered by MarkOS
                </Badge>
              </div>
            </form>
          </Card>

          {/* Success Message */}
          {loginSuccess && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2 animate-fade-in">
                <div className="h-16 w-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-green-500 animate-scale-in"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/80 font-medium">Login Successful!</p>
                <p className="text-white/40 text-sm">Redirecting to dashboard...</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">

          <p className="text-xs text-white/60 mb-2">Built with ❤️ for Wind Turbine Service Technicians</p>
          <p className="text-xs text-white/40 mt-1">© 2025 HRIS Flowchart Manager. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

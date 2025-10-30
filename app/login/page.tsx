"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, Loader2, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import FlowchartBackground from "@/components/auth/FlowchartBackground";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      router.push("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = PRESET_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password
    );

    if (user) {
      setLoginSuccess(true);

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
      document.cookie = `auth-token=${authData.token}; path=/; max-age=${rememberMe ? 604800 : 86400}`;

      if (rememberMe) {
        localStorage.setItem("remember-me", "true");
      }

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      setError("Invalid username or password");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900 flex items-center justify-center">
      <FlowchartBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className={`
          overflow-hidden
          transition-all duration-500 ease-in-out
          ${error ? 'animate-shake' : ''}
          ${loginSuccess ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          border-white/10 bg-black/30 backdrop-blur-lg shadow-2xl
        `}>
          <div className="relative w-full h-48">
            <Image
              src="/brand/flowy-dev-mode2.png"
              alt="Flowy Dev Mode Logo"
              layout="fill"
              objectFit="cover"
              priority
              className="select-none"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          
          <div className="p-6">
            <CardHeader className="items-center text-center p-0 mb-4">
              <h1 className="text-2xl font-bold text-white">Welcome</h1>
              <p className="text-white/60">Sign in to continue</p>
            </CardHeader>
            
            <CardContent className="p-0">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-10 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                      className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-white/60 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={isLoading || !username || !password}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Authenticating...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </div>

          <CardFooter className="flex flex-col items-center space-y-2 text-xs text-white/40 p-6 pt-0">
            <div className="flex items-center">
              <Wind className="h-4 w-4 mr-1.5" />
              <span>Powered by Vestas Wind Systems</span>
            </div>
            <p>&copy; 2025 Dynamic Flowchart Management System. All rights reserved.</p>
          </CardFooter>
        </Card>

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
    </div>
  );
}
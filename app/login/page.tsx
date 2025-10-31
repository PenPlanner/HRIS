"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, Loader2, Cpu, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGitCommit } from "@/hooks/use-git-commit";
import { useAuth } from "@/lib/auth/hooks";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { latestCommit } = useGitCommit({ refreshInterval: 30000 });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = "/";
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        setError("Konto skapat! Kolla din e-post för verifiering.");
        setIsLoading(false);
      } else {
        await signIn(email, password);
        setLoginSuccess(true);

        // Hard redirect instead of Next.js router to avoid issues
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Ett fel uppstod. Försök igen.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-6xl flex items-center justify-center gap-6 mx-auto pl-16">
        {/* Login Form Card */}
        <div className={`
          bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm
          transition-all duration-500
          ${error ? 'animate-shake' : ''}
          ${loginSuccess ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome to Flowy</h1>
            <p className="text-sm text-slate-400">Please sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className={`${error.includes('skapat') ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg p-2`}>
                <p className={`text-xs ${error.includes('skapat') ? 'text-green-400' : 'text-red-400'} text-center`}>{error}</p>
              </div>
            )}

            {/* Full Name (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm text-slate-300 font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-10 text-sm bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-slate-300 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-slate-300 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Remember Me (Sign In Only) */}
            {!isSignUp && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  className="border-slate-600"
                />
                <Label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">
                  Remember me
                </Label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 text-white font-semibold text-sm shadow-lg hover:shadow-2xl transition-all duration-300"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium transition-all duration-200"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Need an account? Sign Up'}
            </button>
          </div>

          {/* Info for first user */}
          {isSignUp && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>OBS:</strong> First user becomes Super Admin with full access!
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Built with love for wind turbine technicians</p>
            <p className="mt-1">&copy; 2025 Flowy. All rights reserved.</p>
          </div>

          {/* Powered by MarkOS */}
          <div className="mt-4 flex justify-center opacity-70 hover:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-full border border-slate-600/30 backdrop-blur-md hover:scale-110 hover:border-blue-500/50 transition-all duration-300 cursor-pointer">
              <Cpu className="h-3.5 w-3.5 text-blue-400 hover:rotate-180 transition-transform duration-500" />
              <p className="text-xs text-slate-300 font-medium">Powered by <span className="text-blue-400">MarkOS</span></p>
            </div>
          </div>
        </div>

        {/* Logo - Right Side */}
        <div className="hidden lg:flex flex-col items-center justify-start flex-1 -mt-32">
          <div className="relative w-full max-w-md hover:scale-105 transition-transform duration-500 cursor-pointer">
            <Image
              src="/brand/flowy-dev-mode2.png"
              alt="Flowy Dev Mode"
              width={600}
              height={300}
              priority
              className="w-full h-auto drop-shadow-2xl hover:drop-shadow-[0_20px_50px_rgba(59,130,246,0.5)] transition-all duration-500"
            />
          </div>
          <div className="space-y-3 max-w-md px-8 -mt-20">
            <p className="text-lg text-slate-300 font-medium text-center">
              Smart flowcharts for wind turbine service
            </p>
            <p className="text-sm text-slate-500 text-center">
              Intelligent step-by-step smart guidance for your maintenance workflow
            </p>
          </div>
        </div>
      </div>

      {/* Git Commit Hash - Bottom Right */}
      <div className="absolute bottom-6 right-6 opacity-40 hover:opacity-100 transition-opacity duration-300 group">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/40 rounded border border-slate-700/30 backdrop-blur-sm cursor-pointer">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] text-slate-400 font-mono">{latestCommit?.hash || 'Loading...'}</p>
        </div>
        {/* Tooltip */}
        {latestCommit && (
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap border border-slate-700">
              {latestCommit.date}
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {loginSuccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-600"
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
            <div>
              <p className="text-xl font-semibold text-gray-900">Login Successful!</p>
              <p className="text-gray-600 mt-1">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

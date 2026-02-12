"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860/api";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
    setLoading(true);
    try {
      const path = isSignUp ? "/auth/signup" : "/auth/login";
      const body = isSignUp ? { name, email, password } : { email, password };
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let t: any = {}
        try {
          t = await res.json()
        } catch (_) {
          t = {}
        }

        // Provide human-friendly messages depending on endpoint and status
        let message = t?.detail || "Authentication failed. Please try again."
        if (!isSignUp) {
          // login
          if (res.status === 401) {
            message = "Invalid email or password. If you don't have an account, click Sign up."
          } else if (res.status === 404) {
            message = "No account found for this email. Please sign up."
          }
        } else {
          // signup
          if (res.status === 400) {
            const lower = String(t?.detail || "").toLowerCase()
            if (lower.includes("already") || lower.includes("exists") || lower.includes("email")) {
              message = "This email is already registered. Try logging in instead."
            }
          }
        }

        toast({ title: "Authentication error", description: message, variant: "destructive" })
        setLoading(false)
        return
      }
      const data = await res.json();
      const token = data?.access_token;
      if (!token) throw new Error("No token returned");
      // Store token in a cookie for middleware to read
      const maxAge = 60 * 60 * 2; // 2 hours
      // httpOnly cannot be set from client-side JS; Secure only when served over HTTPS / production
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const secureFlag = isSecure ? '; Secure' : '';
      document.cookie = `token=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;

      // Show success toast
      toast({
        title: isSignUp ? "Account created successfully!" : "Welcome back!",
        description: isSignUp ? "You can now start analyzing articles." : "You've been logged in successfully.",
        variant: "success",
      });

      router.push("/analyze");
    } catch (err: any) {
      const message = err?.message || "Something went wrong"
      toast({ title: "Authentication error", description: message, variant: "destructive" })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md border border-border/50 shadow-lg relative">
        <div className="absolute left-4 top-4">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-background/70 backdrop-blur hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
          <p className="text-sm text-muted-foreground">{isSignUp ? "Sign up to get started" : "Log in to continue"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Errors are shown via toast notifications */}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
              {loading ? (isSignUp ? "Creating..." : "Signing in...") : (isSignUp ? "Sign up" : "Login")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button onClick={() => setIsSignUp(false)} className="text-primary font-medium">Log in</button>
              </span>
            ) : (
              <span>
                Don’t have an account?{" "}
                <button onClick={() => setIsSignUp(true)} className="text-primary font-medium">Sign up</button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

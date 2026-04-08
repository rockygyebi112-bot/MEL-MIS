"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");
  const errorMessages: Record<string, string> = {
    inactive: "Your account has been deactivated. Contact an administrator.",
    auth: "Authentication failed. Please try again.",
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check approval status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("status, role_id")
        .eq("id", user.id)
        .single();

      console.log("LOGIN DEBUG:", { userId: user.id, profile, profileError });

      if (!profile) {
        // RLS may be blocking — skip client check, let middleware handle it
        router.push("/dashboard");
        return;
      }

      if (profile.status === "pending" || profile.status === "rejected") {
        router.push("/pending");
        return;
      }

      if (profile.status === "inactive") {
        await supabase.auth.signOut();
        setError("Your account has been deactivated. Contact an administrator.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  }

  return (
    <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto mb-2 w-14 h-14 rounded-xl bg-srsf-green-500 flex items-center justify-center shadow-lg shadow-srsf-green-500/25">
          <span className="text-white text-xl font-black">S</span>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight mt-3">Welcome back</CardTitle>
        <CardDescription className="text-sm">
          Sign in to the Management Information System
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 px-8">
          {(error || errorParam) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error || errorMessages[errorParam!] || "An error occurred."}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-gray-600">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 px-8 pb-8">
          <Button
            type="submit"
            className="w-full h-10 bg-srsf-green-500 hover:bg-srsf-green-600 font-semibold shadow-md shadow-srsf-green-500/20 transition-all"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-xs text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-srsf-purple-500 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

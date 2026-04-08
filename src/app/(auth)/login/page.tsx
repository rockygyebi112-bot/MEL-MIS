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
    <Card className="border-0 shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 text-4xl font-bold text-srsf-green-500">
          SRSF
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to the Management Information System
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {(error || errorParam) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error || errorMessages[errorParam!] || "An error occurred."}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-srsf-green-500 hover:bg-srsf-green-600"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-srsf-purple-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

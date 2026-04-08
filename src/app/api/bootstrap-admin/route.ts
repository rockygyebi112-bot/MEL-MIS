import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// ONE-TIME bootstrap route — DELETE after first admin is created
export async function GET() {
  const supabase = createAdminClient();

  // Get the Admin role ID
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "Admin")
    .single();

  if (!role) {
    return NextResponse.json({ error: "Admin role not found. Run migrations first." }, { status: 500 });
  }

  // Get all user profiles
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, email, status, role_id");

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ error: "No user profiles found. Sign up first." }, { status: 404 });
  }

  // Promote the first user to admin
  const firstUser = profiles[0];
  const { error } = await supabase
    .from("user_profiles")
    .update({ status: "active", role_id: role.id })
    .eq("id", firstUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `User ${firstUser.email} promoted to Admin`,
    profiles_before: profiles,
  });
}

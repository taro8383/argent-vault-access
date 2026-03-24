import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const SECTION_LABELS: Record<string, string> = {
  "/society/dashboard/allocations": "Allocations",
  "/society/dashboard/purchases":   "Additional Purchases",
  "/society/dashboard/events":      "Events",
  "/society/dashboard/cellar":      "Your Cellar",
  "/society/dashboard/profile":     "Profile",
};

const SocietyDashboardInner = () => {
  const { user } = useAuth();
  const loc       = useLocation();

  const [memberTier, setMemberTier] = useState<"founding" | "private" | "collector" | undefined>();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("society_members")
      .select("tier")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setMemberTier(data.tier as "founding" | "private" | "collector");
      });
  }, [user]);

  const sectionTitle = SECTION_LABELS[loc.pathname] ?? "Society";

  return (
    <DashboardLayout
      portal="society"
      sectionTitle={sectionTitle}
      memberTier={memberTier}
    >
      <Outlet />
    </DashboardLayout>
  );
};

const SocietyDashboard = () => (
  <ProtectedRoute requiredRole="society">
    <SocietyDashboardInner />
  </ProtectedRoute>
);

export default SocietyDashboard;

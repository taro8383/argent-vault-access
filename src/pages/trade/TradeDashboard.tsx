import { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const SECTION_LABELS: Record<string, string> = {
  "/trade/dashboard/portfolio":    "Portfolio",
  "/trade/dashboard/events":       "Events",
  "/trade/dashboard/intelligence": "Market Intelligence",
  "/trade/dashboard/education":    "Education",
  "/trade/dashboard/orders":       "Orders",
  "/trade/dashboard/partners":     "Partner Hub",
  "/trade/dashboard/contact":      "Contact",
};

const TradeDashboardInner = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showPartnerHub, setShowPartnerHub] = useState(false);
  const [partnerProperty, setPartnerProperty] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    const checkPartner = async () => {
      const { data } = await supabase
        .from("preferred_partners")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      setShowPartnerHub(!!data);
    };
    checkPartner();
  }, [user]);

  const sectionTitle = SECTION_LABELS[location.pathname] ?? "Dashboard";

  return (
    <DashboardLayout
      portal="trade"
      sectionTitle={sectionTitle}
      showPartnerHub={showPartnerHub}
      partnerProperty={partnerProperty}
    >
      <Outlet />
    </DashboardLayout>
  );
};

const TradeDashboard = () => (
  <ProtectedRoute requiredRole="trade">
    <TradeDashboardInner />
  </ProtectedRoute>
);

export default TradeDashboard;

// AUTH BYPASS — dev only. Restore original logic before production deploy.
// Original file is documented in newsections.md under "Dev Overrides".

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "trade" | "society" | "admin";
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <>{children}</>;
};

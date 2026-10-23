import { RequireRole } from "@/features/auth";
import { ProviderDashboard } from "@/features/panel";

export default function ProviderPanelPage() {
  return (
    <RequireRole roles={["proveedor", "admin"]}>
      <ProviderDashboard />
    </RequireRole>
  );
}

import { RequireRole } from "@/features/auth";
import { VerificationWizard } from "@/features/panel";

export default function ProviderVerificationPage() {
  return (
    <RequireRole roles={["proveedor"]}>
      <VerificationWizard />
    </RequireRole>
  );
}

import { RequireRole } from "@/features/auth";
import { AdminVerificationTable } from "@/features/panel";

export default function AdminVerificationPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminVerificationTable />
    </RequireRole>
  );
}

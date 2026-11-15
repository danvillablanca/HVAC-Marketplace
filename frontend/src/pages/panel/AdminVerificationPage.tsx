import { RequireRole } from "@/features/auth";
import { AdminCancellationMetrics, AdminVerificationTable } from "@/features/panel";

export default function AdminVerificationPage() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="space-y-8">
        <AdminVerificationTable />
        <AdminCancellationMetrics />
      </div>
    </RequireRole>
  );
}

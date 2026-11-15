import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RequireRole } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { RequestDetail } from "@/features/requests";

function RequestDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <section className="container-page max-w-3xl space-y-6 py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Volver
      </Button>
      <RequestDetail requestId={id} />
    </section>
  );
}

export default function RequestDetailPage() {
  return (
    <RequireRole roles={["cliente", "proveedor", "admin"]}>
      <RequestDetailContent />
    </RequireRole>
  );
}

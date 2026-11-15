import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RequireRole } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { RequestForm } from "@/features/requests";

function NewRequestContent() {
  const navigate = useNavigate();

  return (
    <section className="container-page max-w-2xl space-y-6 py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Volver
      </Button>
      <RequestForm onSuccess={() => navigate("/panel/solicitudes")} />
    </section>
  );
}

export default function NewRequestPage() {
  return (
    <RequireRole roles={["cliente"]}>
      <NewRequestContent />
    </RequireRole>
  );
}

import { Bot } from "lucide-react";
import { ChatStub } from "@/features/ai";

const SUGGESTIONS = [
  "Necesito instalar un aire acondicionado split en Santiago",
  "¿Que proveedores hacen salas limpias industriales?",
  "¿Cuanto cuesta una mantencion preventiva?",
  "Busco atencion de emergencia 24/7 en Valparaiso",
];

export default function ChatPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Bot className="size-3.5" /> Asistente IA
        </span>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Asistente HVAC</h1>
        <p className="mt-2 text-muted-foreground">
          Consulta que servicio necesitas y te orientamos hacia el proveedor adecuado.
        </p>
      </header>

      <div className="mx-auto max-w-3xl">
        <ChatStub suggestions={SUGGESTIONS} />
      </div>
    </div>
  );
}

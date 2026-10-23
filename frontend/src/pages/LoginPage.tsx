import { AuthForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Bienvenido de vuelta</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa para gestionar tus solicitudes y tu perfil de proveedor.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Modo demo: cliente@demo.cl / demo1234 · proveedor@demo.cl / demo1234 · admin@demo.cl /
          demo1234
        </p>
      </div>
    </div>
  );
}

import { AuthForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Crea tu cuenta</h1>
          <p className="mt-2 text-muted-foreground">
            Registrate como cliente para contratar servicios o como proveedor para ofrecerlos.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}

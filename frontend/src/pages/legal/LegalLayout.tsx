import type { ReactNode } from "react";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

/** Contenedor de texto legal con tipografia legible. */
export function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  return (
    <article className="container-page max-w-3xl py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {updatedAt}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}

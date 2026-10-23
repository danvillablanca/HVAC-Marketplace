import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { Faq, type FaqItem } from "./faq";

describe("Faq", () => {
  it("renderiza las preguntas frecuentes por defecto", () => {
    renderWithProviders(<Faq />);

    expect(screen.getByRole("heading", { name: /Preguntas frecuentes/i })).toBeInTheDocument();
    expect(screen.getByText("¿Cómo verifican a los proveedores?")).toBeInTheDocument();
    expect(screen.getByText("¿Cuánto cuesta publicar un requerimiento?")).toBeInTheDocument();
    expect(screen.getByText("¿Cómo cuidan mi privacidad?")).toBeInTheDocument();
  });

  it("acepta items, titulo y descripcion personalizados", () => {
    const items: FaqItem[] = [
      { question: "¿Pregunta custom?", answer: "Respuesta custom." },
      { question: "¿Otra pregunta?", answer: "Otra respuesta." },
    ];
    renderWithProviders(
      <Faq id="faq-test" title="Título custom" description="Descripción custom" items={items} />,
    );

    expect(screen.getByRole("heading", { name: "Título custom" })).toBeInTheDocument();
    expect(screen.getByText("Descripción custom")).toBeInTheDocument();
    expect(screen.getByText("¿Pregunta custom?")).toBeInTheDocument();
    expect(screen.getByText("Respuesta custom.")).toBeInTheDocument();
    expect(screen.queryByText("¿Cómo cuidan mi privacidad?")).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import type { Review } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import { ReviewList } from "./review-list";

const REVIEWS: Review[] = [
  {
    id: "r1",
    providerId: "p-1",
    rating: 5,
    comment: "Instalacion impecable y rapida.",
    authorName: "Rodrigo M.",
    createdAt: "2026-08-14T15:00:00.000Z",
    verified: true,
  },
  {
    id: "r2",
    providerId: "p-1",
    rating: 4,
    comment: "Buen servicio, llegaron puntuales.",
    authorName: "Carolina P.",
    createdAt: "2026-07-02T11:30:00.000Z",
    verified: false,
  },
];

describe("ReviewList", () => {
  it("muestra el estado vacio", () => {
    renderWithProviders(<ReviewList reviews={[]} />);
    expect(
      screen.getByText("Aun no hay resenas. Se el primero en evaluar a este proveedor."),
    ).toBeInTheDocument();
  });

  it("renderiza las resenas con autor, rating y comentario", () => {
    renderWithProviders(<ReviewList reviews={REVIEWS} />);

    expect(screen.getByText("Rodrigo M.")).toBeInTheDocument();
    expect(screen.getByText("Carolina P.")).toBeInTheDocument();
    expect(screen.getByText("Instalacion impecable y rapida.")).toBeInTheDocument();
    expect(screen.getByText("Buen servicio, llegaron puntuales.")).toBeInTheDocument();
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.getByText("4.0")).toBeInTheDocument();
  });

  it("solo marca como verificada la resena verificada", () => {
    renderWithProviders(<ReviewList reviews={REVIEWS} />);
    expect(screen.getAllByText("Verificada")).toHaveLength(1);
  });
});

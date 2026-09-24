import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

describe("ui/Card", () => {
  it("renderiza la composición completa", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Servicio</CardTitle>
          <CardDescription>Instalación</CardDescription>
        </CardHeader>
        <CardContent>Cuerpo</CardContent>
        <CardFooter>Pie</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveClass("rounded-xl", "border-border");
    expect(screen.getByText("Servicio")).toHaveClass("font-semibold");
    expect(screen.getByText("Instalación")).toHaveClass("text-muted-foreground");
    expect(screen.getByText("Cuerpo")).toHaveClass("p-6");
    expect(screen.getByText("Pie")).toHaveClass("flex");
  });

  it("fusiona className en cada subcomponente", () => {
    render(
      <Card className="a">
        <CardHeader className="b">
          <CardTitle className="c">t</CardTitle>
          <CardDescription className="d">d</CardDescription>
        </CardHeader>
        <CardContent className="e">e</CardContent>
        <CardFooter className="f">f</CardFooter>
      </Card>,
    );

    expect(screen.getByText("t")).toHaveClass("c");
    expect(screen.getByText("d")).toHaveClass("d");
    expect(screen.getByText("e")).toHaveClass("e");
    expect(screen.getByText("f")).toHaveClass("f");
  });
});

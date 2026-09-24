import { describe, it, expect } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

describe("ui/Accordion", () => {
  it("arranca colapsado y expande al pulsar el trigger", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionHeader>
            <AccordionTrigger>Pregunta A</AccordionTrigger>
          </AccordionHeader>
          <AccordionContent>Respuesta A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionHeader>
            <AccordionTrigger>Pregunta B</AccordionTrigger>
          </AccordionHeader>
          <AccordionContent>Respuesta B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const triggerA = screen.getByRole("button", { name: "Pregunta A" });
    expect(triggerA).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Respuesta A")).not.toBeVisible();

    await user.click(triggerA);
    expect(triggerA).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Respuesta A")).toBeVisible();
  });

  it("en modo single solo deja un item abierto", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Contenido A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>B</AccordionTrigger>
          <AccordionContent>Contenido B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByRole("button", { name: "A" }));
    expect(screen.getByText("Contenido A")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getByText("Contenido B")).toBeVisible();
    expect(screen.getByText("Contenido A")).not.toBeVisible();
  });

  it("en modo multiple permite varios abiertos", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Contenido A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>B</AccordionTrigger>
          <AccordionContent>Contenido B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByRole("button", { name: "A" }));
    await user.click(screen.getByRole("button", { name: "B" }));

    expect(screen.getByText("Contenido A")).toBeVisible();
    expect(screen.getByText("Contenido B")).toBeVisible();
  });

  it("con collapsible cierra el item abierto", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Contenido A</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByRole("button", { name: "A" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

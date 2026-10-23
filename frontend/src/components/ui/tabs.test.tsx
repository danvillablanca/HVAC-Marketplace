import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function renderTabs(onValueChange?: (v: string) => void) {
  return render(
    <Tabs defaultValue="uno" onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="uno">Uno</TabsTrigger>
        <TabsTrigger value="dos">Dos</TabsTrigger>
      </TabsList>
      <TabsContent value="uno">Contenido uno</TabsContent>
      <TabsContent value="dos">Contenido dos</TabsContent>
    </Tabs>,
  );
}

describe("ui/Tabs", () => {
  it("muestra solo el contenido de la pestaña activa", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: "Uno" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Contenido uno")).toBeInTheDocument();
    expect(screen.queryByText("Contenido dos")).not.toBeInTheDocument();
  });

  it("cambia el contenido al hacer click en otra pestaña", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Dos" }));

    expect(screen.getByRole("tab", { name: "Dos" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Contenido dos")).toBeInTheDocument();
    expect(screen.queryByText("Contenido uno")).not.toBeInTheDocument();
  });

  it("notifica el cambio con onValueChange", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    renderTabs(onValueChange);

    await user.click(screen.getByRole("tab", { name: "Dos" }));
    expect(onValueChange).toHaveBeenCalledWith("dos");
  });
});

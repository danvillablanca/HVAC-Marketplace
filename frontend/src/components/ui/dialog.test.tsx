import { describe, it, expect } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function renderDialog() {
  return render(
    <Dialog>
      <DialogTrigger>Abrir</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar</DialogTitle>
          <DialogDescription>¿Seguro?</DialogDescription>
        </DialogHeader>
        <p>Contenido</p>
        <DialogFooter>
          <button>Aceptar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
}

describe("ui/Dialog", () => {
  it("no muestra el contenido hasta abrir", () => {
    renderDialog();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
  });

  it("abre el diálogo al pulsar el trigger", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Abrir" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirmar" })).toBeInTheDocument();
  });

  it("cierra con el botón de cierre (X)", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cierra con la tecla Escape", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

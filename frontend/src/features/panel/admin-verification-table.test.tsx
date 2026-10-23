import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent, within } from "@/test/render";
import { AdminVerificationTable } from "./admin-verification-table";

beforeEach(() => {
  window.localStorage.clear();
});

describe("AdminVerificationTable", () => {
  it("lista los proveedores en revision o pendientes", () => {
    renderWithProviders(<AdminVerificationTable />);

    expect(screen.getByText("Termica Norte Ingenieria")).toBeInTheDocument();
    expect(screen.getByText("Calor Central SpA")).toBeInTheDocument();
    expect(screen.getByText(/2 en revision/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Aprobar/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Rechazar/ })).toHaveLength(2);
  });

  it("aprobar resuelve el proveedor y descuenta el contador", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminVerificationTable />);

    await user.click(screen.getAllByRole("button", { name: /Aprobar/ })[0]);

    expect(await screen.findByText(/1 en revision/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Aprobar/ })).toHaveLength(1);
    expect(screen.getByText("Resuelto")).toBeInTheDocument();
  });

  it("rechazar exige un motivo valido y luego resuelve el proveedor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminVerificationTable />);

    await user.click(screen.getAllByRole("button", { name: /Rechazar/ })[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Rechazar verificacion")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Confirmar rechazo" }));
    expect(await within(dialog).findByText(/al menos 5 caracteres/)).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText("Motivo del rechazo"),
      "Documentacion incompleta",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirmar rechazo" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: /Rechazar/ })).toHaveLength(1);
    expect(screen.getByText("Resuelto")).toBeInTheDocument();
  });

  it("descuenta el contador hasta cero al resolver todos los pendientes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminVerificationTable />);

    let approvals = screen.getAllByRole("button", { name: /Aprobar/ });
    await user.click(approvals[0]);
    approvals = screen.getAllByRole("button", { name: /Aprobar/ });
    await user.click(approvals[0]);

    expect(await screen.findByText(/0 en revision/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Aprobar/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Resuelto")).toHaveLength(2);
  });
});

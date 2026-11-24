import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock("nodemailer", () => ({ default: { createTransport } }));

beforeEach(() => {
  // Los casos de Resend no deben tomar un SMTP del entorno local.
  vi.stubEnv("SMTP_HOST", "");
  vi.stubEnv("SMTP_USER", "");
  vi.stubEnv("SMTP_PASS", "");
  sendMail.mockReset();
  createTransport.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

const message = {
  to: "cliente@demo.cl",
  subject: "Nueva cotización recibida",
  text: "Hogar Fresco te envió una cotización por $90.000.",
  link: "/panel/solicitudes/abc",
};

describe("PR-031 NOT-02 correos transaccionales", () => {
  it("sin RESEND_API_KEY registra el correo en el log y no falla", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { sendEmail } = await import("./email");
    await expect(sendEmail(message)).resolves.toBe("logged");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining("cliente@demo.cl"));
  });

  it("con RESEND_API_KEY envía a Resend con asunto, destinatario y enlace", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const { sendEmail } = await import("./email");
    await expect(sendEmail(message)).resolves.toBe("sent");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_123");
    const payload = JSON.parse(init.body);
    expect(payload.to).toEqual(["cliente@demo.cl"]);
    expect(payload.subject).toBe("Nueva cotización recibida");
    expect(payload.html).toContain("/panel/solicitudes/abc");
  });

  it("si Resend falla no lanza error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { sendEmail } = await import("./email");
    await expect(sendEmail(message)).resolves.toBe("failed");
  });

  it("escapa HTML del contenido", async () => {
    const { renderEmail } = await import("./email");
    expect(renderEmail({ ...message, text: "<script>x</script>" })).not.toContain("<script>");
  });

  it("con SMTP envía por nodemailer (Gmail, TLS 465) y tiene prioridad sobre Resend", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "hvac@gmail.com");
    vi.stubEnv("SMTP_PASS", "clave-app");
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubEnv("EMAIL_FROM", "HVAC Connect <hvac@gmail.com>");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    sendMail.mockResolvedValue({ messageId: "1" });
    const { sendEmail } = await import("./email");
    await expect(sendEmail(message)).resolves.toBe("sent");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: "hvac@gmail.com", pass: "clave-app" },
      }),
    );
    const mail = sendMail.mock.calls[0][0];
    expect(mail.from).toBe("HVAC Connect <hvac@gmail.com>");
    expect(mail.to).toBe("cliente@demo.cl");
    expect(mail.subject).toBe("Nueva cotización recibida");
    expect(mail.html).toContain("/panel/solicitudes/abc");
  });

  it("si SMTP falla no lanza error", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "hvac@gmail.com");
    vi.stubEnv("SMTP_PASS", "clave-app");
    sendMail.mockRejectedValue(new Error("Invalid login"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { sendEmail } = await import("./email");
    await expect(sendEmail(message)).resolves.toBe("failed");
  });
});

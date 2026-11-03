import { env } from "./env";

export interface EmailMessage {
  to: string;
  subject: string;
  /** Texto plano; se envuelve en un HTML simple. */
  text: string;
  /** Ruta del frontend a enlazar (por ejemplo /panel/solicitudes/123). */
  link?: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function renderEmail(message: EmailMessage): string {
  const origin = env.frontendOrigin.split(",")[0]?.trim() ?? "";
  const link = message.link
    ? `<p><a href="${origin}${message.link}" style="color:#0f766e">Ver en HVAC Connect</a></p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
<h2 style="font-size:18px">${escapeHtml(message.subject)}</h2>
<p>${escapeHtml(message.text)}</p>${link}
<p style="color:#666;font-size:12px">HVAC Connect · Este es un correo automático, no lo respondas.</p></div>`;
}

/**
 * NOT-02: envia un correo con Resend. Sin `RESEND_API_KEY` solo registra el
 * correo en el log y no falla (degradacion elegante).
 */
export async function sendEmail(message: EmailMessage): Promise<"sent" | "logged" | "failed"> {
  if (!env.resendApiKey) {
    console.info(`[email] (sin RESEND_API_KEY) para=${message.to} asunto="${message.subject}"`);
    return "logged";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [message.to],
        subject: message.subject,
        html: renderEmail(message),
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[email] Resend respondió ${res.status} para ${message.to}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.warn(`[email] no se pudo enviar a ${message.to}:`, (error as Error).message);
    return "failed";
  }
}

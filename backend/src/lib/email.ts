import nodemailer from "nodemailer";
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

type SendResult = "sent" | "logged" | "failed";

const hasSmtp = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

async function sendWithSmtp(message: EmailMessage): Promise<SendResult> {
  try {
    const transport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
    await transport.sendMail({
      from: env.emailFrom,
      to: message.to,
      subject: message.subject,
      html: renderEmail(message),
      text: message.text,
    });
    return "sent";
  } catch (error) {
    console.warn(`[email] SMTP no pudo enviar a ${message.to}:`, (error as Error).message);
    return "failed";
  }
}

/**
 * NOT-02: envia un correo por SMTP (`SMTP_HOST/USER/PASS`, p. ej. Gmail) o, si no
 * hay SMTP, con Resend (`RESEND_API_KEY`). Sin ninguno solo registra el correo en
 * el log. Nunca lanza error (degradacion elegante).
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (hasSmtp()) return sendWithSmtp(message);
  if (!env.resendApiKey) {
    console.info(
      `[email] (sin SMTP ni RESEND_API_KEY) para=${message.to} asunto="${message.subject}"`,
    );
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

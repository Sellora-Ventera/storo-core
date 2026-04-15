import nodemailer, { type Transporter } from "nodemailer"

let cachedTransporter: Transporter | null = null

export function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    console.warn("[email] SMTP credentials not configured — skipping email send")
    return null
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return cachedTransporter
}

export function getSender(): { from: string; name: string } {
  const name = process.env.SMTP_FROM_NAME ?? "STORO.ID"
  const email = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "support@storo.id"
  return { from: `${name} <${email}>`, name }
}

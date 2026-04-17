import { getSender, getTransporter } from "./smtp"

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  if (!to) {
    console.warn("[email] Skipping send — no recipient")
    return false
  }

  const transporter = getTransporter()
  if (!transporter) return false

  try {
    const { from } = getSender()
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]*>/g, ""),
    })
    return true
  } catch (err) {
    console.error("[email] Failed to send:", err)
    return false
  }
}

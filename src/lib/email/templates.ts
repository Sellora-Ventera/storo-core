// ── Email templates untuk notifikasi shipping (Biteship) ─────────────────────
// Dipakai oleh centralized Biteship webhook (/api/webhooks/biteship)
// untuk notify customer saat resi muncul atau pesanan sampai.

function layout(opts: {
  title: string
  preheader?: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  const brandColor = "#4169df"
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a202c;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;">
              <div style="font-size:20px;font-weight:700;color:${brandColor};letter-spacing:-0.3px;">STORO.ID</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3;color:#1a202c;">${opts.title}</h1>
              ${opts.bodyHtml}
              ${opts.ctaLabel && opts.ctaUrl ? `
                <div style="margin-top:32px;">
                  <a href="${opts.ctaUrl}" style="display:inline-block;background-color:${brandColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">${opts.ctaLabel}</a>
                </div>
              ` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
              Email ini dikirim otomatis oleh STORO.ID. Jika ada pertanyaan, hubungi support@storo.id
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface OrderEmailData {
  orderNumber: string
  customerName: string | null
}

// Shipped (resi muncul)
export function orderShippedEmail(data: OrderEmailData & {
  waybillId: string
  courier?: string
  trackingUrl?: string
}): { subject: string; html: string } {
  const greet = data.customerName ? `Halo ${data.customerName},` : "Halo,"
  return {
    subject: `Pesanan Dikirim — ${data.orderNumber}`,
    html: layout({
      title: "Pesanan Anda sedang dalam perjalanan",
      preheader: `Resi ${data.waybillId}${data.courier ? ` via ${data.courier}` : ""}`,
      ctaLabel: data.trackingUrl ? "Lacak Pengiriman" : undefined,
      ctaUrl: data.trackingUrl,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greet}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Kabar baik! Pesanan Anda sudah kami serahkan ke kurir dan sedang dalam perjalanan.</p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:20px 0;background-color:#f9fafb;border-radius:6px;">
          <tr><td style="padding:16px;"><div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Nomor Pesanan</div><div style="font-size:16px;font-weight:600;font-family:monospace;">${data.orderNumber}</div></td></tr>
          <tr><td style="padding:0 16px 16px;"><div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Nomor Resi</div><div style="font-size:16px;font-weight:600;font-family:monospace;">${data.waybillId}</div></td></tr>
          ${data.courier ? `<tr><td style="padding:0 16px 16px;"><div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Kurir</div><div style="font-size:16px;font-weight:600;text-transform:capitalize;">${data.courier}</div></td></tr>` : ""}
        </table>
      `,
    }),
  }
}

// Delivered
export function orderDeliveredEmail(data: OrderEmailData): {
  subject: string
  html: string
} {
  const greet = data.customerName ? `Halo ${data.customerName},` : "Halo,"
  return {
    subject: `Pesanan Diterima — ${data.orderNumber}`,
    html: layout({
      title: "Pesanan Anda telah sampai",
      preheader: `Pesanan ${data.orderNumber} telah diterima`,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greet}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Pesanan Anda sudah sampai di tujuan. Terima kasih telah berbelanja bersama kami!</p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:20px 0;background-color:#f9fafb;border-radius:6px;">
          <tr><td style="padding:16px;"><div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Nomor Pesanan</div><div style="font-size:16px;font-weight:600;font-family:monospace;">${data.orderNumber}</div></td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">Jika ada masalah dengan pesanan, silakan hubungi kami dalam 3 hari kerja.</p>
      `,
    }),
  }
}

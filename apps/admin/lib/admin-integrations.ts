import { getServerEnv } from "@/lib/env";

interface DeliveryResult {
  attempted: boolean;
  delivered: boolean;
  reason?: string;
}

export async function sendPinRejectionEmail(input: {
  to: string | null;
  recipientName: string;
  businessName: string;
}): Promise<DeliveryResult> {
  if (!input.to) {
    return { attempted: false, delivered: false, reason: "recipient_missing" };
  }

  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.ADMIN_FROM_EMAIL) {
    return { attempted: false, delivered: false, reason: "email_not_configured" };
  }

  const text = [
    `Merhaba ${input.recipientName},`,
    "",
    `${input.businessName} için yaptığın işletme pin başvurusunu inceledik ancak mevcut bilgilerle doğrulama tamamlanamadı.`,
    "Lütfen adres, telefon veya işletme sahipliği belgelerini güncelleyip tekrar başvur.",
    "",
    "Rollpit Admin",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.ADMIN_FROM_EMAIL,
      to: [input.to],
      subject: `${input.businessName} başvurun hakkında güncelleme`,
      text,
      html: text.replace(/\n/g, "<br />"),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      attempted: true,
      delivered: false,
      reason: detail || `resend_${response.status}`,
    };
  }

  return { attempted: true, delivered: true };
}

export async function notifyRealtimeDisconnect(input: {
  userId: string;
  mode: "ban_permanent" | "suspend_7d";
}): Promise<DeliveryResult> {
  const env = getServerEnv();
  if (!env.REALTIME_ADMIN_HOOK_URL) {
    return { attempted: false, delivered: false, reason: "realtime_hook_not_configured" };
  }

  const response = await fetch(env.REALTIME_ADMIN_HOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.REALTIME_ADMIN_HOOK_SECRET ? { "x-admin-secret": env.REALTIME_ADMIN_HOOK_SECRET } : {}),
    },
    body: JSON.stringify({
      action: "disconnect_user_sessions",
      userId: input.userId,
      mode: input.mode,
      source: "rollpit_admin",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      attempted: true,
      delivered: false,
      reason: detail || `realtime_hook_${response.status}`,
    };
  }

  return { attempted: true, delivered: true };
}

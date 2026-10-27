import type { APIRoute } from "astro";
import { DiningReservationError, createDiningReservation } from "@/features/dining/reservations";

const ERROR_STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  NO_AVAILABILITY: 409,
  RESERVATION_UNAVAILABLE: 502,
};

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function wixApplicationCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const details = (error as { details?: { applicationError?: { code?: unknown } } }).details;
  const code = details?.applicationError?.code;
  return typeof code === "string" ? code : undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const REQUIRED_FIELDS = ["firstName", "phone"] as const;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_INPUT" }, 400);
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const startDate = asString(payload.startDate);
  const partySize = asString(payload.partySize) || Number(payload.partySize);

  for (const field of REQUIRED_FIELDS) {
    if (!asString(payload[field]).trim()) {
      return json({ error: "INVALID_INPUT" }, 400);
    }
  }

  try {
    const reservation = await createDiningReservation({
      startDate,
      partySize: Number(partySize),
      firstName: asString(payload.firstName),
      lastName: asString(payload.lastName),
      email: asString(payload.email),
      phone: asString(payload.phone),
    });
    return json({ reservation }, 200);
  } catch (error) {
    if (error instanceof DiningReservationError) {
      return json({ error: error.code }, ERROR_STATUS[error.code] ?? 400);
    }
    const wixCode = wixApplicationCode(error);
    if (wixCode === "NOT_AVAILABLE" || wixCode === "RESERVATION_NOT_AVAILABLE" || wixCode === "SEAT_NOT_AVAILABLE") {
      return json({ error: "NO_AVAILABILITY" }, 409);
    }
    if (wixCode === "INVALID_ARGUMENT" || wixCode === "INVALIDATION") {
      return json({ error: "INVALID_INPUT" }, 400);
    }
    // Non-premium sites reject online booking with 428 PREMIUM_ONLY — the
    // seating exists but cannot be booked until the owner upgrades.
    if (wixCode === "PREMIUM_ONLY") {
      return json({ error: "RESERVATION_UNAVAILABLE" }, 502);
    }
    console.error("[dining-api] reservation creation failed:", error);
    return json({ error: "RESERVATION_UNAVAILABLE" }, 502);
  }
};

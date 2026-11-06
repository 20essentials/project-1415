import { createHmac, timingSafeEqual } from 'node:crypto';

export interface BookingConfirmationInput {
  id: string;
  service?: string | null;
  start?: string | null;
  end?: string | null;
}

// Canonical payload order is fixed (id|service|start|end) so a signature only
// ever covers one byte string, regardless of query-param order in the URL.
function canonicalPayload(input: BookingConfirmationInput): string {
  return [input.id, input.service ?? '', input.start ?? '', input.end ?? ''].join('|');
}

function hmacHex(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqualHex(expected: string, actual: string): boolean {
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(actual, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signBookingConfirmation(input: BookingConfirmationInput, secret: string): string {
  const params = new URLSearchParams();
  params.set('id', input.id);
  if (input.service) params.set('service', input.service);
  if (input.start) params.set('start', input.start);
  if (input.end) params.set('end', input.end);
  params.set('sig', hmacHex(canonicalPayload(input), secret));
  return params.toString();
}

export function verifyBookingConfirmation(params: URLSearchParams, secret: string): boolean {
  const sig = params.get('sig');
  const id = params.get('id');
  if (!sig || !id) return false;
  const expected = hmacHex(
    canonicalPayload({
      id,
      service: params.get('service'),
      start: params.get('start'),
      end: params.get('end'),
    }),
    secret,
  );
  return safeEqualHex(expected, sig);
}

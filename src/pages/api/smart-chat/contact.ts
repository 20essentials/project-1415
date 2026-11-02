import type { APIRoute } from 'astro';
import { submitSmartChatContact, validateSmartChatContact } from '@/features/smart-chat/contact';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'INVALID_JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isRecord(payload)) {
    return new Response(JSON.stringify({ error: 'INVALID_PAYLOAD' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const input = {
    name: stringValue(payload.name),
    email: stringValue(payload.email),
    phone: stringValue(payload.phone),
    message: stringValue(payload.message) ?? '',
  };

  const errors = validateSmartChatContact(input);
  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: 'VALIDATION_FAILED', fields: errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await submitSmartChatContact(input);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[smart-chat] contact submit failed:', error);
    if (error instanceof Error && error.message === 'SMART_CHAT_CONTACT_FORM_NOT_FOUND') {
      return new Response(JSON.stringify({ error: 'CONTACT_FORM_NOT_FOUND' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'CONTACT_SUBMIT_FAILED' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

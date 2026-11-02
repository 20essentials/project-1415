import type { APIRoute } from 'astro';
import { getSmartChatConfig } from '@/features/smart-chat/chat-settings';

export const GET: APIRoute = async () => {
  const config = await getSmartChatConfig();

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=60',
    },
  });
};

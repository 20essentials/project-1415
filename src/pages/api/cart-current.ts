import type { APIRoute } from 'astro';
import { currentCart } from '@wix/ecom';

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// 404 es el estado normal del header en la primera visita (sin carrito): no se
// loguea. Cualquier otro fallo sí, y se marca con `error` para que la UI lo
// distinga de un carrito realmente vacío.
function isMissingCart(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as {
    status?: unknown;
    details?: { applicationError?: { code?: unknown } };
  };
  return (
    e.status === 404 ||
    e.details?.applicationError?.code === 'OWNED_CART_NOT_FOUND'
  );
}

export const GET: APIRoute = async () => {
  try {
    const cart = await currentCart.getCurrentCart();
    return json({ cart });
  } catch (error) {
    if (isMissingCart(error)) return json({ cart: null });
    console.error('[cart-current-api] getCurrentCart failed:', error);
    return json({ cart: null, error: 'FAILED' });
  }
};

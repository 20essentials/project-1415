import type { APIRoute } from 'astro';
import { currentCart } from '@wix/ecom';

// `currentCart.getCurrentCart` responde 404 cuando el visitante aún no tiene
// carrito; si la llamada sale del browser el navegador loguea "Failed to load
// resource" en cada página (badge del header). Este route hace la llamada
// server-side y devuelve 200 con `cart: null` como comportamiento por defecto.
export const GET: APIRoute = async () => {
  try {
    const cart = await currentCart.getCurrentCart();
    return new Response(JSON.stringify({ cart }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[cart-current-api] getCurrentCart failed:', error);
    return new Response(JSON.stringify({ cart: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

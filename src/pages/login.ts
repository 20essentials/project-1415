import type { APIRoute } from 'astro';
import { WIX_CLIENT_ID } from 'astro:env/client';
import { redirects } from '@wix/redirects';
import { getContextualAuth } from '@wix/sdk-runtime/context';
import { i18n } from '@wix/essentials';
import type { IOAuthStrategy } from '@wix/sdk';

const CALLBACK_PATH = '/api/auth/callback';
const OAUTH_STATE_COOKIE = 'oAuthState';

export function getPublicOrigin(request: Request, url: URL): string {
  const forwardedUrl = request.headers.get('x-wix-forwarded-url');
  if (forwardedUrl && forwardedUrl !== '' && URL.canParse(forwardedUrl)) {
    const publicUrl = new URL(forwardedUrl);
    if (publicUrl.protocol === 'https:' || publicUrl.protocol === 'http:') return publicUrl.origin;
  }
  return url.origin;
}

export function isSafeReturnUrl(returnToUrl: string, url: URL): boolean {
  if (!returnToUrl.startsWith('/')) return false;
  try {
    return new URL(returnToUrl, url).origin === url.origin;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const returnToUrl = url.searchParams.get('returnToUrl') ?? '/';
  if (!isSafeReturnUrl(returnToUrl, url)) {
    return new Response('Invalid `returnToUrl` query param, only relative URLs are allowed', { status: 400 });
  }

  const callbackUrl = new URL(CALLBACK_PATH, getPublicOrigin(request, url)).toString();
  const auth = getContextualAuth<IOAuthStrategy>();
  const oauthData = auth.generateOAuthData(callbackUrl, returnToUrl);

  const { redirectSession } = await redirects.createRedirectSession({
    auth: {
      authRequest: {
        clientId: WIX_CLIENT_ID,
        responseType: 'code',
        responseMode: 'query',
        scope: 'offline_access',
        redirectUri: oauthData.redirectUri,
        state: oauthData.state,
        codeChallenge: oauthData.codeChallenge,
        codeChallengeMethod: 'S256',
      },
      prompt: 'login',
    },
    preferences: { additionalQueryParameters: { lang: i18n.getLanguage() } },
  });

  const authUrl = redirectSession?.fullUrl;
  if (!authUrl) {
    return new Response('Failed to create login redirect session', { status: 502 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store',
      Location: authUrl,
      'Set-Cookie': `${OAUTH_STATE_COOKIE}=${JSON.stringify(oauthData)}; Max-Age=1800; Path=/; HttpOnly; Secure; SameSite=None`,
    },
  });
};

export const i18n = {
  getLanguage: () => 'en',
  getTranslationFunction: () => (key: string) => key,
};

export const auth = {
  elevate: <T>(sourceFunction: T): T => sourceFunction,
  getContextualAuth: () => ({
    getAuthHeaders: async () => ({ headers: {} }),
  }),
};

export const httpClient = {
  fetchWithAuth: (url: string | URL | Request, init?: RequestInit) => fetch(url, init),
};

export const WIX_APPS = {
  blogs: { id: '14bcded7-0066-7c35-14d7-466cb3f09103', name: 'Wix Blogs' },
} as const;

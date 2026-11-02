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

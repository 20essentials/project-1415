export const i18n = {
  getLanguage: () => 'en',
  getTranslationFunction: () => (key: string) => key,
};

export const auth = {
  elevate: <T>(sourceFunction: T): T => sourceFunction,
};

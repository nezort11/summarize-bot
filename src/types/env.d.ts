export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN_DEV: string;
      BOT_TOKEN_PROD: string;
      // YANDEX_300_API_TOKEN: string;
      YANDEX_SESSION_ID: string;
      TELEGRAPH_ACCESS_TOKEN: string;
    }
  }
}

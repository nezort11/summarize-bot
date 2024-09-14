import * as dotenv from "dotenv";
dotenv.config();

export const IS_PRODUCTION = process.env.NODE_ENV !== "development";

export const BOT_TOKEN = IS_PRODUCTION
  ? process.env.BOT_TOKEN_PROD!
  : process.env.BOT_TOKEN_DEV!;

// export const YANDEX_300_API_TOKEN = process.env.YANDEX_300_API_TOKEN;
export const YANDEX_SESSION_ID = process.env.YANDEX_SESSION_ID;

export const TELEGRAPH_ACCESS_TOKEN = process.env.TELEGRAPH_ACCESS_TOKEN;

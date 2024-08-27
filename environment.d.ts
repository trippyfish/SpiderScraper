import { LogLevel } from "telegram/extensions/Logger.js";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_ID: number;
      API_HASH: string;
      TARGET_CHAT: string;
      TRACKED_CHATS: string;
    }
  }
}

export {};

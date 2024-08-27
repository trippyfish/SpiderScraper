import "dotenv/config";

import { NewMessage } from "telegram/events/NewMessage.js";
import { Api } from "telegram/index.js";
import { getDisplayName } from "telegram/Utils.js";

import client from "./utils/client.js";
import db from "./utils/db.js";

// load db into memory
await db.read();

// solana, trx, evm
const regexRegistry = {
  solana: /[1-9A-HJ-NP-Za-z]{44}/, // lowercase l is only included as dex links are lowercased
  tron: /T[A-Za-z1-9]{33}/,
  evm: /0x[a-fA-F0-9]{40}/,
};

// parse target chat
const targetChat = (() => {
  const chat = process.env.TARGET_CHAT.trim();
  if (!chat) {
    throw new Error("TARGET_CHAT is required");
  }
  return /^-?\d+$/.test(chat) ? parseInt(chat) : chat;
})();

// start listening to messages in tracked chats
client.addEventHandler(
  async ({ message }) => {
    const text = message.text;
    const urls = message.entities
      ?.filter((entity) => entity instanceof Api.MessageEntityTextUrl)
      .map((entity) => entity.url);

    const matchers = Object.entries(regexRegistry);

    for (let i = 0; i < matchers.length; i++) {
      let match = text.match(matchers[i][1]);

      // if no text match, check URLs
      if (!match) {
        for (const url of urls || []) {
          match = url.match(matchers[i][1]);
          if (match) {
            break;
          }
        }
      }

      if (match) {
        const [address] = match;

        const lcAddress = address.toLowerCase();
        const chat = (await message.getChat()) as Api.Chat;
        const sender = (await message.getSender()) as Api.User;

        client.logger.info(
          `Found ${matchers[i][0]} match in ${chat.title} from ${getDisplayName(
            sender
          )}: ${address}`
        );

        if (db.data.scanned.indexOf(lcAddress) > -1) {
          client.logger.info(`${address} is a duplicate! Ignoring...`);
        } else {
          db.data.scanned.push(lcAddress);
          client.logger.info(`Sending ${address} to sniper...`);
          // send ca to target
          await client.sendMessage(targetChat, {
            message: address,
          });
          client.logger.info(`${address} sent!`);
          await db.write();
        }

        break;
      }
    }
  },
  new NewMessage({
    chats: process.env.TRACKED_CHATS.split(",")
      .map((chat) => chat.trim())
      .map((chat) => (/^-?\d+$/.test(chat) ? parseInt(chat) : chat)),
  })
);

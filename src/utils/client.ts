import { input, password } from "@inquirer/prompts";
import { TelegramClient } from "telegram/index.js";
import { StoreSession } from "telegram/sessions/index.js";
import { getDisplayName } from "telegram/Utils.js";

const initializeClient = async () => {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;

  if (!apiId || !apiHash) {
    throw new Error("API_ID and API_HASH are required");
  } else if (isNaN(apiId)) {
    throw new Error("API_ID must be a number");
  }

  const storeSession = new StoreSession("data/session");

  const client = new TelegramClient(storeSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  if (!client.connected) {
    await client.connect();
  }

  const me = (await client.checkAuthorization()) ? await client.getMe() : null;

  if (me) {
    client.logger.info(`Signed in successfully as ${getDisplayName(me)}`);
  } else {
    await client.start({
      phoneNumber: async () => {
        return await input({ message: "Please enter your phone number:" });
      },
      phoneCode: async () => {
        return await input({ message: "Please enter the code sent to your phone:" });
      },
      password: async () => {
        return await password({ message: "Please enter your password:", mask: true });
      },
      onError: (err) => client.logger.error(err.message),
    });

    client.session.save();
  }

  return client;
};

export default await initializeClient();

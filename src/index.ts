import dotenv = require('dotenv');

import { Client, GatewayIntentBits, Events } from 'discord.js';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client
  .login(process.env.DISCORD_TOKEN)
  .then(() => console.log('봇이 준비되었습니다'));

client.once(Events.ClientReady, (c: { user: { tag: string } }) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

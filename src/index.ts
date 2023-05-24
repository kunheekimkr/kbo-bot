import fs = require('fs');
import path = require('path');
import dotenv = require('dotenv');

import { Client, Collection, GatewayIntentBits } from 'discord.js';

import { Command } from './interfaces/command';
dotenv.config();

declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, Command>;
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.ts'));

async function importCommandModules() {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const commandModule = await import(filePath);
      const command = commandModule.default;
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    } catch (error) {
      console.log(
        `[ERROR] Failed to import command module at ${filePath}:`,
        error
      );
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith('.ts'));

async function importEventModules() {
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

importCommandModules().then(() => {
  importEventModules().then(() => {
    client.login(process.env.DISCORD_TOKEN);
  });
});

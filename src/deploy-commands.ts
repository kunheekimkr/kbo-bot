import { REST, Routes } from 'discord.js';
import fs = require('fs');
import path = require('path');
import dotenv = require('dotenv');

dotenv.config();

interface Command {
  data: {
    toJSON(): object;
    name: string;
  };
  execute: () => void;
}

const commands: Command[] = [];
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

      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
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

importCommandModules().then(() => {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  // and deploy your commands!
  (async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      const data: any = await rest.put(
        Routes.applicationCommands(process.env.clientId!),
        { body: commands }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();
});

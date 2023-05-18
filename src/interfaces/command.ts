import { CommandInteraction } from 'discord.js';

export interface Command {
  data: {
    toJSON(): object;
    name: string;
  };
  execute: (interaction: CommandInteraction) => void;
}

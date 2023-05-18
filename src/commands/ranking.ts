import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('순위')
    .setDescription('현재 프로야구 순위'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply('테스트중입니다...');
    //ToDo: 순위 크롤링
  },
};

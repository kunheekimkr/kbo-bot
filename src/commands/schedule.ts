import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder, EmbedField } from 'discord.js';
import axios from 'axios';

async function fetchTodayMatches(): Promise<EmbedBuilder> {
  try {
    // Get Today's Date string (YYYYMMDD)
    const now = new Date();
    const date = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC to KST
    console.log(date);
    const year = date.getFullYear();
    const month = ('0' + (1 + date.getMonth())).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const todayString = year + month + day;

    // 크롤링
    const response = await axios({
      method: 'get',
      url: 'https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList',
      params: {
        leId: 1,
        srId: 0,
        date: todayString,
      },
    });
    // save response as json
    const gameInfos = response.data.game;
    const values: string[] = [];
    for (let i = 0; i < gameInfos.length; i++) {
      const gameStr = `[${gameInfos[i].S_NM}] ${gameInfos[i].HOME_NM} VS ${
        gameInfos[i].AWAY_NM
      } (${
        gameInfos[i].CANCEL_SC_NM == '정상경기'
          ? gameInfos[i].G_TM
          : gameInfos[i].CANCEL_SC_NM
      })\n    <${gameInfos[i].B_PIT_P_NM} vs ${gameInfos[i].T_PIT_P_NM}>\n`;
      values.push('`' + gameStr + '`');
    }
    const field: EmbedField = {
      name: '오늘의 경기',
      value: values.join('\n'),
      inline: false,
    };
    const embed = new EmbedBuilder().setFields(field);
    return embed;
  } catch (error) {
    console.error("Error occurred while fetching today's schedule", error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('일정')
    .setDescription('오늘의 경기 일정'),
  async execute(interaction: CommandInteraction) {
    fetchTodayMatches()
      .then(async (result) => {
        await interaction.reply({
          embeds: [result],
        });
      })
      .catch((error) => {
        console.error("Error occurred while replying today's schedule", error);
      });
  },
};

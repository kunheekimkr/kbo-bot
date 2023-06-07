import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  EmbedBuilder,
  EmbedField,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';
import axios from 'axios';

// Parse gameInfos and create EmbedBuilder
function createScheduleEmbed(gameInfos: any[], date: Date): EmbedBuilder {
  if (gameInfos.length === 0) {
    const field: EmbedField = {
      name: date.getMonth() + 1 + '월 ' + date.getDate() + '일',
      value: '경기가 없습니다.',
      inline: false,
    };
    return new EmbedBuilder().setFields(field);
  } else {
    const values: string[] = [];
    for (let i = 0; i < gameInfos.length; i++) {
      if (
        gameInfos[i].GAME_STATE_SC == 1 ||
        gameInfos[i].GAME_STATE_SC == 2 // 1: 경기예정 2: 경기중 3: 경기종료 4: 경기취소
      ) {
        const gameStr = `[${gameInfos[i].S_NM}] ${gameInfos[i].HOME_NM} VS ${
          gameInfos[i].AWAY_NM
        } (${gameInfos[i].G_TM})\n    <${
          gameInfos[i].B_PIT_P_NM == null ? '미정' : gameInfos[i].B_PIT_P_NM
        } vs ${
          gameInfos[i].T_PIT_P_NM == null ? '미정' : gameInfos[i].T_PIT_P_NM
        }>\n`;
        values.push('`' + gameStr + '`');
      } else if (gameInfos[i].GAME_STATE_SC == 3) {
        const gameStr = `[${gameInfos[i].S_NM}] ${gameInfos[i].HOME_NM} ${
          gameInfos[i].B_SCORE_CN
        } VS ${gameInfos[i].T_SCORE_CN} ${gameInfos[i].AWAY_NM} (${
          gameInfos[i].G_TM
        })\n    ${
          gameInfos[i].W_PIT_P_NM == '' ? '' : '승: ' + gameInfos[i].W_PIT_P_NM
        } ${
          gameInfos[i].L_PIT_P_NM == '' ? '' : '패: ' + gameInfos[i].L_PIT_P_NM
        } ${
          gameInfos[i].SV_PIT_P_NM == ''
            ? ''
            : '세: ' + gameInfos[i].SV_PIT_P_NM
        }\n`;
        values.push('`' + gameStr + '`');
      } else if (gameInfos[i].GAME_STATE_SC == 4) {
        const gameStr = `[${gameInfos[i].S_NM}] ${gameInfos[i].HOME_NM} VS ${gameInfos[i].AWAY_NM} (${gameInfos[i].CANCEL_SC_NM})\n`;
        values.push('`' + gameStr + '`');
      }
    }
    const field: EmbedField = {
      name: date.getMonth() + 1 + '월 ' + date.getDate() + '일',
      value: values.join('\n'),
      inline: false,
    };
    return new EmbedBuilder().setFields(field);
  }
}

// Fetch Game schedule
async function fetchTodayMatches(date: Date): Promise<EmbedBuilder> {
  try {
    let gameInfos: any[] = [];
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
    gameInfos = response.data.game;
    return createScheduleEmbed(gameInfos, date);
  } catch (error) {
    console.error('Error occurred while fetching latest schedule', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('일정')
    .setDescription('가까운 경기 일정'),

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    const back = new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('⏴')
      .setStyle(ButtonStyle.Primary);
    const forward = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('⏵')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      back,
      forward
    );

    const date = new Date();
    const result = await fetchTodayMatches(date);
    const response = await interaction.editReply({
      embeds: [result],
      components: [row],
    });
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });
    collector.on('collect', async (i) => {
      const selected = i.customId;
      if (selected === 'next') date.setDate(date.getDate() + 1);
      else if (selected === 'prev') date.setDate(date.getDate() - 1);
      const result = await fetchTodayMatches(date);
      await i.update({
        embeds: [result],
        components: [row],
      });
    });
  },
};

import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder, EmbedField } from 'discord.js';
import axios from 'axios';
import { load } from 'cheerio';

async function fetchTeamRankTable(): Promise<EmbedBuilder> {
  try {

    // 크롤링
    const response = await axios.get(
      'https://www.koreabaseball.com/TeamRank/TeamRank.aspx'
    );
    const html = response.data;
    const $ = load(html);

    const crawled = $('#cphContents_cphContents_cphContents_udpRecord > table');
    const arr: string[][] = [];
    crawled.find('tr').each((_, element) => {
      const temp = $(element).text().replace(/\s\s+/g, ' ').split(' ');
      const wanted = temp.slice(1, 9);
      wanted.push(temp[10]);
      arr.push(wanted);
    });


    // Embed 메시지로 반환해 가독성 좋게 순위표 출력 
    const values: string[] = [];

    let index = '';
    for (let i = 0; i < arr[0].length; i++) {
      if (arr[0][i].length == 1) index += arr[0][i] + '      ';
      if (arr[0][i].length == 2) index += arr[0][i] + '     ';
      else if (arr[0][i].length == 3) index += arr[0][i] + '    ';
    }
    values.push('`' + index + '`');

    for (let i = 1; i < arr.length; i++) {
      let value = '';
      for (let j = 0; j < arr[i].length; j++) {
        if (j == 1) {
          if ( // 한글은 글자 너비가 달라서 줄 간격 맞추려 보정
            arr[i][j] == '롯데' ||
            arr[i][j] == '두산' ||
            arr[i][j] == '키움' ||
            arr[i][j] == '삼성' ||
            arr[i][j] == '한화'
          ) {
            value += arr[i][j] + ' '.repeat(5);
          } else {
            value += arr[i][j] + ' '.repeat(8 - arr[i][j].length);
          }
        } else {
          value += arr[i][j] + ' '.repeat(8 - arr[i][j].length);
        }
      }
      value += '';
      values.push('`' + value + '`');
    }

    const field: EmbedField = {
      name: "KBO 프로야구 순위표",
      value: values.join('\n'),
      inline: false,
    };
    const embed = new EmbedBuilder().setFields(field);
    return embed;
  } catch (error) {
    console.error('Error occurred while fetching team rank table:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('순위')
    .setDescription('현재 프로야구 순위'),
  async execute(interaction: CommandInteraction) {
    fetchTeamRankTable()
      .then(async (result) => {
        console.log(result.data.fields);
        await interaction.reply({
          embeds: [result],
        });
      })
      .catch((error) => {
        console.error('Error occurred while fetching team rank table:', error);
      });
  },
};

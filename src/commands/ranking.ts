import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, codeBlock } from 'discord.js';
import axios from 'axios';
import { load } from 'cheerio';

async function fetchTeamRankTable(): Promise<string> {
  try {
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

    const formattedString = arr.map((row) => row.join('\t')).join('\n');
    return formattedString;
    // todo: formatt the string!
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
        await interaction.reply(codeBlock(result));
      })
      .catch((error) => {
        console.error('Error occurred while fetching team rank table:', error);
      });
  },
};

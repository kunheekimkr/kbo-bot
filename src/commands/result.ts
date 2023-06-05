import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { ServiceBuilder } from 'selenium-webdriver/chrome';
import { load } from 'cheerio';

async function getWebsiteHTML(): Promise<string> {
  // Specify the path to the ChromeDriver executable
  const chromeDriverPath = './chromedriver';

  // Set up Chrome options
  const options = new chrome.Options();
  let html = '';

  // Create a new WebDriver instance with ChromeDriver
  const serviceBuilder = new ServiceBuilder(chromeDriverPath);
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(serviceBuilder)
    .build();

  try {
    // Navigate to the website
    await driver.get('https://www.koreabaseball.com/Schedule/ScoreBoard.aspx');

    // Get the HTML of the page
    html = await driver.getPageSource();
  } catch (error) {
    console.error('Error occurred while fetching Score Board:', error);
    throw error;
  } finally {
    // Quit the WebDriver
    await driver.quit();
  }
  return html;
}

async function fetchScoreBoard(): Promise<string> {
  try {
    // 크롤링
    const html = await getWebsiteHTML();
    const $ = load(html);
    // Embed 메시지로 반환해 가독성 좋게 순위표 출력
    const values: string[] = [];

    const crawled = $('#cphContents_cphContents_cphContents_udpRecord');
    crawled.find('div.smsScore').each((_, element) => {
      let resultstr = '';

      const abstract = $(element).find('div.score_wrap');
      const leftTeam = $(abstract).find('p.leftTeam');
      const rightTeam = $(abstract).find('p.rightTeam');
      const inning = $(abstract).find('strong.flag');
      const win = $(abstract).find('p.win').find('span');
      let pitcherResult = win
        .map((index, element) => $(element).text())
        .get()
        .join('      ');
      pitcherResult =
        pitcherResult == '' ? pitcherResult : pitcherResult + '\n';
      resultstr +=
        leftTeam.text().replace(/\s\s+/g, ' ').slice(1) +
        'vs' +
        rightTeam.text().replace(/\s\s+/g, ' ') +
        '(' +
        inning.text().replace(/\s\s+/g, ' ') +
        ')\n' +
        pitcherResult;

      const table = $(element).find('table.tScore');
      const arr: string[][] = [];
      $(table)
        .find('tr')
        .each((idx, ths) => {
          arr[idx] = [];
          $(ths)
            .find('th,td')
            .each((i, thOrTd) => {
              if (idx != 0 && i == 0) {
                // team names
                if (
                  // 한글은 글자 너비가 달라서 줄 간격 맞추려 보정
                  $(thOrTd).text() == '롯데' ||
                  $(thOrTd).text() == 'SSG' ||
                  $(thOrTd).text() == 'KIA' ||
                  $(thOrTd).text() == '두산' ||
                  $(thOrTd).text() == '키움' ||
                  $(thOrTd).text() == '삼성' ||
                  $(thOrTd).text() == '한화'
                ) {
                  arr[idx].push($(thOrTd).text() + ' ');
                } else {
                  arr[idx].push($(thOrTd).text() + '  ');
                }
              } else if (idx == 0 && i == 0) {
                arr[idx].push($(thOrTd).text()); // "TEAM"
              } else {
                arr[idx].push($(thOrTd).text().padStart(2, ' '));
              }
            });
        });
      resultstr += '-'.repeat(54) + '\n';
      for (let i = 0; i < arr.length; i++) {
        resultstr += '|';
        for (let j = 0; j < arr[i].length; j++) {
          resultstr += arr[i][j];
          resultstr += '|';
        }
        resultstr += '\n';
      }
      resultstr += '-'.repeat(54) + '\n';
      values.push(resultstr);
    });
    return values.length == 0 ? '오늘은 경기가 없습니다!' : values.join('\n');
  } catch (error) {
    console.error('Error occurred while fetching Score Board:', error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('결과')
    .setDescription('오늘 프로야구 결과'),
  async execute(interaction: CommandInteraction) {
    fetchScoreBoard()
      .then(async (result) => {
        await interaction.reply('```' + result + '```');
      })
      .catch((error) => {
        console.error('Error occurred while replying Score Board:', error);
      });
  },
};

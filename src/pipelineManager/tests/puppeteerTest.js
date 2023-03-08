import puppeteer from 'puppeteer-extra';

import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';

// console.log('here', UserPreferencesPlugin);

const downloadPath = './output/';

puppeteer.use(
  UserPreferencesPlugin({
    userPrefs: {
      download: {
        prompt_for_download: false,
        defaultDirectory: downloadPath,
        automatic_downloads: 1
      },
      profile: {
        default_content_setting_values: {
          automatic_downloads: 1
        }
      }
    }
  })
);

puppeteer.launch({ headless: true }).then(async (browser) => {
  console.log('started', new Date());
  const page = await browser.newPage();
  console.log('opening a page');
  await page.goto('http://localhost:8888', { timeout: 0 });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  // page.waitForSelector('#done-tag').then(async () => {
  //   console.log('done!', new Date());
  //   await browser.close();
  // });

  // figure out a smart way to close the browser
  // setTimeout(async () => {
  //   await browser.close();
  // }, 30000);
});

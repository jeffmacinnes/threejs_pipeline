import puppeteer from 'puppeteer';

export default async ({ scene, format }) => {
  let url = `http://localhost:8080/?scene=${scene}&format=${format}`;
  const browser = await puppeteer.launch({
    headless: true
    // args: [
    //   '--use-cmd-decoder=passthrough' // maybe needed for gpu acceleration?
    // ]
  });

  const page = await browser.newPage();
  await page.goto(url, { timeout: 0 });

  // waiting until the done tag appears
  console.log('waiting for done tag');
  await page.waitForSelector('#done-tag', { timeout: 0 });
  console.log('closing browser');
  await browser.close();

  return 'done';
};

// export default async ({ scene, format }) => {
//   let url = `http://localhost:8080/?scene=${scene}&format=${format}`;
//   puppeteer
//     .launch({
//       headless: true
//       // args: [
//       //   '--use-cmd-decoder=passthrough' // maybe needed for gpu acceleration?
//       // ]
//     })
//     .then(async (browser) => {
//       const page = await browser.newPage();
//       await page.goto(url, { timeout: 0 });

//       // waiting until the done tag appears
//       console.log('waiting for done tag');
//       await page.waitForSelector('#done-tag', { timeout: 0 });
//       console.log('closing browser');
//       await browser.close();
//     });
// };

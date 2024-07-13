import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  const cookiesFilePath = "cookies.json";

  const browser = await puppeteer.launch({ headless: false });
  const landingPage = await browser.newPage();

  const previousSession = fs.existsSync(cookiesFilePath);
  if (previousSession) {
    // If file exist load the cookies
    const cookiesString = fs.readFileSync(cookiesFilePath);
    const parsedCookies = JSON.parse(cookiesString.toString());
    if (parsedCookies.length !== 0) {
      for (let cookie of parsedCookies) {
        await landingPage.setCookie(cookie);
      }
      console.log("Session has been loaded in the browser");
    }
  }

  await landingPage.setViewport({ width: 1920, height: 1080 });
  await landingPage.goto("https://www.steamgifts.com");

  // Save Session Cookies
  const cookiesObject = await landingPage.cookies();
  fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject), function (err) {
    if (err) {
      console.log("The file could not be written.", err);
    }
    console.log("Session has been successfully saved");
  });

  const currPoints = await landingPage.$eval(".nav__points", (el) =>
    parseInt(el.textContent || "0"),
  );
  console.log(`You currently have ${currPoints} points.`);

  await landingPage.close();

  await browser.close();
})();

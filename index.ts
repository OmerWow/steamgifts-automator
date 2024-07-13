import puppeteer from "puppeteer";
import fs from "fs";
import type { Giveaway } from "./types/giveaways";

(async () => {
  const cookiesFilePath = "cookies.json";

  const browser = await puppeteer.launch({ headless: true });
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
  fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject), (err) => {
    if (err) {
      console.log("The file could not be written.", err);
    }
    console.log("Session has been successfully saved");
  });

  const currPoints = await landingPage.$eval(".nav__points", (el) =>
    parseInt(el.textContent || "0"),
  );
  console.log(`You currently have ${currPoints} points, getting giveaways...`);

  const unenteredGiveaways = await landingPage.$$eval(
    "div.giveaway__row-inner-wrap",
    (els) =>
      els
        .filter((el) => !el.className.includes("is-faded"))
        .map((el) => {
          let currentGiveaway: Giveaway = {
            name: "",
            href: "",
            copies: 1,
            cost: 0,
          };

          const heading = el.querySelector("a.giveaway__heading__name");
          currentGiveaway.name = heading?.textContent || "";
          currentGiveaway.href = (heading as HTMLAnchorElement).href;

          const copiesOrCostEl = el.querySelector(
            "span.giveaway__heading__thin",
          );
          const copiesOrCostStr = copiesOrCostEl?.textContent;
          if (copiesOrCostStr?.includes("Copies")) {
            currentGiveaway.copies = parseInt(
              copiesOrCostStr.substring(1, copiesOrCostStr.indexOf(" ")),
            );
            currentGiveaway.cost = parseInt(
              copiesOrCostEl?.nextElementSibling?.textContent?.substring(
                1,
                copiesOrCostEl.nextElementSibling?.textContent.indexOf("P"),
              ) || "0",
            );
          } else {
            currentGiveaway.cost = parseInt(
              copiesOrCostStr?.substring(1, copiesOrCostStr?.indexOf("P")) ||
                "0",
            );
          }

          return currentGiveaway;
        }),
  );

  console.log(`There are ${unenteredGiveaways.length} unentered giveaways.`);

  console.log(unenteredGiveaways);

  await landingPage.close();

  await browser.close();
})();

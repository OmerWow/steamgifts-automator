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
            copies: 0,
            cost: 0,
            href: "",
          };

          let name, copies, cost, href;
          name = el.querySelector("a.giveaway__heading__name")?.textContent;
          currentGiveaway.name = name || "";

          const copiesOrCost = el.querySelector("span.giveaway__heading__thin");
          if (copiesOrCost?.textContent?.includes("Copies")) {
            copies = parseInt(
              copiesOrCost.textContent.substring(
                1,
                copiesOrCost.textContent.indexOf(" "),
              ),
            );
            cost = parseInt(
              copiesOrCost.nextElementSibling?.textContent?.substring(
                1,
                copiesOrCost.nextElementSibling?.textContent.indexOf("P"),
              ) || "0",
            );
          } else {
            copies = 1;
            cost = parseInt(
              copiesOrCost?.textContent?.substring(
                1,
                copiesOrCost?.textContent?.indexOf("P"),
              ) || "0",
            );
          }
          currentGiveaway.copies = copies;
          currentGiveaway.cost = cost;

          href = (
            el.querySelector("a.giveaway__heading__name") as HTMLAnchorElement
          )?.href;
          currentGiveaway.href = href || "";

          return currentGiveaway;
        }),
  );

  console.log(`There are ${unenteredGiveaways.length} unentered giveaways.`);

  console.log(unenteredGiveaways);

  await landingPage.close();

  await browser.close();
})();

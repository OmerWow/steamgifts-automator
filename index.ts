import puppeteer from "puppeteer";
import type { Giveaway } from "./types/giveaways";
import { loadSession } from "./utils/loadSession";
import { saveSession } from "./utils/saveSession";

(async () => {
  const cookiesFilePath = "cookies.json";

  const browser = await puppeteer.launch({ headless: true });
  const landingPage = await browser.newPage();

  await loadSession(landingPage, cookiesFilePath);

  await landingPage.setViewport({ width: 1920, height: 1080 });
  await landingPage.goto("https://www.steamgifts.com");

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

  const multiCopiesGiveaways = unenteredGiveaways
    .filter((giveaway) => giveaway.copies > 1)
    .sort((a, b) => {
      if (a.copies === b.copies) {
        return a.cost < b.cost ? 1 : -1;
      }
      return a.copies < b.copies ? 1 : -1;
    });

  const singleCopyGiveaways = unenteredGiveaways
    .filter((giveaway) => giveaway.copies === 1)
    .sort((a, b) => (a.cost < b.cost ? 1 : -1));

  await saveSession(landingPage, cookiesFilePath);

  await landingPage.close();

  await browser.close();
})();

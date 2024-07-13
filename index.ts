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

  if (unenteredGiveaways.length) {
    console.log(
      `There are ${unenteredGiveaways.length} unentered giveaways, checking which ones you can enter...\n`,
    );

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

    let totalCost = 0;
    const allGiveaways: Giveaway[] = [];

    if (multiCopiesGiveaways.length) {
      multiCopiesGiveaways.forEach((giveaway) => {
        const { name, copies, cost } = giveaway;

        if (totalCost + cost <= currPoints) {
          totalCost += cost;
          console.log(
            `\nFound a giveaway for ${copies} copies of "${name}" that costs ${cost} ${cost > 1 ? "points" : "point"}.`,
          );

          allGiveaways.push(giveaway);
        }
      });
    }

    if (singleCopyGiveaways.length) {
      singleCopyGiveaways.forEach((giveaway) => {
        const { name, cost } = giveaway;

        if (totalCost + cost <= currPoints) {
          totalCost += cost;
          console.log(
            `Found a giveaway for 1 copy of "${name}" that costs ${cost} ${cost > 1 ? "points" : "point"}.`,
          );

          allGiveaways.push(giveaway);
        }
      });
    }

    if (allGiveaways.length) {
      console.log(
        `\nFound a total of ${allGiveaways.length} ${allGiveaways.length > 1 ? "giveaways" : "giveaway"} with a total cost of ${totalCost} ${totalCost > 1 ? "points" : "point"}, entering...`,
      );
    } else {
      console.log("Found no giveaways you can afford.");
    }
  } else {
    console.log("Found no unentered giveaways.");
  }

  await saveSession(landingPage, cookiesFilePath);

  await landingPage.close();

  await browser.close();
})();

import type { Browser } from "puppeteer";
import { saveSession } from "./saveSession";
import type { Page } from "puppeteer";

export const terminate = async (
  message: string,
  page: Page,
  browser: Browser,
) => {
  console.info(message);

  await saveSession(page);

  await browser.close();
};

import fs from "fs";
import type { Page } from "puppeteer";

export const loadSession = async (page: Page, cookiesFilePath: string) => {
  const previousSession = fs.existsSync(cookiesFilePath);
  if (previousSession) {
    const cookiesString = fs.readFileSync(cookiesFilePath);
    const parsedCookies = JSON.parse(cookiesString.toString());
    if (parsedCookies.length !== 0) {
      for (let cookie of parsedCookies) {
        await page.setCookie(cookie);
      }
      console.debug("Session has been succesfully loaded\n");
    }
  } else {
    console.warn("No previous session found");
  }
};

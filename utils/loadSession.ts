import fs from "fs";
import type { Page } from "puppeteer";
import { COOKIES_FILE_PATH } from "../lib/cookiesFilePath";

export const loadSession = async (page: Page) => {
  const previousSession = fs.existsSync(COOKIES_FILE_PATH);
  if (previousSession) {
    const cookiesString = fs.readFileSync(COOKIES_FILE_PATH);
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

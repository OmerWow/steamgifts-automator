import fs from "fs";
import type { Page } from "puppeteer";
import { COOKIES_FILE_PATH } from "../lib/cookiesFilePath";

export const saveSession = async (page: Page) => {
  const cookiesObject = await page.cookies();
  fs.writeFile(COOKIES_FILE_PATH, JSON.stringify(cookiesObject), (err) => {
    if (err) {
      console.error("The file could not be written.", err);
    }
    console.debug("\nSession has been successfully saved");
  });
};

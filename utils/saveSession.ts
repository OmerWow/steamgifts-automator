import fs from "fs";
import type { Page } from "puppeteer";

export const saveSession = async (page: Page, cookiesFilePath: string) => {
  const cookiesObject = await page.cookies();
  fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject), (err) => {
    if (err) {
      console.error("The file could not be written.", err);
    }
    console.info("\nSession has been successfully saved");
  });
};

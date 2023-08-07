import { chromium } from "playwright-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import path from "path";
import prompt from "prompt";

const stealth = Stealth();

chromium.use(stealth);

const NEXT_BTN_SELECTOR =
  "#page-container > div > div > div.csms-screen__block.csms-screen__block--align-stretch > div:nth-child(2) > div > div > div.profile-card-full__bottom-line > div > div > div:nth-child(2) > div > button";

const INFO_DIV_SELECTOR =
  "#page-container > div > div > div.csms-screen__block.csms-screen__block--align-stretch > div:nth-child(2) > div > div > div.profile-card-full__info > div > div.profile-card-info__header > div > span";

const CLOSE_ERROR_SELECTOR =
  "#page-container > div > div > div.csms-screen__block.csms-screen__block--align-top > nav > div.csms-navigation-bar__slot.csms-navigation-bar__slot--primary.csms-navigation-bar__slot--is-wide > div > button";

const USER_DATA_DIR = path.resolve(__dirname, "data");

chromium
  .launchPersistentContext(USER_DATA_DIR, {
    executablePath: "/usr/bin/brave",
    headless: false,
  })
  .then((b) => b.newPage())
  .then(async (page) => {
    await page.goto("https://badoo.com/es-mx/encounters");

    prompt.get("Iniciar?", async function (err, result) {
      const recursiveMain = async () => {
        const info = await page.evaluate((INFO_DIV_SELECTOR) => {
          var div = document.querySelector(INFO_DIV_SELECTOR);
          if (!div) {
            console.log("no existe el Div", INFO_DIV_SELECTOR);
          }
          var result = div?.textContent;
          console.log(div, result);
          return result || "";
        }, INFO_DIV_SELECTOR);

        let [name, ageStr] = info.split(",").map((str) => str.trim());
        const age = Number(ageStr);

        console.log(name, age);

        if (name.includes("Nicole") && age > 20 && age < 23) {
          console.log("ENCONTRADO!!!");
          prompt.get("Seguir?", async function (err, result) {
            if (result["Seguir?"] === "Y") {
              await recursiveMain();
            } else {
              console.log("Okis :)");
            }
          });
        } else {
          const button = page.locator(NEXT_BTN_SELECTOR);
          console.log("Esperando el botón...");
          await page.waitForTimeout(1000);
          console.log("prev");

          try {
            await page.click(NEXT_BTN_SELECTOR, { timeout: 500 });
            try {
              await button.click({
                timeout: 500,
              });
            } catch (e) {}
            console.log("post");
          } catch (error) {
            console.log(error);
            try {
              const btnError = page.locator(CLOSE_ERROR_SELECTOR);

              await btnError.click({
                timeout: 500,
              });
              console.log("post");
            } catch (error) {
              console.log(error);
            }
          }
          await recursiveMain();
        }
      };
      if (result["Iniciar?"] !== "Y") {
        prompt.get<{ Hack: string }>("Hack", () => {
          const recursive = () => {
            prompt.get("code", (_, result) => {
              if (result.code === "exit") {
                recursiveMain();
              } else {
                console.log("result", result);
                eval(result.code);
                recursive();
              }
            });
          };
          recursive();
        });
      } else {
        console.log(result, "¡GO!");
        await recursiveMain();
      }
    });
  });

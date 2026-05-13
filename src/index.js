const puppeteer = require("puppeteer");
const path = require("path");
const login = require("./login");
const searchProfiles = require("./searchProfiles");
const scrapeContactInfo = require("./scrapeContactInfo");
const saveData = require("./saveData");

async function start() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        slowMo: 50,
        args: [
            "--start-maximized",
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
        ],
        userDataDir: path.join(__dirname, "..", "chrome-profile"),
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const enriched = []; // keep outside try so we can save on crash

    try {
        console.log("Step 1: Logging in");
        await login(page);
        console.log("Step 1 DONE \n");

        console.log("Step 2: Searching profiles");
        const profiles = await searchProfiles(page);
        console.log(`Step 2 DONE  — found ${profiles.length} profiles\n`);

        if (profiles.length === 0) {
            console.log("  No profiles found.");
            await browser.close();
            return;
        }

        console.log("Step 3: Scraping contact info...");
        for (let i = 0; i < profiles.length; i++) {
            const p = profiles[i];
            console.log(`  [${i + 1}/${profiles.length}] ${p.name}`);
            const contact = await scrapeContactInfo(page, p.profile);
            enriched.push({ ...p, ...contact });
            console.log(`   email: "${contact.email || "—"}" | phone: "${contact.phone || "—"}"`);
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
        }
        console.log("Step 3 DONE \n");

    } catch (err) {
        console.error(" Crashed at:", err.message);
        await page.screenshot({ path: "debug-error.png", fullPage: true });

    } finally {
        // Always save whatever we collected — even partial data
        if (enriched.length > 0) {
            console.log(`\nStep 4: Saving ${enriched.length} records...`);
            await saveData(enriched);
        } else {
            console.log("  No data to save.");
        }
        await browser.close();
    }
}

start();
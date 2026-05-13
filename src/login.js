// login.js
require("dotenv").config();

async function login(page) {
    console.log("Checking login statu...");

    try {
        await page.goto("https://www.linkedin.com/feed/", {
            waitUntil: "load",
            timeout: 60000  
        });
    } catch {
        // Even if it times out, check what URL we're on
        console.log("goto timed out checking URL anyway");
    }

    await new Promise(r => setTimeout(r, 3000));

    const url = page.url();
    console.log("Current URL:", url);

    // Already logged in
    if (url.includes("/feed") || url.includes("/in/") || url.includes("/mynetwork")) {
        console.log(" Already logged in — skipping login");
        return;
    }

    // Need to log in
    console.log("Not logged in logging in");

    try {
        await page.goto("https://www.linkedin.com/login", {
            waitUntil: "load",
            timeout: 60000
        });
    } catch {
        console.log("Login page goto timed out continuing anyway");
    }

    await new Promise(r => setTimeout(r, 3000));

    // Cookie consent
    try {
        const cookieBtn = await page.waitForSelector(
            'button[action-type="ACCEPT"]', { timeout: 3000 }
        );
        if (cookieBtn) await cookieBtn.click();
        await new Promise(r => setTimeout(r, 1000));
    } catch { /* no banner */ }

    await page.waitForSelector('input[name="session_key"]', { timeout: 15000 });
    await page.type('input[name="session_key"]', process.env.LINKEDIN_EMAIL, { delay: 100 });
    await new Promise(r => setTimeout(r, 500));
    await page.type('input[name="session_password"]', process.env.LINKEDIN_PASSWORD, { delay: 100 });
    await new Promise(r => setTimeout(r, 500));

    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 8000));

    const postUrl = page.url();
    console.log("Postlogin URL:", postUrl);

    if (postUrl.includes("/checkpoint") || postUrl.includes("/challenge")) {
        console.log("  CAPTCHA detected. Solve it manually, then press Enter...");
        await new Promise(r => process.stdin.once("data", r));
    }

    console.log(" Login successful");
}

module.exports = login;
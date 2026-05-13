async function scrapeContactInfo(page, profileUrl) {
    try {
        await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 0 });
        await new Promise(r => setTimeout(r, 4000));

        // Click contact info link
        const contactLink = await page.$('a[href*="overlay/contact-info"]');
        if (!contactLink) {
            return { email: "", phone: "" };
        }

        await contactLink.click();
        await new Promise(r => setTimeout(r, 3000));

        const contact = await page.evaluate(() => {
            let email = "";
            let phone = "";

            // Get all sections in the modal
            const sections = document.querySelectorAll(
                ".pv-contact-info__contact-type, [class*='contact-info'] section, [class*='ci-']"
            );

            sections.forEach(section => {
                const text = section.innerText || "";

                // Email detection
                if (text.toLowerCase().includes("email") || section.querySelector("a[href^='mailto']")) {
                    const mailLink = section.querySelector("a[href^='mailto']");
                    if (mailLink) {
                        email = mailLink.href.replace("mailto:", "").trim();
                    } else {
                        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
                        if (emailMatch) email = emailMatch[0];
                    }
                }

                // Phone detection
                if (text.toLowerCase().includes("phone") || /[\+\d][\d\s\-\(\)]{6,}/.test(text)) {
                    const phoneMatch = text.match(/[\+\d][\d\s\-\(\)]{6,}/);
                    if (phoneMatch) phone = phoneMatch[0].trim();
                }
            });

            // Fallback: scan all text for email/phone patterns
            if (!email) {
                const allText = document.querySelector(
                    ".pv-contact-info__contact-type, [class*='contact-info']"
                )?.innerText || "";
                const emailMatch = allText.match(/[\w.-]+@[\w.-]+\.\w+/);
                if (emailMatch) email = emailMatch[0];
            }

            return { email, phone };
        });

        console.log(`   ${contact.email || "no email"} | ${contact.phone || "no phone"}`);

        // Close modal
        try {
            const closeBtn = await page.$(
                'button[aria-label="Dismiss"], button[aria-label="Close"]'
            );
            if (closeBtn) await closeBtn.click();
        } catch { }

        return contact;

    } catch (err) {
        console.log(`   Error: ${err.message}`);
        return { email: "", phone: "" };
    }
}

module.exports = scrapeContactInfo;
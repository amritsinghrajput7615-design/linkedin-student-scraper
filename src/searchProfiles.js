async function searchProfiles(page) {
    const allProfiles = [];
    const TARGET = 10; // exactly 20 profiles

    const searchUrl = "https://www.linkedin.com/search/results/people/?keywords=2025%20student%20India&origin=GLOBAL_SEARCH_HEADER";

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 0 });
    await new Promise(r => setTimeout(r, 6000));

    console.log("Search URL:", page.url());

    for (let pageNum = 1; pageNum <= 10; pageNum++) {
        if (allProfiles.length >= TARGET) break;

        console.log(`\nScraping page ${pageNum}... (${allProfiles.length}/${TARGET} so far)`);

        // Scroll to load lazy content
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => window.scrollBy(0, 300));
            await new Promise(r => setTimeout(r, 400));
        }
        await new Promise(r => setTimeout(r, 3000));

        const profiles = await page.evaluate(() => {
            const results = [];
            const seen = new Set();

            const links = [...document.querySelectorAll("a[href*='/in/']")];

            links.forEach(link => {
                const href = link.href?.split("?")[0];
                if (!href || seen.has(href)) return;
                if (!href.match(/linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/)) return;

                const rawText = link.innerText?.trim() || "";
                if (!rawText || !rawText.includes("View")) return;

                const name = rawText.split("\n")[0].trim();
                if (!name || name.length < 2 || name.length > 80) return;

                seen.add(href);

                const card =
                    link.closest("li") ||
                    link.closest("[data-view-name]") ||
                    link.parentElement?.parentElement?.parentElement;

                const cardLines = (card?.innerText || "")
                    .split("\n")
                    .map(l => l.trim())
                    .filter(l =>
                        l.length > 2 &&
                        l !== name &&
                        !l.startsWith("View ") &&
                        !l.includes("Connect") &&
                        !l.includes("Follow") &&
                        !l.includes("Message") &&
                        !l.includes("• 1st") &&
                        !l.includes("• 2nd") &&
                        !l.includes("• 3rd") &&
                        !l.includes("Promoted") &&
                        !l.includes("mutual connection")
                    );

                results.push({
                    name,
                    profile: href,
                    title:    cardLines[0] || "",
                    location: cardLines[1] || ""
                });
            });

            return results;
        });

        console.log(`  Found ${profiles.length} profiles on page ${pageNum}`);
        profiles.forEach(p => console.log(`    → ${p.name} | ${p.title}`));

        allProfiles.push(...profiles);

        // Stop if we have enough
        if (allProfiles.length >= TARGET) {
            console.log(`\n Reached target of ${TARGET} profiles`);
            break;
        }

        // Go to next page
        try {
            const nextBtn = await page.$('button[aria-label="Next"]');
            if (!nextBtn) {
                console.log("  No next page button found");
                break;
            }
            await nextBtn.click();
            console.log("  → Going to next page...");
            await new Promise(r => setTimeout(r, 5000));
        } catch {
            break;
        }
    }

    // Deduplicate and slice to exactly 20
    const unique = allProfiles
        .filter((p, i, self) => i === self.findIndex(x => x.profile === p.profile))
        .slice(0, TARGET);

    console.log(`\n Total profiles collected: ${unique.length}`);
    return unique;
}

module.exports = searchProfiles;
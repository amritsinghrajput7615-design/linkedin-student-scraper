const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");

async function saveData(data) {
    // Create output folder if it doesn't exist
    const outputDir = path.join(__dirname, "..", "output");
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(" Created output/ folder at:", outputDir);
    }

    // Save JSON
    const jsonPath = path.join(outputDir, "students.json");
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
    console.log(` JSON saved → ${jsonPath}`);

    // Save CSV
    const csvPath = path.join(outputDir, "students.csv");
    const csvWriter = createCsvWriter({
        path: csvPath,
        header: [
            { id: "name",     title: "NAME"        },
            { id: "title",    title: "TITLE"       },
            { id: "location", title: "LOCATION"    },
            { id: "profile",  title: "PROFILE URL" },
            { id: "email",    title: "EMAIL"       },
            { id: "phone",    title: "PHONE"       },
        ]
    });

    await csvWriter.writeRecords(data);
    console.log(` CSV saved → ${csvPath}`);
    console.log(`\n Total records: ${data.length}`);
    console.table(data.map(d => ({
        Name:    d.name,
        Title:   d.title    || "—",
        Email:   d.email    || "—",
        Phone:   d.phone    || "—",
    })));
}

module.exports = saveData;
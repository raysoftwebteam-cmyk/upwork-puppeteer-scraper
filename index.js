import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/upwork-jobs", async (req, res) => {
  const query = req.query.q || "google app script";
  const url = `https://www.upwork.com/nx/search/jobs/?nbs=1&q=${encodeURIComponent(query)}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(), // ✅ Use Puppeteer’s own Chrome
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector("section.air3-card");

    const jobs = await page.evaluate(() => {
      const data = [];
      document.querySelectorAll("section.air3-card").forEach(card => {
        const title = card.querySelector("a")?.innerText || "";
        const link = card.querySelector("a")?.href || "";
        const desc = card.querySelector("[data-test='job-description-text']")?.innerText || "";
        data.push({ title, link, desc });
      });
      return data;
    });

    await browser.close();
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Scraper running on port ${PORT}`));

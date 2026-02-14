// Demo recording script for TUB Viewer
// Records a video of the main features: browse, search, export

const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: "./demo-videos/",
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // ── Scene 1: Home Page (English) ──
  await page.goto("http://localhost:3456");
  await page.waitForTimeout(1500);

  // Switch to English
  await page.selectOption("select", "en");
  await page.waitForTimeout(1500);

  // ── Scene 2: Browse Azure Products ──
  // Click Azure family
  await page.click('button:has-text("Azure (6)")');
  await page.waitForTimeout(1000);

  // Click Azure (全般)
  const azureBtn = page.locator('button:has-text("Azure (全般)")');
  await azureBtn.click();
  await page.waitForTimeout(2500);

  // Scroll down to see updates
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(2000);

  // Scroll back up
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // ── Scene 3: Search ──
  const searchInput = page.getByRole("textbox");
  await searchInput.click();
  await page.waitForTimeout(800);

  // Type search query slowly
  await searchInput.fill("");
  for (const char of "Azure breaking changes") {
    await searchInput.type(char, { delay: 80 });
  }
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2500);

  // ── Scene 4: Export Menu ──
  const exportBtn = page.getByRole("button", { name: "Export" });
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(2000);
    // Close menu
    await page.click("body", { position: { x: 400, y: 400 } });
    await page.waitForTimeout(500);
  }

  // ── Scene 5: D365 Browse ──
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Clear search
  const clearBtn = page.locator('button:has-text("Clear")');
  if (await clearBtn.isVisible()) {
    await clearBtn.click();
    await page.waitForTimeout(800);
  }

  // Click Dynamics 365
  await page.click('button:has-text("Dynamics 365 (4)")');
  await page.waitForTimeout(800);

  // Click D365 FO
  const d365Btn = page.locator('button:has-text("Dynamics 365 FO")');
  if (await d365Btn.isVisible()) {
    await d365Btn.click();
    await page.waitForTimeout(2500);
  }

  // Scroll to see content
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(2000);

  // ── Scene 6: Language Switch ──
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Switch to Korean
  await page.selectOption("select", "ko");
  await page.waitForTimeout(1500);

  // Switch to Chinese
  await page.selectOption("select", "zh");
  await page.waitForTimeout(1500);

  // Switch back to English
  await page.selectOption("select", "en");
  await page.waitForTimeout(1500);

  // ── End ──
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  console.log("Demo video recorded successfully in ./demo-videos/");
})();

import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../content/assets');
const FINAL_IMAGE = path.join(OUTPUT_DIR, 'leetcode-profile.png');
const USER_URL = 'https://leetcode.cn/u/friendly-almeidaelk/';

async function captureLeetCode() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 2000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  console.log(`Navigating to ${USER_URL}...`);
  try {
    await page.goto(USER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.warn('Navigation timeout or error, trying to proceed anyway...');
  }

  // 等待页面基础结构加载
  await page.waitForTimeout(10000);

  console.log('Capturing sections...');

  let statsBuffer, heatmapBuffer;

  // 1. 获取做题统计 (Stats)
  try {
    const statsBox = page.locator('div.bg-layer-1:has-text("已解答")').first();
    if (await statsBox.isVisible()) {
      console.log('Capturing Stats...');
      statsBuffer = await statsBox.screenshot();
    }
  } catch (e) { console.warn('Stats capture failed'); }

  // 2. 获取热力图 (Heatmap)
  try {
    const heatmapBox = page.locator('div.bg-layer-1:has-text("过去一年共提交")').first();
    if (await heatmapBox.isVisible()) {
      console.log('Capturing Heatmap...');
      heatmapBuffer = await heatmapBox.screenshot();
    }
  } catch (e) { console.warn('Heatmap capture failed'); }

  await browser.close();

  if (!statsBuffer && !heatmapBuffer) {
    console.error('Core sections failed to capture.');
    return;
  }

  console.log('Stitching images...');

  const finalImages = [];
  if (statsBuffer) finalImages.push(statsBuffer);
  if (heatmapBuffer) finalImages.push(heatmapBuffer);

  const finalMetas = await Promise.all(finalImages.map(buf => sharp(buf).metadata()));
  const spacing = 40;
  const maxWidth = Math.max(...finalMetas.map(m => m.width));

  let currentY = 0;
  const finalComposite = finalImages.map((buf, i) => {
    const top = currentY;
    currentY += finalMetas[i].height + spacing;
    return { input: buf, top, left: Math.floor((maxWidth - finalMetas[i].width) / 2) };
  });

  await sharp({
    create: {
      width: maxWidth,
      height: totalHeight(finalMetas, spacing),
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(finalComposite)
  .png()
  .toFile(FINAL_IMAGE);

  console.log(`Saved image to ${FINAL_IMAGE}`);
}

function totalHeight(metas, spacing) {
  return metas.reduce((sum, m) => sum + m.height + spacing, 0);
}

captureLeetCode().catch(console.error);

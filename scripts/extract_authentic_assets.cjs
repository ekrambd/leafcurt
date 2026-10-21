const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = path.join(process.cwd(), 'public', 'authentic');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const img3Path = '/Users/roxy/.gemini/antigravity/brain/72471198-b420-4e7b-8853-073c088ac7c8/.user_uploaded/media_1792523060934_75c2dca6.png';
const img4Path = '/Users/roxy/.gemini/antigravity/brain/72471198-b420-4e7b-8853-073c088ac7c8/.user_uploaded/media_1792523060944_9bd52684.png';

async function extract() {
  try {
    // 1. Extract Main Cover Image 1 (Pod with formula specs) from img3
    // Image 3 is 1024 x 581
    await sharp(img3Path)
      .extract({ left: 45, top: 172, width: 418, height: 388 })
      .toFile(path.join(targetDir, 'pod_triple_chamber_main.png'));

    // 2. Extract Main Cover Image 2 (Bloom Well packaging & tub) from img4
    // Image 4 is 1024 x 623
    await sharp(img4Path)
      .extract({ left: 24, top: 172, width: 433, height: 334 })
      .toFile(path.join(targetDir, 'pod_packaging_boxes.png'));

    // 3. Extract thumbnails from bottom strip of img3 (y roughly 500 to 570)
    // There are 5 thumbnails across width ~45 to 455
    const thumbWidth = 80;
    const thumbHeight = 78;
    const thumbY = 490;
    
    await sharp(img3Path)
      .extract({ left: 55, top: thumbY, width: thumbWidth, height: thumbHeight })
      .toFile(path.join(targetDir, 'thumb_1_overview.png'));

    await sharp(img3Path)
      .extract({ left: 137, top: thumbY, width: thumbWidth, height: thumbHeight })
      .toFile(path.join(targetDir, 'thumb_2_style1_red.png'));

    await sharp(img3Path)
      .extract({ left: 220, top: thumbY, width: thumbWidth, height: thumbHeight })
      .toFile(path.join(targetDir, 'thumb_3_style2_heart.png'));

    await sharp(img3Path)
      .extract({ left: 302, top: thumbY, width: thumbWidth, height: thumbHeight })
      .toFile(path.join(targetDir, 'thumb_4_style3_beads.png'));

    await sharp(img3Path)
      .extract({ left: 385, top: thumbY, width: thumbWidth, height: thumbHeight })
      .toFile(path.join(targetDir, 'thumb_5_style4_green.png'));

    // 4. Extract logo
    await sharp(img3Path)
      .extract({ left: 50, top: 88, width: 145, height: 55 })
      .toFile(path.join(targetDir, 'authentic_logo.png'));

    console.log('Successfully extracted authentic assets to public/authentic/');
  } catch (err) {
    console.error('Error extracting images:', err);
  }
}

extract();

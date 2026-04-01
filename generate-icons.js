const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = 'assets/icons/growday-logo.svg';

const androidIconDir = 'android/app/src/main/res';
const iosIconDir = 'ios/growday/Images.xcassets/AppIcon.appiconset';

const androidConfigs = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const iosConfigs = [
  { name: 'AppIcon-20x20@2x.png', size: 40 },
  { name: 'AppIcon-20x20@3x.png', size: 60 },
  { name: 'AppIcon-29x29@2x.png', size: 58 },
  { name: 'AppIcon-29x29@3x.png', size: 87 },
  { name: 'AppIcon-40x40@2x.png', size: 80 },
  { name: 'AppIcon-40x40@3x.png', size: 120 },
  { name: 'AppIcon-60x60@2x.png', size: 120 },
  { name: 'AppIcon-60x60@3x.png', size: 180 },
  { name: 'AppIcon-76x76@2x.png', size: 152 },
  { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
  { name: 'AppIcon-1024x1024@1x.png', size: 1024 },
];

async function generateIcons() {
  console.log('Starting icon generation...');

  // Generate Android icons
  for (const config of androidConfigs) {
    const outputDir = path.join(androidIconDir, config.dir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    await sharp(inputFile)
      .resize(config.size, config.size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher.png'));
    
    // Also generate rounded icons if needed (copy file for now)
    await sharp(inputFile)
      .resize(config.size, config.size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher_round.png'));
    
    console.log(`Generated Android icons for ${config.dir} (${config.size}x${config.size})`);
  }

  // Generate iOS icons
  if (!fs.existsSync(iosIconDir)) {
    fs.mkdirSync(iosIconDir, { recursive: true });
  }
  for (const config of iosConfigs) {
    await sharp(inputFile)
      .resize(config.size, config.size)
      .png()
      .toFile(path.join(iosIconDir, config.name));
    console.log(`Generated iOS icon ${config.name} (${config.size}x${config.size})`);
  }

  console.log('Icon generation complete!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

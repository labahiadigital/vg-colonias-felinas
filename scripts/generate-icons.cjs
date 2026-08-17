const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'static', 'favicon.svg');
const staticDir = path.join(__dirname, '..', 'static');

async function generate() {
	const svg = fs.readFileSync(svgPath);

	await sharp(svg, { density: 300 })
		.resize(192, 192)
		.png()
		.toFile(path.join(staticDir, 'icon-192.png'));
	console.log('Generated icon-192.png');

	await sharp(svg, { density: 300 })
		.resize(512, 512)
		.png()
		.toFile(path.join(staticDir, 'icon-512.png'));
	console.log('Generated icon-512.png');

	await sharp(svg, { density: 300 })
		.resize(180, 180)
		.png()
		.toFile(path.join(staticDir, 'apple-touch-icon.png'));
	console.log('Generated apple-touch-icon.png');
}

generate().catch(console.error);

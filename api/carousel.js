const fs = require('fs');
const path = require('path');

const ALLOWED_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const CAROUSEL_DIR = path.join(process.cwd(), 'assets', 'carousel');

module.exports = (req, res) => {
  let files = [];
  try {
    files = fs.readdirSync(CAROUSEL_DIR);
  } catch (err) {
    files = [];
  }

  const images = files
    .filter(name => !name.startsWith('.') && ALLOWED_EXT.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.status(200).json({ images });
};

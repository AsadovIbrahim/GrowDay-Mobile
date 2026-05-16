const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('assets/images/main logo.png')
  .pipe(new PNG({
      filterType: 4
  }))
  .on('parsed', function() {
      // sample some pixels
      for (let y = 10; y < 20; y++) {
          const idx = (this.width * y + 10) << 2;
          const r = this.data[idx].toString(16).padStart(2, '0');
          const g = this.data[idx+1].toString(16).padStart(2, '0');
          const b = this.data[idx+2].toString(16).padStart(2, '0');
          console.log(`x=10, y=${y}: #${r}${g}${b}`);
      }
  });

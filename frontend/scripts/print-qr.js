const QRCode = require('qrcode');

const url = process.argv[2] || process.env.URL || 'http://localhost:3000';

QRCode.toString(url, { type: 'terminal', small: true }, (err, out) => {
  if (err) {
    console.error('Error generating QR:', err.message);
    process.exit(1);
  }
  console.log(`\nScan this QR in your phone to open:\n${url}\n`);
  console.log(out);
});

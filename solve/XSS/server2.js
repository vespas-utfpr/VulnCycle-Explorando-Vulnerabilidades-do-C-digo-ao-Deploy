const express = require('express');
const app = express();

// não precisa de express.json() para query params
app.get('/debug-cookie', (req, res) => {
  console.log('=== INFORMAÇÕES CAPTURADAS ===');
  if (req.query.device) {
    const deviceInfo = JSON.parse(decodeURIComponent(req.query.device));
    console.log('Device Info:', deviceInfo);
  }
  if (req.query.ua) {
    console.log('User-Agent:', req.query.ua);
    console.log('Platform:', req.query.platform);
    console.log('Screen:', req.query.screen);
  }
  console.log('==============================');
  res.json({ status: 'captured' });
});

app.listen(4444, () => console.log('server em http://localhost:4444'));

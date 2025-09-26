const express = require('express');
const app = express();

// não precisa de express.json() para query params
app.get('/debug-cookie', (req, res) => {
// req.query.cookie contém a string codificada na URL
const cookieEncoded = req.query.cookie;
// Decodifica (se foi encodeURIComponent no cliente)
const cookie = cookieEncoded ? decodeURIComponent(cookieEncoded) : '';
console.log('cookie recebido (via query):', cookie);
res.json({ status: 'ok', method: 'query', receivedLength: cookie.length });
});

app.listen(4444, () => console.log('server em http://localhost:4444'));

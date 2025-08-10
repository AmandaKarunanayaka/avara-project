// index.js
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3002;

app.get('/', (req, res) => {
  res.send(`Service running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Service started on port ${PORT}`);
});

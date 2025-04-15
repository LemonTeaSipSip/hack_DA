const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'NewSecurePassword123!',
  database: 'clickjacking_demo'
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

app.listen(3000, () => console.log('Legitimate site: http://localhost:3000'));
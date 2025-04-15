const express = require('express');
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure 'sessions' directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir);
}

// Database setup (for user auth only)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sql212002',
  database: 'csrf_demo'
});

// Generate session ID and create session file
function createSessionFile(username) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const sessionFile = path.join(sessionsDir, `${sessionId}.txt`);

  fs.writeFileSync(sessionFile, JSON.stringify({
    username,
    createdAt: new Date().toISOString()
  }));

  console.log(`📁 Created session file: ${sessionFile}`);
  return sessionId;
}

// Delete session file on logout
function deleteSessionFile(sessionId) {
  const sessionFile = path.join(sessionsDir, `${sessionId}.txt`);
  if (fs.existsSync(sessionFile)) {
    fs.unlinkSync(sessionFile);
    console.log(` Deleted session file: ${sessionFile}`);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) throw err;
      
      if (results.length > 0) {
        const sessionId = createSessionFile(username);
        res.cookie('sessionId', sessionId);
        res.redirect('/dashboard');
      } else {
        res.send('Invalid credentials');
      }
    }
  );
});

app.get('/dashboard', (req, res) => {
  const sessionId = req.cookies.sessionId;
  const sessionFile = path.join(sessionsDir, `${sessionId}.txt`);

  if (!sessionId || !fs.existsSync(sessionFile)) {
    return res.redirect('/');
  }
  
  res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

app.get('/reset-password', (req, res) => {
  const sessionId = req.cookies.sessionId;
  const sessionFile = path.join(sessionsDir, `${sessionId}.txt`);

  if (!sessionId || !fs.existsSync(sessionFile)) {
    return res.redirect('/');
  }
  
  res.sendFile(path.join(__dirname, 'views/reset-password.html'));
});

app.post('/reset-password', (req, res) => {
  const sessionId = req.cookies.sessionId;
  const sessionFile = path.join(sessionsDir, `${sessionId}.txt`);

  if (!sessionId || !fs.existsSync(sessionFile)) {
    return res.status(403).send('Invalid session');
  }

  const { password, confirmPassword } = req.body;
  const sessionData = JSON.parse(fs.readFileSync(sessionFile));
  const username = sessionData.username;

  // Validate passwords match
  if (password !== confirmPassword) {
    return res.send('Passwords do not match');
  }

  db.query(
    'UPDATE users SET password = ? WHERE username = ?',
    [password, username],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Error updating password');
      }
      
      console.log(`Password updated for ${username}. Rows affected:`, results.affectedRows);
      
      // Verify the update
      db.query(
        'SELECT password FROM users WHERE username = ?',
        [username],
        (err, checkResults) => {
          if (err) {
            console.error('Verification error:', err);
          } else {
            console.log('Current password in DB:', checkResults[0].password);
          }

          // Force logout
          deleteSessionFile(sessionId);
          res.clearCookie('sessionId');
          res.redirect('/?message=PasswordUpdatedPleaseLoginAgain');
        }
      );
    }
  );
});

app.get('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    deleteSessionFile(sessionId);
  }
  res.clearCookie('sessionId');
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Legitimate app running on http://localhost:3000');
  console.log(`Session files stored in: ${sessionsDir}\n`);
});
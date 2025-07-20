const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Path to store feedback
const feedbackFile = path.join(__dirname, 'feedback.json');

// --- API ROUTES ---
// Save feedback
app.post('/feedback', (req, res) => {
  const feedback = req.body.text?.trim();
  if (!feedback) {
    return res.status(400).send({ message: 'Feedback is required.' });
  }

  let data = [];
  if (fs.existsSync(feedbackFile)) {
    try {
      data = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
    } catch (e) {
      data = [];
    }
  }
  data.push({ text: feedback, date: new Date().toISOString() });

  fs.writeFileSync(feedbackFile, JSON.stringify(data, null, 2));
  res.send({ message: 'Thank you! Feedback saved.' });
});

// Get all feedback (formatted HTML page)
app.get('/feedback', (req, res) => {
  if (!fs.existsSync(feedbackFile)) {
    return res.send("<h2>No feedback submitted yet.</h2>");
  }

  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
  } catch (e) {
    return res.send("<h2>Could not load feedback.</h2>");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Feedback Submissions</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; background: #f5f5f5; }
        h1 { color: #0077ff; margin-bottom: 20px; }
        .feedback-item {
          background: #fff;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .date { color: #555; font-size: 0.85em; margin-top: 4px; }
      </style>
    </head>
    <body>
      <h1>Feedback Submissions</h1>
      ${data.map(item => `
        <div class="feedback-item">
          <div>${item.text}</div>
          <div class="date">${new Date(item.date).toLocaleString()}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  res.send(html);
});

// --- Serve your map (must come last) ---
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


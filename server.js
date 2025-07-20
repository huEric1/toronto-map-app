const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Path to feedback file
const feedbackFile = path.join(__dirname, 'feedback.json');

// --- API: Save new feedback ---
app.post('/feedback', (req, res) => {
  const feedback = req.body.text?.trim();
  if (!feedback) {
    return res.status(400).send({ message: 'Feedback is required.' });
  }

  let data = [];
  if (fs.existsSync(feedbackFile)) {
    try {
      data = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
    } catch {
      data = [];
    }
  }

  data.push({ text: feedback, date: new Date().toISOString() });
  fs.writeFileSync(feedbackFile, JSON.stringify(data, null, 2));

  res.send({ message: 'Thank you! Feedback saved.' });
});

// --- API: Clear all feedback (admin button) ---
app.delete('/feedback', (req, res) => {
  fs.writeFileSync(feedbackFile, JSON.stringify([], null, 2));
  res.send({ message: 'All feedback cleared.' });
});

// --- Serve feedback page (table view) ---
app.get('/feedback', (req, res) => {
  if (!fs.existsSync(feedbackFile)) {
    fs.writeFileSync(feedbackFile, JSON.stringify([], null, 2));
  }

  const data = JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));

  const rows = data.map(
    (entry, index) =>
      `<tr>
        <td>${index + 1}</td>
        <td>${entry.text}</td>
        <td>${new Date(entry.date).toLocaleString()}</td>
      </tr>`
  ).join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Feedback Submissions</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { margin-bottom: 10px; }
        button { margin-top: 15px; padding: 10px; background: #d9534f; color: #fff; border: none; cursor: pointer; border-radius: 4px; }
        button:hover { background: #c9302c; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
      </style>
    </head>
    <body>
      <h1>Feedback Submissions</h1>
      <button onclick="clearFeedback()">Clear All Submissions</button>
      <table>
        <thead>
          <tr><th>#</th><th>Feedback</th><th>Date</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="3">No feedback yet.</td></tr>'}</tbody>
      </table>

      <script>
        async function clearFeedback() {
          if (!confirm('Are you sure you want to clear all feedback?')) return;
          const res = await fetch('/feedback', { method: 'DELETE' });
          const result = await res.json();
          alert(result.message || 'Feedback cleared.');
          window.location.reload();
        }
      </script>
    </body>
    </html>
  `);
});

// --- Serve your static map files ---
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

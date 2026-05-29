const { execSync } = require('child_process');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');

const appRoot = path.resolve(__dirname, '../..');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

router.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const expected = 'sha256=' + crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expected) {
      return res.status(401).send('Unauthorized');
    }

    execSync(`cd ${appRoot} && git pull origin development`);
    execSync(`touch ${appRoot}/backend/tmp/restart.txt`);
    console.log('Deployed successfully!');
    res.send('Deployed!');
  } catch (err) {
    console.error('Deploy error:', err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;
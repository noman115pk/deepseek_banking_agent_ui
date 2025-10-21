const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const FILE = path.join(__dirname, '..', 'config', 'prompts.json');
let cachedPrompts = [];

function loadPromptsOnce() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const prompts = JSON.parse(raw);
    if (Array.isArray(prompts)) {
      cachedPrompts = prompts;
      console.log(`Loaded ${prompts.length} prompts from ${FILE}`);
    } else {
      console.warn('Prompts config is not an array; using empty list');
      cachedPrompts = [];
    }
  } catch (err) {
    console.error('Failed to load prompts config:', err);
    cachedPrompts = [];
  }
}

// Initial load
loadPromptsOnce();

// Watch for changes and reload
fs.watchFile(FILE, { interval: 1000 }, (curr, prev) => {
  if (curr.mtimeMs !== prev.mtimeMs) {
    console.log('Detected change in prompts config, reloading...');
    loadPromptsOnce();
  }
});

router.get('/', (req, res) => {
  res.json(cachedPrompts);
});

module.exports = router;

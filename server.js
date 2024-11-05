import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the frontend
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static('dist'));

const DATA_FILE = path.join(process.cwd(), 'data', 'configurations.json');

// Ensure data directory and file exist
async function ensureDataDir() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Check if configurations file exists
    try {
      await fs.access(DATA_FILE);
    } catch {
      // Create empty configurations file if it doesn't exist
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }
    
    // Verify file is valid JSON
    const content = await fs.readFile(DATA_FILE, 'utf8');
    try {
      JSON.parse(content);
    } catch {
      // Reset file if JSON is invalid
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing data directory:', error);
    process.exit(1); // Exit if we can't set up data storage
  }
}

// Initialize data directory before starting server
(async () => {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();

// Get all configurations
app.get('/api/configurations', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading configurations:', error);
    res.status(500).json({ 
      error: 'Failed to read configurations',
      details: error.message 
    });
  }
});

// Save a new configuration
app.post('/api/configurations', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const configurations = JSON.parse(data);
    const newConfig = {
      ...req.body,
      timestamp: Date.now()
    };
    
    // Check if configuration with same name exists
    const existingIndex = configurations.findIndex(c => c.name === newConfig.name);
    if (existingIndex !== -1) {
      configurations[existingIndex] = newConfig;
    } else {
      configurations.push(newConfig);
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(configurations, null, 2));
    res.json(newConfig);
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ 
      error: 'Failed to save configuration',
      details: error.message 
    });
  }
});

// Delete a configuration
app.delete('/api/configurations/:name', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const configurations = JSON.parse(data);
    const filteredConfigs = configurations.filter(c => c.name !== req.params.name);
    await fs.writeFile(DATA_FILE, JSON.stringify(filteredConfigs, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({ 
      error: 'Failed to delete configuration',
      details: error.message 
    });
  }
});
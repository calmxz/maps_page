const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    // Database connection failed
  } else {
    // Database connected successfully
  }
});

// API Routes

// Get all projects with firm location data
app.get('/api/projects-with-location', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.project_no,
        p.year,
        p.firm_id,
        p.title,
        p.spin,
        p.status,
        p.intervention,
        p.fund_source,
        p.assistance_amount,
        f.firm_name,
        f.municipality,
        f.province,
        f.latitude,
        f.longitude,
        f.sector
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL
      ORDER BY p.project_no DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get projects by province
app.get('/api/projects-by-province', async (req, res) => {
  try {
    const { province } = req.query;
    
    if (!province) {
      return res.status(400).json({ error: 'Province parameter is required' });
    }
    
    const query = `
      SELECT 
        p.project_no,
        p.year,
        p.firm_id,
        p.title,
        p.spin,
        p.status,
        p.intervention,
        p.fund_source,
        p.assistance_amount,
        f.firm_name,
        f.municipality,
        f.province,
        f.latitude,
        f.longitude,
        f.sector
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE f.province ILIKE $1 
        AND f.latitude IS NOT NULL 
        AND f.longitude IS NOT NULL
      ORDER BY p.project_no DESC
    `;
    
    const result = await pool.query(query, [`%${province}%`]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get projects by status
app.get('/api/projects-by-status', async (req, res) => {
  try {
    const { status } = req.query;
    
    if (!status) {
      return res.status(400).json({ error: 'Status parameter is required' });
    }
    
    const query = `
      SELECT 
        p.project_no,
        p.year,
        p.firm_id,
        p.title,
        p.spin,
        p.status,
        p.intervention,
        p.fund_source,
        p.assistance_amount,
        f.firm_name,
        f.municipality,
        f.province,
        f.latitude,
        f.longitude,
        f.sector
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE p.status = $1 
        AND f.latitude IS NOT NULL 
        AND f.longitude IS NOT NULL
      ORDER BY p.project_no DESC
    `;
    
    const result = await pool.query(query, [status]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search projects by title
app.get('/api/search-projects', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query parameter is required' });
    }
    
    const query = `
      SELECT 
        p.project_no,
        p.year,
        p.firm_id,
        p.title,
        p.spin,
        p.status,
        p.intervention,
        p.fund_source,
        p.assistance_amount,
        f.firm_name,
        f.municipality,
        f.province,
        f.latitude,
        f.longitude,
        f.sector
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE (p.title ILIKE $1 OR f.firm_name ILIKE $1 OR p.intervention ILIKE $1)
        AND f.latitude IS NOT NULL 
        AND f.longitude IS NOT NULL
      ORDER BY p.project_no DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [`%${q}%`]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unique provinces
app.get('/api/provinces', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT province 
      FROM firms 
      WHERE province IS NOT NULL 
        AND province != '' 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
      ORDER BY province
    `;
    
    const result = await pool.query(query);
    const provinces = result.rows.map(row => row.province);
    res.json(provinces);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project statistics
app.get('/api/project-stats', async (req, res) => {
  try {
    // Get total count
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL
    `;
    
    // Get count by status
    const statusQuery = `
      SELECT p.status, COUNT(*) as count
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL
      GROUP BY p.status
      ORDER BY p.status
    `;
    
    // Get count by province
    const provinceQuery = `
      SELECT f.province, COUNT(*) as count
      FROM projects p
      INNER JOIN firms f ON p.firm_id = f.firm_id
      WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL
      GROUP BY f.province
      ORDER BY f.province
    `;
    
    const [totalResult, statusResult, provinceResult] = await Promise.all([
      pool.query(totalQuery),
      pool.query(statusQuery),
      pool.query(provinceQuery)
    ]);
    
    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });
    
    const byProvince = {};
    provinceResult.rows.forEach(row => {
      byProvince[row.province] = parseInt(row.count);
    });
    
    res.json({
      total: parseInt(totalResult.rows[0].total),
      byStatus,
      byProvince
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date(),
    message: 'API server is running',
  });
});

// Serve React production build
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  // Server started successfully
});

module.exports = app; 
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Authentication middleware for admin routes
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

// Authentication middleware for director routes
const directorAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== 'director') {
      return res.status(403).json({ error: "Forbidden - Director access required" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Auth endpoints
app.post('/api/auth/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin' }, jwtSecret, { expiresIn: '24h' });
    return res.json({ token, message: 'Admin login successful' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/director/login', async (req, res) => {
  const { username, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
  
  if (username === process.env.DIRECTOR_USERNAME && password === process.env.DIRECTOR_PASSWORD) {
    const token = jwt.sign({ username, role: 'director' }, jwtSecret, { expiresIn: '24h' });
    return res.json({ token, message: 'Director login successful' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Student endpoints (Admin only)
app.get('/api/admin/students', adminAuth, async (req, res) => {
  try {
    const students = await prisma.students.findMany({
      include: { invoices: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/students', adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, level, busUser } = req.body;
    
    const lastStudent = await prisma.students.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const lastNumber = lastStudent ? parseInt(lastStudent.admissionNumber.replace('ALB', '')) : 0;
    const admissionNumber = `ALB${String(lastNumber + 1).padStart(3, '0')}`;
    
    const student = await prisma.students.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        level,
        busUser: busUser || false,
        admissionNumber
      }
    });
    
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import endpoint
app.post('/api/admin/students/bulk/import', adminAuth, async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students array is required and must not be empty' });
    }
    
    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      admissionNumbers: []
    };
    
    for (let i = 0; i < students.length; i++) {
      const { firstName, lastName, email, phone, level, busUser } = students[i];
      
      // Validate required fields
      if (!firstName || !lastName) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          message: 'firstName and lastName are required'
        });
        continue;
      }
      
      try {
        // Generate admission number
        const lastStudent = await prisma.students.findFirst({
          orderBy: { id: 'desc' }
        });
        
        const lastNumber = lastStudent ? parseInt(lastStudent.admissionNumber.replace('ALB', '')) : 0;
        const admissionNumber = `ALB${String(lastNumber + 1).padStart(3, '0')}`;
        
        // Create student
        await prisma.students.create({
          data: {
            firstName,
            lastName,
            email: email || null,
            phone: phone || null,
            level: level || 'Primary',
            busUser: busUser || false,
            admissionNumber
          }
        });
        
        results.successful++;
        results.admissionNumbers.push(admissionNumber);
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          message: error.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Director endpoints (Read-only)
app.get('/api/director/summary', directorAuth, async (req, res) => {
  try {
    const students = await prisma.students.findMany();
    const primaryCount = students.filter(s => s.level === 'Primary').length;
    const secondaryCount = students.filter(s => s.level === 'Secondary').length;
    const boardersCount = students.filter(s => s.busUser === true).length;
    
    res.json({
      totalStudents: students.length,
      primaryStudents: primaryCount,
      secondaryStudents: secondaryCount,
      boarders: boardersCount,
      students
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export as Cloud Function
exports.api = functions.https.onRequest(app);

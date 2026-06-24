const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';

// Mock data storage
let mockStudents = [
  {
    id: 1,
    admissionNumber: 'ALB001',
    firstName: 'Ahmed',
    lastName: 'Al-Mansouri',
    email: 'ahmed@example.com',
    phone: '+971123456',
    level: 'Secondary',
    busUser: false,
    invoices: [
      { id: 1, term: 'Term 1', amount: 2500, status: 'Paid', dueDate: '2026-02-01' },
      { id: 2, term: 'Term 2', amount: 2500, status: 'Pending', dueDate: '2026-05-01' }
    ]
  },
  {
    id: 2,
    admissionNumber: 'ALB002',
    firstName: 'Fatima',
    lastName: 'Al-Noor',
    email: 'fatima@example.com',
    phone: '+971234567',
    level: 'Primary',
    busUser: true,
    invoices: [
      { id: 3, term: 'Term 1', amount: 2250, status: 'Paid', dueDate: '2026-02-01' },
      { id: 4, term: 'Term 2', amount: 2250, status: 'Paid', dueDate: '2026-05-01' }
    ]
  }
];

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

// Admin auth check
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Director auth check
const isDirector = (req, res, next) => {
  if (req.user.role !== 'director') {
    return res.status(403).json({ error: "Director access required" });
  }
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Albayyan School API is running' });
});

// Admin login
app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMe@123Secure';
  
  if (username === adminUser && password === adminPass) {
    const token = jwt.sign(
      { username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, role: 'admin', username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Director login
app.post('/api/auth/director/login', (req, res) => {
  const { username, password } = req.body;
  const directorUser = process.env.DIRECTOR_USERNAME || 'director';
  const directorPass = process.env.DIRECTOR_PASSWORD || 'ChangeMe@456Secure';
  
  if (username === directorUser && password === directorPass) {
    const token = jwt.sign(
      { username, role: 'director' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, role: 'director', username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Get all students (admin only)
app.get('/api/admin/students', authenticate, isAdmin, (req, res) => {
  res.json(mockStudents);
});

// Create new student (admin only)
app.post('/api/admin/students', authenticate, isAdmin, (req, res) => {
  const { firstName, lastName, email, phone, level, busUser } = req.body;
  
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }
  
  const lastNumber = mockStudents.length > 0 
    ? parseInt(mockStudents[mockStudents.length - 1].admissionNumber.replace('ALB', ''))
    : 0;
  
  const newStudent = {
    id: mockStudents.length + 1,
    admissionNumber: `ALB${String(lastNumber + 1).padStart(3, '0')}`,
    firstName,
    lastName,
    email: email || '',
    phone: phone || '',
    level: level || 'Primary',
    busUser: busUser || false,
    invoices: []
  };
  
  mockStudents.push(newStudent);
  res.status(201).json(newStudent);
});

// Bulk import students
app.post('/api/admin/students/bulk/import', authenticate, isAdmin, (req, res) => {
  const { students } = req.body;
  
  if (!Array.isArray(students)) {
    return res.status(400).json({ error: 'Students must be an array' });
  }
  
  const results = { successful: 0, failed: 0, errors: [], admissionNumbers: [] };
  
  students.forEach((student, index) => {
    if (!student.firstName || !student.lastName) {
      results.failed++;
      results.errors.push({ row: index + 1, error: 'Missing firstName or lastName' });
    } else {
      const lastNumber = mockStudents.length > 0 
        ? parseInt(mockStudents[mockStudents.length - 1].admissionNumber.replace('ALB', ''))
        : 0;
      
      const newStudent = {
        id: mockStudents.length + 1,
        admissionNumber: `ALB${String(lastNumber + 1).padStart(3, '0')}`,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || '',
        phone: student.phone || '',
        level: student.level || 'Primary',
        busUser: student.busUser || false,
        invoices: []
      };
      
      mockStudents.push(newStudent);
      results.successful++;
      results.admissionNumbers.push(newStudent.admissionNumber);
    }
  });
  
  res.json(results);
});

// Director summary
app.get('/api/director/summary', authenticate, isDirector, (req, res) => {
  const totalStudents = mockStudents.length;
  const primaryCount = mockStudents.filter(s => s.level === 'Primary').length;
  const secondaryCount = mockStudents.filter(s => s.level === 'Secondary').length;
  const boardersCount = mockStudents.filter(s => s.busUser === true).length;
  
  res.json({
    totalStudents,
    primaryStudents: primaryCount,
    secondaryStudents: secondaryCount,
    boarders: boardersCount,
    students: mockStudents
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export as Cloud Function
exports.api = functions.https.onRequest(app);

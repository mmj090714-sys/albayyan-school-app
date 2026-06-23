import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors());
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

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Helper function to determine if student is new or returning
const isNewStudent = async (studentId, sessionStartDate) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  // If student joined before session start, they're returning; otherwise new
  return new Date(student.joinedDate) >= new Date(sessionStartDate);
};

// ===== AUTHENTICATION ROUTES =====

// POST: Admin Login
app.post('/api/auth/admin/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign(
      { role: 'admin', username },
      jwtSecret,
      { expiresIn: '24h' }
    );
    return res.json({ token, role: 'admin', message: 'Login successful' });
  }

  res.status(401).json({ error: "Invalid username or password" });
}));

// POST: Director Login
app.post('/api/auth/director/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
  const directorUsername = process.env.DIRECTOR_USERNAME || 'director';
  const directorPassword = process.env.DIRECTOR_PASSWORD || 'Director@123';

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username === directorUsername && password === directorPassword) {
    const token = jwt.sign(
      { role: 'director', username },
      jwtSecret,
      { expiresIn: '24h' }
    );
    return res.json({ token, role: 'director', message: 'Login successful' });
  }

  res.status(401).json({ error: "Invalid username or password" });
}));

// ===== PARENT PORTAL ROUTES =====

// GET: Fetch Outstanding Invoices for a Student
app.get('/api/students/:admissionNumber/invoices', asyncHandler(async (req, res) => {
  const { admissionNumber } = req.params;

  const student = await prisma.student.findUnique({
    where: { admissionNumber },
    include: {
      invoices: {
        where: { balanceDue: { gt: 0 } },
        include: { 
          feeStructure: true,
          payments: true,
          term: true
        }
      }
    }
  });

  if (!student) {
    return res.status(404).json({ error: "Student not found at Albayyan International." });
  }

  res.json({
    school: "Albayyan International School",
    studentName: `${student.firstName} ${student.lastName}`,
    class: student.classLevel,
    outstandingInvoices: student.invoices
  });
}));

// ===== SESSION ROUTES =====

// GET: All Sessions
app.get('/api/admin/sessions', adminAuth, asyncHandler(async (req, res) => {
  const sessions = await prisma.session.findMany({
    include: { terms: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(sessions);
}));

// POST: Create Session
app.post('/api/admin/sessions', adminAuth, asyncHandler(async (req, res) => {
  const { name, startDate, endDate } = req.body;

  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const session = await prisma.session.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: false
    }
  });

  res.status(201).json(session);
}));

// PUT: Update Session (mainly for activation)
app.put('/api/admin/sessions/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, name, startDate, endDate } = req.body;

  // If activating this session, deactivate others
  if (isActive) {
    await prisma.session.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
  }

  const session = await prisma.session.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) })
    }
  });

  res.json(session);
}));

// DELETE: Delete Session
app.delete('/api/admin/sessions/:id', adminAuth, asyncHandler(async (req, res) => {
  await prisma.session.delete({ where: { id: req.params.id } });
  res.json({ message: "Session deleted" });
}));

// ===== TERM ROUTES =====

// GET: All Terms for a Session
app.get('/api/admin/sessions/:sessionId/terms', adminAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const terms = await prisma.term.findMany({
    where: { sessionId },
    include: { feeStructures: true, invoices: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(terms);
}));

// POST: Create Term
app.post('/api/admin/terms', adminAuth, asyncHandler(async (req, res) => {
  const { sessionId, name, startDate, endDate } = req.body;

  if (!sessionId || !name || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const term = await prisma.term.create({
    data: {
      sessionId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: false
    }
  });

  res.status(201).json(term);
}));

// PUT: Update Term
app.put('/api/admin/terms/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, isActive } = req.body;

  const term = await prisma.term.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(isActive !== undefined && { isActive })
    }
  });

  res.json(term);
}));

// DELETE: Delete Term
app.delete('/api/admin/terms/:id', adminAuth, asyncHandler(async (req, res) => {
  await prisma.term.delete({ where: { id: req.params.id } });
  res.json({ message: "Term deleted" });
}));

// POST: Carry Forward Balances to New Term
app.post('/api/admin/terms/:termId/carry-forward-balances', adminAuth, asyncHandler(async (req, res) => {
  const { termId } = req.params;

  const term = await prisma.term.findUnique({
    where: { id: termId },
    include: { session: true }
  });

  if (!term) {
    return res.status(404).json({ error: "Term not found" });
  }

  // Find previous term
  const previousTerm = await prisma.term.findFirst({
    where: {
      sessionId: term.sessionId,
      createdAt: { lt: term.createdAt }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!previousTerm) {
    return res.status(400).json({ message: "No previous term found. Skipping carry-forward." });
  }

  // Get all students with outstanding balances in previous term
  const previousInvoices = await prisma.invoice.findMany({
    where: {
      termId: previousTerm.id,
      balanceDue: { gt: 0 }
    },
    include: { student: true, feeStructure: true }
  });

  const carryForwardResults = [];

  for (const prevInvoice of previousInvoices) {
    // Create carry forward record
    const carryForward = await prisma.carryForward.create({
      data: {
        studentId: prevInvoice.studentId,
        fromTermId: previousTerm.id,
        toTermId: termId,
        balanceAmount: prevInvoice.balanceDue,
        status: 'Active'
      }
    });

    // Get fee structure for new term
    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        termId: termId,
        classLevel: prevInvoice.student.classLevel
      }
    });

    if (feeStructure) {
      // Determine student type and get appropriate fee
      const newStudent = await isNewStudent(prevInvoice.studentId, term.session.startDate);
      const baseFee = newStudent 
        ? feeStructure.newStudentTotal 
        : feeStructure.returningStudentTotal;

      // Create new invoice with carried forward balance
      const newInvoice = await prisma.invoice.create({
        data: {
          studentId: prevInvoice.studentId,
          feeStructureId: feeStructure.id,
          termId: termId,
          isNewStudent: newStudent,
          totalAmount: baseFee + prevInvoice.balanceDue,
          balanceDue: baseFee + prevInvoice.balanceDue,
          carriedForwardBalance: prevInvoice.balanceDue,
          dueDate: new Date(term.endDate),
          status: 'Unpaid'
        }
      });

      // Update carry forward record
      await prisma.carryForward.update({
        where: { id: carryForward.id },
        data: { appliedToInvoiceId: newInvoice.id }
      });

      carryForwardResults.push({
        student: prevInvoice.student.firstName + ' ' + prevInvoice.student.lastName,
        carriedBalance: prevInvoice.balanceDue,
        newInvoiceId: newInvoice.id,
        totalDue: newInvoice.totalAmount
      });
    }
  }

  res.json({
    message: `Carried forward ${carryForwardResults.length} student balances`,
    results: carryForwardResults
  });
}));

// ===== STUDENT ROUTES =====

// GET: All Students
app.get('/api/admin/students', adminAuth, asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    include: { 
      invoices: { include: { payments: true, term: true, feeStructure: true } }
    }
  });
  res.json(students);
}));

// Helper function to generate admission number
const generateAdmissionNumber = async () => {
  const lastStudent = await prisma.student.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  if (!lastStudent) return 'ALB001';
  
  const lastNumber = parseInt(lastStudent.admissionNumber.replace('ALB', ''));
  const newNumber = String(lastNumber + 1).padStart(3, '0');
  return `ALB${newNumber}`;
};

// POST: Create Student
app.post('/api/admin/students', adminAuth, asyncHandler(async (req, res) => {
  const { firstName, lastName, school, classLevel, parentPhoneNumber, boardingStatus, takesSchoolBus } = req.body;

  if (!firstName || !lastName || !parentPhoneNumber || !school || !classLevel) {
    return res.status(400).json({ error: "Missing required fields (firstName, lastName, parentPhoneNumber, school, classLevel)" });
  }

  const admissionNumber = await generateAdmissionNumber();

  const student = await prisma.student.create({
    data: {
      admissionNumber,
      firstName,
      lastName,
      school,
      classLevel,
      parentPhoneNumber,
      boardingStatus: boardingStatus || false,
      takesSchoolBus: takesSchoolBus || false,
      isNewStudent: true,
      joinedDate: new Date()
    }
  });

  res.status(201).json(student);
}));

// POST: Bulk Import Students (Excel)
app.post('/api/admin/students/bulk/import', adminAuth, asyncHandler(async (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: "No students provided" });
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: [],
    createdStudents: []
  };

  for (let i = 0; i < students.length; i++) {
    try {
      const { firstName, lastName, school, classLevel, parentPhoneNumber, boardingStatus, takesSchoolBus } = students[i];

      // Validate required fields
      if (!firstName || !lastName) {
        throw new Error("First Name and Last Name are required");
      }

      // Generate admission number
      const admissionNumber = await generateAdmissionNumber();

      // Create student
      const student = await prisma.student.create({
        data: {
          admissionNumber,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          school: school || 'Secondary',
          classLevel: classLevel || 'JSS 1',
          parentPhoneNumber: parentPhoneNumber || '',
          boardingStatus: boardingStatus || false,
          takesSchoolBus: takesSchoolBus || false,
          isNewStudent: true,
          joinedDate: new Date()
        }
      });

      results.successful++;
      results.createdStudents.push({
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName
      });
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 2,
        firstName: students[i].firstName,
        lastName: students[i].lastName,
        error: error.message
      });
    }
  }

  res.status(201).json({
    message: `Imported ${results.successful} students, ${results.failed} failed`,
    ...results
  });
}));

// PUT: Update Student
app.put('/api/admin/students/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, school, classLevel, parentPhoneNumber, boardingStatus, takesSchoolBus, isNewStudent } = req.body;

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(school && { school }),
      ...(classLevel && { classLevel }),
      ...(parentPhoneNumber && { parentPhoneNumber }),
      ...(boardingStatus !== undefined && { boardingStatus }),
      ...(takesSchoolBus !== undefined && { takesSchoolBus }),
      ...(isNewStudent !== undefined && { isNewStudent })
    }
  });

  res.json(student);
}));

// DELETE: Delete Student
app.delete('/api/admin/students/:id', adminAuth, asyncHandler(async (req, res) => {
  await prisma.student.delete({ where: { id: req.params.id } });
  res.json({ message: "Student deleted" });
}));

// ===== FEE STRUCTURE ROUTES =====

// GET: All Fee Structures
app.get('/api/admin/fee-structures', adminAuth, asyncHandler(async (req, res) => {
  const structures = await prisma.feeStructure.findMany({
    include: { session: true, term: true }
  });
  res.json(structures);
}));

// GET: Fee Structures for a Term
app.get('/api/admin/terms/:termId/fee-structures', adminAuth, asyncHandler(async (req, res) => {
  const { termId } = req.params;
  const structures = await prisma.feeStructure.findMany({
    where: { termId },
    include: { session: true, term: true }
  });
  res.json(structures);
}));

// POST: Create Fee Structure
app.post('/api/admin/fee-structures', adminAuth, asyncHandler(async (req, res) => {
  const { sessionId, termId, classLevel, newStudentBaseTuition, newStudentBoardingFee, newStudentSchoolBusFee, returningStudentBaseTuition, returningStudentBoardingFee, returningStudentSchoolBusFee } = req.body;

  if (!sessionId || !termId || !classLevel) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newStudentTotal = (newStudentBaseTuition || 0) + (newStudentBoardingFee || 0) + (newStudentSchoolBusFee || 0);
  const returningStudentTotal = (returningStudentBaseTuition || 0) + (returningStudentBoardingFee || 0) + (returningStudentSchoolBusFee || 0);

  const structure = await prisma.feeStructure.create({
    data: {
      sessionId,
      termId,
      classLevel,
      newStudentBaseTuition: newStudentBaseTuition || 0,
      newStudentBoardingFee: newStudentBoardingFee || 0,
      newStudentSchoolBusFee: newStudentSchoolBusFee || 0,
      newStudentTotal,
      returningStudentBaseTuition: returningStudentBaseTuition || 0,
      returningStudentBoardingFee: returningStudentBoardingFee || 0,
      returningStudentSchoolBusFee: returningStudentSchoolBusFee || 0,
      returningStudentTotal
    },
    include: { session: true, term: true }
  });

  res.status(201).json(structure);
}));

// PUT: Update Fee Structure
app.put('/api/admin/fee-structures/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newStudentBaseTuition, newStudentBoardingFee, newStudentSchoolBusFee, returningStudentBaseTuition, returningStudentBoardingFee, returningStudentSchoolBusFee } = req.body;

  const updates = {};
  if (newStudentBaseTuition !== undefined) {
    updates.newStudentBaseTuition = newStudentBaseTuition;
  }
  if (newStudentBoardingFee !== undefined) {
    updates.newStudentBoardingFee = newStudentBoardingFee;
  }
  if (newStudentSchoolBusFee !== undefined) {
    updates.newStudentSchoolBusFee = newStudentSchoolBusFee;
  }
  if (returningStudentBaseTuition !== undefined) {
    updates.returningStudentBaseTuition = returningStudentBaseTuition;
  }
  if (returningStudentBoardingFee !== undefined) {
    updates.returningStudentBoardingFee = returningStudentBoardingFee;
  }
  if (returningStudentSchoolBusFee !== undefined) {
    updates.returningStudentSchoolBusFee = returningStudentSchoolBusFee;
  }

  // Recalculate totals if individual fees changed
  const current = await prisma.feeStructure.findUnique({ where: { id } });
  if (Object.keys(updates).length > 0) {
    const newBaseTuition = updates.newStudentBaseTuition !== undefined ? updates.newStudentBaseTuition : current.newStudentBaseTuition;
    const newBoardingFee = updates.newStudentBoardingFee !== undefined ? updates.newStudentBoardingFee : current.newStudentBoardingFee;
    const newBusFee = updates.newStudentSchoolBusFee !== undefined ? updates.newStudentSchoolBusFee : current.newStudentSchoolBusFee;
    const retBaseTuition = updates.returningStudentBaseTuition !== undefined ? updates.returningStudentBaseTuition : current.returningStudentBaseTuition;
    const retBoardingFee = updates.returningStudentBoardingFee !== undefined ? updates.returningStudentBoardingFee : current.returningStudentBoardingFee;
    const retBusFee = updates.returningStudentSchoolBusFee !== undefined ? updates.returningStudentSchoolBusFee : current.returningStudentSchoolBusFee;

    updates.newStudentTotal = newBaseTuition + newBoardingFee + newBusFee;
    updates.returningStudentTotal = retBaseTuition + retBoardingFee + retBusFee;
  }

  const structure = await prisma.feeStructure.update({
    where: { id },
    data: updates,
    include: { session: true, term: true }
  });

  res.json(structure);
}));

// DELETE: Delete Fee Structure
app.delete('/api/admin/fee-structures/:id', adminAuth, asyncHandler(async (req, res) => {
  await prisma.feeStructure.delete({ where: { id: req.params.id } });
  res.json({ message: "Fee structure deleted" });
}));

// ===== INVOICE ROUTES =====

// GET: All Invoices
app.get('/api/admin/invoices', adminAuth, asyncHandler(async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: { 
      student: true, 
      feeStructure: true,
      term: { include: { session: true } },
      payments: true 
    }
  });
  res.json(invoices);
}));

// GET: Invoices for a Term
app.get('/api/admin/terms/:termId/invoices', adminAuth, asyncHandler(async (req, res) => {
  const { termId } = req.params;
  const invoices = await prisma.invoice.findMany({
    where: { termId },
    include: { 
      student: true, 
      feeStructure: true,
      payments: true 
    }
  });
  res.json(invoices);
}));

// POST: Create Invoice
app.post('/api/admin/invoices', adminAuth, asyncHandler(async (req, res) => {
  const { studentId, feeStructureId, termId, dueDate } = req.body;

  if (!studentId || !feeStructureId || !termId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
    include: { term: { include: { session: true } } }
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!feeStructure) {
    return res.status(404).json({ error: "Fee structure not found" });
  }

  // Determine if student is new or returning
  const newStudent = await isNewStudent(studentId, feeStructure.term.session.startDate);
  const totalAmount = newStudent 
    ? feeStructure.newStudentTotal 
    : feeStructure.returningStudentTotal;

  const invoice = await prisma.invoice.create({
    data: {
      studentId,
      feeStructureId,
      termId,
      isNewStudent: newStudent,
      totalAmount,
      balanceDue: totalAmount,
      dueDate: new Date(dueDate || feeStructure.term.endDate),
      status: "Unpaid"
    },
    include: { student: true, feeStructure: true, term: true }
  });

  res.status(201).json(invoice);
}));

// PUT: Update Invoice Status
app.put('/api/admin/invoices/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status }
  });

  res.json(invoice);
}));

// DELETE: Delete Invoice
app.delete('/api/admin/invoices/:id', adminAuth, asyncHandler(async (req, res) => {
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ message: "Invoice deleted" });
}));

// ===== PAYMENT ROUTES =====

// POST: Record Payment
app.post('/api/admin/payments', adminAuth, asyncHandler(async (req, res) => {
  const { invoiceId, amountPaid, paymentMethod, transactionReference, recordedBy, bankName, receiptNumber, paidByName, paidDate } = req.body;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  if (!receiptNumber) {
    return res.status(400).json({ error: "Receipt number is required" });
  }

  const newAmountPaid = invoice.amountPaid + amountPaid;
  const newBalanceDue = invoice.totalAmount - newAmountPaid;
  const newStatus = newBalanceDue <= 0 ? "Paid" : "Partial";

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amountPaid,
      paymentMethod,
      transactionReference: transactionReference || `PAY-${Date.now()}`,
      recordedBy: recordedBy || "System",
      bankName: bankName || null,
      receiptNumber,
      paidByName: paidByName || "Not specified",
      paymentDate: paidDate ? new Date(paidDate) : new Date()
    }
  });

  // Update invoice
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: newAmountPaid,
      balanceDue: Math.max(0, newBalanceDue),
      status: newStatus
    }
  });

  res.status(201).json({ payment, message: "Payment recorded successfully" });
}));

// GET: All Payments
app.get('/api/admin/payments', adminAuth, asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: { invoice: { include: { student: true, term: true } } },
    orderBy: { paymentDate: 'desc' }
  });
  res.json(payments);
}));

// GET: Payments for Invoice
app.get('/api/admin/invoices/:invoiceId/payments', adminAuth, asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const payments = await prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paymentDate: 'desc' }
  });

  res.json(payments);
}));

// DELETE: Delete Payment
app.delete('/api/admin/payments/:id', adminAuth, asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  
  // Get payment details
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }

  // Get invoice details
  const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
  
  // Revert payment from invoice
  const newAmountPaid = Math.max(0, invoice.amountPaid - payment.amountPaid);
  const newBalanceDue = invoice.totalAmount - newAmountPaid;
  const newStatus = newBalanceDue <= 0 ? "Paid" : (newAmountPaid > 0 ? "Partial" : "Unpaid");

  // Update invoice
  await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      status: newStatus
    }
  });

  // Delete payment
  await prisma.payment.delete({ where: { id: paymentId } });

  res.json({ message: "Payment deleted and invoice updated" });
}));

// GET: Check Student Clearance Status for a Term
app.get('/api/admin/students/:studentId/clearances', adminAuth, asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { termId } = req.query; // Optional: filter by specific term

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  let invoices;
  if (termId) {
    invoices = await prisma.invoice.findMany({
      where: { studentId, termId }
    });
  } else {
    // Get invoices for all active terms
    const activeTerms = await prisma.term.findMany({ where: { isActive: true } });
    const termIds = activeTerms.map(t => t.id);
    invoices = await prisma.invoice.findMany({
      where: { studentId, termId: { in: termIds } }
    });
  }

  // Check if all invoices are paid
  const allPaid = invoices.length > 0 && invoices.every(inv => inv.status === "Paid");
  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  res.json({
    studentId,
    studentName: student.fullName,
    termId: termId || "All Active Terms",
    isCleared: allPaid && totalDue === 0,
    invoiceCount: invoices.length,
    paidCount: invoices.filter(inv => inv.status === "Paid").length,
    totalDue,
    invoices: invoices.map(inv => ({
      id: inv.id,
      status: inv.status,
      totalAmount: inv.totalAmount,
      amountPaid: inv.amountPaid,
      balanceDue: inv.balanceDue
    }))
  });
}));

// ===== DASHBOARD & STATS =====

// GET: Dashboard Statistics
app.get('/api/admin/stats', adminAuth, asyncHandler(async (req, res) => {
  const totalStudents = await prisma.student.count();
  const newStudents = await prisma.student.count({ where: { isNewStudent: true } });
  const totalInvoices = await prisma.invoice.count();
  const paidInvoices = await prisma.invoice.count({ where: { status: "Paid" } });
  const totalCollected = await prisma.payment.aggregate({ _sum: { amountPaid: true } });
  
  const outstandingInvoices = await prisma.invoice.aggregate({
    where: { balanceDue: { gt: 0 } },
    _sum: { balanceDue: true }
  });

  const activeSessions = await prisma.session.count({ where: { isActive: true } });
  const totalSessions = await prisma.session.count();

  res.json({
    totalStudents,
    newStudents,
    totalInvoices,
    paidInvoices,
    unpaidInvoices: totalInvoices - paidInvoices,
    totalCollected: totalCollected._sum.amountPaid || 0,
    outstandingBalance: outstandingInvoices._sum.balanceDue || 0,
    activeSessions,
    totalSessions
  });
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", message: "Albayyan Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server Error" });
});

// ===== DIRECTOR ROUTES (READ-ONLY) =====

// GET: All Students (Director view - read-only)
app.get('/api/director/students', directorAuth, asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany({
    include: { 
      invoices: { 
        include: { 
          payments: true, 
          term: true, 
          feeStructure: true 
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { admissionNumber: 'asc' }
  });
  res.json(students);
}));

// GET: All Invoices (Director view - read-only)
app.get('/api/director/invoices', directorAuth, asyncHandler(async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: { 
      student: true,
      term: true,
      feeStructure: true,
      payments: { orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(invoices);
}));

// GET: All Payments (Director view - read-only, sorted by latest)
app.get('/api/director/payments', directorAuth, asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: { 
      invoice: { 
        include: { 
          student: true,
          term: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(payments);
}));

// GET: Payment Notifications (recent payments for director dashboard)
app.get('/api/director/notifications', directorAuth, asyncHandler(async (req, res) => {
  // Get payments from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPayments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo }
    },
    include: { 
      invoice: { 
        include: { 
          student: true,
          term: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(recentPayments);
}));

// GET: Dashboard Summary (Director view)
app.get('/api/director/summary', directorAuth, asyncHandler(async (req, res) => {
  const totalStudents = await prisma.student.count();
  const totalInvoices = await prisma.invoice.count();
  const totalPayments = await prisma.payment.count();
  
  // Count boarders
  const totalBoarders = await prisma.student.count({
    where: { boardingStatus: true }
  });

  // Count school bus users
  const totalBusUsers = await prisma.student.count({
    where: { takesSchoolBus: true }
  });

  // Count by school
  const primaryStudents = await prisma.student.count({
    where: { school: "Primary" }
  });

  const secondaryStudents = await prisma.student.count({
    where: { school: "Secondary" }
  });

  // Get all students grouped by class and school
  const studentsByClass = await prisma.student.groupBy({
    by: ['school', 'classLevel'],
    _count: true
  });
  
  const totalExpected = await prisma.invoice.aggregate({
    _sum: { totalAmount: true }
  });

  const totalCollected = await prisma.payment.aggregate({
    _sum: { amountPaid: true }
  });

  const totalOutstanding = await prisma.invoice.aggregate({
    _sum: { balanceDue: true }
  });

  // Recent payments in last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const recentPaymentCount = await prisma.payment.count({
    where: { createdAt: { gte: oneDayAgo } }
  });

  res.json({
    totalStudents,
    totalBoarders,
    totalBusUsers,
    primaryStudents,
    secondaryStudents,
    studentsByClass,
    totalInvoices,
    totalPayments,
    recentPayments: recentPaymentCount,
    totalExpected: totalExpected._sum.totalAmount || 0,
    totalCollected: totalCollected._sum.amountPaid || 0,
    totalOutstanding: totalOutstanding._sum.balanceDue || 0,
    collectionRate: totalExpected._sum.totalAmount ? 
      Math.round((totalCollected._sum.amountPaid || 0) / totalExpected._sum.totalAmount * 100) : 0
  });
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Albayyan Server running on port ${PORT}`));

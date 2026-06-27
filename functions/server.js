import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
const isDev = process.env.NODE_ENV !== 'production';
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || (isDev ? SUPABASE_ANON_KEY : undefined);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.\n' +
    'In development, you may also set SUPABASE_ANON_KEY or VITE_SUPABASE_KEY as a fallback.'
  );
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY && SUPABASE_ANON_KEY && isDev) {
  console.warn('Warning: using SUPABASE_ANON_KEY fallback in development because SUPABASE_SERVICE_ROLE_KEY is missing. This is not secure for production.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

const snakeToCamel = (key) => key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

const mapKeysDeep = (input) => {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(mapKeysDeep);
  if (typeof input !== 'object') return input;
  return Object.entries(input).reduce((acc, [key, value]) => {
    acc[snakeToCamel(key)] = mapKeysDeep(value);
    return acc;
  }, {});
};

const normalize = (data) => {
  if (Array.isArray(data)) return data.map(mapKeysDeep);
  return mapKeysDeep(data);
};

const getAuthToken = (req) => req.headers.authorization?.split(' ')[1];

const createAuthMiddleware = (requiredRole) => (req, res, next) => {
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized - No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== requiredRole) {
      return res.status(403).json({ error: `Forbidden - ${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} access required` });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

const adminAuth = createAuthMiddleware('admin');
const directorAuth = createAuthMiddleware('director');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const isNewStudent = async (studentId, sessionStartDate) => {
  const { data: student, error } = await supabase
    .from('students')
    .select('joined_date')
    .eq('id', studentId)
    .single();

  if (error || !student) return false;
  return new Date(student.joined_date) >= new Date(sessionStartDate);
};

const mapInvoiceWithAcademicTerm = (invoice) => {
  const normalizedInvoice = normalize(invoice);
  return {
    ...normalizedInvoice,
    academicTerm: normalizedInvoice.term?.name || null,
  };
};

const buildJwtToken = (role, username) => jwt.sign({ role, username }, JWT_SECRET, { expiresIn: '24h' });

app.post('/api/auth/admin/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username === adminUsername && password === adminPassword) {
    return res.json({ token: buildJwtToken('admin', username), role: 'admin', message: 'Login successful' });
  }

  res.status(401).json({ error: 'Invalid username or password' });
}));

app.post('/api/auth/director/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const directorUsername = process.env.DIRECTOR_USERNAME || 'director';
  const directorPassword = process.env.DIRECTOR_PASSWORD || 'Director@123';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username === directorUsername && password === directorPassword) {
    return res.json({ token: buildJwtToken('director', username), role: 'director', message: 'Login successful' });
  }

  res.status(401).json({ error: 'Invalid username or password' });
}));

app.get('/api/students/:admissionNumber/invoices', asyncHandler(async (req, res) => {
  const { admissionNumber } = req.params;
  const { data, error } = await supabase
    .from('students')
    .select('id, admission_number, first_name, last_name, school, class_level, invoices(*, payments(*), term(*), fee_structure(*))')
    .eq('admission_number', admissionNumber)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Student not found at Albayyan International.' });
  }

  const student = normalize(data);
  const outstandingInvoices = (student.invoices || []).filter((invoice) => invoice.balanceDue > 0).map(mapInvoiceWithAcademicTerm);

  res.json({
    school: 'Albayyan International School',
    studentName: `${student.firstName} ${student.lastName}`,
    class: student.classLevel,
    outstandingInvoices,
  });
}));

app.get('/api/admin/sessions', adminAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, terms(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json(normalize(data));
}));

app.post('/api/admin/sessions', adminAuth, asyncHandler(async (req, res) => {
  const { name, startDate, endDate } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert([{ name, start_date: new Date(startDate).toISOString(), end_date: new Date(endDate).toISOString(), is_active: false }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(normalize(data));
}));

app.put('/api/admin/sessions/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, name, startDate, endDate } = req.body;

  if (isActive) {
    const { error: clearError } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('is_active', true);

    if (clearError) throw clearError;
  }

  const updates = {};
  if (isActive !== undefined) updates.is_active = isActive;
  if (name) updates.name = name;
  if (startDate) updates.start_date = new Date(startDate).toISOString();
  if (endDate) updates.end_date = new Date(endDate).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  res.json(normalize(data));
}));

app.delete('/api/admin/sessions/:id', adminAuth, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;
  res.json({ message: 'Session deleted' });
}));

app.get('/api/admin/sessions/:sessionId/terms', adminAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { data, error } = await supabase
    .from('terms')
    .select('*, fee_structures(*), invoices(*)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  res.json(normalize(data));
}));

app.post('/api/admin/terms', adminAuth, asyncHandler(async (req, res) => {
  const { sessionId, name, startDate, endDate } = req.body;
  if (!sessionId || !name || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('terms')
    .insert([{ session_id: sessionId, name, start_date: new Date(startDate).toISOString(), end_date: new Date(endDate).toISOString(), is_active: false }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(normalize(data));
}));

app.put('/api/admin/terms/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, isActive } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (startDate) updates.start_date = new Date(startDate).toISOString();
  if (endDate) updates.end_date = new Date(endDate).toISOString();
  if (isActive !== undefined) updates.is_active = isActive;

  const { data, error } = await supabase
    .from('terms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  res.json(normalize(data));
}));

app.delete('/api/admin/terms/:id', adminAuth, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('terms')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;
  res.json({ message: 'Term deleted' });
}));

app.post('/api/admin/terms/:termId/carry-forward-balances', adminAuth, asyncHandler(async (req, res) => {
  const { termId } = req.params;
  const { data: term, error: termError } = await supabase
    .from('terms')
    .select('*')
    .eq('id', termId)
    .single();

  if (termError || !term) {
    return res.status(404).json({ error: 'Term not found' });
  }

  const { data: previousTerms, error: prevErr } = await supabase
    .from('terms')
    .select('*')
    .eq('session_id', term.session_id)
    .lt('created_at', term.created_at)
    .order('created_at', { ascending: false })
    .limit(1);

  if (prevErr) throw prevErr;
  if (!previousTerms || previousTerms.length === 0) {
    return res.status(400).json({ message: 'No previous term found. Skipping carry-forward.' });
  }

  const previousTerm = previousTerms[0];
  const { data: previousInvoices, error: prevInvoicesError } = await supabase
    .from('invoices')
    .select('*, student(*), fee_structure(*)')
    .eq('term_id', previousTerm.id)
    .gt('balance_due', 0);

  if (prevInvoicesError) throw prevInvoicesError;

  const carryForwardResults = [];

  for (const prevInvoice of previousInvoices || []) {
    const { data: carryForward, error: carryError } = await supabase
      .from('carry_forwards')
      .insert([{ student_id: prevInvoice.student_id, from_term_id: previousTerm.id, to_term_id: termId, balance_amount: prevInvoice.balance_due, status: 'Active' }])
      .select()
      .single();

    if (carryError || !carryForward) continue;

    const feeStructure = prevInvoice.fee_structure;
    if (!feeStructure) continue;

    const newStudentStatus = await isNewStudent(prevInvoice.student_id, term.start_date);
    const baseFee = newStudentStatus ? feeStructure.new_student_total : feeStructure.returning_student_total;
    const totalDue = baseFee + prevInvoice.balance_due;

    const { data: newInvoice, error: newInvoiceError } = await supabase
      .from('invoices')
      .insert([{ student_id: prevInvoice.student_id, fee_structure_id: feeStructure.id, term_id: termId, is_new_student: newStudentStatus, total_amount: totalDue, amount_paid: 0, balance_due: totalDue, carried_forward_balance: prevInvoice.balance_due, due_date: term.end_date, status: 'Unpaid' }])
      .select()
      .single();

    if (newInvoiceError || !newInvoice) continue;

    await supabase
      .from('carry_forwards')
      .update({ applied_to_invoice_id: newInvoice.id })
      .eq('id', carryForward.id);

    carryForwardResults.push({
      student: `${prevInvoice.student?.first_name || ''} ${prevInvoice.student?.last_name || ''}`.trim(),
      carriedBalance: prevInvoice.balance_due,
      newInvoiceId: newInvoice.id,
      totalDue,
    });
  }

  res.json({ message: `Carried forward ${carryForwardResults.length} student balances`, results: carryForwardResults });
}));

app.get('/api/admin/students', adminAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, invoices(*, payments(*), term(*), fee_structure(*))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json(normalize(data));
}));

app.post('/api/admin/students', adminAuth, asyncHandler(async (req, res) => {
  const { firstName, lastName, school, classLevel, parentPhoneNumber, boardingStatus, takesSchoolBus } = req.body;
  if (!firstName || !lastName || !parentPhoneNumber || !school || !classLevel) {
    return res.status(400).json({ error: 'Missing required fields (firstName, lastName, parentPhoneNumber, school, classLevel)' });
  }

  const { data: lastStudent, error: lastError } = await supabase
    .from('students')
    .select('admission_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastError) throw lastError;

  const lastNumber = lastStudent && lastStudent.length > 0 ? parseInt((lastStudent[0].admission_number || 'ALB000').replace(/[^0-9]/g, ''), 10) : 0;
  const admissionNumber = `ALB${String(lastNumber + 1).padStart(3, '0')}`;

  const payload = {
    admission_number: admissionNumber,
    first_name: firstName,
    last_name: lastName,
    school,
    class_level: classLevel,
    parent_phone_number: parentPhoneNumber,
    boarding_status: boardingStatus || false,
    takes_school_bus: takesSchoolBus || false,
    is_new_student: true,
    joined_date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('students')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(normalize(data));
}));

app.post('/api/admin/students/bulk/import', adminAuth, asyncHandler(async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'No students provided' });
  }

  const results = { successful: 0, failed: 0, errors: [], createdStudents: [] };

  for (let i = 0; i < students.length; i += 1) {
    try {
      const { firstName, lastName, school, classLevel, parentPhoneNumber, boardingStatus, takesSchoolBus } = students[i];
      if (!firstName || !lastName) {
        throw new Error('First Name and Last Name are required');
      }

      const { data: lastStudent, error: lastError } = await supabase
        .from('students')
        .select('admission_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastError) throw lastError;

      const lastNumber = lastStudent && lastStudent.length > 0 ? parseInt((lastStudent[0].admission_number || 'ALB000').replace(/[^0-9]/g, ''), 10) : 0;
      const admissionNumber = `ALB${String(lastNumber + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('students')
        .insert([{ admission_number: admissionNumber, first_name: firstName.trim(), last_name: lastName.trim(), school: school || 'Secondary', class_level: classLevel || 'JSS 1', parent_phone_number: parentPhoneNumber || '', boarding_status: boardingStatus || false, takes_school_bus: takesSchoolBus || false, is_new_student: true, joined_date: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      results.successful += 1;
      results.createdStudents.push({ id: data.id, admissionNumber: data.admission_number, firstName: data.first_name, lastName: data.last_name });
    } catch (error) {
      results.failed += 1;
      results.errors.push({ row: i + 2, firstName: students[i]?.firstName, lastName: students[i]?.lastName, error: error.message });
    }
  }

  res.status(201).json({ message: `Imported ${results.successful} students, ${results.failed} failed`, ...results });
}));

app.put('/api/admin/students/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, school, classLevel, parentPhoneNumber, boardingStatus, takesSchoolBus, isNewStudent } = req.body;
  const updates = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (school) updates.school = school;
  if (classLevel) updates.class_level = classLevel;
  if (parentPhoneNumber) updates.parent_phone_number = parentPhoneNumber;
  if (boardingStatus !== undefined) updates.boarding_status = boardingStatus;
  if (takesSchoolBus !== undefined) updates.takes_school_bus = takesSchoolBus;
  if (isNewStudent !== undefined) updates.is_new_student = isNewStudent;

  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  res.json(normalize(data));
}));

app.delete('/api/admin/students/:id', adminAuth, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;
  res.json({ message: 'Student deleted' });
}));

app.get('/api/admin/fee-structures', adminAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*, session(*), term(*)');

  if (error) throw error;
  res.json(normalize(data));
}));

app.get('/api/admin/terms/:termId/fee-structures', adminAuth, asyncHandler(async (req, res) => {
  const { termId } = req.params;
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*, session(*), term(*)')
    .eq('term_id', termId);

  if (error) throw error;
  res.json(normalize(data));
}));

app.post('/api/admin/fee-structures', adminAuth, asyncHandler(async (req, res) => {
  const { sessionId, termId, classLevel, newStudentBaseTuition, newStudentBoardingFee, newStudentSchoolBusFee, returningStudentBaseTuition, returningStudentBoardingFee, returningStudentSchoolBusFee } = req.body;
  if (!sessionId || !termId || !classLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    session_id: sessionId,
    term_id: termId,
    class_level: classLevel,
    new_student_base_tuition: newStudentBaseTuition || 0,
    new_student_boarding_fee: newStudentBoardingFee || 0,
    new_student_school_bus_fee: newStudentSchoolBusFee || 0,
    new_student_total: (newStudentBaseTuition || 0) + (newStudentBoardingFee || 0) + (newStudentSchoolBusFee || 0),
    returning_student_base_tuition: returningStudentBaseTuition || 0,
    returning_student_boarding_fee: returningStudentBoardingFee || 0,
    returning_student_school_bus_fee: returningStudentSchoolBusFee || 0,
    returning_student_total: (returningStudentBaseTuition || 0) + (returningStudentBoardingFee || 0) + (returningStudentSchoolBusFee || 0),
  };

  const { data, error } = await supabase
    .from('fee_structures')
    .insert([payload])
    .select('*, session(*), term(*)')
    .single();

  if (error) throw error;
  res.status(201).json(normalize(data));
}));

app.put('/api/admin/fee-structures/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newStudentBaseTuition, newStudentBoardingFee, newStudentSchoolBusFee, returningStudentBaseTuition, returningStudentBoardingFee, returningStudentSchoolBusFee } = req.body;

  const { data: current, error: currentError } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('id', id)
    .single();

  if (currentError || !current) {
    return res.status(404).json({ error: 'Fee structure not found' });
  }

  const updates = {};
  if (newStudentBaseTuition !== undefined) updates.new_student_base_tuition = newStudentBaseTuition;
  if (newStudentBoardingFee !== undefined) updates.new_student_boarding_fee = newStudentBoardingFee;
  if (newStudentSchoolBusFee !== undefined) updates.new_student_school_bus_fee = newStudentSchoolBusFee;
  if (returningStudentBaseTuition !== undefined) updates.returning_student_base_tuition = returningStudentBaseTuition;
  if (returningStudentBoardingFee !== undefined) updates.returning_student_boarding_fee = returningStudentBoardingFee;
  if (returningStudentSchoolBusFee !== undefined) updates.returning_student_school_bus_fee = returningStudentSchoolBusFee;

  const newStudentTotal = (updates.new_student_base_tuition !== undefined ? updates.new_student_base_tuition : current.new_student_base_tuition || 0) + (updates.new_student_boarding_fee !== undefined ? updates.new_student_boarding_fee : current.new_student_boarding_fee || 0) + (updates.new_student_school_bus_fee !== undefined ? updates.new_student_school_bus_fee : current.new_student_school_bus_fee || 0);
  const returningStudentTotal = (updates.returning_student_base_tuition !== undefined ? updates.returning_student_base_tuition : current.returning_student_base_tuition || 0) + (updates.returning_student_boarding_fee !== undefined ? updates.returning_student_boarding_fee : current.returning_student_boarding_fee || 0) + (updates.returning_student_school_bus_fee !== undefined ? updates.returning_student_school_bus_fee : current.returning_student_school_bus_fee || 0);
  updates.new_student_total = newStudentTotal;
  updates.returning_student_total = returningStudentTotal;

  const { data, error } = await supabase
    .from('fee_structures')
    .update(updates)
    .eq('id', id)
    .select('*, session(*), term(*)')
    .single();

  if (error) throw error;
  res.json(normalize(data));
}));

app.delete('/api/admin/fee-structures/:id', adminAuth, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('fee_structures')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;
  res.json({ message: 'Fee structure deleted' });
}));

app.get('/api/admin/invoices', adminAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, student(*), fee_structure(*), term(*), payments(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json(normalize(data).map(mapInvoiceWithAcademicTerm));
}));

app.get('/api/admin/terms/:termId/invoices', adminAuth, asyncHandler(async (req, res) => {
  const { termId } = req.params;
  const { data, error } = await supabase
    .from('invoices')
    .select('*, student(*), fee_structure(*), payments(*)')
    .eq('term_id', termId);

  if (error) throw error;
  res.json(normalize(data).map(mapInvoiceWithAcademicTerm));
}));

app.post('/api/admin/invoices', adminAuth, asyncHandler(async (req, res) => {
  const { studentId, feeStructureId, termId, dueDate } = req.body;
  if (!studentId || !feeStructureId || !termId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: feeStructure, error: feeError } = await supabase
    .from('fee_structures')
    .select('*, term(start_date, end_date)')
    .eq('id', feeStructureId)
    .single();

  if (feeError || !feeStructure) {
    return res.status(404).json({ error: 'Fee structure not found' });
  }

  const newStudentStatus = await isNewStudent(studentId, feeStructure.term?.start_date);
  const totalAmount = newStudentStatus ? feeStructure.new_student_total : feeStructure.returning_student_total;

  const payload = {
    student_id: studentId,
    fee_structure_id: feeStructureId,
    term_id: termId,
    is_new_student: newStudentStatus,
    total_amount: totalAmount,
    amount_paid: 0,
    balance_due: totalAmount,
    due_date: dueDate ? new Date(dueDate).toISOString() : feeStructure.term?.end_date || new Date().toISOString(),
    status: 'Unpaid',
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert([payload])
    .select('*, student(*), fee_structure(*), term(*)')
    .single();

  if (error) throw error;
  res.status(201).json(mapInvoiceWithAcademicTerm(normalize(data)));
}));

app.put('/api/admin/invoices/:id', adminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  res.json(normalize(data));
}));

app.delete('/api/admin/invoices/:id', adminAuth, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;
  res.json({ message: 'Invoice deleted' });
}));

app.post('/api/admin/payments', adminAuth, asyncHandler(async (req, res) => {
  const { invoiceId, amountPaid, paymentMethod, transactionReference, recordedBy, bankName, receiptNumber, paidByName, paidDate } = req.body;

  if (!invoiceId || amountPaid === undefined || amountPaid === null) {
    return res.status(400).json({ error: 'invoiceId and amountPaid are required' });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, total_amount, amount_paid')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  if (!receiptNumber) {
    return res.status(400).json({ error: 'Receipt number is required' });
  }

  const currentAmountPaid = invoice.amount_paid || 0;
  const newAmountPaid = currentAmountPaid + Number(amountPaid);
  const newBalanceDue = invoice.total_amount - newAmountPaid;
  const newStatus = newBalanceDue <= 0 ? 'Paid' : (newAmountPaid > 0 ? 'Partial' : 'Unpaid');

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert([{ invoice_id: invoiceId, amount_paid: amountPaid, payment_method: paymentMethod || 'Bank Transfer', transaction_reference: transactionReference || `PAY-${Date.now()}`, recorded_by: recordedBy || 'System', bank_name: bankName || null, receipt_number: receiptNumber, paid_by_name: paidByName || 'Not specified', payment_date: paidDate ? new Date(paidDate).toISOString() : new Date().toISOString() }])
    .select('*')
    .single();

  if (paymentError) throw paymentError;

  const { error: invoiceUpdateError } = await supabase
    .from('invoices')
    .update({ amount_paid: newAmountPaid, balance_due: Math.max(0, newBalanceDue), status: newStatus })
    .eq('id', invoiceId);

  if (invoiceUpdateError) throw invoiceUpdateError;

  res.status(201).json({ payment: normalize(payment), message: 'Payment recorded successfully' });
}));

app.post('/api/admin/notifications/payment-received', adminAuth, asyncHandler(async (req, res) => {
  const { studentName, parentEmail, parentPhone, amount, invoiceId, paymentMethod, transactionReference } = req.body;

  if (!studentName || !invoiceId || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'studentName, invoiceId and amount are required' });
  }

  console.log('Payment notification received:', {
    studentName,
    parentEmail,
    parentPhone,
    amount,
    invoiceId,
    paymentMethod,
    transactionReference
  });

  res.status(200).json({
    message: 'Notification request accepted',
    notification: {
      studentName,
      parentEmail,
      parentPhone,
      amount,
      invoiceId,
      paymentMethod,
      transactionReference
    }
  });
}));

app.get('/api/admin/payments', adminAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice(student(*), term(*))')
    .order('payment_date', { ascending: false });

  if (error) throw error;
  res.json(normalize(data));
}));

app.get('/api/admin/invoices/:invoiceId/payments', adminAuth, asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  res.json(normalize(data));
}));

app.delete('/api/admin/payments/:id', adminAuth, asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (paymentError || !payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', payment.invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const newAmountPaid = Math.max(0, (invoice.amount_paid || 0) - (payment.amount_paid || 0));
  const newBalanceDue = invoice.total_amount - newAmountPaid;
  const newStatus = newBalanceDue <= 0 ? 'Paid' : (newAmountPaid > 0 ? 'Partial' : 'Unpaid');

  const { error: invoiceUpdateError } = await supabase
    .from('invoices')
    .update({ amount_paid: newAmountPaid, balance_due: newBalanceDue, status: newStatus })
    .eq('id', invoice.id);

  if (invoiceUpdateError) throw invoiceUpdateError;

  const { error: deleteError } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId);

  if (deleteError) throw deleteError;
  res.json({ message: 'Payment deleted and invoice updated' });
}));

app.get('/api/admin/students/:studentId/clearances', adminAuth, asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { termId } = req.query;

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  let query = supabase.from('invoices').select('*').eq('student_id', studentId);

  if (termId) {
    query = query.eq('term_id', termId);
  } else {
    const { data: activeTerms, error: activeTermError } = await supabase
      .from('terms')
      .select('id')
      .eq('is_active', true);

    if (activeTermError) throw activeTermError;
    const termIds = (activeTerms || []).map((term) => term.id);
    if (termIds.length > 0) {
      query = query.in('term_id', termIds);
    }
  }

  const { data: invoices, error: invoicesError } = await query;
  if (invoicesError) throw invoicesError;

  const normalizedInvoices = normalize(invoices);
  const allPaid = normalizedInvoices.length > 0 && normalizedInvoices.every((inv) => inv.status === 'Paid');
  const totalDue = normalizedInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  res.json({
    studentId,
    studentName: `${student.first_name} ${student.last_name}`,
    termId: termId || 'All Active Terms',
    isCleared: allPaid && totalDue === 0,
    invoiceCount: normalizedInvoices.length,
    paidCount: normalizedInvoices.filter((inv) => inv.status === 'Paid').length,
    totalDue,
    invoices: normalizedInvoices.map((inv) => ({
      id: inv.id,
      status: inv.status,
      totalAmount: inv.totalAmount,
      amountPaid: inv.amountPaid,
      balanceDue: inv.balanceDue,
    })),
  });
}));

app.get('/api/admin/stats', adminAuth, asyncHandler(async (req, res) => {
  const totalStudentsResp = await supabase.from('students').select('id', { count: 'exact', head: true });
  const newStudentsResp = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_new_student', true);
  const totalInvoicesResp = await supabase.from('invoices').select('id', { count: 'exact', head: true });
  const paidInvoicesResp = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'Paid');
  const totalCollectedData = await supabase.from('payments').select('amount_paid');
  const outstandingInvoicesData = await supabase.from('invoices').select('balance_due').gt('balance_due', 0);
  const activeSessionsResp = await supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('is_active', true);
  const totalSessionsResp = await supabase.from('sessions').select('id', { count: 'exact', head: true });

  if (totalStudentsResp.error || newStudentsResp.error || totalInvoicesResp.error || paidInvoicesResp.error || totalCollectedData.error || outstandingInvoicesData.error || activeSessionsResp.error || totalSessionsResp.error) {
    throw new Error('Failed to build stats');
  }

  const totalCollected = (totalCollectedData.data || []).reduce((sum, record) => sum + Number(record.amount_paid || 0), 0);
  const outstandingBalance = (outstandingInvoicesData.data || []).reduce((sum, record) => sum + Number(record.balance_due || 0), 0);

  res.json({
    totalStudents: totalStudentsResp.count || 0,
    newStudents: newStudentsResp.count || 0,
    totalInvoices: totalInvoicesResp.count || 0,
    paidInvoices: paidInvoicesResp.count || 0,
    unpaidInvoices: (totalInvoicesResp.count || 0) - (paidInvoicesResp.count || 0),
    totalCollected,
    outstandingBalance,
    activeSessions: activeSessionsResp.count || 0,
    totalSessions: totalSessionsResp.count || 0,
  });
}));

app.get('/api/director/students', directorAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, invoices(*, payments(*), term(*), fee_structure(*))')
    .order('admission_number', { ascending: true });

  if (error) throw error;
  res.json(normalize(data));
}));

app.get('/api/director/invoices', directorAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, student(*), term(*), fee_structure(*), payments(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json(normalize(data).map(mapInvoiceWithAcademicTerm));
}));

app.get('/api/director/payments', directorAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice(student(*), term(*))')
    .order('payment_date', { ascending: false });

  if (error) throw error;
  res.json(normalize(data));
}));

app.get('/api/director/notifications', directorAuth, asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice(student(*), term(*))')
    .gte('payment_date', sevenDaysAgo.toISOString())
    .order('payment_date', { ascending: false });

  if (error) throw error;
  res.json(normalize(data));
}));

app.get('/api/director/summary', directorAuth, asyncHandler(async (req, res) => {
  const studentsResp = await supabase.from('students').select('*');
  const invoicesResp = await supabase.from('invoices').select('*, term(*)');
  const paymentsResp = await supabase.from('payments').select('*, invoice(student(*), term(*))');

  if (studentsResp.error || invoicesResp.error || paymentsResp.error) {
    throw new Error('Failed to build director summary');
  }

  const students = normalize(studentsResp.data || []);
  const invoices = normalize(invoicesResp.data || []);
  const payments = normalize(paymentsResp.data || []);

  const totalStudents = students.length;
  const totalBoarders = students.filter((student) => student.boardingStatus).length;
  const totalBusUsers = students.filter((student) => student.takesSchoolBus).length;
  const primaryStudents = students.filter((student) => student.school === 'Primary').length;
  const secondaryStudents = students.filter((student) => student.school === 'Secondary').length;

  const totalExpected = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
  const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue || 0), 0);

  const studentsByClass = Object.values(students.reduce((acc, student) => {
    const key = `${student.school || 'Unknown'}|${student.classLevel || 'Unknown'}`;
    if (!acc[key]) {
      acc[key] = { school: student.school || 'Unknown', classLevel: student.classLevel || 'Unknown', count: 0 };
    }
    acc[key].count += 1;
    return acc;
  }, {}));

  const bankData = payments.reduce((acc, payment) => {
    const bankName = payment.bankName || payment.paymentMethod || 'Unknown';
    const amount = Number(payment.amountPaid || 0);
    if (!acc[bankName]) {
      acc[bankName] = { amount: 0, percentage: 0 };
    }
    acc[bankName].amount += amount;
    return acc;
  }, {});

  const termData = invoices.reduce((acc, invoice) => {
    const term = invoice.term?.name || 'Unknown Term';
    if (!acc[term]) {
      acc[term] = { term, totalInvoices: 0, totalAmount: 0 };
    }
    acc[term].totalInvoices += 1;
    acc[term].totalAmount += Number(invoice.totalAmount || 0);
    return acc;
  }, {});

  const totalBankAmount = Object.values(bankData).reduce((sum, entry) => sum + entry.amount, 0);
  Object.values(bankData).forEach((entry) => {
    entry.percentage = totalBankAmount > 0 ? Number(((entry.amount / totalBankAmount) * 100).toFixed(2)) : 0;
  });

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const recentPaymentCount = payments.filter((payment) => new Date(payment.paymentDate || payment.createdAt) >= oneDayAgo).length;

  res.json({
    totalStudents,
    totalBoarders,
    totalBusUsers,
    primaryStudents,
    secondaryStudents,
    studentsByClass,
    totalInvoices: invoices.length,
    totalPayments: payments.length,
    recentPayments: recentPaymentCount,
    totalExpected,
    totalCollected,
    totalOutstanding,
    collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    bankAnalytics: {
      bankData,
      termData,
      totalExpected,
      totalCollected,
      totalInvoices: invoices.length,
    },
  });
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Albayyan Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

const verifySupabaseConnection = async () => {
  const { error } = await supabase.from('students').select('id').limit(1);
  if (error) {
    console.error('Supabase connection validation failed:', error.message || error);
    process.exit(1);
  }
};

export { app, verifySupabaseConnection };

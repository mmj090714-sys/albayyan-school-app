import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mock authentication - use localStorage to track login state
export const loginAdmin = async (username, password) => {
  if (username === 'admin' && password === 'ChangeMe@123Secure') {
    const token = 'admin-token-' + Date.now()
    localStorage.setItem('authToken', token)
    localStorage.setItem('userRole', 'admin')
    localStorage.setItem('username', username)
    return { token, role: 'admin', username }
  }
  throw new Error('Invalid admin credentials')
}

export const loginDirector = async (username, password) => {
  if (username === 'director' && password === 'ChangeMe@456Secure') {
    const token = 'director-token-' + Date.now()
    localStorage.setItem('authToken', token)
    localStorage.setItem('userRole', 'director')
    localStorage.setItem('username', username)
    return { token, role: 'director', username }
  }
  throw new Error('Invalid director credentials')
}

export const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
}

export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

export const getUserRole = () => {
  return localStorage.getItem('userRole')
}

// Student operations
export const fetchStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, invoices(*)')
      .order('id', { ascending: false })
    
    if (error) throw error
    
    // Format data to match expected structure
    return (data || []).map(student => ({
      id: student.id,
      admissionNumber: student.admission_number,
      firstName: student.first_name,
      lastName: student.last_name,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      phone: student.phone,
      level: student.level || 'Primary',
      busUser: student.bus_user,
      invoices: (student.invoices || []).map(inv => ({
        id: inv.id,
        term: inv.term,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.due_date
      })),
      // Calculate totals
      totalAmount: (student.invoices || []).reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
      paidAmount: (student.invoices || [])
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
      status: (student.invoices || []).length === 0 ? 'No Invoices' : 
              (student.invoices || []).every(inv => inv.status === 'Paid') ? 'Paid' : 'Partial'
    }))
  } catch (error) {
    console.error('Error fetching students:', error)
    throw error
  }
}

export const createStudent = async (studentData) => {
  try {
    let nextNumber = 1
    const { data: students } = await supabase
      .from('students')
      .select('admission_number')
      .order('id', { ascending: false })
      .limit(1)
    
    if (students && students.length > 0) {
      const lastNum = parseInt(students[0].admission_number.replace('ALB', ''))
      nextNumber = lastNum + 1
    }
    
    const admissionNumber = `ALB${String(nextNumber).padStart(3, '0')}`
    
    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          admission_number: admissionNumber,
          first_name: studentData.firstName || studentData.first_name,
          last_name: studentData.lastName || studentData.last_name,
          email: studentData.email,
          phone: studentData.phone,
          level: studentData.level || 'Primary',
          bus_user: studentData.busUser || studentData.bus_user || false
        }
      ])
      .select()
    
    if (error) throw error
    
    return {
      id: data[0].id,
      admissionNumber: data[0].admission_number,
      firstName: data[0].first_name,
      lastName: data[0].last_name,
      email: data[0].email,
      phone: data[0].phone,
      level: data[0].level,
      busUser: data[0].bus_user
    }
  } catch (error) {
    console.error('Error creating student:', error)
    throw error
  }
}

export const bulkImportStudents = async (students) => {
  try {
    let results = { successful: 0, failed: 0, errors: [], admissionNumbers: [] }
    
    // Get the last admission number
    let nextNumber = 1
    const { data: lastStudents } = await supabase
      .from('students')
      .select('admission_number')
      .order('id', { ascending: false })
      .limit(1)
    
    if (lastStudents && lastStudents.length > 0) {
      const lastNum = parseInt(lastStudents[0].admission_number.replace('ALB', ''))
      nextNumber = lastNum + 1
    }
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      
      if (!student.firstName || !student.lastName) {
        results.failed++
        results.errors.push({
          row: i + 1,
          error: 'Missing firstName or lastName'
        })
        continue
      }
      
      try {
        const admissionNumber = `ALB${String(nextNumber).padStart(3, '0')}`
        
        const { error } = await supabase
          .from('students')
          .insert([
            {
              admission_number: admissionNumber,
              first_name: student.firstName,
              last_name: student.lastName,
              email: student.email || null,
              phone: student.phone || null,
              level: student.level || 'Primary',
              bus_user: student.busUser || false
            }
          ])
        
        if (error) throw error
        
        results.successful++
        results.admissionNumbers.push(admissionNumber)
        nextNumber++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: i + 1,
          error: error.message
        })
      }
    }
    
    return results
  } catch (error) {
    console.error('Error bulk importing students:', error)
    throw error
  }
}

// Director summary
export const getDirectorSummary = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, invoices(*)')
    
    if (error) throw error
    
    const students = data || []
    const primaryCount = students.filter(s => s.level === 'Primary').length
    const secondaryCount = students.filter(s => s.level === 'Secondary').length
    const boardersCount = students.filter(s => s.bus_user === true).length
    
    return {
      totalStudents: students.length,
      primaryStudents: primaryCount,
      secondaryStudents: secondaryCount,
      boarders: boardersCount,
      students: students.map(student => ({
        id: student.id,
        admissionNumber: student.admission_number,
        firstName: student.first_name,
        lastName: student.last_name,
        name: `${student.first_name} ${student.last_name}`,
        level: student.level || 'Primary',
        busUser: student.bus_user,
        invoices: student.invoices || []
      }))
    }
  } catch (error) {
    console.error('Error fetching director summary:', error)
    throw error
  }
}

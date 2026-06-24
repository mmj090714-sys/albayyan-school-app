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

// Analytics: Bank-wise payment data
export const getBankAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, students(first_name, last_name)')
    
    if (error) throw error
    
    const invoices = data || []
    
    // Mock bank distribution for MVP (since current schema doesn't have explicit bank field)
    // In production, parse from payment_method or add dedicated bank column
    const bankData = {
      'UBA': { amount: 0, count: 0, percentage: 0 },
      'Sterling': { amount: 0, count: 0, percentage: 0 },
      'Unity': { amount: 0, count: 0, percentage: 0 },
      'Moniepoint': { amount: 0, count: 0, percentage: 0 },
      'Cash': { amount: 0, count: 0, percentage: 0 }
    }
    
    // For MVP: Simulate payment distribution
    // TODO: When payments table is created, replace with actual payment data
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    
    if (totalAmount > 0) {
      // Distribute hypothetically for demo
      bankData['UBA'].amount = Math.round(totalAmount * 0.35)
      bankData['Sterling'].amount = Math.round(totalAmount * 0.25)
      bankData['Unity'].amount = Math.round(totalAmount * 0.18)
      bankData['Moniepoint'].amount = Math.round(totalAmount * 0.15)
      bankData['Cash'].amount = totalAmount - bankData['UBA'].amount - bankData['Sterling'].amount - bankData['Unity'].amount - bankData['Moniepoint'].amount
      
      Object.keys(bankData).forEach(bank => {
        bankData[bank].percentage = ((bankData[bank].amount / totalAmount) * 100).toFixed(1)
      })
    }
    
    // Group invoices by term
    const termData = {}
    invoices.forEach(inv => {
      const term = inv.term || 'Unassigned'
      if (!termData[term]) {
        termData[term] = {
          term,
          totalInvoices: 0,
          totalAmount: 0,
          invoices: []
        }
      }
      termData[term].totalInvoices += 1
      termData[term].totalAmount += inv.amount || 0
      termData[term].invoices.push(inv)
    })
    
    return {
      bankData,
      termData,
      totalInvoices: invoices.length,
      totalExpected: totalAmount,
      invoices
    }
  } catch (error) {
    console.error('Error fetching bank analytics:', error)
    throw error
  }
}

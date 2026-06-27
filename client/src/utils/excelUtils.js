import * as XLSX from 'xlsx';

/**
 * Export students to Excel file
 * @param {Array} students - Array of student objects
 * @param {String} fileName - Name of the Excel file (without extension)
 */
export const exportStudentsToExcel = (students, fileName = 'students') => {
  try {
    // Prepare data for Excel
    const excelData = students.map((student) => ({
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Admission Number': student.admissionNumber,
      'School': student.school,
      'Class Level': student.classLevel,
      'Phone Number': student.parentPhoneNumber,
      'Boarding Status': student.boardingStatus ? 'Yes' : 'No',
      'Takes School Bus': student.takesSchoolBus ? 'Yes' : 'No',
      'Joined Date': new Date(student.joinedDate).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 18 }, // Admission Number
      { wch: 12 }, // School
      { wch: 15 }, // Class Level
      { wch: 18 }, // Phone Number
      { wch: 15 }, // Boarding Status
      { wch: 18 }, // Takes School Bus
      { wch: 15 }, // Joined Date
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFileName = `${fileName}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, finalFileName);

    return { success: true, message: `Exported ${students.length} students` };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Parse Excel file and return students data
 * @param {File} file - Excel file to parse
 * @returns {Promise<Array>} Array of student objects
 */
export const parseStudentsFromExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const students = jsonData.map((row, index) => {
          // Validate required fields
          if (!row['First Name'] || !row['Last Name']) {
            throw new Error(
              `Row ${index + 2}: First Name and Last Name are required`
            );
          }

          return {
            firstName: String(row['First Name']).trim(),
            lastName: String(row['Last Name']).trim(),
            school: String(row['School'] || 'Secondary').trim(),
            classLevel: String(row['Class Level'] || 'JSS 1').trim(),
            parentPhoneNumber: String(row['Phone Number'] || '').trim(),
            boardingStatus: String(row['Boarding Status'] || 'No').toLowerCase() === 'yes',
            takesSchoolBus: String(row['Takes School Bus'] || 'No').toLowerCase() === 'yes',
          };
        });

        if (students.length === 0) {
          reject(new Error('No student data found in Excel file'));
          return;
        }

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Create a template Excel file for bulk upload
 * @returns {void}
 */
export const downloadExcelTemplate = () => {
  try {
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'School': 'Primary',
        'Class Level': 'Grade 1',
        'Phone Number': '08012345678',
        'Boarding Status': 'No',
        'Takes School Bus': 'Yes',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'School': 'Secondary',
        'Class Level': 'JSS 1',
        'Phone Number': '08012345679',
        'Boarding Status': 'Yes',
        'Takes School Bus': 'No',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'students_template.xlsx');
  } catch (error) {
    console.error('Template download error:', error);
  }
};

/**
 * Parse payment collection Excel (with School Fee, Boarding Fee, Bus Fee breakdown)
 * @param {File} file - Excel file to parse
 * @returns {Promise} - Returns parsed payment data
 */
export const parsePaymentCollectionExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Parse the payment collection data
        const paymentData = jsonData.map((row, index) => {
          if (!row['Student Name'] || !row['Class']) {
            throw new Error(`Row ${index + 2}: Student Name and Class are required`);
          }

          // Helper to clean currency values
          const cleanAmount = (val) => {
            if (!val) return 0;
            return parseInt(String(val).replace(/[₦,]/g, '').trim()) || 0;
          };

          return {
            studentName: String(row['Student Name']).trim(),
            class: String(row['Class']).trim(),
            expectedSchoolFee: cleanAmount(row['Expected School Fee (₦)']),
            paidSchoolFee: cleanAmount(row['Paid School Fee (₦)']),
            expectedBoardingFee: cleanAmount(row['Expected Boarding Fee (₦)']),
            paidBoardingFee: cleanAmount(row['Paid Boarding Fee (₦)']),
            expectedBusFee: cleanAmount(row['Expected Bus Fee (₦)']),
            paidBusFee: cleanAmount(row['Paid Bus Fee (₦)']),
            totalPaid: cleanAmount(row['Total Paid (₦)']),
            status: String(row['Status'] || 'Unknown').trim(),
          };
        });

        if (paymentData.length === 0) {
          reject(new Error('No payment data found in Excel file'));
          return;
        }

        resolve(paymentData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Download template for payment collection import
 */
export const downloadPaymentCollectionTemplate = () => {
  try {
    const templateData = [
      {
        'Student Name': 'OLANITE SA\'AD',
        'Class': 'Reception 1',
        'Expected School Fee (₦)': 35000,
        'Paid School Fee (₦)': 25000,
        'Outstanding School Fee (₦)': 10000,
        'Expected Boarding Fee (₦)': 0,
        'Paid Boarding Fee (₦)': 0,
        'Outstanding Boarding Fee (₦)': 0,
        'Expected Bus Fee (₦)': 0,
        'Paid Bus Fee (₦)': 0,
        'Outstanding Bus Fee (₦)': 0,
        'Total Paid (₦)': 25000,
        'Total Outstanding (₦)': 10000,
        'Status': 'Part-Paid',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Student Name
      { wch: 15 }, // Class
      { wch: 18 }, // Expected School Fee
      { wch: 18 }, // Paid School Fee
      { wch: 20 }, // Outstanding School Fee
      { wch: 18 }, // Expected Boarding Fee
      { wch: 18 }, // Paid Boarding Fee
      { wch: 20 }, // Outstanding Boarding Fee
      { wch: 15 }, // Expected Bus Fee
      { wch: 15 }, // Paid Bus Fee
      { wch: 17 }, // Outstanding Bus Fee
      { wch: 12 }, // Total Paid
      { wch: 15 }, // Total Outstanding
      { wch: 12 }, // Status
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Collection');
    XLSX.writeFile(workbook, 'payment_collection_template.xlsx');
  } catch (error) {
    console.error('Template download error:', error);
  }
};

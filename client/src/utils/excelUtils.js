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

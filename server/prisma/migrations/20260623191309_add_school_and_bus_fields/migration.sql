-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Term_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admissionNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "school" TEXT NOT NULL DEFAULT 'Secondary',
    "classLevel" TEXT NOT NULL,
    "parentPhoneNumber" TEXT NOT NULL,
    "boardingStatus" BOOLEAN NOT NULL DEFAULT false,
    "takesSchoolBus" BOOLEAN NOT NULL DEFAULT false,
    "isNewStudent" BOOLEAN NOT NULL DEFAULT true,
    "joinedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "newStudentBaseTuition" REAL NOT NULL,
    "newStudentBoardingFee" REAL,
    "newStudentSchoolBusFee" REAL,
    "newStudentTotal" REAL NOT NULL,
    "returningStudentBaseTuition" REAL NOT NULL,
    "returningStudentBoardingFee" REAL,
    "returningStudentSchoolBusFee" REAL,
    "returningStudentTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeStructure_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeeStructure_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0.0,
    "balanceDue" REAL NOT NULL,
    "carriedForwardBalance" REAL NOT NULL DEFAULT 0.0,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "isNewStudent" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarryForward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "fromTermId" TEXT NOT NULL,
    "toTermId" TEXT NOT NULL,
    "balanceAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "appliedToInvoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarryForward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amountPaid" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankName" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "paidByName" TEXT NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_name_key" ON "Session"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Term_sessionId_name_key" ON "Term"("sessionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructure_sessionId_termId_classLevel_key" ON "FeeStructure"("sessionId", "termId", "classLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionReference_key" ON "Payment"("transactionReference");

# Albayyan International School Fee Management System

A comprehensive full-stack web application for managing student invoices and payment tracking at Albayyan International School.

## 🎯 Features

### Admin Dashboard
- **Student Management**: Add, view, and manage students with school level (Primary/Secondary) and class assignment
- **School Bus Tracking**: Track which students use school bus services
- **Boarding Management**: Manage boarding student status and fees
- **Fee Structure Management**: Create fee structures for different classes and terms
- **Invoice Management**: Generate invoices for students
- **Payment Tracking**: Record payments with transaction references and methods
- **Dashboard Statistics**: View key metrics (total collected, outstanding balance, collection rate)
- **Debtors Report**: Filter and print outstanding invoices by term and class
- **Admin Authentication**: Secure access with token-based authentication

### Director Portal
- **Student Supervision**: View all registered students with school and class information
- **Payment Oversight**: Monitor all payment transactions and activity
- **Real-time Notifications**: Receive alerts when payments are recorded
- **School-level Statistics**: Track Primary vs Secondary student distribution
- **Boarding & Bus Statistics**: Monitor boarding and school bus utilization
- **Financial Insights**: View total expected fees, collected amounts, and outstanding balance
- **Collection Rate Tracking**: Monitor payment collection efficiency
- **Read-only Access**: Director cannot modify student or invoice records

### Technical Highlights
- ✅ Full-stack monorepo (server + client)
- ✅ Supabase for development and production
- ✅ RESTful API with comprehensive error handling
- ✅ Responsive UI for all devices
- ✅ Role-based access control (Admin, Director)
- ✅ Dynamic class selection based on school level
- ✅ Real-time payment notifications

## 📁 Project Structure

```
alb-project/
├── server/                    # Node.js/Express backend
│   ├── server.js             # Express server with all routes
│   ├── package.json
│   ├── .env                  # Local environment configuration
│   ├── .env.example          # Example environment variables
│   └── .env.production       # Production environment guidance
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.jsx           # Home page router
│   │   ├── App.css           # Home page styles
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminDashboard.css
│   │   ├── DirectorDashboard.jsx
│   │   ├── SchoolHeader.jsx
│   │   ├── main.jsx          # React entry point
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .vscode/tasks.json        # VS Code development tasks
├── README.md
├── DEVELOPMENT.md            # Development guide
└── package.json              # Root monorepo config
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation

```bash
# 1. Install all dependencies
npm install

# 2. Configure Supabase environment variables in server/.env
# For production, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your host

# 3. Start development servers
npm run dev
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

## 🔑 Default Admin Credentials

Default development credentials are defined in `server/.env`:
- `ADMIN_USERNAME="admin"`
- `ADMIN_PASSWORD="Admin@123"`
- `DIRECTOR_USERNAME="director"`
- `DIRECTOR_PASSWORD="Director@123"`

Change these values in `server/.env` for production.

## 📊 API Endpoints

### Parent Portal
- `GET /api/students/:admissionNumber/invoices` - Get outstanding invoices

### Admin Routes (require Authorization: Bearer {ADMIN_SECRET})

**Students**
- `GET /api/admin/students` - List all students
- `POST /api/admin/students` - Create student
- `PUT /api/admin/students/:id` - Update student
- `DELETE /api/admin/students/:id` - Delete student

**Fee Structures**
- `GET /api/admin/fee-structures` - List fee structures
- `POST /api/admin/fee-structures` - Create fee structure

**Invoices**
- `GET /api/admin/invoices` - List all invoices
- `POST /api/admin/invoices` - Create invoice
- `PUT /api/admin/invoices/:id` - Update invoice status

**Payments**
- `POST /api/admin/payments` - Record payment
- `GET /api/admin/invoices/:invoiceId/payments` - Get invoice payments

**Dashboard**
- `GET /api/admin/stats` - Get dashboard statistics

## 🗄️ Database Schema

### Student
- `id` - UUID (Primary Key)
- `admissionNumber` - Unique identifier
- `firstName`, `lastName`
- `classLevel` - Class/Grade
- `sponsorEmail` - Parent email
- `boardingStatus` - Is boarder
- `createdAt`, `updatedAt`

### FeeStructure
- `id` - UUID
- `academicTerm` - e.g., "2026/2027 Term 1"
- `classLevel`
- `baseTuition`
- `boardingFee` (optional)
- `totalExpected`

### Invoice
- `id` - UUID
- `studentId` - Foreign key to Student
- `feeStructureId` - Foreign key to FeeStructure
- `totalAmount`
- `amountPaid`
- `balanceDue`
- `dueDate`
- `status` - "Unpaid", "Partial", "Paid"

### Payment
- `id` - UUID
- `invoiceId` - Foreign key to Invoice
- `amountPaid`
- `paymentMethod` - "Bank Transfer", "Cash", "Online"
- `transactionReference`
- `paymentDate`
- `recordedBy`

## 🛠️ Available Tasks

Use VS Code Task Runner (Ctrl+Shift+B):

```bash
# Development
npm run dev                           # Start both servers
npm run dev --workspace=server        # Backend only
npm run dev --workspace=client        # Frontend only

# Database
npm run db:push --workspace=server    # Sync schema
npm run prisma:studio --workspace=server  # Database GUI

# Production
npm run build                         # Build both
```

## 🔄 Database Configuration

### Development (Default)
SQLite is pre-configured for easy local development. Database file: `server/dev.db`

### Production
Update `server/.env`:
```
DATABASE_URL="postgresql://user:password@hostname:5432/albayyan_fees"
```

Then run:
```bash
npm run db:push --workspace=server
```

## 🎨 User Interfaces

### Home Page
- Portal selection (Parent / Admin)
- Clean, professional design
- Mobile responsive

### Parent Dashboard
- Admission number search
- Outstanding invoices display
- Payment tracking
- Responsive layout

### Admin Dashboard
- Complete fee management system
- Student database
- Invoice generation
- Payment recording
- Real-time statistics
- Secure login

## 📱 Responsive Design
All interfaces are fully responsive and work seamlessly on:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🔐 Security Notes

1. **Admin Authentication**: Token-based access control
2. **Environment Variables**: Sensitive data in .env files (git ignored)
3. **API Validation**: Input validation on all endpoints
4. **Error Handling**: Proper error responses without exposing internals

## 🚀 Deployment

### Backend (Node.js)
```bash
# Build
npm run build --workspace=server

# Run
npm start --workspace=server
```

### Frontend (React)
```bash
# Build
npm run build --workspace=client

# The build/ folder contains static files ready for CDN/hosting
```

## 📝 Environment Variables

### Server (.env)
```
SUPABASE_URL="https://ugcshwgjqubuhbhpxztw.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
# Optional development fallback if service role key is unavailable
SUPABASE_ANON_KEY="sb_publishable_1mttcxj1p6Sb6WzYV37Lfg_TEi87RM8"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
CORS_ORIGIN="http://localhost:3000"
PORT=5000
NODE_ENV=development
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin@123"
DIRECTOR_USERNAME="director"
DIRECTOR_PASSWORD="Director@123"
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

**Port already in use**
- Backend: Change `PORT` in `server/.env`
- Frontend: Edit `client/vite.config.js`

**Database errors**
- Ensure `server/dev.db` exists or re-run `npm run db:push --workspace=server`
- Check database path in `DATABASE_URL`

**Module not found**
- Run `npm install` from root directory
- Ensure both `server/` and `client/` have `node_modules/`

**API connection issues**
- Verify backend is running on configured port
- Check `VITE_API_URL` in client `.env`

## 📚 Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide and best practices
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Project setup info

## 🔮 Future Enhancements

- [ ] Payment gateway integration (Flutterwave, Paystack)
- [ ] Email notifications for due invoices
- [ ] SMS reminders
- [ ] Advanced reporting and analytics
- [ ] Student portal for self-service
- [ ] Multi-language support
- [ ] Two-factor authentication
- [ ] Automated invoice generation

## 📄 License

Proprietary - Albayyan International School

## 📞 Support

For technical support or questions, contact the development team.

---

**Last Updated**: June 16, 2026
**Version**: 1.0.0

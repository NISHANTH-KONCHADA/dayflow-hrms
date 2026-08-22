import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import companyRoutes from './routes/company.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveTypeRoutes from './routes/leaveType.routes.js';
import leaveAllocationRoutes from './routes/leaveAllocation.routes.js';
import leaveRequestRoutes from './routes/leaveRequest.routes.js';
import salaryRoutes from './routes/salary.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import payslipRoutes from './routes/payslip.routes.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dayflow API is running smoothly!',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leave-allocations', leaveAllocationRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/admin/employees', salaryRoutes);
app.use('/api/admin/payroll', payrollRoutes);
app.use('/api/payslips', payslipRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Dayflow API running on http://localhost:${PORT}`);
});

export default server;

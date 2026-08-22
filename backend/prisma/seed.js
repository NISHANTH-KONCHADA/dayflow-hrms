import bcrypt from 'bcryptjs';
import prisma, { pool } from '../src/config/db.js';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create or get Company
  let company = await prisma.company.findFirst({
    where: { name: 'Dayflow Technologies' },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Dayflow Technologies',
        email: 'contact@dayflow.com',
        phone: '+91 9876543210',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        address: 'Tower A, Cyber City, Gurugram, India',
      },
    });
    console.log('✅ Created Company:', company.name);
  }

  // 2. Create Payroll Settings for Company
  const existingPayrollSettings = await prisma.payrollSettings.findUnique({
    where: { companyId: company.id },
  });
  if (!existingPayrollSettings) {
    await prisma.payrollSettings.create({
      data: {
        companyId: company.id,
        defaultEmployeePfRate: 12,
        defaultEmployerPfRate: 12,
        defaultProfessionalTax: 200,
      },
    });
    console.log('✅ Created default PayrollSettings');
  }

  // 3. Create Default Leave Types
  const leaveTypesData = [
    { code: 'PAID', name: 'Paid Time Off', defaultDays: 24, requiresProof: false, isPaid: true },
    { code: 'SICK', name: 'Sick Leave', defaultDays: 7, requiresProof: true, isPaid: true },
    { code: 'UNPAID', name: 'Unpaid Leave', defaultDays: 0, requiresProof: false, isPaid: false },
  ];

  const leaveTypesMap = {};
  for (const lt of leaveTypesData) {
    const record = await prisma.leaveType.upsert({
      where: { companyId_code: { companyId: company.id, code: lt.code } },
      update: lt,
      create: { ...lt, companyId: company.id },
    });
    leaveTypesMap[lt.code] = record;
  }
  console.log('✅ Seeded Leave Types (PAID, SICK, UNPAID)');

  // 4. Create Departments
  const departments = ['Engineering', 'Human Resources', 'Finance', 'Product & Design'];
  const departmentMap = {};
  for (const deptName of departments) {
    const dept = await prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: deptName } },
      update: {},
      create: { companyId: company.id, name: deptName },
    });
    departmentMap[deptName] = dept;
  }
  console.log('✅ Seeded Departments');

  // 5. Create Job Positions
  const jobPositions = [
    { name: 'Senior Fullstack Engineer', dept: 'Engineering' },
    { name: 'HR Manager', dept: 'Human Resources' },
    { name: 'Lead Product Designer', dept: 'Product & Design' },
    { name: 'Senior Financial Analyst', dept: 'Finance' },
  ];
  const positionMap = {};
  for (const pos of jobPositions) {
    const record = await prisma.jobPosition.upsert({
      where: { companyId_name: { companyId: company.id, name: pos.name } },
      update: {},
      create: {
        companyId: company.id,
        name: pos.name,
        departmentId: departmentMap[pos.dept]?.id,
      },
    });
    positionMap[pos.name] = record;
  }
  console.log('✅ Seeded Job Positions');

  // 6. Create Skills
  const skills = ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'HR Management', 'Payroll'];
  const skillMap = {};
  for (const s of skills) {
    const record = await prisma.skill.upsert({
      where: { companyId_name: { companyId: company.id, name: s } },
      update: {},
      create: { companyId: company.id, name: s },
    });
    skillMap[s] = record;
  }
  console.log('✅ Seeded Skills');

  // 7. Create Admin User & Employee
  const adminEmail = 'admin@dayflow.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminUser) {
    const adminEmployee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeCode: 'EMP001',
        loginId: 'OIADMI20250001',
        firstName: 'System',
        lastName: 'Admin',
        personalEmail: adminEmail,
        phone: '+91 9999999999',
        dateOfJoining: new Date('2025-01-01'),
        departmentId: departmentMap['Human Resources']?.id,
        jobPositionId: positionMap['HR Manager']?.id,
      },
    });

    const adminHash = await bcrypt.hash('Admin@123456', 10);
    adminUser = await prisma.user.create({
      data: {
        companyId: company.id,
        employeeId: adminEmployee.id,
        email: adminEmail,
        passwordHash: adminHash,
        role: 'ADMIN',
        mustChangePassword: false,
        emailVerifiedAt: new Date(),
      },
    });
    console.log('✅ Created Super Admin User:', adminEmail, '(Login ID: OIADMI20250001, Pass: Admin@123456)');
  }

  // 8. Create Sample Employee (John Doe)
  const empEmail = 'john.doe@dayflow.com';
  let empUser = await prisma.user.findUnique({ where: { email: empEmail } });

  if (!empUser) {
    const employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeCode: 'EMP002',
        loginId: 'OIJODO20250001',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: empEmail,
        phone: '+91 9876543211',
        dateOfJoining: new Date('2025-01-15'),
        departmentId: departmentMap['Engineering']?.id,
        jobPositionId: positionMap['Senior Fullstack Engineer']?.id,
        panNumber: 'ABCDE1234F',
        uanNumber: '100904567890',
        address: '123 Tech Park, Bangalore, India',
        gender: 'MALE',
        nationality: 'Indian',
        maritalStatus: 'Single',
        about: 'Senior full-stack developer passionate about building scalable web applications.',
        interestsHobbies: 'Open-source contributing, chess, cycling',
      },
    });

    const empHash = await bcrypt.hash('Password@123', 10);
    empUser = await prisma.user.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        email: empEmail,
        passwordHash: empHash,
        role: 'EMPLOYEE',
        mustChangePassword: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Bank Details
    await prisma.bankDetails.create({
      data: {
        employeeId: employee.id,
        accountNumber: '123456789012',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
      },
    });

    // Working Schedule
    await prisma.workingSchedule.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        name: 'Standard 5-Day Schedule',
        workingDays: 5,
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
      },
    });

    // Skills
    if (skillMap['Node.js'] && skillMap['React']) {
      await prisma.employeeSkill.createMany({
        data: [
          { employeeId: employee.id, skillId: skillMap['Node.js'].id },
          { employeeId: employee.id, skillId: skillMap['React'].id },
          { employeeId: employee.id, skillId: skillMap['TypeScript'].id },
        ],
      });
    }

    // Leave Allocations for 2026
    const currentYear = new Date().getFullYear();
    for (const code of ['PAID', 'SICK']) {
      if (leaveTypesMap[code]) {
        await prisma.leaveAllocation.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: leaveTypesMap[code].id,
            year: currentYear,
            allocatedDays: leaveTypesMap[code].defaultDays || 0,
            usedDays: 0,
          },
        });
      }
    }

    // Salary Structure
    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        monthlyWage: 50000,
        currency: 'INR',
        employeePfRate: 12,
        employerPfRate: 12,
        professionalTax: 200,
      },
    });

    // Salary Components
    await prisma.salaryComponent.createMany({
      data: [
        {
          salaryStructureId: salaryStructure.id,
          code: 'BASIC',
          name: 'Basic Salary',
          computationType: 'PERCENTAGE',
          percentageBase: 'WAGE',
          percentage: 50.0,
          sequence: 1,
          isEarning: true,
        },
        {
          salaryStructureId: salaryStructure.id,
          code: 'HRA',
          name: 'House Rent Allowance',
          computationType: 'PERCENTAGE',
          percentageBase: 'BASIC',
          percentage: 50.0,
          sequence: 2,
          isEarning: true,
        },
        {
          salaryStructureId: salaryStructure.id,
          code: 'STANDARD_ALLOWANCE',
          name: 'Standard Allowance',
          computationType: 'FIXED',
          fixedAmount: 4167.0,
          sequence: 3,
          isEarning: true,
        },
        {
          salaryStructureId: salaryStructure.id,
          code: 'PERFORMANCE_BONUS',
          name: 'Performance Bonus',
          computationType: 'PERCENTAGE',
          percentageBase: 'BASIC',
          percentage: 8.33,
          sequence: 4,
          isEarning: true,
        },
        {
          salaryStructureId: salaryStructure.id,
          code: 'LTA',
          name: 'Leave Travel Allowance',
          computationType: 'PERCENTAGE',
          percentageBase: 'BASIC',
          percentage: 8.33,
          sequence: 5,
          isEarning: true,
        },
        {
          salaryStructureId: salaryStructure.id,
          code: 'FIXED_ALLOWANCE',
          name: 'Fixed Allowance (Remainder)',
          computationType: 'REMAINDER',
          sequence: 6,
          isEarning: true,
        },
      ],
    });

    console.log('✅ Created Sample Employee:', empEmail, '(Login ID: OIJODO20250001, Pass: Password@123)');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

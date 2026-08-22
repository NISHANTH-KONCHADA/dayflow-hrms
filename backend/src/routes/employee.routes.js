import { Router } from 'express';
import { z } from 'zod';
import { EmployeeController } from '../controllers/employee.controller.js';
import { SkillController } from '../controllers/skill.controller.js';
import { CertificationController } from '../controllers/certification.controller.js';
import { DocumentController } from '../controllers/document.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Apply auth to all employee routes
router.use(authenticateToken);

const listEmployeesSchema = {
  query: z.object({
    search: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    jobPositionId: z.string().uuid().optional(),
    role: z.enum(['ADMIN', 'HR_OFFICER', 'EMPLOYEE', 'admin', 'hr_officer', 'employee']).optional(),
    status: z.enum(['present', 'leave', 'absent', 'PRESENT', 'LEAVE', 'ABSENT']).optional(),
    sortBy: z.enum(['name', 'dateOfJoining', 'employeeCode', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

const createEmployeeSchema = {
  body: z
    .object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional(),
      email: z.string().email('Invalid email address').optional(),
      personalEmail: z.string().email('Invalid personal email address').optional(),
      phone: z.string().optional(),
      dateOfJoining: z.string().optional(),
      departmentId: z.string().uuid().optional(),
      jobPositionId: z.string().uuid().optional(),
      managerId: z.string().uuid().optional(),
      role: z.enum(['EMPLOYEE', 'HR_OFFICER']).optional(),
      // Private Info
      dateOfBirth: z.string().optional(),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
      maritalStatus: z.string().optional(),
      nationality: z.string().optional(),
      address: z.string().optional(),
      panNumber: z.string().optional(),
      uanNumber: z.string().optional(),
      // Bank Info
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      ifscCode: z.string().optional(),
      // Schedule
      workingDays: z.number().int().min(1).max(7).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakMinutes: z.number().int().optional(),
      // Salary Info
      monthlyWage: z.number().positive().optional(),
      employeePfRate: z.number().min(0).max(100).optional(),
      employerPfRate: z.number().min(0).max(100).optional(),
      professionalTax: z.number().min(0).optional(),
      // Skills & Info
      skillIds: z.array(z.string().uuid()).optional(),
      about: z.string().optional(),
      interestsHobbies: z.string().optional(),
      profilePictureUrl: z.string().optional(),
    })
    .refine((data) => data.email || data.personalEmail, {
      message: 'Either work email or personal email is required',
      path: ['email'],
    }),
};

const updateEmployeeSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().optional(),
    personalEmail: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    maritalStatus: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    panNumber: z.string().optional(),
    uanNumber: z.string().optional(),
    departmentId: z.string().uuid().optional().nullable(),
    jobPositionId: z.string().uuid().optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    role: z.enum(['EMPLOYEE', 'HR_OFFICER', 'ADMIN']).optional(),
    dateOfJoining: z.string().optional(),
    // Bank Info
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
    // Salary Info
    monthlyWage: z.number().positive().optional(),
    employeePfRate: z.number().min(0).max(100).optional(),
    employerPfRate: z.number().min(0).max(100).optional(),
    professionalTax: z.number().min(0).optional(),
    // Schedule
    workingDays: z.number().int().min(1).max(7).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    breakMinutes: z.number().int().optional(),
    // Skills
    skillIds: z.array(z.string().uuid()).optional(),
    dateOfLeaving: z.string().optional().nullable(),
    // Info
    about: z.string().optional(),
    interestsHobbies: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }),
};

const updateMeSchema = {
  body: z.object({
    phone: z.string().optional(),
    personalEmail: z.string().email('Invalid personal email address').optional(),
    address: z.string().optional(),
    about: z.string().optional(),
    interestsHobbies: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
};

const assignMeSkillSchema = {
  body: z
    .object({
      skillId: z.string().uuid('Invalid skill ID').optional(),
      name: z.string().min(1).optional(),
    })
    .refine((data) => data.skillId || data.name, {
      message: 'Either skillId or name is required',
    }),
};

const removeMeSkillSchema = {
  params: z.object({
    skillId: z.string().uuid('Invalid skill ID'),
  }),
};

const assignEmployeeSkillSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z
    .object({
      skillId: z.string().uuid('Invalid skill ID').optional(),
      name: z.string().min(1).optional(),
    })
    .refine((data) => data.skillId || data.name, {
      message: 'Either skillId or name is required',
    }),
};

const removeEmployeeSkillSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
    skillId: z.string().uuid('Invalid skill ID'),
  }),
};

const addCertificationSchema = {
  body: z.object({
    name: z.string().min(1, 'Certification name is required'),
    issuer: z.string().optional(),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    documentUrl: z.string().optional(),
  }),
};

const updateMeCertSchema = {
  params: z.object({
    certificationId: z.string().uuid('Invalid certification ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    issuer: z.string().optional(),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    documentUrl: z.string().optional(),
  }),
};

const updateEmpCertSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
    certificationId: z.string().uuid('Invalid certification ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    issuer: z.string().optional(),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    documentUrl: z.string().optional(),
  }),
};

const deleteMeCertSchema = {
  params: z.object({
    certificationId: z.string().uuid('Invalid certification ID'),
  }),
};

const deleteEmpCertSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
    certificationId: z.string().uuid('Invalid certification ID'),
  }),
};

const addDocumentSchema = {
  body: z.object({
    type: z.enum(['RESUME', 'CERTIFICATION', 'OTHER', 'resume', 'certification', 'other']).optional(),
    name: z.string().min(1, 'Document name is required'),
    fileUrl: z.string().min(1, 'File URL is required'),
    mimeType: z.string().optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
  }),
};

const listDocumentsSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  query: z.object({
    type: z.enum(['RESUME', 'CERTIFICATION', 'OTHER', 'resume', 'certification', 'other']).optional(),
  }),
};

const listMeDocumentsSchema = {
  query: z.object({
    type: z.enum(['RESUME', 'CERTIFICATION', 'OTHER', 'resume', 'certification', 'other']).optional(),
  }),
};

const deleteMeDocSchema = {
  params: z.object({
    documentId: z.string().uuid('Invalid document ID'),
  }),
};

const deleteEmpDocSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
    documentId: z.string().uuid('Invalid document ID'),
  }),
};

const uploadResumeSchema = {
  body: z.object({
    fileUrl: z.string().min(1, 'Resume file URL is required'),
    name: z.string().optional(),
    mimeType: z.string().optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
  }),
};

// Current Employee Profile (/me)
router.get('/me', EmployeeController.getCurrentProfile);
router.patch('/me', validate(updateMeSchema), EmployeeController.updateCurrentProfile);
router.put('/me', validate(updateMeSchema), EmployeeController.updateCurrentProfile);

// Current Employee Resume (/me/resume)
router.get('/me/resume', DocumentController.getResume);
router.post('/me/resume', validate(uploadResumeSchema), DocumentController.uploadResume);
router.delete('/me/resume', DocumentController.deleteResume);

// Current Employee Skills (/me/skills)
router.get('/me/skills', (req, res, next) => {
  req.params.id = req.user.employeeId;
  return SkillController.getEmployeeSkills(req, res, next);
});
router.post('/me/skills', validate(assignMeSkillSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return SkillController.assignSkill(req, res, next);
});
router.delete('/me/skills/:skillId', validate(removeMeSkillSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return SkillController.removeSkill(req, res, next);
});

// Current Employee Certifications (/me/certifications)
router.get('/me/certifications', (req, res, next) => {
  req.params.id = req.user.employeeId;
  return CertificationController.getAll(req, res, next);
});
router.post('/me/certifications', validate(addCertificationSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return CertificationController.create(req, res, next);
});
router.patch('/me/certifications/:certificationId', validate(updateMeCertSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return CertificationController.update(req, res, next);
});
router.put('/me/certifications/:certificationId', validate(updateMeCertSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return CertificationController.update(req, res, next);
});
router.delete('/me/certifications/:certificationId', validate(deleteMeCertSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return CertificationController.delete(req, res, next);
});

// Current Employee Documents (/me/documents)
router.get('/me/documents', validate(listMeDocumentsSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return DocumentController.getAll(req, res, next);
});
router.post('/me/documents', validate(addDocumentSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return DocumentController.create(req, res, next);
});
router.delete('/me/documents/:documentId', validate(deleteMeDocSchema), (req, res, next) => {
  req.params.id = req.user.employeeId;
  return DocumentController.delete(req, res, next);
});

// Employee Skills (/:id/skills)
router.get('/:id/skills', validate(getByIdSchema), SkillController.getEmployeeSkills);
router.post('/:id/skills', validate(assignEmployeeSkillSchema), SkillController.assignSkill);
router.delete('/:id/skills/:skillId', validate(removeEmployeeSkillSchema), SkillController.removeSkill);

// Employee Certifications (/:id/certifications)
router.get('/:id/certifications', validate(getByIdSchema), CertificationController.getAll);
router.post('/:id/certifications', validate({ params: z.object({ id: z.string().uuid() }), body: addCertificationSchema.body }), CertificationController.create);
router.patch('/:id/certifications/:certificationId', validate(updateEmpCertSchema), CertificationController.update);
router.put('/:id/certifications/:certificationId', validate(updateEmpCertSchema), CertificationController.update);
router.delete('/:id/certifications/:certificationId', validate(deleteEmpCertSchema), CertificationController.delete);

// Employee Documents (/:id/documents)
router.get('/:id/documents', validate(listDocumentsSchema), DocumentController.getAll);
router.post('/:id/documents', validate({ params: z.object({ id: z.string().uuid() }), body: addDocumentSchema.body }), DocumentController.create);
router.delete('/:id/documents/:documentId', validate(deleteEmpDocSchema), DocumentController.delete);

// Employee CRUD (/ and /:id)
router.get('/', validate(listEmployeesSchema), EmployeeController.getAll);
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createEmployeeSchema), EmployeeController.create);
router.get('/:id', validate(getByIdSchema), EmployeeController.getById);
router.put('/:id', validate(updateEmployeeSchema), EmployeeController.update);
router.patch('/:id', validate(updateEmployeeSchema), EmployeeController.update);
router.delete('/:id', requireRole('ADMIN'), validate(getByIdSchema), EmployeeController.delete);
router.post('/:id/reset-credentials', requireRole('ADMIN', 'HR_OFFICER'), validate(getByIdSchema), EmployeeController.resetCredentials);

export default router;

import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class DocumentService {
  /**
   * Helper to verify employee existence and permissions
   */
  static async checkEmployeeAccess({ companyId, requestingUser, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { user: true },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const isOwner = requestingUser.employeeId === employeeId || requestingUser.userId === employee.user?.id;
    const isAdminOrHr = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR_OFFICER';

    return { employee, isOwner, isAdminOrHr };
  }

  /**
   * Safe serializer for document records (handles BigInt sizeBytes)
   */
  static formatDocument(doc) {
    if (!doc) return null;
    return {
      id: doc.id,
      employeeId: doc.employeeId,
      type: doc.type,
      name: doc.name,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes !== null && doc.sizeBytes !== undefined ? Number(doc.sizeBytes) : null,
      createdAt: doc.createdAt,
    };
  }

  /**
   * List documents for an employee
   */
  static async getEmployeeDocuments({ companyId, requestingUser, employeeId, type }) {
    const { isOwner, isAdminOrHr } = await DocumentService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You do not have permission to view documents for this employee', 403);
    }

    const where = { employeeId };
    if (type) {
      where.type = type.toUpperCase();
    }

    const documents = await prisma.employeeDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(DocumentService.formatDocument);
  }

  /**
   * Upload / Add a document to an employee
   */
  static async addDocument({ companyId, requestingUser, employeeId, data }) {
    const { isOwner, isAdminOrHr } = await DocumentService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot upload documents for this employee', 403);
    }

    const { type = 'OTHER', name, fileUrl, mimeType, sizeBytes } = data;

    if (!fileUrl || !fileUrl.trim()) {
      throw new ApiError('Document fileUrl is required', 400);
    }

    if (!name || !name.trim()) {
      throw new ApiError('Document name is required', 400);
    }

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        type: type.toUpperCase(),
        name: name.trim(),
        fileUrl: fileUrl.trim(),
        mimeType: mimeType ? mimeType.trim() : null,
        sizeBytes: sizeBytes !== undefined && sizeBytes !== null ? BigInt(sizeBytes) : null,
      },
    });

    return DocumentService.formatDocument(document);
  }

  /**
   * Delete a document
   */
  static async deleteDocument({ companyId, requestingUser, employeeId, documentId }) {
    const { isOwner, isAdminOrHr } = await DocumentService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot delete documents for this employee', 403);
    }

    const existing = await prisma.employeeDocument.findFirst({
      where: { id: documentId, employeeId },
    });

    if (!existing) {
      throw new ApiError('Document not found', 404);
    }

    await prisma.employeeDocument.delete({
      where: { id: documentId },
    });

    return {
      message: `Document '${existing.name}' deleted successfully`,
      documentId,
    };
  }

  /**
   * Get active resume for an employee
   */
  static async getCurrentResume({ companyId, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const resume = await prisma.employeeDocument.findFirst({
      where: { employeeId, type: 'RESUME' },
      orderBy: { createdAt: 'desc' },
    });

    return DocumentService.formatDocument(resume);
  }

  /**
   * Upload / Update active resume for an employee
   */
  static async uploadResume({ companyId, requestingUser, employeeId, data }) {
    const { isOwner, isAdminOrHr, employee } = await DocumentService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot upload a resume for this employee', 403);
    }

    const { fileUrl, name, mimeType = 'application/pdf', sizeBytes } = data;

    if (!fileUrl || !fileUrl.trim()) {
      throw new ApiError('Resume fileUrl is required', 400);
    }

    const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ');
    const resumeName = name && name.trim() ? name.trim() : `Resume - ${fullName || 'Employee'}.pdf`;

    // Remove older resumes if replacing
    await prisma.employeeDocument.deleteMany({
      where: { employeeId, type: 'RESUME' },
    });

    const resume = await prisma.employeeDocument.create({
      data: {
        employeeId,
        type: 'RESUME',
        name: resumeName,
        fileUrl: fileUrl.trim(),
        mimeType: mimeType.trim(),
        sizeBytes: sizeBytes !== undefined && sizeBytes !== null ? BigInt(sizeBytes) : null,
      },
    });

    return DocumentService.formatDocument(resume);
  }

  /**
   * Delete active resume for an employee
   */
  static async deleteCurrentResume({ companyId, requestingUser, employeeId }) {
    const { isOwner, isAdminOrHr } = await DocumentService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot delete the resume for this employee', 403);
    }

    const deleted = await prisma.employeeDocument.deleteMany({
      where: { employeeId, type: 'RESUME' },
    });

    if (deleted.count === 0) {
      throw new ApiError('No resume found for this employee', 404);
    }

    return {
      message: 'Resume deleted successfully',
      deletedCount: deleted.count,
    };
  }
}

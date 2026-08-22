import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class CertificationService {
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
   * List certifications for an employee
   */
  static async getEmployeeCertifications({ companyId, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const certifications = await prisma.certification.findMany({
      where: { employeeId },
      orderBy: { issuedAt: 'desc' },
    });

    return certifications;
  }

  /**
   * Add a certification to an employee
   */
  static async addCertification({ companyId, requestingUser, employeeId, data }) {
    const { isOwner, isAdminOrHr } = await CertificationService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot add certifications for this employee', 403);
    }

    const { name, issuer, issuedAt, expiresAt, documentUrl } = data;

    if (!name || !name.trim()) {
      throw new ApiError('Certification name is required', 400);
    }

    const certification = await prisma.certification.create({
      data: {
        employeeId,
        name: name.trim(),
        issuer: issuer ? issuer.trim() : null,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        documentUrl: documentUrl || null,
      },
    });

    return certification;
  }

  /**
   * Update an existing certification
   */
  static async updateCertification({ companyId, requestingUser, employeeId, certificationId, data }) {
    const { isOwner, isAdminOrHr } = await CertificationService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot update certifications for this employee', 403);
    }

    const existing = await prisma.certification.findFirst({
      where: { id: certificationId, employeeId },
    });

    if (!existing) {
      throw new ApiError('Certification not found', 404);
    }

    const updatePayload = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw new ApiError('Certification name cannot be empty', 400);
      updatePayload.name = trimmed;
    }
    if (data.issuer !== undefined) {
      updatePayload.issuer = data.issuer ? data.issuer.trim() : null;
    }
    if (data.issuedAt !== undefined) {
      updatePayload.issuedAt = data.issuedAt ? new Date(data.issuedAt) : null;
    }
    if (data.expiresAt !== undefined) {
      updatePayload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.documentUrl !== undefined) {
      updatePayload.documentUrl = data.documentUrl || null;
    }

    const updated = await prisma.certification.update({
      where: { id: certificationId },
      data: updatePayload,
    });

    return updated;
  }

  /**
   * Delete a certification
   */
  static async deleteCertification({ companyId, requestingUser, employeeId, certificationId }) {
    const { isOwner, isAdminOrHr } = await CertificationService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot delete certifications for this employee', 403);
    }

    const existing = await prisma.certification.findFirst({
      where: { id: certificationId, employeeId },
    });

    if (!existing) {
      throw new ApiError('Certification not found', 404);
    }

    await prisma.certification.delete({
      where: { id: certificationId },
    });

    return {
      message: `Certification '${existing.name}' deleted successfully`,
      certificationId,
    };
  }
}

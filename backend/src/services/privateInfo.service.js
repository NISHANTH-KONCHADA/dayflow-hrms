import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class PrivateInfoService {
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
   * Get employee private information
   */
  static async getPrivateInfo({ companyId, requestingUser, employeeId }) {
    const { employee, isOwner, isAdminOrHr } = await PrivateInfoService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You do not have permission to view private info for this employee', 403);
    }

    return {
      employeeId: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      nationality: employee.nationality,
      address: employee.address,
      panNumber: employee.panNumber,
      uanNumber: employee.uanNumber,
      personalEmail: employee.personalEmail,
      phone: employee.phone,
    };
  }

  /**
   * Update employee private information
   */
  static async updatePrivateInfo({ companyId, requestingUser, employeeId, data }) {
    const { employee, isOwner, isAdminOrHr } = await PrivateInfoService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot modify private info for this employee', 403);
    }

    const updatePayload = {};

    if (isAdminOrHr) {
      if (data.dateOfBirth !== undefined) updatePayload.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
      if (data.gender !== undefined) updatePayload.gender = data.gender;
      if (data.nationality !== undefined) updatePayload.nationality = data.nationality;
      if (data.panNumber !== undefined) updatePayload.panNumber = data.panNumber;
      if (data.uanNumber !== undefined) updatePayload.uanNumber = data.uanNumber;
    }

    // Editable by both employee & admin
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.maritalStatus !== undefined) updatePayload.maritalStatus = data.maritalStatus;
    if (data.personalEmail !== undefined) updatePayload.personalEmail = data.personalEmail;
    if (data.phone !== undefined) updatePayload.phone = data.phone;

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: updatePayload,
    });

    return {
      employeeId: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      maritalStatus: updated.maritalStatus,
      nationality: updated.nationality,
      address: updated.address,
      panNumber: updated.panNumber,
      uanNumber: updated.uanNumber,
      personalEmail: updated.personalEmail,
      phone: updated.phone,
    };
  }
}

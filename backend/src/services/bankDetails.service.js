import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class BankDetailsService {
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
   * Get employee bank details
   */
  static async getBankDetails({ companyId, requestingUser, employeeId }) {
    const { isOwner, isAdminOrHr } = await BankDetailsService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You do not have permission to view bank details for this employee', 403);
    }

    const bankDetails = await prisma.bankDetails.findUnique({
      where: { employeeId },
    });

    return bankDetails;
  }

  /**
   * Upsert / Update employee bank details
   */
  static async updateBankDetails({ companyId, requestingUser, employeeId, data }) {
    const { isOwner, isAdminOrHr } = await BankDetailsService.checkEmployeeAccess({
      companyId,
      requestingUser,
      employeeId,
    });

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot modify bank details for this employee', 403);
    }

    const { accountNumber, bankName, ifscCode } = data;

    const existing = await prisma.bankDetails.findUnique({
      where: { employeeId },
    });

    const finalAccountNumber = accountNumber || existing?.accountNumber;
    const finalBankName = bankName || existing?.bankName;
    const finalIfscCode = ifscCode || existing?.ifscCode;

    if (!finalAccountNumber || !finalBankName || !finalIfscCode) {
      throw new ApiError('accountNumber, bankName, and ifscCode are required', 400);
    }

    const bankDetails = await prisma.bankDetails.upsert({
      where: { employeeId },
      update: {
        accountNumber: accountNumber || undefined,
        bankName: bankName || undefined,
        ifscCode: ifscCode || undefined,
      },
      create: {
        employeeId,
        accountNumber: finalAccountNumber,
        bankName: finalBankName,
        ifscCode: finalIfscCode,
      },
    });

    return bankDetails;
  }
}

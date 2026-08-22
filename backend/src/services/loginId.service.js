import prisma from '../config/db.js';

export class LoginIdService {
  /**
   * Generates Login ID in format: [CompanyCode][2 letters First][2 letters Last][Year][4 digit Serial]
   * Example: OIJODO20260001
   */
  static async generate({ companyId, firstName, lastName, dateOfJoining }) {
    // 1. Company Code (default 'OI' or derived from company name initials)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    let companyCode = 'OI';
    if (company && company.name) {
      const words = company.name.trim().split(/\s+/);
      if (words.length >= 2) {
        companyCode = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words[0].length >= 2) {
        companyCode = words[0].slice(0, 2).toUpperCase();
      }
    }

    // 2. First 2 letters of first name and last name
    const cleanFirst = (firstName || 'EM').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const cleanLast = (lastName || 'XX').replace(/[^a-zA-Z]/g, '').toUpperCase();

    const fn2 = (cleanFirst + 'XX').slice(0, 2);
    const ln2 = (cleanLast + 'XX').slice(0, 2);
    const nameCode = fn2 + ln2;

    // 3. Joining year
    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const year = joiningDate.getFullYear();

    // 4. Calculate next serial number for this company and year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const countInYear = await prisma.employee.count({
      where: {
        companyId,
        dateOfJoining: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    const serialNum = (countInYear + 1).toString().padStart(4, '0');
    let loginId = `${companyCode}${nameCode}${year}${serialNum}`;

    // Ensure uniqueness in case of collisions
    let exists = await prisma.employee.findFirst({
      where: { loginId },
    });

    let extraIncrement = 1;
    while (exists) {
      const altSerial = (countInYear + 1 + extraIncrement).toString().padStart(4, '0');
      loginId = `${companyCode}${nameCode}${year}${altSerial}`;
      exists = await prisma.employee.findFirst({
        where: { loginId },
      });
      extraIncrement++;
    }

    return loginId;
  }
}

import XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { createExtractorFromData } from 'node-unrar-js';
import db from '../models/index.js';
import { hashUserPassword } from './loginRegisterService.js';

const SUPPER_TEACHER_GROUP_ID = 6;

/**
 * Unified archive entry: { name: string, isDirectory: boolean, getData: () => Buffer }
 */
const extractArchiveEntries = async (buffer) => {
  // Detect format by magic bytes
  const isRar = buffer[0] === 0x52 && buffer[1] === 0x61 && buffer[2] === 0x72;

  if (isRar) {
    const extractor = await createExtractorFromData({ data: buffer });
    const extracted = extractor.extract();
    const files = [...extracted.files];
    return files.map(f => ({
      name: f.fileHeader.name.replace(/\\/g, '/'),
      isDirectory: f.fileHeader.flags.directory,
      getData: () => Buffer.from(f.extraction),
    }));
  }

  // ZIP
  const zip = new AdmZip(buffer);
  return zip.getEntries().map(e => ({
    name: e.entryName,
    isDirectory: e.isDirectory,
    getData: () => e.getData(),
  }));
};

/**
 * Parse a date value from Excel cell.
 * Excel dates can be serial numbers or strings.
 */
const parseExcelDate = (val) => {
  if (val == null || val === '') return null;
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(val).trim();
  if (!s) return null;
  // Try dd/MM/yyyy
  const ddmmyyyy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  // Try yyyy-MM-dd
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  return null;
};

const cellStr = (val) => (val == null ? null : String(val).trim() || null);

/**
 * Extract hyperlink target or text from a cell.
 * XLSX stores hyperlinks in sheet['!hyperlinks'] or cell.l.Target
 */
const extractHyperlink = (cell) => {
  if (!cell) return null;
  if (cell.l && cell.l.Target) return cell.l.Target;
  return cellStr(cell.v);
};

/**
 * Parse one row into a profile data object.
 * Columns: A=STT, B=name, C=gender, D=dob, E=cccd, F=phone, G=address,
 * H=gcnGv, I=gcnCs, J=issueDate, K=gcnGvExp, L=gcnCsExp, M=skip,
 * N=teachingLC, O=licenseNumber, P=licenseClass, Q=skip, R=qualification,
 * S=educationLevel, T=seniority, U=avatar
 */
const parseRow = (row, sheet, rowIdx) => {
  const cccd = cellStr(row['E']);
  const fullName = cellStr(row['B']);
  if (!cccd || !fullName) return null;

  // Avatar: try to get hyperlink from sheet
  const avatarCellRef = `U${rowIdx}`;
  const avatarCell = sheet[avatarCellRef];
  const avatarLink = extractHyperlink(avatarCell);

  return {
    cccd,
    fullName,
    gender: cellStr(row['C']),
    dateOfBirth: parseExcelDate(row['D']),
    phone: cellStr(row['F']),
    address: cellStr(row['G']),
    gcnGvNumber: cellStr(row['H']),
    gcnCsNumber: cellStr(row['I']),
    gcnIssueDate: parseExcelDate(row['J']),
    gcnGvExpiry: parseExcelDate(row['K']),
    gcnCsExpiry: parseExcelDate(row['L']),
    teachingLicenseClass: cellStr(row['N']),
    licenseNumber: cellStr(row['O']),
    licenseClass: cellStr(row['P']),
    qualification: cellStr(row['R']),
    educationLevel: cellStr(row['S']),
    seniority: cellStr(row['T']),
    avatarLink,
  };
};

/**
 * Resolve avatar file from ZIP entries.
 * @param {string|null} avatarLink  hyperlink text from Excel
 * @param {Map<string, import('adm-zip').IZipEntry>} avatarMap  lowercase filename → entry
 * @returns {Buffer|null}
 */
const resolveAvatarBuffer = (avatarLink, avatarMap) => {
  if (!avatarLink) return null;
  // Extract just the filename from a path like "avatar/abc.jpg" or full URL
  const basename = path.basename(avatarLink).toLowerCase();
  const entry = avatarMap.get(basename);
  if (!entry) return null;
  return entry.getData();
};

/**
 * Main import function.
 * @param {Buffer} zipBuffer  the uploaded ZIP file buffer
 * @param {number} adminId    the admin performing the import
 * @returns {Promise<{created: number, updated: number, demoted: number, errors: Array}>}
 */
export const importSupperTeachersFromZip = async (archiveBuffer, adminId) => {
  const entries = await extractArchiveEntries(archiveBuffer);

  // Find Excel file
  const xlsxEntry = entries.find(e =>
    !e.isDirectory && /\.xlsx?$/i.test(e.name) && !e.name.startsWith('__MACOSX')
  );
  if (!xlsxEntry) throw Object.assign(new Error('Không tìm thấy file Excel (.xlsx) trong file nén'), { code: 'NO_EXCEL' });

  // Build avatar map: lowercase filename → entry
  const avatarMap = new Map();
  for (const e of entries) {
    if (e.isDirectory) continue;
    const lower = e.name.toLowerCase();
    if (lower.includes('avatar') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(e.name)) {
      avatarMap.set(path.basename(e.name).toLowerCase(), e);
    }
  }

  // Parse Excel
  const workbook = XLSX.read(xlsxEntry.getData(), { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  // Find header row (first row with "CCCD" or "Họ và tên")
  let headerRowIdx = 1;
  for (let r = range.s.r; r <= Math.min(range.s.r + 5, range.e.r); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const v = cellStr(sheet[cellRef]?.v);
      if (v && /cccd|cmt|hộ chiếu/i.test(v)) {
        headerRowIdx = r + 2; // data starts after header (1-indexed in sheet = r+1, data = r+2)
        break;
      }
    }
    if (headerRowIdx > 1) break;
  }

  // Parse rows using column letters
  const rows = [];
  for (let r = headerRowIdx - 1; r <= range.e.r; r++) {
    const rowObj = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const col = XLSX.utils.encode_col(c);
      rowObj[col] = sheet[cellRef]?.v;
    }
    const parsed = parseRow(rowObj, sheet, r + 1);
    if (parsed) {
      rows.push({ ...parsed, excelRow: r + 1 });
    }
  }

  if (rows.length === 0) {
    throw Object.assign(new Error('File Excel không có dữ liệu hợp lệ (thiếu CCCD hoặc Họ tên)'), { code: 'EMPTY_DATA' });
  }

  // Process in transaction
  const { Op } = db.Sequelize;
  const transaction = await db.sequelize.transaction();
  const errors = [];
  let created = 0;
  let updated = 0;
  const importedCccds = [];

  try {
    for (const row of rows) {
      try {
        // Check if user with this CCCD exists via instructor_profile or hoc_vien
        let existingUser = null;
        const existingProfile = await db.instructor_profile.findOne({
          where: { cccd: row.cccd },
          transaction,
        });

        if (existingProfile) {
          existingUser = await db.user.findByPk(existingProfile.userId, { transaction });
        }

        if (existingUser) {
          // Check ownership
          if (existingUser.adminId && existingUser.adminId !== adminId) {
            errors.push({ row: row.excelRow, message: `CCCD ${row.cccd} thuộc admin khác` });
            continue;
          }

          // Update user
          const userUpdates = { staffType: 'official', adminId };
          if (row.fullName) userUpdates.username = row.fullName;
          if (row.phone) userUpdates.phone = row.phone;
          if (row.address) userUpdates.address = row.address;
          await existingUser.update(userUpdates, { transaction });

          // Update or create profile
          const profileData = buildProfileData(row);
          if (existingProfile) {
            await existingProfile.update({ ...profileData, importedAt: new Date() }, { transaction });
          } else {
            await db.instructor_profile.create(
              { userId: existingUser.id, ...profileData, importedAt: new Date() },
              { transaction }
            );
          }

          // Avatar
          const avatarBuf = resolveAvatarBuffer(row.avatarLink, avatarMap);
          if (avatarBuf) {
            await existingUser.update({ image: avatarBuf }, { transaction });
          }

          updated++;
        } else {
          // Create new user — password defaults to CCCD, login via instructor_profile.cccd
          const hashedPw = hashUserPassword(row.cccd);

          const newUser = await db.user.create({
            email: null,
            username: row.fullName,
            password: hashedPw,
            phone: row.phone || null,
            address: row.address || null,
            groupId: SUPPER_TEACHER_GROUP_ID,
            adminId,
            active: 1,
            staffType: 'official',
            image: resolveAvatarBuffer(row.avatarLink, avatarMap) || null,
          }, { transaction });

          // Create profile
          const profileData = buildProfileData(row);
          await db.instructor_profile.create(
            { userId: newUser.id, ...profileData, importedAt: new Date() },
            { transaction }
          );

          created++;
        }

        importedCccds.push(row.cccd);
      } catch (rowErr) {
        errors.push({ row: row.excelRow, message: rowErr.message || 'Lỗi không xác định' });
      }
    }

    // Demote: all STs under this admin NOT in importedCccds → auxiliary
    const allStProfiles = await db.instructor_profile.findAll({
      include: [{
        model: db.user,
        as: 'user',
        where: { adminId, groupId: SUPPER_TEACHER_GROUP_ID, staffType: 'official' },
        attributes: ['id'],
      }],
      attributes: ['cccd'],
      transaction,
    });

    const todemoteUserIds = [];
    for (const p of allStProfiles) {
      if (!importedCccds.includes(p.cccd)) {
        todemoteUserIds.push(p.user.id);
      }
    }

    let demoted = 0;
    if (todemoteUserIds.length > 0) {
      const [affectedCount] = await db.user.update(
        { staffType: 'auxiliary' },
        { where: { id: { [Op.in]: todemoteUserIds } }, transaction }
      );
      demoted = affectedCount;
    }

    // Also demote STs without profile that were previously official
    await db.user.update(
      { staffType: 'auxiliary' },
      {
        where: {
          adminId,
          groupId: SUPPER_TEACHER_GROUP_ID,
          staffType: 'official',
          id: {
            [Op.notIn]: db.sequelize.literal(
              '(SELECT userId FROM instructor_profile WHERE cccd IN (' +
              importedCccds.map(c => `'${c.replace(/'/g, "''")}'`).join(',') +
              '))'
            ),
          },
        },
        transaction,
      }
    );

    await transaction.commit();
    return { created, updated, demoted, errors };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Build profile data object from parsed row (only non-null values).
 */
const buildProfileData = (row) => {
  const data = {
    cccd: row.cccd,
    fullName: row.fullName,
  };
  if (row.gender != null) data.gender = row.gender;
  if (row.dateOfBirth != null) data.dateOfBirth = row.dateOfBirth;
  if (row.address != null) data.residence = row.address;
  if (row.gcnGvNumber != null) data.gcnGvNumber = row.gcnGvNumber;
  if (row.gcnCsNumber != null) data.gcnCsNumber = row.gcnCsNumber;
  if (row.gcnIssueDate != null) data.gcnIssueDate = row.gcnIssueDate;
  if (row.gcnGvExpiry != null) data.gcnGvExpiry = row.gcnGvExpiry;
  if (row.gcnCsExpiry != null) data.gcnCsExpiry = row.gcnCsExpiry;
  if (row.teachingLicenseClass != null) data.teachingLicenseClass = row.teachingLicenseClass;
  if (row.licenseNumber != null) data.licenseNumber = row.licenseNumber;
  if (row.licenseClass != null) data.licenseClass = row.licenseClass;
  if (row.qualification != null) data.qualification = row.qualification;
  if (row.educationLevel != null) data.educationLevel = row.educationLevel;
  if (row.seniority != null) data.seniority = row.seniority;
  return data;
};

/**
 * Generate Excel template buffer.
 */
export const generateTemplate = () => {
  const headers = [
    'STT', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Số CCCD/CMT/Hộ chiếu',
    'Điện thoại', 'Nơi cư trú', 'Số GCN GV', 'Số GCN CS',
    'Ngày cấp', 'Ngày hết hạn GCN GV', 'Ngày hết hạn GCN CS',
    '(Bỏ qua)', 'Hạng GPLX được phép dạy', 'Số GPLX', 'Hạng GPLX',
    '(Bỏ qua)', 'Trình độ chuyên môn', 'Trình độ văn hóa', 'Thâm niên',
    'Ảnh giáo viên',
  ];
  const sampleRow = [
    1, 'Nguyễn Văn A', 'Nam', '15/06/1985', '079012345678',
    '0901234567', 'TP.HCM', 'GV-001', 'CS-001',
    '01/01/2020', '01/01/2025', '01/01/2025',
    '', 'B1, B2', 'GP-123456', 'B2',
    '', 'Đại học', '12/12', '10 năm',
    'avatar/nguyen_van_a.jpg',
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

  // Set column widths
  ws['!cols'] = headers.map((h, i) => ({ wch: i === 6 ? 30 : i === 1 ? 25 : 18 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách giáo viên');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

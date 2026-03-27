import db from '../models/index.js';
import XLSX from 'xlsx';

/**
 * Import review sets (bộ đề ôn tập) from Excel file.
 *
 * Excel format per sheet:
 *   Row 0: Title — "BỘ ĐỀ ÔN TẬP • Hạng B ..." (ignored)
 *   Row 1: Headers — "Đề | C1 | C2 | ... | CN"
 *   Row 2+: Data   — "1  | 127 | 80 | ..."
 *
 * Sheet name must match rank.name (e.g. "B", "A1", "C").
 */
const importReviewSets = async (file) => {
  if (!file) return { EM: 'File không được để trống', EC: 2, DT: [] };

  try {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    // Pre-load all questions: number → id
    const allQuestions = await db.question.findAll({ attributes: ['id', 'number'], raw: true });
    const questionMap = new Map(allQuestions.map((q) => [q.number, q.id]));

    const results = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length < 3) {
        results.push({ sheet: sheetName, status: 'skipped', reason: 'Không đủ dữ liệu (cần ít nhất 3 dòng)' });
        continue;
      }

      // Find rank by sheet name
      const rank = await db.rank.findOne({ where: { name: sheetName } });
      if (!rank) {
        results.push({ sheet: sheetName, status: 'skipped', reason: `Không tìm thấy hạng "${sheetName}" trong DB` });
        continue;
      }

      // Count question columns from header row (row index 1, skip col 0 = "Đề")
      const headerRow = data[1] ?? [];
      const questionColumnCount = headerRow.slice(1).filter((h) => h != null && String(h).trim() !== '').length;

      if (questionColumnCount === 0) {
        results.push({ sheet: sheetName, status: 'skipped', reason: 'Không tìm thấy cột câu hỏi trong header' });
        continue;
      }

      // Delete existing review sets for this rank
      await db.reviewSet.destroy({ where: { IDRank: rank.id } });

      // Process data rows (skip row 0 = title, row 1 = header)
      const dataRows = data.slice(2);
      let setsCreated = 0;
      const notFoundNumbers = new Set();

      for (const row of dataRows) {
        const setIndex = parseInt(row[0]);
        if (isNaN(setIndex)) continue;

        const questionNumbers = [];
        for (let col = 1; col <= questionColumnCount; col++) {
          const qNum = parseInt(row[col]);
          if (!isNaN(qNum)) questionNumbers.push(qNum);
        }

        const newSet = await db.reviewSet.create({
          name: `Bộ ôn tập ${String(setIndex).padStart(2, '0')} — Hạng ${rank.name}`,
          IDRank: rank.id,
          setIndex,
          totalQuestions: questionNumbers.length,
        });

        const junctionRows = [];
        questionNumbers.forEach((qNum, idx) => {
          const qId = questionMap.get(qNum);
          if (!qId) { notFoundNumbers.add(qNum); return; }
          junctionRows.push({
            IDReviewSet: newSet.id,
            IDQuestion: qId,
            orderIndex: idx + 1,
          });
        });

        if (junctionRows.length > 0) {
          await db.reviewSetQuestion.bulkCreate(junctionRows);
        }
        setsCreated++;
      }

      results.push({
        sheet: sheetName,
        rank: rank.name,
        setsCreated,
        questionsPerSet: questionColumnCount,
        notFoundCount: notFoundNumbers.size,
        status: 'success',
      });
    }

    const totalSets = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (r.setsCreated ?? 0), 0);

    return {
      EM: `Import hoàn tất — ${totalSets} bộ ôn tập được tạo`,
      EC: 0,
      DT: results,
    };
  } catch (error) {
    console.error('importReviewSets error:', error);
    return { EM: 'Có lỗi xảy ra trong quá trình import', EC: -1, DT: [] };
  }
};

module.exports = { importReviewSets };

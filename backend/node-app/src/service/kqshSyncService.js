import sql from 'mssql';
import db from '../models/index.js';
import { getMssqlPool } from '../config/mssqlClient.js';

const BATCH_SIZE = 500;

const THISINH_QUERY = `
  SELECT
    MaKySH, SoBaoDanh, SoCMT,
    HoVaTen, NgaySinh, HangGPLX,
    MaKhoaHoc, NgayTao AS NgaySH, KetQuaSH,
    KetQuaSHLT AS DiemLyThuyet, KetQuaSHTH AS DiemHinh,
    KetQuaSHD  AS DiemDuong,    KetQuaSHM  AS DiemMoPhong,
    SoQDSH
  FROM ThiSinh
  WHERE SoCMT IN (PARAMS)
`;

const SUBJECTS_QUERY = `
  SELECT LoaiSH, NgaySH, DiemSH, DiemToiDa, DiemToiThieu, VangSH, KetQuaSH
  FROM ThiSinh_KQSH
  WHERE MaKySH = @maKySH AND SoBaoDanh = @soBaoDanh
`;

async function fetchThisinhBatch(pool, cccdBatch) {
  const req = pool.request();
  const params = cccdBatch.map((_, idx) => {
    req.input(`c${idx}`, sql.NVarChar, cccdBatch[idx]);
    return `@c${idx}`;
  });
  const result = await req.query(THISINH_QUERY.replace('PARAMS', params.join(',')));
  return result.recordset;
}

async function fetchSubjects(pool, maKySH, soBaoDanh) {
  const result = await pool.request()
    .input('maKySH', sql.NVarChar, maKySH)
    .input('soBaoDanh', sql.Int, soBaoDanh)
    .query(SUBJECTS_QUERY);
  return result.recordset;
}

export async function syncKQSH() {
  const hocVienList = await db.hoc_vien.findAll({
    where: { SoCCCD: { [db.Sequelize.Op.not]: null } },
    attributes: ['id', 'SoCCCD'],
  });

  console.log(`[KQSH Sync] Tìm thấy ${hocVienList.length} học viên có CCCD`);

  if (!hocVienList.length) {
    return { synced: 0, skipped: 0, errors: [] };
  }

  const cccdMap = Object.fromEntries(
    hocVienList.map((h) => [h.SoCCCD.trim(), h.id])
  );
  const cccdList = Object.keys(cccdMap);

  const pool = await getMssqlPool();

  const allThisinh = [];
  for (let i = 0; i < cccdList.length; i += BATCH_SIZE) {
    const batch = cccdList.slice(i, i + BATCH_SIZE);
    const records = await fetchThisinhBatch(pool, batch);
    allThisinh.push(...records);
    console.log(`[KQSH Sync] Batch ${Math.floor(i / BATCH_SIZE) + 1}: nhận ${records.length} ThiSinh`);
  }

  console.log(`[KQSH Sync] Tổng ThiSinh từ SQL Server: ${allThisinh.length}`);

  const errors = [];
  let synced = 0;

  const t = await db.sequelize.transaction();
  try {
    for (const ts of allThisinh) {
      const cccd = ts.SoCMT?.trim();
      const hocVienId = cccdMap[cccd] ?? null;

      await db.kqsh_thisinh.upsert(
        {
          hocVienId,
          SoCCCD:       cccd,
          MaKySH:       ts.MaKySH,
          SoBaoDanh:    ts.SoBaoDanh,
          HoVaTen:      ts.HoVaTen,
          NgaySinh:     ts.NgaySinh,
          HangGPLX:     ts.HangGPLX,
          MaKhoaHoc:    ts.MaKhoaHoc,
          NgaySH:       ts.NgaySH,
          KetQuaSH:     ts.KetQuaSH,
          DiemLyThuyet: ts.DiemLyThuyet,
          DiemHinh:     ts.DiemHinh,
          DiemDuong:    ts.DiemDuong,
          DiemMoPhong:  ts.DiemMoPhong,
          SoQDSH:       ts.SoQDSH,
        },
        { transaction: t }
      );

      const thisinhRow = await db.kqsh_thisinh.findOne({
        where: { MaKySH: ts.MaKySH, SoBaoDanh: ts.SoBaoDanh },
        transaction: t,
      });

      const subjects = await fetchSubjects(pool, ts.MaKySH, ts.SoBaoDanh);

      for (const sub of subjects) {
        if (!sub.LoaiSH) continue;
        await db.kqsh_subjects.upsert(
          {
            thisinhId:    thisinhRow.id,
            MaKySH:       ts.MaKySH,
            SoBaoDanh:    ts.SoBaoDanh,
            LoaiSH:       sub.LoaiSH,
            NgaySH:       sub.NgaySH,
            DiemSH:       sub.DiemSH,
            DiemToiDa:    sub.DiemToiDa,
            DiemToiThieu: sub.DiemToiThieu,
            VangSH:       sub.VangSH,
            KetQuaSH:     sub.KetQuaSH,
          },
          { transaction: t }
        );
      }

      synced++;
    }

    await t.commit();
    console.log(`[KQSH Sync] Hoàn tất: ${synced} bản ghi đã sync`);
  } catch (err) {
    await t.rollback();
    console.error('[KQSH Sync] Lỗi, rollback:', err.message);
    throw err;
  }

  return {
    synced,
    skipped: cccdList.length - allThisinh.length,
    errors,
  };
}

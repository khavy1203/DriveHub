'use strict';

// Helper: chỉ tạo index nếu chưa tồn tại
async function addIndexIfNotExists(queryInterface, table, fields, options = {}) {
    try {
        await queryInterface.addIndex(table, fields, options);
    } catch (e) {
        if (!e.message.includes('Duplicate key name') && !e.message.includes('already exists')) {
            throw e;
        }
    }
}

module.exports = {
    up: async (queryInterface) => {
        // ── thisinh ──────────────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'thisinh', ['IDKhoaHoc'], { name: 'idx_thisinh_khoahoc' });
        await addIndexIfNotExists(queryInterface, 'thisinh', ['loaibangthi'], { name: 'idx_thisinh_rank' });

        // ── khoahoc_thisinh ───────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'khoahoc_thisinh', ['IDThiSinh'], { name: 'idx_kts_thisinh' });
        await addIndexIfNotExists(queryInterface, 'khoahoc_thisinh', ['IDKhoaHoc'], { name: 'idx_kts_khoahoc' });
        await addIndexIfNotExists(queryInterface, 'khoahoc_thisinh', ['SoBaoDanh'], { name: 'idx_kts_sbd' });
        await addIndexIfNotExists(queryInterface, 'khoahoc_thisinh', ['IDstatus'], { name: 'idx_kts_status' });
        // composite: tìm thí sinh theo khóa + SBD (dùng nhiều nhất)
        await addIndexIfNotExists(queryInterface, 'khoahoc_thisinh', ['IDKhoaHoc', 'SoBaoDanh'], { name: 'idx_kts_khoahoc_sbd' });

        // ── exam ─────────────────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'exam', ['IDThiSinh'], { name: 'idx_exam_thisinh' });
        await addIndexIfNotExists(queryInterface, 'exam', ['IDSubject'], { name: 'idx_exam_subject' });
        await addIndexIfNotExists(queryInterface, 'exam', ['IDTest'], { name: 'idx_exam_test' });
        // composite: check exam của thí sinh theo môn
        await addIndexIfNotExists(queryInterface, 'exam', ['IDThiSinh', 'IDSubject'], { name: 'idx_exam_thisinh_subject' });

        // ── test ─────────────────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'test', ['IDSubject'], { name: 'idx_test_subject' });

        // ── test_question ─────────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'test_question', ['IDTest'], { name: 'idx_tq_test' });
        await addIndexIfNotExists(queryInterface, 'test_question', ['IDQuestion'], { name: 'idx_tq_question' });

        // ── subject ───────────────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'subject', ['IDRank'], { name: 'idx_subject_rank' });

        // ── visitor_stats ─────────────────────────────────────────
        await addIndexIfNotExists(queryInterface, 'visitor_stats', ['id'], { name: 'idx_visitor_id' });
    },

    down: async (queryInterface) => {
        const indexes = [
            ['thisinh', 'idx_thisinh_khoahoc'],
            ['thisinh', 'idx_thisinh_rank'],
            ['khoahoc_thisinh', 'idx_kts_thisinh'],
            ['khoahoc_thisinh', 'idx_kts_khoahoc'],
            ['khoahoc_thisinh', 'idx_kts_sbd'],
            ['khoahoc_thisinh', 'idx_kts_status'],
            ['khoahoc_thisinh', 'idx_kts_khoahoc_sbd'],
            ['exam', 'idx_exam_thisinh'],
            ['exam', 'idx_exam_subject'],
            ['exam', 'idx_exam_test'],
            ['exam', 'idx_exam_thisinh_subject'],
            ['test', 'idx_test_subject'],
            ['test_question', 'idx_tq_test'],
            ['test_question', 'idx_tq_question'],
            ['subject', 'idx_subject_rank'],
            ['visitor_stats', 'idx_visitor_id'],
        ];
        for (const [table, name] of indexes) {
            try { await queryInterface.removeIndex(table, name); } catch (_) {}
        }
    }
};

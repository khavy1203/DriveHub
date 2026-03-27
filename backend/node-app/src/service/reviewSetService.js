import db from '../models/index.js';
const { Op } = require('sequelize');
const cache = require('../cache/memoryCache');

const QUESTIONS_PER_SET = 20;

/**
 * Get all review sets for a rank (ordered by setIndex).
 */
const getReviewSetsByRank = async (rankId) => {
  if (!rankId) return { EM: 'rankId is required', EC: 2, DT: [] };

  const CACHE_KEY = `review_sets_rank_${rankId}`;
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const sets = await db.reviewSet.findAll({
      where: { IDRank: rankId },
      order: [['setIndex', 'ASC']],
      attributes: ['id', 'name', 'setIndex', 'totalQuestions'],
    });
    const result = { EM: 'success', EC: 0, DT: sets };
    cache.set(CACHE_KEY, result, 10 * 60 * 1000);
    return result;
  } catch (e) {
    console.error('getReviewSetsByRank error:', e);
    return { EM: 'error from server', EC: -1, DT: [] };
  }
};

/**
 * Get questions for a specific review set (includes tip).
 */
const getReviewSetQuestions = async (reviewSetId) => {
  if (!reviewSetId) return { EM: 'reviewSetId is required', EC: 2, DT: [] };

  const CACHE_KEY = `review_set_questions_${reviewSetId}`;
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const set = await db.reviewSet.findByPk(reviewSetId, {
      include: [
        {
          model: db.question,
          as: 'questions',
          attributes: ['id', 'number', 'answer', 'totalOptions', 'URLImage', 'tip', 'reason'],
          through: {
            attributes: ['orderIndex'],
          },
        },
        {
          model: db.rank,
          as: 'rank',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!set) return { EM: 'Review set not found', EC: 1, DT: null };

    const questions = (set.questions ?? [])
      .sort((a, b) => (a.review_set_question?.orderIndex ?? 0) - (b.review_set_question?.orderIndex ?? 0));

    const result = {
      EM: 'success',
      EC: 0,
      DT: {
        id: set.id,
        name: set.name,
        setIndex: set.setIndex,
        rank: set.rank,
        questions,
      },
    };
    cache.set(CACHE_KEY, result, 10 * 60 * 1000);
    return result;
  } catch (e) {
    console.error('getReviewSetQuestions error:', e);
    return { EM: 'error from server', EC: -1, DT: null };
  }
};

/**
 * Auto-generate review sets for a rank from existing questions in exam test sets.
 * Groups all distinct questions (ordered by number) into sets of QUESTIONS_PER_SET.
 * Idempotent: clears existing review sets for the rank before regenerating.
 */
const generateReviewSets = async (rankId) => {
  if (!rankId) return { EM: 'rankId is required', EC: 2, DT: [] };

  try {
    // 1. Get all subjects for rank
    const subjects = await db.subject.findAll({ where: { IDrank: rankId }, attributes: ['id'] });
    if (!subjects.length) return { EM: 'No subjects found for rank', EC: 1, DT: [] };

    const subjectIds = subjects.map((s) => s.id);

    // 2. Get all exam tests for those subjects
    const tests = await db.test.findAll({
      where: { IDSubject: { [Op.in]: subjectIds } },
      attributes: ['id'],
    });
    const testIds = tests.map((t) => t.id);
    if (!testIds.length) return { EM: 'No tests found for rank', EC: 1, DT: [] };

    // 3. Get distinct question IDs (via test_question junction)
    const testQuestionRows = await db.sequelize.query(
      `SELECT DISTINCT tq.IDQuestion
       FROM test_question tq
       WHERE tq.IDTest IN (:testIds)
       ORDER BY tq.IDQuestion ASC`,
      { replacements: { testIds }, type: db.sequelize.QueryTypes.SELECT },
    );

    if (!testQuestionRows.length) return { EM: 'No questions found', EC: 1, DT: [] };

    const questionIds = testQuestionRows.map((r) => r.IDQuestion);

    // 4. Fetch questions ordered by number
    const questions = await db.question.findAll({
      where: { id: { [Op.in]: questionIds } },
      attributes: ['id', 'number'],
      order: [['number', 'ASC']],
    });

    // 5. Delete existing review sets for this rank (cascade deletes review_set_question)
    await db.reviewSet.destroy({ where: { IDRank: rankId } });

    // 6. Chunk into sets of QUESTIONS_PER_SET
    const rank = await db.rank.findByPk(rankId, { attributes: ['name'] });
    const rankName = rank?.name ?? `Rank ${rankId}`;
    const createdSets = [];

    for (let i = 0; i < questions.length; i += QUESTIONS_PER_SET) {
      const chunk = questions.slice(i, i + QUESTIONS_PER_SET);
      const setIndex = Math.floor(i / QUESTIONS_PER_SET) + 1;

      const newSet = await db.reviewSet.create({
        name: `Bộ ôn tập ${String(setIndex).padStart(2, '0')} — Hạng ${rankName}`,
        IDRank: rankId,
        setIndex,
        totalQuestions: chunk.length,
      });

      const junctionRows = chunk.map((q, idx) => ({
        IDReviewSet: newSet.id,
        IDQuestion: q.id,
        orderIndex: idx + 1,
      }));

      await db.reviewSetQuestion.bulkCreate(junctionRows);
      createdSets.push({ id: newSet.id, name: newSet.name, total: chunk.length });
    }

    cache.invalidatePrefix(`review_sets_rank_${rankId}`);

    return {
      EM: `Generated ${createdSets.length} review sets for hạng ${rankName}`,
      EC: 0,
      DT: createdSets,
    };
  } catch (e) {
    console.error('generateReviewSets error:', e);
    return { EM: 'error from server', EC: -1, DT: [] };
  }
};

/**
 * Update tip for a question by question number.
 */
const updateQuestionTip = async (questionNumber, tip) => {
  if (!questionNumber) return { EM: 'questionNumber is required', EC: 2, DT: null };

  try {
    const [updated] = await db.question.update({ tip }, { where: { number: questionNumber } });
    if (!updated) return { EM: 'Question not found', EC: 1, DT: null };

    // Invalidate any cached review set questions containing this question
    cache.invalidatePrefix('review_set_questions_');
    return { EM: 'Tip updated', EC: 0, DT: null };
  } catch (e) {
    console.error('updateQuestionTip error:', e);
    return { EM: 'error from server', EC: -1, DT: null };
  }
};

/**
 * Batch import tips from an array of { number, tip } objects.
 */
const batchImportTips = async (tips) => {
  if (!Array.isArray(tips) || !tips.length) return { EM: 'tips array is required', EC: 2, DT: null };

  try {
    let updatedCount = 0;
    for (const { number, tip } of tips) {
      if (!number || !tip) continue;
      const [n] = await db.question.update({ tip }, { where: { number } });
      if (n) updatedCount++;
    }
    cache.invalidatePrefix('review_set_questions_');
    return { EM: `Updated ${updatedCount} tips`, EC: 0, DT: { updatedCount } };
  } catch (e) {
    console.error('batchImportTips error:', e);
    return { EM: 'error from server', EC: -1, DT: null };
  }
};

module.exports = {
  getReviewSetsByRank,
  getReviewSetQuestions,
  generateReviewSets,
  updateQuestionTip,
  batchImportTips,
};

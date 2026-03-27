import db from "../models/index.js"; // Sequelize models
const { Op, Model } = require("sequelize");
const cache = require('../cache/memoryCache');

const getRank = async () => {
    const CACHE_KEY = 'ranks_all';
    const cached = cache.get(CACHE_KEY);
    if (cached) return cached;

    try {
        let data = await db.rank.findAll({
            include: [{ model: db.subject }]
        });
        const result = { EM: 'Info rank', EC: 0, DT: data };
        cache.set(CACHE_KEY, result, 15 * 60 * 1000); // cache 15 phút
        return result;
    } catch (e) {
        console.error("check error: ", e);
        return ({ EM: 'error from sever', EC: -1, DT: [] });
    }
}


const createRank = async (name) => {
    try {
        if (!name)
            return ({ EM: 'Some Field Null', EC: 2, DT: [] });

        const newRank = await db.rank.create({ name });
        cache.invalidate('ranks_all');
        return ({ EM: 'create success', EC: 0, DT: newRank });
    } catch (error) {
        console.log('chekc error', error)
        return ({ EM: 'error from sever', EC: -1, DT: [] });
    }
};

const updateRank = async (id, name) => {
    try {

        if (!id || !name)
            return ({
                EM: 'Some Field Null',//error message
                EC: 2,//error code
                DT: []
            });

        const rank = await db.rank.findByPk(id);
        if (!rank) {
            return ({
                EM: 'Cant find by ID',//error message
                EC: 1,//error code
                DT: []
            });
        }
        const updateRank = await rank.update({ name });
        cache.invalidate('ranks_all');
        return ({ EM: 'update success', EC: 0, DT: updateRank });
    } catch (error) {
        return ({
            EM: 'error from sever',//error message
            EC: -1,//error code
            DT: []
        });
    }
};


const deleteRank = async (id) => {
    try {
        if (!id) return ({ EM: 'Some Field Null', EC: 2, DT: [] });

        const rank = await db.rank.findByPk(id);
        if (!rank) return ({ EM: 'Cant find by ID', EC: 1, DT: [] });

        // 1. Delete review sets for this rank (review_set_question cascades via FK)
        await db.reviewSet.destroy({ where: { IDRank: id } });

        // 2. Find all subjects for this rank
        const subjects = await db.subject.findAll({ where: { IDrank: id }, attributes: ['id'] });
        const subjectIds = subjects.map((s) => s.id);

        if (subjectIds.length > 0) {
            // 3. Find all tests under those subjects
            const tests = await db.test.findAll({ where: { IDSubject: subjectIds }, attributes: ['id'] });
            const testIds = tests.map((t) => t.id);

            if (testIds.length > 0) {
                // 4. Delete exams and test_questions linked to those tests
                await db.exam.destroy({ where: { IDTest: testIds } });
                await db.test_question.destroy({ where: { IDTest: testIds } });
                await db.test.destroy({ where: { id: testIds } });
            }

            // 5. Delete subjects
            await db.subject.destroy({ where: { IDrank: id } });
        }

        // 6. Delete the rank itself
        await rank.destroy();

        cache.invalidate('ranks_all');
        cache.invalidatePrefix(`review_sets_rank_${id}`);
        return ({ EM: 'delete success', EC: 0, DT: [] });
    } catch (error) {
        console.log('deleteRank error', error);
        return ({ EM: 'error from sever', EC: -1, DT: [] });
    }
};

module.exports = {
    getRank,
    createRank,
    updateRank,
    deleteRank
}
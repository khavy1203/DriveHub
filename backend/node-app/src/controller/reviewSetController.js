import reviewSetService from '../service/reviewSetService.js';

const getReviewSetsByRank = async (req, res) => {
  try {
    const { rankId } = req.params;
    const data = await reviewSetService.getReviewSetsByRank(rankId);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ EM: 'error from server', EC: -1, DT: [] });
  }
};

const getReviewSetQuestions = async (req, res) => {
  try {
    const { setId } = req.params;
    const data = await reviewSetService.getReviewSetQuestions(setId);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ EM: 'error from server', EC: -1, DT: null });
  }
};

const generateReviewSets = async (req, res) => {
  try {
    const { rankId } = req.params;
    const data = await reviewSetService.generateReviewSets(rankId);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ EM: 'error from server', EC: -1, DT: [] });
  }
};

const batchImportTips = async (req, res) => {
  try {
    const { tips } = req.body; // [{ number, tip }]
    const data = await reviewSetService.batchImportTips(tips);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ EM: 'error from server', EC: -1, DT: null });
  }
};

module.exports = {
  getReviewSetsByRank,
  getReviewSetQuestions,
  generateReviewSets,
  batchImportTips,
};

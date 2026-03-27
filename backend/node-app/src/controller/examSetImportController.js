const examSetImportService = require('../service/examSetImportService');

const importReviewSets = async (req, res) => {
  try {
    const result = await examSetImportService.importReviewSets(req.file);
    return res.status(200).json(result);
  } catch (error) {
    console.error('importReviewSets controller error:', error);
    return res.status(500).json({ EM: 'Server error', EC: -1, DT: [] });
  }
};

module.exports = { importReviewSets };

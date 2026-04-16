const fs = require("fs");
const { parseCSV } = require("../utils/parseCSV");
const { normalize } = require("../utils/normalize");
const { extractTextFromPDF, extractQuestions } = require("../utils/extractText");
const { similarityMatch } = require("../utils/similarityMatch");
const { aiFallback } = require("../utils/aiFallback");
const {
  findExact,
  getAllQA,
  insertQA,
  insertPending,
  deletePending,
} = require("../db/db");

const SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD || 0.7);
const AI_THRESHOLD = 0.6;
const USE_AI = String(process.env.USE_AI || "false").toLowerCase() === "true";

const safeDelete = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const buildMatchResult = (question, answer, method, confidence) => ({
  question,
  answer,
  method,
  confidence,
});

const matchQuestionWithData = async (question, qaData = null) => {
  const normalizedQuestion = normalize(question);
  const exactMatch = await findExact(normalizedQuestion);

  if (exactMatch) {
    await deletePending(normalizedQuestion);

    return buildMatchResult(question, exactMatch.answer, "exact", 1);
  }

  const resolvedQAData = qaData || (await getAllQA());
  const similarity = similarityMatch(normalizedQuestion, resolvedQAData);
  const similarityScore = similarity?.score ?? 0;

  if (similarity && similarityScore > SIMILARITY_THRESHOLD) {
    await deletePending(normalizedQuestion);

    return buildMatchResult(
      question,
      similarity.record.answer,
      "similarity",
      similarityScore
    );
  }

  if (USE_AI && similarityScore < AI_THRESHOLD) {
    const aiAnswer = await aiFallback(question, resolvedQAData);

    if (aiAnswer) {
      await insertQA(question, normalizedQuestion, aiAnswer, "ai", 0.6);
      await deletePending(normalizedQuestion);

      return buildMatchResult(question, aiAnswer, "ai", 0.6);
    }
  }

  await insertPending(question, normalizedQuestion);

  return buildMatchResult(question, null, "admin_required", 0);
};

const matchQuestion = async (question) => {
  return matchQuestionWithData(question);
};

const uploadCSV = async (req, res) => {
  const uploadedPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const parsedRows = await parseCSV(req.file.path);

    if (!parsedRows.length) {
      return res.status(400).json({ error: "No valid Question-Answer rows found" });
    }

    let storedCount = 0;

    for (const row of parsedRows) {
      const normalizedQuestion = normalize(row.question);

      await insertQA(row.question, normalizedQuestion, row.answer, "csv", 1);
      await deletePending(normalizedQuestion);
      storedCount += 1;
    }

    return res.json({
      message: "CSV mappings stored successfully",
      totalRows: parsedRows.length,
      stored: storedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    safeDelete(uploadedPath);
  }
};

const processPDF = async (req, res) => {
  const uploadedPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const rawText = await extractTextFromPDF(req.file.path);
    const questions = extractQuestions(rawText);

    if (!questions.length) {
      return res
        .status(400)
        .json({ error: "No questions extracted from PDF form" });
    }

    const qaData = await getAllQA();
    const results = [];

    for (const question of questions) {
      const answerResult = await matchQuestionWithData(question, qaData);
      results.push(answerResult);
    }

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    safeDelete(uploadedPath);
  }
};

const learnMappings = async (req, res) => {
  try {
    const { mappings } = req.body;

    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({ error: "mappings array is required" });
    }

    const validMappings = mappings.filter((item) => item.question && item.answer);

    if (!validMappings.length) {
      return res.status(400).json({ error: "No valid mappings found" });
    }

    let storedCount = 0;

    for (const item of validMappings) {
      const normalizedQuestion = normalize(item.question);

      await insertQA(item.question, normalizedQuestion, item.answer, "admin", 1);
      await deletePending(normalizedQuestion);
      storedCount += 1;
    }

    return res.json({
      message: "New mappings learned",
      processed: storedCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const healthCheck = (req, res) => {
  return res.json({
    status: "ok",
    service: "One Nation One Data Backend",
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  uploadCSV,
  processPDF,
  learnMappings,
  healthCheck,
  matchQuestion,
};

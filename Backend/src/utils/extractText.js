const fs = require("fs");
const pdfParse = require("pdf-parse");

const extractTextFromPDF = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(fileBuffer);
  return parsed.text || "";
};

const extractQuestions = (text = "") => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const ignoredPatterns = [
    /^\d+$/, // only numbers
    /^page\s*\d+/i,
    /^naac|ugc/i,
  ];

  const questionLike = lines.filter((line) => {
    if (line.length < 5) return false;
    if (ignoredPatterns.some((pattern) => pattern.test(line))) return false;

    return (
      line.includes("?") ||
      line.endsWith(":") ||
      /name|number|no\.?|total|details|year|address|department|faculty|teacher|research|publication/i.test(
        line
      )
    );
  });

  // Keep original order but remove duplicates.
  return [...new Set(questionLike.map((q) => q.replace(/[:\-]+$/, "").trim()))];
};

module.exports = {
  extractTextFromPDF,
  extractQuestions,
};

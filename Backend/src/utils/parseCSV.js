const fs = require("fs");
const csv = require("csv-parser");

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const question = row.Question || row.question;
        const answer = row.Answer || row.answer;

        if (question && answer !== undefined && answer !== null) {
          rows.push({
            question: String(question).trim(),
            answer: String(answer).trim(),
          });
        }
      })
      .on("end", () => resolve(rows))
      .on("error", (error) => reject(error));
  });
};

module.exports = {
  parseCSV,
};

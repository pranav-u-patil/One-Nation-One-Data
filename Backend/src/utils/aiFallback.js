const { GoogleGenerativeAI } = require("@google/generative-ai");

const aiFallback = async (question, dbData = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !dbData.length) {
    return null;
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const contextPairs = dbData
    .slice(0, 80)
    .map(
      (item, index) =>
        `${index + 1}. Question: ${item.original_question}\nAnswer: ${item.answer}`
    )
    .join("\n\n");

  const prompt = `You are helping fill an institutional form.
Given a target question and known question-answer mappings, return the single best answer.
If there is no reasonable match, return exactly: NOT_FOUND
Return only the answer text and nothing else.

Target question: ${question}

Known mappings:
${contextPairs}`;

  try {
    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();

    if (!raw || /^NOT_FOUND$/i.test(raw)) {
      return null;
    }

    return raw.replace(/^"|"$/g, "").trim();
  } catch (error) {
    console.error("Gemini fallback failed:", error.message);
    return null;
  }
};

module.exports = {
  aiFallback,
};

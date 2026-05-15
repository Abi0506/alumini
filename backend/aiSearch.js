const pool = require("./db");

const AI_PAGE_SIZE = 25;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "i",
  "in",
  "is",
  "like",
  "me",
  "need",
  "of",
  "or",
  "people",
  "show",
  "that",
  "the",
  "them",
  "want",
  "who",
  "with",
  "working",
]);

const groupDefinitions = {
  designation: {
    fieldWeights: { designation: 18, company: 7, dept: 2, address: 1 },
  },
  company: {
    fieldWeights: { company: 18, designation: 8, dept: 2, address: 1 },
  },
  department: {
    fieldWeights: { dept: 16, designation: 2, company: 2 },
  },
  location: {
    fieldWeights: { address: 14, company: 3, designation: 2 },
  },
  general: {
    fieldWeights: { designation: 10, company: 10, dept: 4, address: 4, name: 2 },
  },
};

const normalizeSpaced = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCompact = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
};

const uniqueStrings = (values = [], max = 8) => {
  const seen = new Set();

  return values
    .map((value) => normalizeSpaced(value))
    .filter((value) => value.length > 1)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, max);
};

const extractFallbackKeywords = (query = "") =>
  uniqueStrings(
    normalizeSpaced(query)
      .split(" ")
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
    10
  );

const includesLoose = (value, keyword) => {
  const spacedValue = normalizeSpaced(value);
  const spacedKeyword = normalizeSpaced(keyword);
  const compactValue = normalizeCompact(value);
  const compactKeyword = normalizeCompact(keyword);

  if (!spacedKeyword || !compactKeyword) return false;

  return spacedValue.includes(spacedKeyword) || compactValue.includes(compactKeyword);
};

const safeParseJson = (rawText) => {
  const normalized = String(rawText || "").trim();
  const withoutFence = normalized
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
};

const sanitizeInterpretation = (query, parsed = {}) => {
  const fallbackKeywords = extractFallbackKeywords(query);

  const interpretation = {
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "Natural-language alumni search",
    designationKeywords: uniqueStrings(asArray(parsed.designationKeywords)),
    companyKeywords: uniqueStrings(asArray(parsed.companyKeywords)),
    departmentKeywords: uniqueStrings(asArray(parsed.departmentKeywords)),
    locationKeywords: uniqueStrings(asArray(parsed.locationKeywords)),
    generalKeywords: uniqueStrings(asArray(parsed.generalKeywords)),
    requiredGroups: uniqueStrings(asArray(parsed.requiredGroups), 5).filter((group) =>
      ["designation", "company", "department", "location", "general"].includes(group)
    ),
    yearFrom: Number.isInteger(Number(parsed.yearFrom)) ? Number(parsed.yearFrom) : null,
    yearTo: Number.isInteger(Number(parsed.yearTo)) ? Number(parsed.yearTo) : null,
  };

  const hasNoKeywords =
    interpretation.designationKeywords.length === 0 &&
    interpretation.companyKeywords.length === 0 &&
    interpretation.departmentKeywords.length === 0 &&
    interpretation.locationKeywords.length === 0 &&
    interpretation.generalKeywords.length === 0;

  if (hasNoKeywords) {
    interpretation.generalKeywords = fallbackKeywords;
  }

  if (interpretation.yearFrom && interpretation.yearTo && interpretation.yearFrom > interpretation.yearTo) {
    const originalFrom = interpretation.yearFrom;
    interpretation.yearFrom = interpretation.yearTo;
    interpretation.yearTo = originalFrom;
  }

  return interpretation;
};

const getGeminiPrompt = (query) => `
You convert alumni directory natural-language search requests into structured JSON.
Return JSON only. Do not include markdown.

User query: "${String(query || "").replace(/"/g, '\\"')}"

Return this exact shape:
{
  "summary": "short sentence",
  "designationKeywords": ["..."],
  "companyKeywords": ["..."],
  "departmentKeywords": ["..."],
  "locationKeywords": ["..."],
  "generalKeywords": ["..."],
  "requiredGroups": ["designation", "company", "department", "location", "general"],
  "yearFrom": null,
  "yearTo": null
}

Rules:
- Focus on current role, designation, company, location, and explicit department/year constraints.
- Never infer department from a job role. Example: a mechanical graduate working in software should still match software-role queries.
- If the user asks for software/IT/tech workers, include relevant role/company terms in designationKeywords, companyKeywords, or generalKeywords.
- If the user asks for general managers, prioritize designationKeywords such as "general manager" and close variants.
- Use requiredGroups only for explicit hard constraints. Example: "general managers in chennai" should require designation and location.
- Keep each keyword list short and relevant. Use null for missing years.
`;

const interpretNaturalLanguageQuery = async (query) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: getGeminiPrompt(query) }],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const responseText = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim();

  if (!responseText) {
    throw new Error("Gemini did not return a usable interpretation.");
  }

  return sanitizeInterpretation(query, safeParseJson(responseText));
};

const getKeywordGroups = (interpretation) => ({
  designation: interpretation.designationKeywords,
  company: interpretation.companyKeywords,
  department: interpretation.departmentKeywords,
  location: interpretation.locationKeywords,
  general: interpretation.generalKeywords,
});

const scoreKeywordsAgainstRow = (row, keywords, fieldWeights) => {
  let score = 0;
  let matched = false;

  for (const keyword of keywords) {
    let bestMatch = 0;

    for (const [fieldName, weight] of Object.entries(fieldWeights)) {
      if (includesLoose(row[fieldName], keyword)) {
        bestMatch = Math.max(bestMatch, weight);
      }
    }

    score += bestMatch;
    matched = matched || bestMatch > 0;
  }

  return { score, matched };
};

const scoreRow = (row, interpretation) => {
  const yearValue = row?.year ? Number(row.year) : null;

  if (interpretation.yearFrom && (!yearValue || yearValue < interpretation.yearFrom)) {
    return null;
  }

  if (interpretation.yearTo && (!yearValue || yearValue > interpretation.yearTo)) {
    return null;
  }

  const keywordGroups = getKeywordGroups(interpretation);
  let score = 0;

  for (const requiredGroup of interpretation.requiredGroups) {
    const keywords = keywordGroups[requiredGroup] || [];
    if (keywords.length === 0) continue;

    const definition = groupDefinitions[requiredGroup];
    const requiredScore = scoreKeywordsAgainstRow(row, keywords, definition.fieldWeights);

    if (!requiredScore.matched) {
      return null;
    }
  }

  for (const [groupName, keywords] of Object.entries(keywordGroups)) {
    if (keywords.length === 0) continue;

    const definition = groupDefinitions[groupName];
    const groupScore = scoreKeywordsAgainstRow(row, keywords, definition.fieldWeights);

    score += groupScore.score;
  }

  const combinedSearchText = [
    row?.name,
    row?.dept,
    row?.designation,
    row?.company,
    row?.address,
  ]
    .filter(Boolean)
    .join(" ");

  if (includesLoose(combinedSearchText, interpretation.summary)) {
    score += 3;
  }

  return score > 0 ? score : null;
};

const runAiSearch = async (query, page = 1) => {
  const interpretation = await interpretNaturalLanguageQuery(query);
  const [rows] = await pool.query("SELECT * FROM alumni");

  const scoredRows = rows
    .map((row, index) => ({
      row,
      index,
      score: scoreRow(row, interpretation),
    }))
    .filter((entry) => entry.score !== null)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const total = scoredRows.length;
  const offset = (page - 1) * AI_PAGE_SIZE;
  const pageRows = scoredRows.slice(offset, offset + AI_PAGE_SIZE).map((entry) => entry.row);

  return {
    success: total > 0,
    message: total > 0 ? `Found ${total} records` : "No matching records found.",
    data: pageRows,
    total,
    page,
    pageSize: AI_PAGE_SIZE,
    interpretation,
  };
};

module.exports = {
  runAiSearch,
};

const express = require("express");
const pool = require("./db");
const { runProfessionalAiSearch } = require("./professionalAiSearch");
const { authenticateToken, isAdmin } = require("./auth");

const router = express.Router();

const PAGE_SIZE = 25;

router.post("/search", authenticateToken, async (req, res) => {
  const filters = req.body || {};

  const page = Math.max(1, parseInt(filters?.page, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  delete filters?.page;

  const allowedColumns = [
    "user_id",
    "company_name",
    "website",
    "name",
    "designation",
    "email",
    "phone",
    "address",
  ];

  const conditions = [];
  const params = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const strValue = String(value).trim();
    if (strValue === "") continue;

    if (!allowedColumns.includes(key)) continue;

    if (key === "user_id") {
      const idValue = Number(strValue);
      if (!Number.isNaN(idValue)) {
        conditions.push("user_id = ?");
        params.push(idValue);
      }
      continue;
    }

    if (key === "phone") {
      const digitsOnly = strValue.replace(/\D/g, "");
      if (!digitsOnly) continue;
      if (digitsOnly.length >= 10) {
        conditions.push("phone = ?");
        params.push(digitsOnly);
      } else {
        conditions.push("phone LIKE ?");
        params.push(`%${digitsOnly}%`);
      }
      continue;
    }

    conditions.push(`LOWER(${key}) LIKE LOWER(?)`);
    params.push(`%${strValue}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countQuery = `SELECT COUNT(*) AS total FROM professional_circle ${whereClause}`;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0]?.total || 0;

    const query = `
      SELECT *
      FROM professional_circle
      ${whereClause}
      ORDER BY name ASC, company_name ASC, user_id ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(query, params);

    if (!rows.length) {
      return res.json({
        success: false,
        message: "No matching records found.",
        data: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
      });
    }

    return res.json({
      success: true,
      message: `Found ${total} records`,
      data: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/ai-search", authenticateToken, async (req, res) => {
  const query = String(req.body?.query || "").trim();
  const page = Math.max(1, parseInt(req.body?.page, 10) || 1);

  if (!query) {
    return res.status(400).json({ error: "AI search query is required" });
  }

  try {
    const result = await runProfessionalAiSearch(query, page);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || "AI search failed" });
  }
});

router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const {
    user_id,
    company_name,
    website,
    name,
    designation,
    email,
    phone,
    address,
  } = req.body || {};

  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    await pool.execute(
      `INSERT INTO professional_circle (user_id, company_name, website, name, designation, email, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         company_name = VALUES(company_name),
         website = VALUES(website),
         name = VALUES(name),
         designation = VALUES(designation),
         email = VALUES(email),
         phone = VALUES(phone),
         address = VALUES(address)`,
      [
        user_id || null,
        company_name?.trim() || null,
        website?.trim() || null,
        name?.trim() || null,
        designation?.trim() || null,
        email?.trim() || null,
        phone?.toString().trim() || null,
        address?.trim() || null,
      ]
    );

    return res.json({ success: true, message: "Record saved" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

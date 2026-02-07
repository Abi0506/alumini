const multer = require("multer");
const exceljs = require("exceljs");
const fs = require("fs").promises;
const path = require("path");
const pool = require("./db");
const express = require("express");
const router = express.Router();

// ─── MULTER setup ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "uploads");

(async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Could not create uploads folder:", err);
  }
})();

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});


router.post("/search", async (req, res) => {
  const filters = req.body;

  const runQuery = async (whereClause, params, hasLike = false) => {
  const orderBy = hasLike
    ? `ORDER BY 
        name ASC,
        phone ASC,
        email ASC,
        location ASC,
        company ASC,
        dept ASC,
        year ASC,
        id ASC`
    : `ORDER BY name ASC`;

  const query = `
    SELECT *
    FROM alumni
    ${whereClause}
    ${orderBy}
    LIMIT 150
  `;

  const [rows] = await pool.execute(query, params);
  return rows;
};

  try {
    const exactConditions = [];
    const exactParams = [];

    const likeConditions = [];
    const likeParams = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      const strValue = String(value).trim();
      if (strValue === "") return;

      // ✅ PHONE (VARCHAR)
      if (key === "phone") {
        const digitsOnly = strValue.replace(/\D/g, "");

        // exact only if 10 digits
        if (digitsOnly.length === 10) {
          exactConditions.push("phone = ?");
          exactParams.push(digitsOnly);
        } else {
          exactConditions.push("phone LIKE ?");
          exactParams.push(`%${digitsOnly}%`);
        }

        // fallback always LIKE
        likeConditions.push("phone LIKE ?");
        likeParams.push(`%${digitsOnly}%`);
        return;
      }

      // ✅ EMAIL
      if (key === "email") {
        // exact if contains @
        if (strValue.includes("@")) {
          exactConditions.push("LOWER(email) = LOWER(?)");
          exactParams.push(strValue);
        } else {
          exactConditions.push("LOWER(email) LIKE LOWER(?)");
          exactParams.push(`%${strValue}%`);
        }

        // fallback always LIKE
        likeConditions.push("LOWER(email) LIKE LOWER(?)");
        likeParams.push(`%${strValue}%`);
        return;
      }

      // ✅ YEAR exact
      if (key === "year") {
        if (!isNaN(strValue)) {
          exactConditions.push("year = ?");
          exactParams.push(Number(strValue));

          likeConditions.push("year = ?");
          likeParams.push(Number(strValue));
        }
        return;
      }

      // ✅ other fields LIKE (id, roll, name, dept, address, company, location...)
      exactConditions.push(`${key} LIKE ?`);
      exactParams.push(`%${strValue}%`);

      likeConditions.push(`${key} LIKE ?`);
      likeParams.push(`%${strValue}%`);
    });

    const exactWhere =
      exactConditions.length > 0 ? "WHERE " + exactConditions.join(" AND ") : "";

    const likeWhere =
      likeConditions.length > 0 ? "WHERE " + likeConditions.join(" AND ") : "";

    // ✅ run exact first
    let rows = await runQuery(exactWhere, exactParams);

    // ✅ fallback if exact gives 0
    if (rows.length === 0) {
      rows = await runQuery(likeWhere, likeParams);
    }

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "No matching records found.",
        data: [],
      });
    }

    res.json({
      success: true,
      message: `Found ${rows.length} records`,
      data: rows,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// ✅ Add / Update single record (phone as VARCHAR)
// ────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { id, roll, name, phone, email, dept, year, address, company, location } =
    req.body;

  // if (!id?.trim()) {
  //   return res.status(400).json({ error: "id is required" });
  // }

  try {
    await pool.execute(
      `INSERT INTO alumni (id, roll, name, phone, email, dept, year, address, company, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         roll     = VALUES(roll),
         name     = VALUES(name),
         phone    = VALUES(phone),
         email    = VALUES(email),
         dept     = VALUES(dept),
         year     = VALUES(year),
         address  = VALUES(address),
         company  = VALUES(company),
         location = VALUES(location)`,
      [
        id.trim(),
        roll?.trim() || null,
        name?.trim() || null,
        phone?.toString().trim() || null, // ✅ phone string
        email?.trim() || null,
        dept?.trim() || null,
        year || null,
        address?.trim() || null,
        company?.trim() || null,
        location?.trim() || null,
      ]
    );

    res.json({ success: true, message: "Record saved" });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// ✅ Bulk import from Excel (phone as VARCHAR)
// ────────────────────────────────────────────────────────────────
router.post("/import-excel", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;

  try {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("No worksheet found");

    // ✅ Read headers safely
    const headers = {};
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell, colNumber) => {
      const header = cell.value?.toString().trim().toLowerCase();
      if (header) headers[header] = colNumber;
    });

    // ✅ Accept multiple names for ID column
    const idCol =
      headers["id"] ||
      headers["student id"] ||
      headers["student_id"] ||
      headers["roll"] ||
      headers["roll no"] ||
      headers["rollno"] ||
      headers["register no"] ||
      headers["reg no"];

    if (!idCol) {
      throw new Error(
        'Column "id" is required. Accepted headers: id / student id / roll / roll no / register no'
      );
    }

    let inserted = 0;
    let updated = 0;

    // ✅ helper to safely read a cell by header name
    const getCellValue = (row, headerKey) => {
      const col = headers[headerKey];
      if (!col) return null;

      const value = row.getCell(col).value;
      if (value === null || value === undefined) return null;

      return value.toString().trim();
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // ✅ skip empty rows
      if (!row || row.cellCount === 0) continue;

      const idValue = row.getCell(idCol).value?.toString?.()?.trim?.();
      if (!idValue) continue;

      const data = {
        id: idValue,
        roll: getCellValue(row, "roll"),
        name: getCellValue(row, "name"),
        phone: getCellValue(row, "phone"),
        email: getCellValue(row, "email"),
        dept: getCellValue(row, "dept"),
        year: getCellValue(row, "year") ? Number(getCellValue(row, "year")) : null,
        address: getCellValue(row, "address"),
        company: getCellValue(row, "company"),
        location: getCellValue(row, "location"),
      };

      const [result] = await pool.execute(
        `INSERT INTO alumni (id, roll, name, phone, email, dept, year, address, company, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           roll     = VALUES(roll),
           name     = VALUES(name),
           phone    = VALUES(phone),
           email    = VALUES(email),
           dept     = VALUES(dept),
           year     = VALUES(year),
           address  = VALUES(address),
           company  = VALUES(company),
           location = VALUES(location)`,
        [
          data.id,
          data.roll,
          data.name,
          data.phone,
          data.email,
          data.dept,
          data.year,
          data.address,
          data.company,
          data.location,
        ]
      );

      if (result.affectedRows === 1) inserted++;
      else if (result.affectedRows === 2) updated++;
    }

    await fs.unlink(filePath).catch(() => {});

    res.json({
      success: true,
      inserted,
      updated,
      total: inserted + updated,
    });
  } catch (err) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    console.error("Excel import error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ────────────────────────────────────────────────────────────────
// ✅ Get departments
// ────────────────────────────────────────────────────────────────
router.get("/departments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, dept_name FROM departments ORDER BY dept_name"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

module.exports = router;

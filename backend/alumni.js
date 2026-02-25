const multer = require("multer");
const exceljs = require("exceljs");
const fs = require("fs").promises;
const path = require("path");
const pool = require("./db");
const express = require("express");
const router = express.Router();

const normalizeDeptName = (value) => {
  if (!value) return "";
  return String(value).trim();
};

const columnExists = async (columnName) => {
  try {
    const [rows] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alumni' AND COLUMN_NAME = ? LIMIT 1",
      [columnName]
    );
    return rows.length > 0;
  } catch (err) {
    return false;
  }
};

const ensureDepartment = async (deptName) => {
  const normalized = normalizeDeptName(deptName);
  if (!normalized) return null;

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [existing] = await connection.execute(
      "SELECT id FROM departments WHERE dept_name = ? LIMIT 1",
      [normalized]
    );

    if (existing.length > 0) {
      await connection.commit();
      return existing[0].id;
    }

    await connection.execute("INSERT IGNORE INTO departments (dept_name) VALUES (?)", [
      normalized,
    ]);

    const [created] = await connection.execute(
      "SELECT id FROM departments WHERE dept_name = ? LIMIT 1",
      [normalized]
    );

    await connection.commit();
    return created.length > 0 ? created[0].id : null;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const uploadDir = path.join(__dirname, "uploads");

(async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // uploads folder creation failed
  }
})();

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 },
});


router.post("/search", async (req, res) => {
  const filters = req.body;

  // Extract event/round filters (handled specially)
  const eventFilterRaw = filters?.event;
  const roundFilterRaw = filters?.round;
  delete filters?.event;
  delete filters?.round;

  const allowedColumns = ['roll', 'name', 'phone', 'email', 'dept', 'designation', 'year', 'address', 'company'];

  const runQuery = async (whereClause, params, hasLike = false) => {
  const orderBy = hasLike
    ? `ORDER BY 
        name ASC,
        phone ASC,
        email ASC,
        company ASC,
        dept ASC,
        designation ASC,
        year ASC`
    : `ORDER BY name ASC`;

  const query = `
    SELECT *
    FROM alumni
    ${whereClause}
    ${orderBy}
  `;

  const [rows] = await pool.execute(query, params);
  return rows;
};

  try {
    const exactConditions = [];
    const exactParams = [];

    const likeConditions = [];
    const likeParams = [];

      for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;

      const strValue = String(value).trim();
      if (strValue === "") continue;

      
      if (!allowedColumns.includes(key)) continue;

      if (key === "id") continue;

      
      if (key === "phone") {
        const digitsOnly = strValue.replace(/\D/g, "");

        
        if (digitsOnly.length === 10) {
          exactConditions.push("phone = ?");
          exactParams.push(digitsOnly);
        } else {
          exactConditions.push("phone LIKE ?");
          exactParams.push(`%${digitsOnly}%`);
        }

        
        likeConditions.push("phone LIKE ?");
        likeParams.push(`%${digitsOnly}%`);
        continue;
      }

      
      if (key === 'dept') {
        try {
          const [deptRows] = await pool.execute(
            'SELECT dept_name FROM departments WHERE LOWER(dept_name) = LOWER(?) LIMIT 1',
            [strValue]
          );

          if (deptRows.length > 0) {
            const deptName = deptRows[0].dept_name;
            exactConditions.push('LOWER(dept) = LOWER(?)');
            exactParams.push(deptName);

            likeConditions.push('LOWER(dept) LIKE LOWER(?)');
            likeParams.push(`%${deptName}%`);
          } else {
            exactConditions.push('LOWER(dept) LIKE LOWER(?)');
            exactParams.push(`%${strValue}%`);

            likeConditions.push('LOWER(dept) LIKE LOWER(?)');
            likeParams.push(`%${strValue}%`);
          }
        } catch (err) {
          // dept lookup failed
          exactConditions.push('LOWER(dept) LIKE LOWER(?)');
          exactParams.push(`%${strValue}%`);

          likeConditions.push('LOWER(dept) LIKE LOWER(?)');
          likeParams.push(`%${strValue}%`);
        }

        continue;
      }

      // Handle event / payment filtering: ensure only paid participants are returned
      if (eventFilterRaw) {
        const raw = String(eventFilterRaw || '').trim();
        if (raw) {
          const ev = raw.replace(/[^a-z0-9]+/gi, '_').toLowerCase();

          const roundNum = roundFilterRaw ? Number(roundFilterRaw) : null;

          // candidate column names to check
          const candidates = [];
          candidates.push(`${ev}_paid`);
          candidates.push(`paid_${ev}`);
          candidates.push(`${ev}_round1_paid`);
          candidates.push(`${ev}_round2_paid`);
          candidates.push(`${ev}_paid_round1`);
          candidates.push(`${ev}_paid_round2`);
          candidates.push(`${ev}_paid_round${roundNum}`);
          candidates.push(`${ev}_round${roundNum}_paid`);

          const existing = [];
          for (const col of candidates) {
            if (!col) continue;
            if (existing.includes(col)) continue;
            // eslint-disable-next-line no-await-in-loop
            if (await columnExists(col)) existing.push(col);
          }

          // prefer round-specific columns if round provided
          if (roundNum && !Number.isNaN(roundNum)) {
            const roundColCandidates = existing.filter(c => c.includes(`round${roundNum}`) || c.includes(`round_${roundNum}`) || c.endsWith(`_round${roundNum}`));
            const roundCol = roundColCandidates[0] || existing.find(c => c === `${ev}_paid` || c === `paid_${ev}`);
            if (roundCol) {
              const round1Col = existing.find(c => c.includes('round1')) || null;
              exactConditions.push(`${roundCol} = ?`);
              exactParams.push(1);
              if (round1Col && round1Col !== roundCol) {
                exactConditions.push(`${round1Col} = ?`);
                exactParams.push(1);
              }
            }
          } else {
            // no round specified: if schema indicates round1 exists (suggesting multiple rounds), require round1 paid
            const round1Col = existing.find(c => c.includes('round1'));
            if (round1Col) {
              exactConditions.push(`${round1Col} = ?`);
              exactParams.push(1);
            } else if (existing.length > 0) {
              const generic = existing.find(c => c === `${ev}_paid` || c === `paid_${ev}`) || existing[0];
              if (generic) {
                exactConditions.push(`${generic} = ?`);
                exactParams.push(1);
              }
            }
          }
        }
      }

      exactConditions.push(`LOWER(${key}) LIKE LOWER(?)`);
      exactParams.push(`%${strValue}%`);

      likeConditions.push(`LOWER(${key}) LIKE LOWER(?)`);
      likeParams.push(`%${strValue}%`);

    }

    const exactWhere =
      exactConditions.length > 0 ? "WHERE " + exactConditions.join(" AND ") : "";

    const likeWhere =
      likeConditions.length > 0 ? "WHERE " + likeConditions.join(" AND ") : "";

    let rows = await runQuery(exactWhere, exactParams);

    
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
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { roll, name, phone, email, dept, designation, year, address, company } = req.body;

  
  if (!roll?.trim()) {
    return res.status(400).json({ error: "Roll number is required" });
  }
  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    await ensureDepartment(dept);
    await pool.execute(
      `INSERT INTO alumni (roll, name, phone, email, dept, designation, year, address, company)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         roll        = VALUES(roll),
         name        = VALUES(name),
         phone       = VALUES(phone),
         email       = VALUES(email),
         dept        = VALUES(dept),
         designation = VALUES(designation),
         year        = VALUES(year),
         address     = VALUES(address),
         company     = VALUES(company)`,
      [
        roll?.trim() || null,
        name?.trim() || null,
        phone?.toString().trim() || null,
        email?.trim() || null,
        dept?.trim() || null,
        designation?.trim() || null,
        year || null,
        address?.trim() || null,
        company?.trim() || null,
      ]
    );

    res.json({ success: true, message: "Record saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/import-excel", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;

  try {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("No worksheet found");

    
    const headers = {};
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell, colNumber) => {
      const header = cell.value?.toString().trim().toLowerCase();
      if (header) headers[header] = colNumber;
    });

    
    const rollCol =
      headers["roll"] ||
      headers["roll no"] ||
      headers["rollno"] ||
      headers["register no"] ||
      headers["reg no"];

    if (!rollCol) {
      throw new Error(
        'Column "roll" is required. Accepted headers: roll / roll no / rollno / register no / reg no'
      );
    }

    let inserted = 0;
    let updated = 0;

    
    const getCellValue = (row, headerKey) => {
      const col = headers[headerKey];
      if (!col) return null;

      const value = row.getCell(col).value;
      if (value === null || value === undefined) return null;

      return value.toString().trim();
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      
      if (!row || row.cellCount === 0) continue;

      const rollValue = row.getCell(rollCol).value?.toString?.()?.trim?.();
      if (!rollValue) continue;

      const data = {
        roll: rollValue,
        name: getCellValue(row, "name"),
        phone: getCellValue(row, "phone"),
        email: getCellValue(row, "email"),
        dept: getCellValue(row, "dept"),
        designation: getCellValue(row, "designation"),
        year: getCellValue(row, "year") ? Number(getCellValue(row, "year")) : null,
        address: getCellValue(row, "address"),
        company: getCellValue(row, "company"),
      };

      await ensureDepartment(data.dept);

      const [result] = await pool.execute(
        `INSERT INTO alumni (roll, name, phone, email, dept, designation, year, address, company)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           roll        = VALUES(roll),
           name        = VALUES(name),
           phone       = VALUES(phone),
           email       = VALUES(email),
           dept        = VALUES(dept),
           designation = VALUES(designation),
           year        = VALUES(year),
           address     = VALUES(address),
           company     = VALUES(company)`,
        [
          data.roll,
          data.name,
          data.phone,
          data.email,
          data.dept,
          data.designation,
          data.year,
          data.address,
          data.company,
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
    res.status(500).json({ error: err.message });
  }
});


 
router.get("/departments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, dept_name FROM departments ORDER BY dept_name"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

module.exports = router;

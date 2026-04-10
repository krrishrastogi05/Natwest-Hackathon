/**
 * Parse CSV content into structured data with schema and summary
 */

export function parseCSV(text, delimiter = ',') {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('File must contain at least a header row and one data row.');
  }

  // Parse header
  const headers = parseLine(lines[0], delimiter);

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line, delimiter);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect delimiter from file content
 */
export function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

/**
 * Infer column types from data
 */
export function inferColumnTypes(headers, rows) {
  const schema = {};
  const sampleSize = Math.min(rows.length, 100);

  headers.forEach(header => {
    let numberCount = 0;
    let boolCount = 0;
    let dateCount = 0;
    let emptyCount = 0;
    let totalSampled = 0;

    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i][header];
      if (value === '' || value === null || value === undefined) {
        emptyCount++;
        continue;
      }
      totalSampled++;

      if (/^(true|false|yes|no|1|0)$/i.test(value)) {
        boolCount++;
      }
      if (!isNaN(value) && value !== '') {
        numberCount++;
      }
      if (isDateLike(value)) {
        dateCount++;
      }
    }

    // Determine type
    const threshold = totalSampled * 0.7;
    if (numberCount >= threshold && totalSampled > 0) {
      schema[header] = { type: 'number', nullCount: emptyCount };
    } else if (boolCount >= threshold && totalSampled > 0) {
      schema[header] = { type: 'boolean', nullCount: emptyCount };
    } else if (dateCount >= threshold && totalSampled > 0) {
      schema[header] = { type: 'date', nullCount: emptyCount };
    } else {
      schema[header] = { type: 'string', nullCount: emptyCount };
    }
  });

  return schema;
}

function isDateLike(value) {
  // Quick check for common date patterns
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value)) return true;
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(value)) return true;
  const d = new Date(value);
  return !isNaN(d.getTime()) && value.length > 4;
}

/**
 * Generate summary statistics for numeric columns
 */
export function generateSummary(headers, rows, schema) {
  const summary = {
    totalRows: rows.length,
    totalColumns: headers.length,
    columns: {},
  };

  headers.forEach(header => {
    const colInfo = schema[header];
    const values = rows.map(r => r[header]).filter(v => v !== '' && v !== null && v !== undefined);

    const colSummary = {
      type: colInfo.type,
      nonNullCount: values.length,
      nullCount: rows.length - values.length,
      uniqueCount: new Set(values).size,
    };

    if (colInfo.type === 'number') {
      const nums = values.map(Number).filter(n => !isNaN(n));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        colSummary.min = nums[0];
        colSummary.max = nums[nums.length - 1];
        colSummary.mean = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        colSummary.median = nums.length % 2 === 0
          ? +((nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2).toFixed(2)
          : nums[Math.floor(nums.length / 2)];
        const mean = colSummary.mean;
        colSummary.stdDev = +(Math.sqrt(nums.reduce((a, v) => a + (v - mean) ** 2, 0) / nums.length)).toFixed(2);
      }
    } else if (colInfo.type === 'string') {
      // Top 5 most frequent values
      const freq = {};
      values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      colSummary.topValues = Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }

    summary.columns[header] = colSummary;
  });

  return summary;
}

/**
 * Parse uploaded file and return all analysis
 */
export async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let headers, rows;

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            headers = Object.keys(data[0]);
            rows = data;
          } else {
            throw new Error('JSON must be an array of objects.');
          }
        } else {
          // CSV / TSV
          const delimiter = detectDelimiter(text);
          const result = parseCSV(text, delimiter);
          headers = result.headers;
          rows = result.rows;
        }

        const schema = inferColumnTypes(headers, rows);
        const summary = generateSummary(headers, rows, schema);

        resolve({
          fileName: file.name,
          fileSize: file.size,
          headers,
          rows,
          schema,
          summary,
          preview: rows.slice(0, 10),
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

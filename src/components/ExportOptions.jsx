import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { exportToPDF } from "../utils/exportPDF.js";
import { exportToExcel, exportToExcelMultiple } from "../utils/exportExcel.js";
import { toast } from "./Toast.jsx";

const ExportOptions = ({ 
  data, 
  title = "Movement Records",
  onExportComplete,
  onImportCsv,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const fileInputRef = useRef(null);

  const handleImportCsvClick = () => {
    if (!onImportCsv) {
      toast.warning("CSV/TXT import is not available here.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImportCsvFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseCsvFromFile(file);
      if (!Array.isArray(rows) || rows.length === 0) {
        toast.warning("No rows found in CSV/TXT file.");
        return;
      }

      onImportCsv(rows);
      if (onExportComplete) onExportComplete("import-csv");
    } catch (error) {
      toast.error(`CSV/TXT import failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  };

  const parseCsvFromFile = async (file) => {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return headers.reduce((acc, header, idx) => {
        acc[header] = values[idx] ?? "";
        return acc;
      }, {});
    });
  };

  const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        const nextChar = line[i + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  };

  const handleExport = async (type) => {
    if (data.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    setIsExporting(true);
    setExportType(type);

    try {
      switch (type) {
        case 'pdf':
          await exportPDF(data, `tui-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
          break;
        case 'excel':
          await exportToExcel(data, `tui-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`);
          break;
        case 'print':
          handlePrint();
          break;
        default:
          throw new Error("Unknown export type");
      }

      if (onExportComplete) {
        onExportComplete(type);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportType("");
    }
  };

  const exportPDF = (data, filename) => {
    return new Promise((resolve, reject) => {
      try {
        const { exportToPDF: pdfExport } = require("../utils/exportPDF.js");
        pdfExport(data, filename);
        setTimeout(resolve, 1000);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Please allow popups to print');
      return;
    }

    // Generate print-friendly HTML
    const printContent = generatePrintHTML(data, title);
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const generatePrintHTML = (data, title) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - TUI Airways</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            color: #333;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007acc;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #007acc;
            margin: 0;
            font-size: 20px;
          }
          .header .subtitle {
            color: #666;
            margin: 3px 0 0 0;
            font-size: 12px;
          }
          .summary {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 15px;
            font-size: 12px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
          }
          .summary-item {
            background: white;
            padding: 8px;
            border-radius: 2px;
            border-left: 3px solid #007acc;
          }
          .summary-item .label {
            font-size: 10px;
            color: #666;
            margin-bottom: 2px;
          }
          .summary-item .value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          th {
            background-color: #007acc;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 10px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .no-data {
            text-align: center;
            padding: 30px;
            color: #666;
            font-style: italic;
          }
          @media print {
            body { margin: 10px; }
            .header { page-break-after: always; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
            th, td { font-size: 9px; padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="subtitle">TUI Airways Movement Logbook</div>
          <div class="subtitle">Generated on ${currentDate} at ${currentTime}</div>
        </div>
        
        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Total Movements</div>
              <div class="value">${data.length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Unique Aircraft</div>
              <div class="value">${new Set(data.map(item => item.aircraft)).size}</div>
            </div>
            <div class="summary-item">
              <div class="label">Date Range</div>
              <div class="value">${getDateRange(data)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Top Stand</div>
              <div class="value">${getTopStand(data)}</div>
            </div>
          </div>
        </div>
        
        ${data.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Aircraft</th>
                <th>Type</th>
                <th>Movement</th>
                <th>From</th>
                <th>To</th>
                <th>User</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.date || '-'}</td>
                  <td>${item.time || '-'}</td>
                  <td>${item.aircraft || '-'}</td>
                  <td>${getAircraftType(item.aircraft)}</td>
                  <td>${item.movementType || '-'}</td>
                  <td>${item.fromStand || '-'}</td>
                  <td>${item.toStand || '-'}</td>
                  <td>${item.createdBy || '-'}</td>
                  <td>${(item.notes || '').substring(0, 30)}${item.notes && item.notes.length > 30 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="no-data">
            No movement records found for the selected criteria.
          </div>
        `}
        
        <div class="footer">
          <p>TUI Airways Movement Logbook - Confidential Document</p>
          <p>Page 1 of 1</p>
        </div>
      </body>
      </html>
    `;
  };

  const getDateRange = (data) => {
    if (data.length === 0) return 'No data';
    
    const dates = data
      .filter(item => item.date)
      .map(item => new Date(item.date))
      .sort((a, b) => a - b);
    
    if (dates.length === 0) return 'No dates';
    if (dates.length === 1) return dates[0].toLocaleDateString();
    
    return `${dates[0].toLocaleDateString()} - ${dates[dates.length - 1].toLocaleDateString()}`;
  };

  const getTopStand = (data) => {
    if (data.length === 0) return 'No data';
    
    const standCounts = {};
    data.forEach(item => {
      if (item.fromStand) {
        standCounts[item.fromStand] = (standCounts[item.fromStand] || 0) + 1;
      }
      if (item.toStand) {
        standCounts[item.toStand] = (standCounts[item.toStand] || 0) + 1;
      }
    });
    
    const topStand = Object.entries(standCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topStand ? topStand[0] : 'No stands';
  };

  const getAircraftType = (aircraft) => {
    if (!aircraft) return '';
    const parts = aircraft.split(' - ');
    return parts.length > 1 ? parts[1] : aircraft;
  };

  return (
    <div className="ops-panel space-y-4 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
          Export Options
        </h3>
        <div className="text-sm text-slate-400">
          {data.length} records
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={handleImportCsvFile}
        />

        {/* CSV/TXT Import */}
        <button
          onClick={handleImportCsvClick}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          ⬆️ Import CSV/TXT
        </button>

        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting || data.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isExporting && exportType === 'pdf' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              📄 Export PDF
            </>
          )}
        </button>

        {/* Excel Export */}
        <button
          onClick={() => handleExport('excel')}
          disabled={isExporting || data.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isExporting && exportType === 'excel' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              📊 Export Excel
            </>
          )}
        </button>

        {/* Print */}
        <button
          onClick={() => handleExport('print')}
          disabled={isExporting || data.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isExporting && exportType === 'print' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Preparing...
            </>
          ) : (
            <>
              🖨️ Print
            </>
          )}
        </button>
      </div>

      <div className="space-y-2 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span><strong>PDF:</strong> Professional formatted report for sharing and archiving</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span><strong>Excel:</strong> Data spreadsheet for analysis and calculations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span><strong>Print:</strong> Optimized print layout for physical copies</span>
        </div>
      </div>

      {data.length === 0 && (
        <div className="rounded-lg bg-slate-900/50 py-4 text-center text-slate-500">
          No data available to export
        </div>
      )}
    </div>
  );
};

ExportOptions.propTypes = {
  data: PropTypes.array.isRequired,
  title: PropTypes.string,
  onExportComplete: PropTypes.func,
  onImportCsv: PropTypes.func,
};

export default ExportOptions;

// =============================================================================
// Popo Live Phase 7 Module 7.10 — Pure TypeScript Standards-Compliant PDF-1.4 Builder
// Zero external font/binary dependencies (works reliably in Next.js serverless & PM2).
// Produces valid mobile-friendly printable PDF receipts & multi-page finance reports.
// =============================================================================

function pdfEscape(str: string | number | null | undefined): string {
  return String(str ?? '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['-'];
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur ? cur.length + 1 : 0) + w.length <= maxChars) {
      cur = cur ? `${cur} ${w}` : w;
    } else {
      if (cur) lines.push(cur);
      cur = w.length > maxChars ? `${w.slice(0, maxChars - 3)}...` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function assemblePdfDocument(pageWidth: number, pageHeight: number, contentStreams: string[]): Buffer {
  const objects: string[] = [];
  const addObj = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObj('');
  const pagesId = addObj('');
  const fontRegularId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const pageIds: number[] = [];
  for (const streamStr of contentStreams) {
    const streamBytes = Buffer.byteLength(streamStr, 'latin1');
    const streamId = addObj(`<< /Length ${streamBytes} >>\nstream\n${streamStr}\nendstream`);
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${streamId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  const headerBuf = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1');
  const chunks: Buffer[] = [headerBuf];
  const offsets: number[] = [0];
  let currentOffset = headerBuf.length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    const entry = Buffer.from(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`, 'latin1');
    chunks.push(entry);
    currentOffset += entry.length;
  }

  const xrefOffset = currentOffset;
  const xrefLines: string[] = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
  for (let i = 1; i <= objects.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xrefLines.join('') + trailer, 'latin1'));
  return Buffer.concat(chunks);
}

export interface PdfReceiptInput {
  receiptId: string;
  receiptNumber: string;
  transactionId: string;
  userId: string;
  userNickname?: string | null;
  userPoppoId?: string | null;
  txCategory: string;
  title: string;
  description: string;
  paymentAmount: number;
  currency: string;
  coinQuantity: number;
  bonusCoinQuantity: number;
  pointsQuantity: number;
  platformShareCoins: number;
  sharePercentage?: number | null;
  paymentMethod?: string | null;
  providerReferenceMasked?: string | null;
  status: string;
  issuedAt: string;
  itemDetailSummary?: string | null;
}

export function generateReceiptPdfBuffer(r: PdfReceiptInput): Buffer {
  // Mobile-friendly printable A4 Portrait (595 x 842)
  const W = 595;
  const H = 842;

  const statusColor =
    r.status === 'successful'
      ? '0.13 0.77 0.45'
      : r.status === 'refunded'
      ? '0.96 0.62 0.04'
      : '0.94 0.27 0.27';

  const statusBadgeLabel =
    r.status === 'successful'
      ? 'VERIFIED / PAID'
      : r.status === 'refunded'
      ? 'REFUNDED'
      : 'REVERSED';

  const paymentDisplay =
    r.paymentAmount > 0 && r.currency !== 'NONE'
      ? `${r.currency} ${Number(r.paymentAmount).toFixed(2)}`
      : '0.00 (Virtual Coin / Points Ledger)';

  const lines: string[] = [
    // Deep purple branded header + neon pink bottom accent bar
    '0.075 0.031 0.165 rg 32 712 531 98 re f',
    '1.0 0.180 0.455 rg 32 712 531 5 re f',
    'BT /F2 20 Tf 1 1 1 rg 52 770 Td (POPO LIVE) Tj ET',
    'BT /F1 10.5 Tf 0.98 0.75 0.14 rg 52 746 Td (OFFICIAL FINANCIAL TRANSACTION RECEIPT) Tj ET',
    `BT /F2 11 Tf ${statusColor} rg 422 768 Td (${pdfEscape(statusBadgeLabel)}) Tj ET`,
    'BT /F1 8.5 Tf 0.80 0.76 0.92 rg 422 746 Td (Verified Backend Record) Tj ET',
    // Light neutral printable card body
    '0.97 0.96 0.99 rg 32 108 531 588 re f',
    '0.82 0.78 0.90 RG 1 w 32 108 531 588 re S',
  ];

  const rows: Array<[string, string]> = [
    ['Receipt Number', r.receiptNumber],
    ['Receipt ID', r.receiptId],
    ['Transaction ID', r.transactionId],
    ['Transaction Type', `${r.txCategory.toUpperCase()} — ${r.title}`],
    [
      'Account Holder',
      r.userNickname
        ? `${r.userNickname}${r.userPoppoId ? ` (ID: ${r.userPoppoId})` : ''} [${r.userId}]`
        : r.userId,
    ],
    ['Description', r.description || r.title],
    ['Payment Amount', paymentDisplay],
    ['Coins Quantity', `${Number(r.coinQuantity || 0).toLocaleString()} Coins`],
    ['Bonus Coins', `${Number(r.bonusCoinQuantity || 0).toLocaleString()} Bonus Coins`],
    [
      'Host Points (Non-Cash)',
      `${Number(r.pointsQuantity || 0).toLocaleString()} Points${
        r.sharePercentage ? ` (${r.sharePercentage}% host share)` : ''
      }`,
    ],
    ['Platform Share (30%)', `${Number(r.platformShareCoins || 0).toLocaleString()} Coins`],
    ['Item / Plan Summary', r.itemDetailSummary || 'Standard Ledger Entry'],
    ['Payment Method', r.paymentMethod || 'Popo Live Wallet'],
    ['Provider Reference', r.providerReferenceMasked || 'Internal Popo Live Reference'],
    ['Status', r.status.toUpperCase()],
    ['Issued Date (UTC)', r.issuedAt],
  ];

  let y = 668;
  for (const [label, val] of rows) {
    const valLines = wrapText(val, 52);
    lines.push(`BT /F2 9.5 Tf 0.25 0.16 0.44 rg 50 ${y} Td (${pdfEscape(label)}) Tj ET`);
    let vy = y;
    for (const vl of valLines.slice(0, 2)) {
      lines.push(`BT /F1 9.5 Tf 0.10 0.10 0.14 rg 206 ${vy} Td (${pdfEscape(vl)}) Tj ET`);
      vy -= 12;
    }
    const rowStep = valLines.length > 1 ? 38 : 31;
    lines.push(`0.88 0.85 0.93 RG 0.5 w 50 ${y - rowStep + 18} m 545 ${y - rowStep + 18} l S`);
    y -= rowStep;
    if (y < 130) break;
  }

  lines.push(
    'BT /F1 8 Tf 0.42 0.36 0.54 rg 32 84 Td (Note: Coins, Host Points, Platform Share, and Real Payment Amounts remain strictly separate.) Tj ET'
  );
  lines.push(
    'BT /F1 8 Tf 0.42 0.36 0.54 rg 32 70 Td (Host Points are non-cash platform credits. Sensitive provider credentials are masked for security.) Tj ET'
  );

  return assemblePdfDocument(W, H, [lines.join('\n')]);
}

export interface PdfFinanceReportInput {
  reportTitle: string;
  generatedAt: string;
  exportedBy: string;
  periodLabel: string;
  filtersSummary: string;
  recordCount: number;
  metrics: Array<{ label: string; value: string }>;
  headers: string[];
  rows: Array<Array<string | number>>;
  disclaimer?: string;
}

export function generateFinanceReportPdfBuffer(report: PdfFinanceReportInput): Buffer {
  // Landscape A4 (842 x 595) for clean multi-column financial tables
  const W = 842;
  const H = 595;
  const streams: string[] = [];

  const rowsPerPageFirst = 13;
  const rowsPerPageNext = 20;
  const totalRows = report.rows.length;
  const chunks: Array<Array<Array<string | number>>> = [];
  if (totalRows === 0) {
    chunks.push([]);
  } else {
    chunks.push(report.rows.slice(0, rowsPerPageFirst));
    let cursor = rowsPerPageFirst;
    while (cursor < totalRows) {
      chunks.push(report.rows.slice(cursor, cursor + rowsPerPageNext));
      cursor += rowsPerPageNext;
    }
  }

  const colCount = Math.max(1, Math.min(report.headers.length, 9));
  const tableWidth = 778;
  const colWidth = tableWidth / colCount;

  chunks.forEach((pageRows, pageIdx) => {
    const isFirst = pageIdx === 0;
    const cmds: string[] = [
      '0.075 0.031 0.165 rg 32 512 778 58 re f',
      '1.0 0.180 0.455 rg 32 512 778 4 re f',
      `BT /F2 15 Tf 1 1 1 rg 46 544 Td (${pdfEscape(report.reportTitle)}) Tj ET`,
      `BT /F1 8.5 Tf 0.98 0.75 0.14 rg 46 525 Td (${pdfEscape(
        `Period: ${report.periodLabel} | Exporter Admin: ${report.exportedBy} | Records: ${report.recordCount} | Page ${
          pageIdx + 1
        }/${chunks.length}`
      )}) Tj ET`,
      `BT /F1 8 Tf 0.85 0.82 0.95 rg 580 546 Td (Generated UTC: ${pdfEscape(report.generatedAt)}) Tj ET`,
    ];

    let y = 492;
    if (isFirst) {
      cmds.push(
        `BT /F1 8.5 Tf 0.25 0.18 0.40 rg 32 ${y} Td (${pdfEscape(`Applied Filters: ${report.filtersSummary}`)}) Tj ET`
      );
      y -= 18;

      // Render KPI metric boxes (2 rows max, up to 4 per row)
      const boxW = 186;
      const boxGap = 11;
      report.metrics.slice(0, 8).forEach((m, idx) => {
        const rowI = Math.floor(idx / 4);
        const colI = idx % 4;
        const bx = 32 + colI * (boxW + boxGap);
        const by = y - rowI * 46 - 38;
        cmds.push(`0.96 0.95 0.99 rg ${bx} ${by} ${boxW} 38 re f`);
        cmds.push(`0.82 0.77 0.92 RG 0.8 w ${bx} ${by} ${boxW} 38 re S`);
        cmds.push(`BT /F1 7.5 Tf 0.42 0.34 0.56 rg ${bx + 8} ${by + 24} Td (${pdfEscape(m.label.slice(0, 34))}) Tj ET`);
        cmds.push(`BT /F2 10.5 Tf 0.10 0.08 0.20 rg ${bx + 8} ${by + 8} Td (${pdfEscape(m.value.slice(0, 28))}) Tj ET`);
      });

      const kpiRowsCount = Math.ceil(Math.min(report.metrics.length, 8) / 4);
      y -= kpiRowsCount * 48 + 12;
    }

    // Table Header Bar
    cmds.push(`0.16 0.06 0.36 rg 32 ${y - 20} ${tableWidth} 20 re f`);
    for (let c = 0; c < colCount; c++) {
      const hText = String(report.headers[c] || '').slice(0, 18);
      cmds.push(`BT /F2 7.5 Tf 1 1 1 rg ${36 + c * colWidth} ${y - 13} Td (${pdfEscape(hText)}) Tj ET`);
    }
    y -= 24;

    if (pageRows.length === 0) {
      cmds.push(`BT /F1 9 Tf 0.35 0.35 0.45 rg 36 ${y - 16} Td (No matching financial records for selected filters.) Tj ET`);
    } else {
      for (let r = 0; r < pageRows.length; r++) {
        const row = pageRows[r];
        if (r % 2 === 1) {
          cmds.push(`0.97 0.96 0.99 rg 32 ${y - 17} ${tableWidth} 18 re f`);
        }
        for (let c = 0; c < colCount; c++) {
          const valStr = String(row[c] ?? '').slice(0, 19);
          cmds.push(`BT /F1 7.2 Tf 0.12 0.12 0.16 rg ${36 + c * colWidth} ${y - 11} Td (${pdfEscape(valStr)}) Tj ET`);
        }
        cmds.push(`0.90 0.88 0.94 RG 0.4 w 32 ${y - 18} m ${32 + tableWidth} ${y - 18} l S`);
        y -= 19;
      }
    }

    cmds.push(
      `BT /F1 7.5 Tf 0.45 0.38 0.55 rg 32 24 Td (${pdfEscape(
        report.disclaimer ||
          'Popo Live Authorized Finance Report — Coins, Host Points (70% non-cash share), Platform Share (30%), and Cash Revenue are tracked strictly separately.'
      )}) Tj ET`
    );
    streams.push(cmds.join('\n'));
  });

  return assemblePdfDocument(W, H, streams);
}

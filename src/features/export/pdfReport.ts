import { platformLabels } from '../../constants/platforms';
import type { MonthReport } from './exportData';

// Minimal dependency-free PDF writer for the monthly report. It only needs
// text, filled rectangles and the two standard Helvetica fonts, so no native
// PDF library is required. Text is encoded as WinAnsi (Latin-1 plus the euro).

export interface ReportLabels {
  title: string; // Heading, e.g. "Informe de noviembre de 2026".
  generatedBy: string; // Footer text.
  page: string; // "Página" / "Page".
  operations: string;
  fares: string;
  tips: string;
  netCash: string;
  average: string;
  byPlatform: string;
  byDay: string;
  platform: string;
  day: string;
  total: string;
}

export interface ReportFormat {
  money: (cents: number) => string;
  dayLabel: (key: string) => string;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const ROW = 19;
const TEXT = '0.04 0.045 0.045';
const GREY = '0.4 0.42 0.41';
const LIME = '0.78 0.94 0.29';
const LIGHT = '0.95 0.97 0.89';
const ZEBRA = '0.965 0.97 0.955';
const DARK = '0.078 0.082 0.082';

// Helvetica glyph widths (1/1000 em) for the characters used in numbers.
function width(text: string, size: number): number {
  let total = 0;
  for (const char of text) {
    total +=
      char === ',' || char === '.' || char === ' ' || char === ':'
        ? 278
        : char === '-'
        ? 333
        : char === '%'
        ? 889
        : 556;
  }
  return (total * size) / 1000;
}

function encode(text: string): string {
  let out = '';
  for (const char of text.replace(/[  ]/g, ' ')) {
    const code = char.charCodeAt(0);
    const byte = char === '€' ? 0x80 : code < 256 ? code : 0x3f; // "?" for anything outside WinAnsi
    if (char === '\\' || char === '(' || char === ')') {
      out += `\\${char}`;
    } else if (byte < 32 || byte > 126) {
      out += `\\${byte.toString(8).padStart(3, '0')}`;
    } else {
      out += String.fromCharCode(byte);
    }
  }
  return out;
}

class Page {
  ops: string[] = [];
  rect(x: number, y: number, w: number, h: number, color: string) {
    this.ops.push(
      `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(
        2,
      )} re f`,
    );
  }
  text(
    x: number,
    y: number,
    value: string,
    size: number,
    options: { bold?: boolean; color?: string; align?: 'left' | 'right' } = {},
  ) {
    const left = options.align === 'right' ? x - width(value, size) : x;
    this.ops.push(
      `BT /${options.bold ? 'F2' : 'F1'} ${size} Tf ${
        options.color ?? TEXT
      } rg ${left.toFixed(2)} ${y.toFixed(2)} Td (${encode(value)}) Tj ET`,
    );
  }
}

export function buildMonthPdf(
  report: MonthReport,
  labels: ReportLabels,
  format: ReportFormat,
): string {
  const pages: Page[] = [];
  const right = PAGE_WIDTH - MARGIN;
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let page = new Page();
  pages.push(page);

  // Header
  page.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, LIME);
  page.text(MARGIN, PAGE_HEIGHT - 52, 'Cash Driver', 22, { bold: true });
  page.text(MARGIN, PAGE_HEIGHT - 74, labels.title, 13, { color: GREY });

  // Summary boxes
  const boxes = [
    [labels.operations, String(report.count)],
    [labels.fares, format.money(report.fareTotalCents)],
    [labels.tips, format.money(report.tipTotalCents)],
    [labels.netCash, format.money(report.netCashTotalCents)],
  ];
  const gap = 8;
  const boxWidth = (contentWidth - gap * 3) / 4;
  const boxTop = PAGE_HEIGHT - 100;
  boxes.forEach(([label, value], index) => {
    const x = MARGIN + index * (boxWidth + gap);
    page.rect(x, boxTop - 50, boxWidth, 50, LIGHT);
    page.text(x + 9, boxTop - 18, label, 8.5, { color: GREY });
    page.text(x + 9, boxTop - 38, value, 13, { bold: true });
  });
  page.text(
    MARGIN,
    boxTop - 68,
    `${labels.average}: ${format.money(report.averageFareCents)}`,
    9.5,
    { color: GREY },
  );

  const columns = (
    target: Page,
    y: number,
    cells: string[],
    xs: number[],
    options: { bold?: boolean; color?: string },
  ) => {
    cells.forEach((cell, index) => {
      target.text(xs[index], y, cell, 9.5, {
        bold: options.bold,
        color: options.color,
        align: index === 0 ? 'left' : 'right',
      });
    });
  };

  let y = boxTop - 100;
  const tableHeader = (
    target: Page,
    top: number,
    cells: string[],
    xs: number[],
  ) => {
    target.rect(MARGIN, top - 5, contentWidth, ROW, DARK);
    columns(target, top, cells, xs, { bold: true, color: '1 1 1' });
  };

  // Platform table
  page.text(MARGIN, y + 8, labels.byPlatform, 12, { bold: true });
  y -= 14;
  const platformXs = [MARGIN + 8, MARGIN + 270, MARGIN + 390, right - 8];
  tableHeader(
    page,
    y - 14,
    [labels.platform, labels.operations, labels.fares, labels.tips],
    platformXs,
  );
  y -= 14 + ROW;
  report.platforms.forEach((row, index) => {
    if (index % 2 === 1) {
      page.rect(MARGIN, y - 5, contentWidth, ROW, ZEBRA);
    }
    columns(
      page,
      y,
      [
        platformLabels[row.platform],
        String(row.count),
        format.money(row.fareCents),
        format.money(row.tipCents),
      ],
      platformXs,
      {},
    );
    y -= ROW;
  });

  // Daily table (paginated)
  y -= 22;
  const dayXs = [
    MARGIN + 8,
    MARGIN + 215,
    MARGIN + 305,
    MARGIN + 410,
    right - 8,
  ];
  const dayHeader = [
    labels.day,
    labels.operations,
    labels.fares,
    labels.tips,
    labels.netCash,
  ];
  const needsRoom = (rows: number) => y - rows * ROW < 60;
  if (needsRoom(3)) {
    page = new Page();
    pages.push(page);
    y = PAGE_HEIGHT - 60;
  }
  page.text(MARGIN, y + 8, labels.byDay, 12, { bold: true });
  y -= 14;
  tableHeader(page, y - 14, dayHeader, dayXs);
  y -= 14 + ROW;
  report.days.forEach((day, index) => {
    if (y < 60) {
      page = new Page();
      pages.push(page);
      y = PAGE_HEIGHT - 60;
      tableHeader(page, y, dayHeader, dayXs);
      y -= ROW;
    }
    if (index % 2 === 1) {
      page.rect(MARGIN, y - 5, contentWidth, ROW, ZEBRA);
    }
    columns(
      page,
      y,
      [
        format.dayLabel(day.key),
        String(day.count),
        format.money(day.fareCents),
        format.money(day.tipCents),
        format.money(day.netCashCents),
      ],
      dayXs,
      {},
    );
    y -= ROW;
  });
  if (y < 60) {
    page = new Page();
    pages.push(page);
    y = PAGE_HEIGHT - 60;
  }
  page.rect(MARGIN, y - 5, contentWidth, ROW, LIGHT);
  columns(
    page,
    y,
    [
      labels.total,
      String(report.count),
      format.money(report.fareTotalCents),
      format.money(report.tipTotalCents),
      format.money(report.netCashTotalCents),
    ],
    dayXs,
    { bold: true },
  );

  // Footers
  pages.forEach((target, index) => {
    target.text(
      MARGIN,
      28,
      `${labels.generatedBy}  ·  ${labels.page} ${index + 1}/${pages.length}`,
      8,
      { color: GREY },
    );
  });

  // Assemble objects: 1 catalog, 2 pages, 3-4 fonts, then page + content pairs.
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds
    .map(id => `${id} 0 R`)
    .join(' ')}] /Count ${pages.length} >>`;
  objects[3] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  pages.forEach((target, index) => {
    const content = target.ops.join('\n');
    const pageId = pageIds[index];
    objects[
      pageId
    ] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${
      pageId + 1
    } 0 R >>`;
    objects[
      pageId + 1
    ] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

// The PDF string only contains ASCII (non-ASCII is octal-escaped), so base64
// of its char codes is the exact byte content.
export function pdfToBase64(pdf: string): string {
  return btoa(pdf);
}

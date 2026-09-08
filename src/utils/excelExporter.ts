import ExcelJS from 'exceljs';
import type { QuoteDocument } from '../types/itinerary';
import { detectIsland } from './costCalculator';
import { getSystemConfig } from './storage';

export async function exportQuoteToExcel(doc: QuoteDocument, fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '新西兰定制旅游行程报价系统';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('行程报价确认单', {
    views: [
      {
        state: 'frozen',
        xSplit: 4,
        ySplit: 0,
        topLeftCell: 'E1',
        showGridLines: true,
      },
    ],
  });

  // 设置列宽（精准对齐 26.12.18 南北岛18天.xlsx）
  worksheet.getColumn(1).width = 10.5;   // Col A: Day 序号
  worksheet.getColumn(2).width = 11.62;  // Col B: 日期
  worksheet.getColumn(3).width = 34.7;   // Col C: 行程路线
  worksheet.getColumn(4).width = 30.5;   // Col D: 活动 // 球场

  // 若包含右侧辅助成本核算列
  const includeBreakdown = doc.includeCostBreakdown !== false;
  if (includeBreakdown) {
    worksheet.getColumn(5).width = 11.0; // E: 北岛
    worksheet.getColumn(6).width = 11.0; // F: 南岛
    worksheet.getColumn(7).width = 11.0; // G: 节日附加费
    worksheet.getColumn(8).width = 11.0; // H: 附加费
    worksheet.getColumn(9).width = 11.0; // I: 北岛餐补
    worksheet.getColumn(10).width = 11.0; // J: 南岛餐补
    worksheet.getColumn(11).width = 11.0; // K: 住宿补贴
    worksheet.getColumn(12).width = 12.0; // L: 每日小计
  }

  // 统一字体：华文楷体 12号（完全对齐原表）
  const fontKaiti: Partial<ExcelJS.Font> = {
    name: '华文楷体',
    size: 12,
    color: { argb: 'FF000000' },
  };

  // 红色加粗字体
  const fontRedBold: Partial<ExcelJS.Font> = {
    name: '华文楷体',
    size: 12,
    bold: true,
    color: { argb: 'FFFF0000' },
  };

  // 实线细边框 (thin)
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  // 明黄色底纹 (FFFFFF00)
  const yellowFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF00' },
  };

  let currentRowNum = 1;

  // 1. Row 1: 顶部附加说明行（PS：26春节：2.16-26 附加费）
  const psText = doc.psNote || 'PS： 26春节：2.16-26 附加费';
  const row1 = worksheet.addRow([psText, '', '', '']);
  row1.height = 22;
  worksheet.mergeCells(`A1:D1`);
  const cellA1 = worksheet.getCell('A1');
  cellA1.font = fontRedBold;
  cellA1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // 若带右侧成本核算表头
  if (includeBreakdown) {
    worksheet.getCell('E1').value = doc.vehicleQuote.vehicleModel || '7 座 Alphard';
    worksheet.getCell('E1').font = fontKaiti;
    worksheet.getCell('E1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('E1:H1');
    applyBorderToMergedRange(worksheet, 'E1:H1', thinBorder);

    worksheet.getCell('I1').value = '导游';
    worksheet.getCell('I1').font = fontKaiti;
    worksheet.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('I1:K1');
    applyBorderToMergedRange(worksheet, 'I1:K1', thinBorder);

    worksheet.getCell('L1').value = '总计';
    worksheet.getCell('L1').font = fontKaiti;
    worksheet.getCell('L1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('L1').border = thinBorder;
  }
  currentRowNum++;

  // 2. Row 2: 表头 (A2:B2 合并为“日期”，C2“行程”，D2“活动 // 球场”)
  const row2 = worksheet.addRow(['日期', '', '行程', '活动 // 球场']);
  row2.height = 20;
  worksheet.mergeCells(`A2:B2`);

  const cellDate = worksheet.getCell('A2');
  cellDate.font = fontKaiti;
  cellDate.alignment = { vertical: 'middle', horizontal: 'center' };

  const cellRoute = worksheet.getCell('C2');
  cellRoute.font = fontKaiti;
  cellRoute.alignment = { vertical: 'middle', horizontal: 'center' };

  const cellAct = worksheet.getCell('D2');
  cellAct.font = fontKaiti;
  cellAct.alignment = { vertical: 'middle', horizontal: 'center' };

  if (includeBreakdown) {
    const subHeaders = ['北岛', '南岛', '节日附加费', '附加费', '北岛餐补', '南岛餐补', '住宿补贴', '小计'];
    subHeaders.forEach((sh, idx) => {
      const colLetter = String.fromCharCode(69 + idx); // E, F, G...
      const c = worksheet.getCell(`${colLetter}2`);
      c.value = sh;
      c.font = fontKaiti;
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.border = thinBorder;
    });
  }
  currentRowNum++;

  // 3. 行程行明细
  const itineraryStartRow = currentRowNum;
  doc.itinerary.forEach((item, idx) => {
    // 动态行高：若行程或活动有多行换行，设为 40~42，否则 20
    const hasMultipleLines = (item.route && item.route.includes('\n')) || (item.activity && item.activity.includes('\n'));
    const rHeight = hasMultipleLines ? 42 : 20;

    const row = worksheet.addRow([item.day, item.date, item.route, item.activity]);
    row.height = rHeight;

    const cA = worksheet.getCell(`A${currentRowNum}`);
    const cB = worksheet.getCell(`B${currentRowNum}`);
    const cC = worksheet.getCell(`C${currentRowNum}`);
    const cD = worksheet.getCell(`D${currentRowNum}`);

    cA.font = fontKaiti;
    cA.alignment = { vertical: 'middle', horizontal: 'center' };

    cB.font = fontKaiti;
    cB.alignment = { vertical: 'middle', horizontal: 'center' };

    cC.font = fontKaiti;
    cC.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };

    cD.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
    if (item.noCar || item.activity.includes('不用车')) {
      cD.font = fontRedBold;
    } else {
      cD.font = fontKaiti;
    }

    if (includeBreakdown) {
      const isNoCar = Boolean(item.noCar || (item.activity && item.activity.includes('不用车')));

      let eVal: number | null = null;
      let fVal: number | null = null;
      let gVal: number | null = null;
      let hVal: number | null = null;
      let iVal: number | null = null;
      let jVal: number | null = null;
      let kVal: number | null = null;

      // 只有需要用车时才输出底表成本
      if (!isNoCar) {
        const hasPredefinedCost = item.northIslandCar != null || item.southIslandCar != null || item.northGuideMeal != null || item.southGuideMeal != null;

        eVal = item.northIslandCar ?? null;
        fVal = item.southIslandCar ?? null;
        gVal = item.holidaySurcharge ?? null;
        hVal = item.otherSurcharge ?? null;
        iVal = item.northGuideMeal ?? null;
        jVal = item.southGuideMeal ?? null;
        kVal = item.guideAccommodation ?? null;

        // 智能兜底：如果未配置过成本明细（如新识别或导入的行程），自动按当前车型单价与路线特征补全，绝不留空
        if (!hasPredefinedCost) {
          const island = detectIsland(item.route);
          const sysCfg = getSystemConfig();
          const matchedV = sysCfg.vehicleList.find(v => v.name === doc.vehicleQuote.vehicleModel) || sysCfg.vehicleList[0];

          if (island === 'south') {
            fVal = matchedV?.southIslandPrice || 850;
            jVal = sysCfg.guideAllowance?.southIslandMeal || 75;
          } else {
            eVal = matchedV?.northIslandPrice || 750;
            iVal = sysCfg.guideAllowance?.northIslandMeal || 50;
          }

          if (item.date?.includes('2月') || item.route?.includes('春节')) {
            gVal = matchedV?.holidaySurcharge || (matchedV?.holidaySurcharge === 0 ? null : 175);
          }

          const isLastDay = idx === doc.itinerary.length - 1 && (item.route?.includes('送机') || item.route?.includes('离开'));
          if (!isLastDay && (
            item.route?.includes('蒂阿瑙') || 
            item.route?.includes('库克山') || 
            item.route?.includes('蒂卡波') || 
            item.route?.includes('但尼丁') || 
            item.route?.includes('奥马鲁') || 
            item.route?.includes('罗托鲁阿')
          )) {
            kVal = sysCfg.guideAllowance?.accommodationSubsidy || 200;
          }
        }
      }

      worksheet.getCell(`E${currentRowNum}`).value = eVal;
      worksheet.getCell(`F${currentRowNum}`).value = fVal;
      worksheet.getCell(`G${currentRowNum}`).value = gVal;
      worksheet.getCell(`H${currentRowNum}`).value = hVal;
      worksheet.getCell(`I${currentRowNum}`).value = iVal;
      worksheet.getCell(`J${currentRowNum}`).value = jVal;
      worksheet.getCell(`K${currentRowNum}`).value = kVal;

      // L 列为 SUM(E:K)
      worksheet.getCell(`L${currentRowNum}`).value = {
        formula: `SUM(E${currentRowNum}:K${currentRowNum})`,
      };

      for (let colIdx = 5; colIdx <= 12; colIdx++) {
        const colLetter = String.fromCharCode(64 + colIdx);
        const cell = worksheet.getCell(`${colLetter}${currentRowNum}`);
        cell.font = fontKaiti;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      }
    }

    currentRowNum++;
  });
  const itineraryEndRow = currentRowNum - 1;

  // 若带核算表，在紧接着的一行写核算小计合计行
  if (includeBreakdown) {
    worksheet.getCell(`L${currentRowNum}`).value = {
      formula: `SUM(L${itineraryStartRow}:L${itineraryEndRow})`,
    };
    worksheet.getCell(`L${currentRowNum}`).font = fontRedBold;
    worksheet.getCell(`L${currentRowNum}`).border = thinBorder;
    worksheet.getCell(`L${currentRowNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // 4. 空行两行（对应原文件中的 Row 20, Row 21）
  const emptyRow1 = worksheet.addRow([]);
  emptyRow1.height = 20;
  currentRowNum++;

  const emptyRow2 = worksheet.addRow([]);
  emptyRow2.height = 20;
  currentRowNum++;

  // 5. 核心报价块 (完全对齐原文件的样式与排版)
  // 5.1 模块 1：用车报价 (Row 22: 黄底，红字加粗，thin 边框，indent 2)
  const vehicleTitleText = `1. 以上行程用车：${doc.vehicleQuote.currency} ${doc.vehicleQuote.totalPrice.toLocaleString()}`;
  const vTitleRow = worksheet.addRow([vehicleTitleText, '', '', '']);
  vTitleRow.height = 20;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const vCell = worksheet.getCell(`A${currentRowNum}`);
  vCell.font = fontRedBold;
  vCell.fill = yellowFill;
  vCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
  currentRowNum++;

  // 5.2 价格包含标题 (Row 23)
  const incTitleRow = worksheet.addRow(['价格包含：', '', '', '']);
  incTitleRow.height = 20;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const incTitleCell = worksheet.getCell(`A${currentRowNum}`);
  incTitleCell.font = fontKaiti;
  incTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
  currentRowNum++;

  // 5.3 价格包含明细 (Row 24, Row 25: indent 3)
  doc.vehicleQuote.inclusions.forEach((incText) => {
    const incRow = worksheet.addRow([incText, '', '', '']);
    incRow.height = 20;
    worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
    const cell = worksheet.getCell(`A${currentRowNum}`);
    cell.font = fontKaiti;
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 3 };
    applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
    currentRowNum++;
  });

  // 5.4 价格包含占位空行 (Row 26: 原文件中有一行合并单元格的空行，带 thin 边框)
  const placeholderRow = worksheet.addRow(['', '', '', '']);
  placeholderRow.height = 20;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
  currentRowNum++;

  // 5.5 价格不含标题 (Row 27)
  const excTitleRow = worksheet.addRow(['价格不含：', '', '', '']);
  excTitleRow.height = 20;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const excTitleCell = worksheet.getCell(`A${currentRowNum}`);
  excTitleCell.font = fontKaiti;
  excTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
  currentRowNum++;

  // 5.6 价格不含明细带序号 (Row 28 ~ 30: A列序号居中，B:D合并 indent 1)
  doc.vehicleQuote.exclusions.forEach((excText, index) => {
    const excRow = worksheet.addRow([index + 1, excText, '', '']);
    excRow.height = 22;

    const numCell = worksheet.getCell(`A${currentRowNum}`);
    numCell.font = fontKaiti;
    numCell.alignment = { vertical: 'middle', horizontal: 'center' };
    numCell.border = thinBorder;

    worksheet.mergeCells(`B${currentRowNum}:D${currentRowNum}`);
    const textCell = worksheet.getCell(`B${currentRowNum}`);
    textCell.font = fontKaiti;
    textCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    applyBorderToMergedRange(worksheet, `B${currentRowNum}:D${currentRowNum}`, thinBorder);
    currentRowNum++;
  });

  // 5.7 说明标题 (Row 31)
  const noteTitleRow = worksheet.addRow(['说明：', '', '', '']);
  noteTitleRow.height = 20;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const noteTitleCell = worksheet.getCell(`A${currentRowNum}`);
  noteTitleCell.font = fontKaiti;
  noteTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
  currentRowNum++;

  // 5.8 说明明细带序号 (Row 32 ~ 33: A列序号居中，B:D合并 indent 1)
  doc.vehicleQuote.notes.forEach((noteText, index) => {
    const noteRow = worksheet.addRow([index + 1, noteText, '', '']);
    noteRow.height = 20;

    const numCell = worksheet.getCell(`A${currentRowNum}`);
    numCell.font = fontKaiti;
    numCell.alignment = { vertical: 'middle', horizontal: 'center' };
    numCell.border = thinBorder;

    worksheet.mergeCells(`B${currentRowNum}:D${currentRowNum}`);
    const textCell = worksheet.getCell(`B${currentRowNum}`);
    textCell.font = fontKaiti;
    textCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    applyBorderToMergedRange(worksheet, `B${currentRowNum}:D${currentRowNum}`, thinBorder);
    currentRowNum++;
  });

  // 5.9 模块 2：活动费用 (Row 34: 黄底，红字加粗，thin 边框，indent 2)
  const actTitleText = `2. 活动费用：成人：${doc.activityQuote.currency} ${doc.activityQuote.adultPrice}/人；`;
  const actTitleRow = worksheet.addRow([actTitleText, '', '', '']);
  actTitleRow.height = 20;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const actCell = worksheet.getCell(`A${currentRowNum}`);
  actCell.font = fontRedBold;
  actCell.fill = yellowFill;
  actCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);
  currentRowNum++;

  // 5.10 活动包含长文本 (Row 35: A:D 合并，自动换行，行高 65，indent 1)
  const actContentText =
    doc.activityQuote.customActivityText ||
    `活动包含：\n${doc.activityQuote.includedActivities.join('；')}`;
  
  // 保证包含“活动包含：”前缀
  const fullActText = actContentText.startsWith('活动包含：')
    ? actContentText
    : `活动包含：\n${actContentText}`;

  const actContentRow = worksheet.addRow([fullActText, '', '', '']);
  actContentRow.height = 65;
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const actContentCell = worksheet.getCell(`A${currentRowNum}`);
  actContentCell.font = fontKaiti;
  actContentCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
  applyBorderToMergedRange(worksheet, `A${currentRowNum}:D${currentRowNum}`, thinBorder);

  // 导出为 Excel 文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || `${doc.title || '南北岛行程报价确认单'}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

// 辅助函数：统一给合并单元格所有单元格赋予边框，确保 Excel 渲染完整
function applyBorderToMergedRange(
  worksheet: ExcelJS.Worksheet,
  rangeStr: string,
  borderStyle: Partial<ExcelJS.Borders>
) {
  const [start, end] = rangeStr.split(':');
  const startCol = start.charCodeAt(0) - 65 + 1;
  const startRow = parseInt(start.slice(1), 10);
  const endCol = end.charCodeAt(0) - 65 + 1;
  const endRow = parseInt(end.slice(1), 10);

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      worksheet.getCell(r, c).border = borderStyle;
    }
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Funfinity Summer Camp — Google Apps Script (v1.3 Hard-Delete & Custom IDs)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SPREADSHEET_ID = ''; 

const HEADERS = [
  'No.', 'Student Name', "Guardian's Name", 'Contact Number',
  'Class', 'Age', 'Residing Area', 'Zone', 'Activities Selected', 'Submitted At'
];

const ZONE_TAB = {
  'Muharraq': 'Muharraq Zone',
  'Manama':   'Manama Zone',
  'Riffa':    'Riffa Zone'
};

const COLORS = {
  headerBg:      '#FFD93D',
  headerText:    '#1A1A2E',
  muharraqBg:    '#E1F5FE',
  manamaBg:      '#E8F8F2',
  riffaBg:       '#FFF0E0',
  allBg:         '#FFFDF5',
  altRow:        '#FFF8DC',
  updatedBg:     '#FFF3B0',
};

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet not found!");
  }
  return ss;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss      = getSpreadsheet();

    if (payload.action === 'register') {
      handleRegister(ss, payload);
    } else if (payload.action === 'edit') {
      handleEdit(ss, payload);
    } else if (payload.action === 'delete') {
      handleDelete(ss, payload);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    const ss = getSpreadsheet();

    // Fetch all active registrations to restore web database on server restart
    if (e && e.parameter && e.parameter.action === 'getAll') {
      const sheet = ss.getSheetByName('All Registrations');
      if (!sheet) return jsonResponse({ ok: true, registrations: [] });

      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ ok: true, registrations: [] });

      const rows = values.slice(1);
      const registrations = [];

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var idStr = String(r[0] || '');
        if (idStr.indexOf('[DELETED]') === 0) continue;
        if (idStr.indexOf('[UPDATED]') === 0) continue;

        registrations.push({
          id: parseInt(r[0]) || (i + 1),
          student_name:   String(r[1] || ''),
          guardian_name:  String(r[2] || ''),
          contact_number: String(r[3] || ''),
          class:          String(r[4] || ''),
          age:            parseInt(r[5]) || 0,
          residing_area:  String(r[6] || ''),
          zone:           String(r[7] || ''),
          activities:     r[8] ? String(r[8]).split(', ') : [],
          submitted_at:   String(r[9] || '')
        });
      }

      return jsonResponse({ ok: true, registrations: registrations });
    }

    return jsonResponse({ 
      ok: true, 
      app: 'Funfinity Summer Camp Registration Sync', 
      version: '1.3',
      connectedSheet: ss.getName()
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function handleRegister(ss, reg) {
  const activities = formatActivities(reg.activities);
  const row = buildRow(reg, activities);

  const allSheet = getOrCreateSheet(ss, 'All Registrations', COLORS.allBg);
  appendStyledRow(allSheet, row, false);

  const zoneTabName = ZONE_TAB[reg.zone];
  if (zoneTabName) {
    const zoneBg = { 'Muharraq Zone': COLORS.muharraqBg, 'Manama Zone': COLORS.manamaBg, 'Riffa Zone': COLORS.riffaBg }[zoneTabName] || COLORS.allBg;
    const zoneSheet = getOrCreateSheet(ss, zoneTabName, zoneBg);
    appendStyledRow(zoneSheet, row, false);
  }
}

function handleEdit(ss, reg) {
  const activities = formatActivities(reg.activities);
  const allSheet = getOrCreateSheet(ss, 'All Registrations', COLORS.allBg);
  const auditRow = ['[UPDATED] #' + (reg.id || '?')].concat(buildRow(reg, activities).slice(1));
  appendStyledRow(allSheet, auditRow, true);
}

// PERMANENT HARD DELETE: Deletes the matching row permanently from both "All Registrations" and Zone tab
function handleDelete(ss, reg) {
  const targetId = String(reg.id || '');

  // 1. Delete row from "All Registrations" sheet
  const allSheet = ss.getSheetByName('All Registrations');
  if (allSheet) {
    deleteRowByRegistrationId(allSheet, targetId);
  }

  // 2. Delete row from Zone sheet
  const zoneTabName = ZONE_TAB[reg.zone];
  if (zoneTabName) {
    const zoneSheet = ss.getSheetByName(zoneTabName);
    if (zoneSheet) {
      deleteRowByRegistrationId(zoneSheet, targetId);
    }
  }

  Logger.log('Hard deleted registration ID ' + targetId + ' from Google Sheets');
}

function deleteRowByRegistrationId(sheet, targetId) {
  if (!sheet || !targetId) return;
  const values = sheet.getDataRange().getValues();
  // Loop backwards so row deletions don't mess up loop indexing
  for (var i = values.length - 1; i >= 1; i--) {
    var cellValue = String(values[i][0] || '').trim();
    if (cellValue === targetId) {
      sheet.deleteRow(i + 1); // deleteRow takes 1-indexed row number
    }
  }
}

function buildRow(reg, activitiesStr) {
  return [
    reg.id            || '',
    reg.student_name  || '',
    reg.guardian_name || '',
    reg.contact_number|| '',
    reg.class         || '',
    reg.age           || '',
    reg.residing_area || '',
    reg.zone          || '',
    activitiesStr,
    reg.submitted_at  || new Date().toLocaleString('en-GB'),
  ];
}

function formatActivities(activities) {
  if (!activities) return '';
  if (Array.isArray(activities)) return activities.join(', ');
  return String(activities);
}

function getOrCreateSheet(ss, name, altRowColor) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    styleNewSheet(sheet, altRowColor);
  }
  return sheet;
}

function styleNewSheet(sheet, altRowColor) {
  sheet.appendRow(HEADERS);
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground(COLORS.headerBg);
  headerRange.setFontColor(COLORS.headerText);
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 60);
  sheet.setColumnWidth(7, 130);
  sheet.setColumnWidth(8, 110);
  sheet.setColumnWidth(9, 340);
  sheet.setColumnWidth(10, 160);
}

function appendStyledRow(sheet, row, isAudit) {
  sheet.appendRow(row);
  const lastRow   = sheet.getLastRow();
  const rowRange  = sheet.getRange(lastRow, 1, 1, HEADERS.length);
  if (isAudit) {
    rowRange.setBackground(COLORS.updatedBg);
    rowRange.setFontStyle('italic');
  } else {
    rowRange.setBackground(lastRow % 2 === 0 ? '#FFFFFF' : COLORS.altRow);
  }
  sheet.getRange(lastRow, 9).setWrap(true);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

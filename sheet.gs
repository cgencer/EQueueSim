/**
 *
 * @param {number} row - The row number of the cell reference. Row 1 is row number 0.
 * @param {number} column - The column number of the cell reference. A is column number 0.
 * @returns {string} Returns a cell reference as a string using A1 Notation
 *
 * @example
 *
 *   getA1Notation(2, 4) returns "E3"
 *   getA1Notation(2, 4) returns "E3"
 *
 */
const getA1Notation = (row, column) => {
  const a1Notation = [`${row + 1}`];
  const totalAlphabets = 'Z'.charCodeAt() - 'A'.charCodeAt() + 1;
  let block = column;
  while (block >= 0) {
    a1Notation.unshift(String.fromCharCode((block % totalAlphabets) + 'A'.charCodeAt()));
    block = Math.floor(block / totalAlphabets) - 1;
  }
  return a1Notation.join('');
};

/**
 *
 * @param {string} cell -  The cell address in A1 notation
 * @returns {object} The row number and column number of the cell (0-based)
 *
 * @example
 *
 *   fromA1Notation("A2") returns {row: 1, column: 3}
 *
 */

const fromA1Notation = (cell) => {
  const [, columnName, row] = cell.toUpperCase().match(/([A-Z]+)([0-9]+)/);
  const characters = 'Z'.charCodeAt() - 'A'.charCodeAt() + 1;

  let column = 0;
  columnName.split('').forEach((char) => {
    column *= characters;
    column += char.charCodeAt() - 'A'.charCodeAt() + 1;
  });

  return { row, column };
};

/**
 * R1C1 pattern
 *
 * @type {RegExp}
 */

const R1C1 = /^R([1-9]\d*)C([1-9]\d*)$/

/**
 * A1 pattern
 *
 * @type {RegExp}
 */

const A1 = /^([A-Z]+)(\d+)$/

/**
 * Auto detect notation used and convert to the opposite notation
 *
 * @param   {string} ref
 * @returns {string}
 * @throws  {Error}
 */

function cellref (ref) {
  if (R1C1.test(ref)) {
    return convertR1C1toA1(ref)
  }

  if (A1.test(ref)) {
    return convertA1toR1C1(ref)
  }

  throw new Error(`could not detect cell reference notation for ${ref}`)
}

/**
 * Convert A1 notation to R1C1 notation
 *
 * @param   {string} ref
 * @returns {string}
 * @throws  {Error}
 */

function convertA1toR1C1 (ref) {
  if (!A1.test(ref)) {
    throw new Error(`${ref} is not a valid A1 cell reference`)
  }

  const refParts = ref
    .replace(A1, '$1,$2')
    .split(',')

  const columnStr = refParts[0]
  const row = refParts[1]
  let column = 0

  for (let i = 0; i < columnStr.length; i++) {
    column = 26 * column + columnStr.charCodeAt(i) - 64
  }

  return `R${row}C${column}`
}

/**
 * Convert R1C1 notation to A1 notation
 *
 * @param {string} ref
 * @returns {string}
 * @throws {Error}
 */

function convertR1C1toA1 (ref) {
  if (!R1C1.test(ref)) {
    throw new Error(`${ref} is not a valid R1C1 cell reference`)
  }

  const refParts = ref
    .replace(R1C1, '$1,$2')
    .split(',')

  const row = refParts[0]
  let column = refParts[1]
  let columnStr = ''

  for (; column; column = Math.floor((column - 1) / 26)) {
    columnStr = String.fromCharCode(((column - 1) % 26) + 65) + columnStr
  }

  return columnStr + row
}

/**
 * Write to multiple, disjoint data ranges.
 * @param {string} spreadsheetId The spreadsheet ID to write to.
 * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate
 */
function writeToMultipleRanges(spreadsheetId = yourspreadsheetId) {
  // Specify some values to write to the sheet.
  const columnAValues = [
    ['Item', 'Wheel', 'Door', 'Engine']
  ];
  const rowValues = [
    ['Cost', 'Stocked', 'Ship Date'],
    ['$20.50', '4', '3/1/2016']
  ];

  let majorRequest = {
    'valueInputOption': 'USER_ENTERED',
    'data': [{}]      // templates go into this array
  };
  let templateCellSet = {
    majorDimension: 'COLUMNS',    // COLUMNS / ROWS
    range: [],
    values: []
  };


  try {
    const response = Sheets.Spreadsheets.Values.batchUpdate(request, spreadsheetId);
    if (response) {
      console.log(response);
      return;
    }
    console.log('response null');
  } catch (e) {
    // TODO (developer) - Handle  exception
    console.log('Failed with error %s', e.message);
  }
}

function convertRangeToCsvFile_(csvFileName) {
  // Get the selected range in the spreadsheet
  var ws = SpreadsheetApp.getActiveSpreadsheet().getActiveSelection();
  try {
    var data = ws.getValues();
    var csvFile = undefined;

    // Loop through the data in the range and build a string with the CSV data
    if (data.length > 1) {
      var csv = "";
      for (var row = 0; row < data.length; row++) {
        for (var col = 0; col < data[row].length; col++) {
          if (data[row][col].toString().indexOf(",") != -1) {
            data[row][col] = "\"" + data[row][col] + "\"";
          }
        }

        // Join each row's columns
        // Add a carriage return to end of each row, except for the last one
        if (row < data.length-1) {
          csv += data[row].join(",") + "\r\n";
        } else {
          csv += data[row];
        }
      }
      csvFile = csv;
    }
    return csvFile;
  }
  catch(err) {
    Logger.log(err);
    Browser.msgBox(err);
  }
}

function logToSheet(url, message) {
  
  var sheets = SpreadsheetApp.getActiveSpreadsheet();
  
  var emailRow = sheets.getSheets()[1].getLastRow();
  var toStopEmails = sheets.getSheets()[1].getRange(emailRow, 2).getValue();
  
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var row   = logSheet.getLastRow() + 1;    
  var time  = new Date();  
  
  logSheet.getRange(row,1).setValue(time);
  logSheet.getRange(row,2).setValue(message + " : " + url);
  
  var alert = "Site: " + url + " is " + message.toLowerCase() + " To stop emails: http://goo.gl/todo-your-own-sheet";
  
  if (toStopEmails === "Yes") {
    Logger.log("We got an alert: " + alert + " But we are not sending emails!");
  }
  else {
    Logger.log("Send an alert: " + alert);
    MailApp.sendEmail(logSheet.getRange("B3").getValue(), "AGF Site " + message, alert);  
  }
  
  // If you have a sheet with a form this is the location to see if you 'stoped' the notifications
  // 
  //  if (sheet.getRange("B4").getValue().toLowerCase() == "yes") {
  //    time = new Date(time.getTime() + 15000);
  //    CalendarApp.createEvent(alert, time, time).addSmsReminder(0); 
  //  }
  
  return;
}

function promptApiKey(){
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Meraki API Key', 'Required to run reports.', ui.ButtonSet.OK_CANCEL);
  
  // Process the user's response.
  if (response.getSelectedButton() == ui.Button.OK) {
    
    // save key and refresh menu
    setApiKey(response.getResponseText());
    //ui.alert('API Key Set: '+settings.apiKey, ui.ButtonSet.YES_NO);

    loadMenu();
  } else if (response.getSelectedButton() == ui.Button.CANCEL) {
    Logger.log('The user didn\'t want to provide an API key.');
  } else {
    Logger.log('The user clicked the close button in the dialog\'s title bar.');
  }
}

function copyFromTemplate() {
  let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  activeSpreadsheet.insertSheet(activeSpreadsheet.getSheets().length, {template: activeSpreadsheet.getSheetByName('template')});
}

function createDumpster () {
  var source = SpreadsheetApp.getActiveSpreadsheet();
  let templateSheet = source.getSheetByName('template');
  var sheet = source.getSheets();

  let date = new Date();
  let dayOfMonth = date.getDate();
  let month = date.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;
  let hour = date.getHours();
  let minutes = date.getMinutes();
  hour = hour < 10 ? '0' + hour : hour;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  let ds = date.getFullYear()+'-'+month+'-'+dayOfMonth;

  let dumpsterId, ssFile, allSheets, lastSheet;
  var files = DriveApp.getFilesByName("gamedumps on "+ds);
  if(!files.hasNext()){
 
     // create a new file for each day
    ssFile = SpreadsheetApp.create("gamedumps on "+ds);
    dumpsterId = ssFile.getId();
 
    let newSheet = SpreadsheetApp.openById(dumpsterId);
    templateSheet.copyTo(newSheet);
    allSheets = ssFile.getSheets();

  }else{

    ssFile = SpreadsheetApp.open(files.next());
    dumpsterId = ssFile.getId();
    templateSheet.copyTo(ssFile);
    
    allSheets = ssFile.getSheets();
  }
  lastSheet = allSheets[allSheets.length-1];
  const nama = '@'+hour+':'+minutes;
  lastSheet.setName(nama);
  sheetName = nama;
  lastSheet.deleteRows(2, lastSheet.getMaxRows()-2);
  ssFile.setActiveSheet(lastSheet).getRange('A2:A2').activate();
  return {logSheet: lastSheet, logsheetID: dumpsterId, logsheetName: nama};
}

// helper function to check any flag
function isFlagSet (actual, expected) {
  const flag = actual & expected;
  return flag === expected;
};

function cachedWrite(sheet, mode, y, x, v) {
  const columnAValues = [
    ['Item', 'Wheel', 'Door', 'Engine']
  ];
  const rowValues = [
    ['Cost', 'Stocked', 'Ship Date'],
    ['$20.50', '4', '3/1/2016']
  ];

  const request = {
    'valueInputOption': 'USER_ENTERED',
    'data': [
      {
        'range': 'Sheet1!A1:A4',
        'majorDimension': 'COLUMNS',
        'values': columnAValues
      },
      {
        'range': 'Sheet1!B1:D2',
        'majorDimension': 'ROWS',
        'values': rowValues
      }
    ]
  }

  try {
    const response = Sheets.Spreadsheets.Values.batchUpdate(request, spreadsheetId);
    if (response) {
      console.log(response);
      return;
    }
    console.log('response null');
  } catch (e) {
    // TODO (developer) - Handle  exception
    console.log('Failed with error %s', e.message);
  }

}

function logPlayerStats(playerObj, setOfVals) {
  let playerNo, pos;
  let playerCols = [fromA1Notation('A1').column, 
                    fromA1Notation('G1').column, 
                    fromA1Notation('M1').column, 
                    fromA1Notation('S1').column];
  let cols = ['info', 'stat', 'crystals', 'xp', 'gameboard', 'playerboard'];

  let newRow = (_.has(setOfVals, 'noCR') && setOfVals['noCR'] === true) ? logSheet.getMaxRows() : logSheet.getMaxRows() + 1; 
  let i = 0;
  let n = '';

  _.forIn(setOfVals, function(v, k){
    if(!_.isNull(playerObj))
      playerNo = _.isInteger(playerObj) ? playerObj : playerObj.index;

    if(_.isNull(playerObj) && _.isInteger(v))
      v = _.fill(Array(4), v);

    else if(_.isNull(playerObj) && _.isArray(v) && v.length == 1)       
      v = _.fill(Array(4), v[0]);

    else if(_.isPlainObject(v)){
      n = _.has(v, 'note') ? v.note : '';
      v = _.has(v, 'value') ? v.value : '';
    }
    switch(k){
      case 'noCR':
        break;
      case 'info':
        writeCache.push({ 'range': sheetName+'!A1:A1', 'majorDimension': 'COLUMNS', 'values': v });
        logSheet.getRange(newRow, playerCols[playerNo]).setValue(v);
        break;
      case 'stat':
        writeCache.push({ 'range': sheetName+'!B1:B1', 'majorDimension': 'COLUMNS', 'values': v });
        logSheet.getRange(newRow, playerCols[playerNo]+1).setValue(v);
        break;
      case 'note':
        logSheet.getRange(newRow, playerCols[playerNo]+1).setNote(v);
        break;
      case 'crystal':
        writeCache.push({ 'range': sheetName+'!C1:C1', 'majorDimension': 'COLUMNS', 'values': v });
        logSheet.getRange(newRow, playerCols[playerNo]+2).setValue(v);
        break;
      case 'xp':
        writeCache.push({ 'range': sheetName+'!D1:D1', 'majorDimension': 'COLUMNS', 'values': v });
        logSheet.getRange(newRow, playerCols[playerNo]+3).setValue(v);
        break;
      case 'heart':
        break;
      case 'mind':
        break;
      case 'calm':
//        logSheet.getRange(newRow, playerCols[playerNo]+3).setValue(
//            (playerObj.stats.c + v) + ' / ' + playerObj.stats.s);
        break;
      case 'stress':
//        logSheet.getRange(newRow, playerCols[playerNo]+3).setValue(
//            (playerObj.stats.c) + ' / ' + playerObj.stats.s + v);
        break;
      case 'gameboard':
        if(v!='')
          logSheet.getRange(newRow, playerCols[playerNo]+4).setValue(v);
        if(n!='')
          logSheet.getRange(newRow, playerCols[playerNo]+4).setNote(n);
        break;
      case 'playerboard':
        break;
      case 'infos':
        _.each(v, function(c){
          logSheet.getRange(newRow, playerCols[i++]).setValue(c);
        });
        i=0;
        break;
      case 'stats':
        _.each(v, function(c){
          logSheet.getRange(newRow, playerCols[i++]+1).setValue(c);
        });
        i=0;
        break;
      case 'crystals':
        _.each(v, function(c){
          logSheet.getRange(newRow, playerCols[i++]+2).setValue(c);
        });
        i=0;
        break;
    }
  });
}

function generateXML(request) {
  
  var SS_id = request.parameter.ss,
      sheet_name = request.parameter.list;
  
  var spreadsheet = SpreadsheetApp.openById(SS_id),
      sheet = spreadsheet.getSheetByName(sheet_name),
      dataRange = sheet.getDataRange().getValues();
  
  var height = dataRange.length,
      width = dataRange[0].length;
  
  var title = dataRange[0];
  
  var xml = "<data>";
  for(var i=1; i < height; i++){
    xml = xml + "<row>";
    for(var j=0; j < width; j++){
      xml = xml + '<column id="'+title[j]+'">'+dataRange[i][j]+"</column>";
        }
    xml = xml + "</row>";     
      }
  xml = xml + "</data>";
  
  return ContentService.createTextOutput(xml).setMimeType(ContentService.MimeType.XML);
}

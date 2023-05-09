/*
function installFunctions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues()[0];
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('GameSim').addItem('Create sheet', 'menuItem1').addSeparator();
  var subMenu = ui.createMenu('Sim a game');
  for (var i = 0; i < headers.length; i++) {
    var dynamicMenu = headers[i];
    this[dynamicMenu] = dynamicItem(i);
    subMenu.addItem(dynamicMenu, dynamicMenu);
  }
  menu.addSubMenu(subMenu).addToUi();
}

function dynamicItem(i) {
  return function() {
    var sheet = SpreadsheetApp.getActiveSheet();
    sheet.getRange(2, i + 1, sheet.getLastRow() - 1, 1).activate();
  }
}

installFunctions();

function onOpen() {} // This can be used as the simple trigger.

function onEdit() {} // This can be used as the simple trigger.

function onChange() {} // Please install OnChange event trigger to this function.
*/
var _ = LodashGS.load();

var actionTiles = [];
var dones = [];
let maxRow = 150;
let numPlayers = 4;
let logSheet;

function initGame(){
  var players = initPlayerDecks(SpreadsheetApp.getActiveSpreadsheet(), shuffleCardIndexes(maxRow), initActionTiles(SpreadsheetApp.getActiveSpreadsheet()), numPlayers);

/*
playACard(0);
playACard(1);
playACard(2);
playACard(3);
playACard(0);
playACard(1);
*/
logSheet = createDumpster();
logGame(logSheet, 0, null, {info: 'test'});
logGame(logSheet, 1, null, {info: 'test2'});
logGame(logSheet, 0, null, {hindrance: 21, poison: 6});
logGame(logSheet, 1, null, {hindrance: 25, poison: 3});

console.log(players);

}
initGame();





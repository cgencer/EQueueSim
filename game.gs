var _ = LodashGS.load();

var actionTiles = [];
var dones = [];
let maxRow = 150;
let numPlayers = 4;

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
createDumpster();

console.log(players);

}
initGame();





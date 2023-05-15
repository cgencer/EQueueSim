var _ = LodashGS.load();

var actionTiles = [];
var dones = [];
let maxRow = 150;
let numPlayers = 4;
const FLAGS_START_COL = 19;

function initGame(){
  initActionTiles();
  var players = initPlayerDecks(SpreadsheetApp.getActiveSpreadsheet(), shuffleCardIndexes(), numPlayers);

console.log(players);
/*
playACard(0);
playACard(1);
playACard(2);
playACard(3);
playACard(0);
playACard(1);
*/
console.log(players);

}
initGame();

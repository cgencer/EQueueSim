var _ = LodashGS.load();

var actionTiles = [];
var dones = [];
let maxRow = 150;
let numPlayers = 4;
let logSheet = createDumpster();

function initGame(){
  var players = initPlayerDecks(SpreadsheetApp.getActiveSpreadsheet(), logSheet, shuffleCardIndexes(maxRow), initActionTiles(SpreadsheetApp.getActiveSpreadsheet()), numPlayers);

/*
playACard(0);
playACard(1);
playACard(2);
playACard(3);
playACard(0);
playACard(1);
*/
logGameStats(logSheet, players[0], {info: 'test', hindrance: 21, poison: 6});
logGameStats(logSheet, players[1], {info: 'test2'});
logGameStats(logSheet, players[0], {hindrance: 21, poison: 6});
logGameStats(logSheet, players[1], {hindrance: 25, poison: 3});

console.log(players);

}
initGame();





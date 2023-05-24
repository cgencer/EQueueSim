var _ = LodashGS.load();

var actionTiles = [];
var dones = [];
var players = [];
let tiles = [];
let tileSelection;
let maxRow = 150;
let numPlayers = 4;
let logSheet = createDumpster();
var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();

function initGame(){
  tiles = initActionTiles(spreadSheet);
  let resultTiles = chooseTiles(logSheet, tiles);
  players = initPlayers(numPlayers, resultTiles);

  let toGoFields = movableFields(tiles, players, []);

  console.log(resultTiles);

  players = initPlayerDecks(spreadSheet, logSheet, players, shuffleCardIndexes(maxRow), tiles, numPlayers);

  console.log(players);

/*
playACard(0);
playACard(1);
playACard(2);
playACard(3);
playACard(0);
playACard(1);
*/

/*
logPlayerStats(logSheet, players[0], {info: 'test', hindrance: 21, poison: 6});
logPlayerStats(logSheet, players[1], {info: 'test2'});
logPlayerStats(logSheet, players[0], {hindrance: 21, poison: 6});
logPlayerStats(logSheet, players[1], {hindrance: 25, poison: 3});
*/
}

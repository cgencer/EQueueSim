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

  players = initPlayerDecks(spreadSheet, logSheet, players, shuffleCardIndexes(maxRow), tiles, numPlayers);

  logSheet.insertRowsAfter(logSheet.getMaxRows(), 1);
  for(let j=0;j<3;j++){
    for(let i=0;i<4;i++){
      playACard(logSheet, players, i);
    }
    logSheet.insertRowsAfter(logSheet.getMaxRows(), 1);
  }
  console.log(players);


/*
logPlayerStats(logSheet, players[0], {info: 'test', hindrance: 21, poison: 6});
logPlayerStats(logSheet, players[1], {info: 'test2'});
logPlayerStats(logSheet, players[0], {hindrance: 21, poison: 6});
logPlayerStats(logSheet, players[1], {hindrance: 25, poison: 3});
*/
}

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
  players = initPlayers(numPlayers, resultTiles.w);

  let toGoFields = movableFields(tiles, players, []);

  console.log(resultTiles);
  let latestHindrances = [];
  for(let p=0; p<4; p++){
    // OUTGOs are yellow shields! / INCOMEs are shields with MINUS
    let pNewStats = modifyHindrances(players[p].stats, resultTiles.i[p], resultTiles.o[p]);
    players[p].stats.h = pNewStats.h;
    players[p].stats.sh = pNewStats.sh;
    latestHindrances[p] = pNewStats.h;
  }

  logPlayerStats(logSheet, null, {
    infos: ['places workers'], 
    stats: resultTiles.l, 
    hindrances: latestHindrances
  });

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

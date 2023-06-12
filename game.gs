var _ = LodashGS.load();

var actionTiles = [];
var dones = [];
var players = [];
let tiles = [];
let gameBoard = {
  tracks: {
    hindrance1: [],
    hindrance2: [],
    hindrance3: [],
    hindrance4: [],
    hindrance5: [],
    dukkha: 0,
    sukkha: 0
  }
};
let tileSelection;
let maxRow = 150;
let numPlayers = 4;
let actionNo = 0;
const { logSheet, logsheetID, logsheetName } = createDumpster();
var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();

function doGet(){
  tiles = initActionTiles(spreadSheet);
  let resultTiles = chooseTiles(logSheet, tiles);
  players = initPlayers(numPlayers, resultTiles);

  let toGoFields = movableFields(tiles, players, []);

  players = initPlayerDecks(spreadSheet, logSheet, players, shuffleCardIndexes(maxRow), tiles, numPlayers);

  logSheet.insertRowsAfter(logSheet.getMaxRows(), 1);
  while((players[0].deck.length > 0 && players[0].stats.q > 1) || 
        (players[1].deck.length > 0 && players[1].stats.q > 1) || 
        (players[2].deck.length > 0 && players[2].stats.q > 1) || 
        (players[3].deck.length > 0 && players[3].stats.q > 1) ){

    if((actionNo%numPlayers) == 0)
      logSheet.insertRowsAfter(logSheet.getMaxRows(), 1);

    playACard(logSheet, players, (actionNo%numPlayers));
    trashCards(logSheet, players, (actionNo%numPlayers));
    actionNo++;
    console.log('p0:>>> ' + players[0].deck.length + ':::' + players[0].stats.q);
    console.log('p1:>>> ' + players[1].deck.length + ':::' + players[1].stats.q);
    console.log('p2:>>> ' + players[2].deck.length + ':::' + players[2].stats.q);
    console.log('p3:>>> ' + players[3].deck.length + ':::' + players[3].stats.q);
  }
  logSheet.insertRowsAfter(logSheet.getMaxRows(), 1);
  roundEnding(logSheet, players);
  console.log(players);

}

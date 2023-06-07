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
const { logSheet, logsheetID, logsheetName } = createDumpster();
var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();

function doGet(){
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

}

var _ = LodashGS.load();

var players = [{}, {}, {}, {}, {}, {}, {}, {}];
var actionTiles = [];
var dones = [];
let maxRow = 150;
const FLAGS_START_COL = 19;

function buildDeckOfIndexes() {
  var arr = [];
  for (let i = 0; i < 149; i++) {
    arr[i] = i + 1;
  }
  return _.shuffle(arr);
}

function initActionTiles() {
  let grid = new BHex.Grid(8);
  grid.initMarkers();

  let actionSheet = SpreadsheetApp.getActiveSpreadsheet().getRange('Sheet1!A200:BL227').getValues();
  let actionCalcSheet = SpreadsheetApp.getActiveSpreadsheet().getRange('calc!A200:BL227').getValues();
  let posBuffer = new BHex.Axial(0,0);
  let coin = true;

  for(let tileIndex=0; tileIndex<actionSheet.length; tileIndex++){
    let decoded = decodeSheetRow(tileIndex, actionSheet[tileIndex], actionCalcSheet[tileIndex]);
    decoded.pos = posBuffer;
    decoded.type = 'tile';
    decoded.side = (tileIndex % 2 == 0) ? coin : !coin;
    actionTiles.push(
      _.pick(decoded, ['x', 'y', 'type', 'side', 'xp', 'no', 'id', 'income', 'outgo']));
    console.info('>>> put the tile '+decoded.id+' onto grid '+grid.getHexAt(posBuffer).getKey()+' with side '+decoded.side);

    if(tileIndex % 2 == 1 && tileIndex<actionSheet.length){     // every 2 half of a tile is @same location
      // pick a random neighbor for the new tile from neighbors only
      coin = _.random(0, 9999) % 2 == 0 ? false : true;
      posBuffer = grid.placeAtBorder(posBuffer);
      if(!posBuffer){break;}
      console.log('flushing buffer with '+grid.getHexAt(posBuffer).getKey());
    }
  }
}
initActionTiles();

var deck = buildDeckOfIndexes();
let copySheet = SpreadsheetApp.getActiveSpreadsheet().getRange('Sheet1!A2:BL' + maxRow).getValues();
let copyCalc = SpreadsheetApp.getActiveSpreadsheet().getRange('calc!A2:O' + maxRow).getValues();

for (let j = 0; j < 4; j++) {
  players[j] = {
    deck: [],
    deckIds: [],
    activated: [],
    workers: {
      w0: 3,     // 0 is always the master worker
      w1: 7,
      w2: 12
    },
    stats: {
      q: 6,       // crystals
      xp: 0,
      c: 0,       // calmness
      s: 0,       // stress
      h: 0,       // hindrances
      p: 0        // poisons
    }
  };
  for (let i = 0; i < 6; i++) {
    let aCard = deck.shift();
    if (!aCard) { aCard = deck.shift(); }
    let theCard = decodeSheetRow(aCard, copySheet[aCard], copyCalc[aCard]);
    players[j].deck.push(theCard);
    players[j].deckIds.push(theCard.id);
  }
}
for (let x = 0; x < 4; x++) {
  players[x].deck = _.sortBy(players[x].deck, ['xp', 'xpp', 'q']);
  for (let y = 0; y < 6; y++) {
    players[x].deck[y].q -= 10;
  }
}

function flipWorker(p, w) {
  let buff = players[p].workers.w0;
  players[p].workers.w0 = players[p].workers.w2;
  players[p].workers.w2 = buff;
}

function playACard(p) {
  if(players[p].stats.q > 0 && players[p].deck.length > 0){
    let theQ = players[p].deck[ players[p].deck.length-1 ].q;
    if(players[p].stats.q >= theQ){
      let activatingCard = players[p].deck.pop();
      changePlayerStats(p, 'q', activatingCard.q);
      changePlayerStats(p, 'xp', activatingCard.xp);
      players[p].activated.push(activatingCard);
    }
  }
}

function changePlayerStats(p, v, s) {  // playerNo, whichStat, statNo or value (c/s/q)
  if(v == 'h') players[p].stats.h ^= (1 << (s+3));   // toggles the bit on/off
  else if(v == 'p') players[p].stats.p ^= (1 << s);
  else players[p].stats[v] += s;
}

function decodeSheetRow(i, sx, cx) {
  let row = _.slice(sx, FLAGS_START_COL);
  let c = cx[1];
  let qx = sx[FLAGS_START_COL - 2];
  if (sx[16] == true) qx *= -1;

  var obj = {
    no: i,
    id: sx[0],
    type: 'card',
    xp: cx[0],
    xpp: Number(c.substr(2)),
    cost: cx[3],
    lvl: sx[5],
    q: qx+10,    // to sort also negatives, deduce this on usage
    income: (row[6] || row[11]) << 7 | (row[5] || row[10]) << 6 | (row[4] || row[9]) << 5 | (row[3] || row[8]) << 4 | (row[2] || row[7]) << 3 | row[1] << 1 | row[0],
    outgo: // higher 5 bits are guardians, lower 3 bits are poisons
      (row[17] || row[22]) << 7 | (row[18] || row[23]) << 6 | (row[19] || row[24]) << 5 | (row[20] || row[25]) << 4 | (row[21] || row[26]) << 3 | (row[29] || row[32] || row[35]) | (row[28] || row[31] || row[34]) << 1 | (row[27] || row[30] || row[33]) << 2
  };
  return (obj);
}
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

/**
 *
 * @param {number} row - The row number of the cell reference. Row 1 is row number 0.
 * @param {number} column - The column number of the cell reference. A is column number 0.
 * @returns {string} Returns a cell reference as a string using A1 Notation
 *
 * @example
 *
 *   getA1Notation(2, 4) returns "E3"
 *   getA1Notation(2, 4) returns "E3"
 *
 */
const getA1Notation = (row, column) => {
  const a1Notation = [`${row + 1}`];
  const totalAlphabets = 'Z'.charCodeAt() - 'A'.charCodeAt() + 1;
  let block = column;
  while (block >= 0) {
    a1Notation.unshift(String.fromCharCode((block % totalAlphabets) + 'A'.charCodeAt()));
    block = Math.floor(block / totalAlphabets) - 1;
  }
  return a1Notation.join('');
};

/**
 *
 * @param {string} cell -  The cell address in A1 notation
 * @returns {object} The row number and column number of the cell (0-based)
 *
 * @example
 *
 *   fromA1Notation("A2") returns {row: 1, column: 3}
 *
 */

const fromA1Notation = (cell) => {
  const [, columnName, row] = cell.toUpperCase().match(/([A-Z]+)([0-9]+)/);
  const characters = 'Z'.charCodeAt() - 'A'.charCodeAt() + 1;

  let column = 0;
  columnName.split('').forEach((char) => {
    column *= characters;
    column += char.charCodeAt() - 'A'.charCodeAt() + 1;
  });

  return { row, column };
};

/**
 * Converts a row from the sheet into a usable object
 * 
 * @param {integer} cell -  The card number from the shuffled deck
 * @param {sheet object} cell -  The sheet block containing the card attributes
 * @param {sheet object} cell -  The sheet block containing values based on the attributes
 * @returns {object} A deck object with values coming from the sheets:
 *                      no:       number of the card
 *                      id:       id for the card
 *                      type:     card | tile
 *                      xp:       xp-value
 *                      xpp:      boosted xp-value (=when any worker is on a matching tile)
 *                      cost:     cost-value
 *                      lvl:      level of card for set-collection
 *                      q:        crystal cost
 *                      income:   bit-masked flags for the 5-hindrances and 3-poisons 
 *                      outgo:    bit-masked flags... higher 5 bits (xxxxx000) are hiddrances 5-1, 
 *                                                    lower 3 bits (00000xxx) are poisons 3-1
 */
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


function chooseTiles(aT, players) {

  let sT = _.shuffle(_.concat(
    _.filter(aT, { 'players': 2, 'stage': '*' }), 
    _.filter(aT, { 'players': 2, 'stage': 'wood' })
  ));
  let vp = [];
  let nm = ['master', 'slave'];
  for(let p=0; p<players; p++){
    vp[p] = {};
    for(let w=0; w<2; w++){
      vp[p][nm[w]]=sT.pop();
    }
  }
  return vp;
}

function initPlayerDecks(sheet, deck, numplayers) {
  let players = [{}, {}, {}, {}, {}, {}, {}, {}];
  let copySheet = sheet.getRange('Sheet1!A2:BL' + maxRow).getValues();
  let copyCalc = sheet.getRange('calc!A2:O' + maxRow).getValues();
  for (let j = 0; j < numplayers; j++) {
    players[j] = {
      deck: [],
      deckIds: [],
      activated: [],
      workers: [],
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

  let tileSelection = chooseTiles(actionTiles, numplayers);
  for (let x = 0; x < numplayers; x++) {
    players[x].workers = tileSelection[x];
    players[x].deck = _.sortBy(players[x].deck, ['xp', 'xpp', 'q']);
    for (let y = 0; y < 6; y++) {
      players[x].deck[y].q -= 10;
    }
  }
  return players;
}

function shuffleCardIndexes() {
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

  let pidx = fromA1Notation('BI1');
  pidx = pidx.column-1;

  for(let tileIndex=0; tileIndex<actionSheet.length; tileIndex++){
    let decoded = decodeSheetRow(tileIndex, actionSheet[tileIndex], actionCalcSheet[tileIndex]);
    decoded.pos = posBuffer;
    decoded.type = 'tile';
    decoded.players = actionSheet[tileIndex][pidx];

    decoded.bonuscard = actionSheet[tileIndex][pidx-1];
    if(decoded.bonuscard=='') decoded.bonuscard = 0;

    decoded.stage = actionSheet[tileIndex][pidx+1];
    if(decoded.stage=='') decoded.stage = '*';

    decoded.side = (tileIndex % 2 == 0) ? coin : !coin;
    actionTiles.push(
      _.pick(decoded, ['x', 'y', 'type', 'side', 'xp', 'no', 'id', 'income', 'outgo', 'players', 'bonuscard', 'stage']));
    console.info('>>> placing the tile '+decoded.id+' onto grid '+grid.getHexAt(posBuffer).getKey()+' with side '+decoded.side);

    if(tileIndex % 2 == 1 && tileIndex<actionSheet.length){     // every 2 half of a tile is @same location
      // pick a random neighbor for the new tile from neighbors only
      coin = _.random(0, 9999) % 2 == 0 ? false : true;
      posBuffer = grid.placeAtBorder(posBuffer);
      if(!posBuffer){break;}
//      console.log('flushing buffer with '+grid.getHexAt(posBuffer).getKey());
    }
  }
  console.log(actionTiles);
}

function changePlayerStats(p, v, s) {  // playerNo, whichStat, statNo or value (c/s/q)
  if(v == 'h') players[p].stats.h ^= (1 << (s+3));   // toggles the bit on/off
  else if(v == 'p') players[p].stats.p ^= (1 << s);
  else players[p].stats[v] += s;
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

function flipWorker(p) {
  let buff = players[p].workers.slave;
  players[p].workers.slave = players[p].workers.master;
  players[p].workers.master = buff;
}

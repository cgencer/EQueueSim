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
 * R1C1 pattern
 *
 * @type {RegExp}
 */

const R1C1 = /^R([1-9]\d*)C([1-9]\d*)$/

/**
 * A1 pattern
 *
 * @type {RegExp}
 */

const A1 = /^([A-Z]+)(\d+)$/

/**
 * Auto detect notation used and convert to the opposite notation
 *
 * @param   {string} ref
 * @returns {string}
 * @throws  {Error}
 */

function cellref (ref) {
  if (R1C1.test(ref)) {
    return convertR1C1toA1(ref)
  }

  if (A1.test(ref)) {
    return convertA1toR1C1(ref)
  }

  throw new Error(`could not detect cell reference notation for ${ref}`)
}

/**
 * Convert A1 notation to R1C1 notation
 *
 * @param   {string} ref
 * @returns {string}
 * @throws  {Error}
 */

function convertA1toR1C1 (ref) {
  if (!A1.test(ref)) {
    throw new Error(`${ref} is not a valid A1 cell reference`)
  }

  const refParts = ref
    .replace(A1, '$1,$2')
    .split(',')

  const columnStr = refParts[0]
  const row = refParts[1]
  let column = 0

  for (let i = 0; i < columnStr.length; i++) {
    column = 26 * column + columnStr.charCodeAt(i) - 64
  }

  return `R${row}C${column}`
}

/**
 * Convert R1C1 notation to A1 notation
 *
 * @param {string} ref
 * @returns {string}
 * @throws {Error}
 */

function convertR1C1toA1 (ref) {
  if (!R1C1.test(ref)) {
    throw new Error(`${ref} is not a valid R1C1 cell reference`)
  }

  const refParts = ref
    .replace(R1C1, '$1,$2')
    .split(',')

  const row = refParts[0]
  let column = refParts[1]
  let columnStr = ''

  for (; column; column = Math.floor((column - 1) / 26)) {
    columnStr = String.fromCharCode(((column - 1) % 26) + 65) + columnStr
  }

  return columnStr + row
}


/**
 * Converts a row from the sheet into a usable object
 * 
 * @param {integer}      -  The card number from the shuffled deck
 * @param {sheet object} -  The sheet block containing the card attributes
 * @param {sheet object} -  The sheet block containing values based on the attributes
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
  const FLAGS_START_COL = fromA1Notation('T1');
  let row = _.slice(sx, FLAGS_START_COL);       // this is only the flags of income/outgo part
  const colXP = fromA1Notation('A1');           // XP
  const colXPP = fromA1Notation('B1');          // XPP
  const colStage = fromA1Notation('BJ1');
  const colXtal = fromA1Notation('R1');
  const colLevel = fromA1Notation('F1');
  const colCost = fromA1Notation('D1');
  const colPay = fromA1Notation('Q1');
  let xpp = cx[colXPP.column-1];
  const xtal = sx[colXtal.column-1];
  if (sx[colPay] == true) xtal *= -1;

  var obj = {
    no: i,
    id: sx[0],
    type: 'card',
    xp: Number(cx[colXP.column-1]),
    xpp: Number(xpp.substr(2)),     // remove [/-slash] from cell content
    cost: cx[colCost.column-1],
    stage: sx[colStage.column-1],
    lvl: sx[colLevel.column-1],
    q: Number(xtal)+10,             // to sort also negatives, deduce this on usage
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
  let nm = ['master', 'slaveOne'];
  for(let p=0; p<players; p++){
    vp[p] = {};
    for(let w=0; w<2; w++){
      vp[p][nm[w]]=sT.pop();
    }
  }
  return vp;
}

function initPlayerDecks(sheet, deck, actionTiles, numplayers) {
  let players = [];
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
  let toGoFields = movableFields(actionTiles, players);
  return players;
}

function shuffleCardIndexes() {
  var arr = [];
  for (let i = 0; i < 149; i++) {
    arr[i] = i + 1;
  }
  return _.shuffle(arr);
}
/**
 * Initializes the hexagonal action-tiles objects and their attributes,
 * by looking up rows 200+ on the values-sheet and its corresponding 
 * calculated values sheets. Two tiles will be set up for a location,
 * thus selecting randomly one side.
 * The created action-tile objects are similar with the card objects,
 * both use the same decoding and bit-coding methods.
 * 
 * @param {sheet object}     - The sheet object
 * @return {array}           - Array of action-tile objects
 * 
*/

function initActionTiles(sheet) {
  let actionTiles = [];
  let grid = new BHex.Grid(8);
  grid.initMarkers();

  let actionSheet = sheet.getRange('Sheet1!A200:BL227').getValues();
  let actionCalcSheet = sheet.getRange('calc!A200:BL227').getValues();
  let posBuffer = new BHex.Axial(0,0);
  let coin = true;

  const colPlayersNum = fromA1Notation('BI1');
  const colStage = fromA1Notation('BJ1');

  for(let tileIndex=0; tileIndex<actionSheet.length; tileIndex++){
    let decoded = decodeSheetRow(tileIndex, actionSheet[tileIndex], actionCalcSheet[tileIndex]);
    decoded.pos = _.pick(posBuffer, ['x', 'y']);
    decoded.type = 'tile';
    decoded.players = actionSheet[tileIndex][colPlayersNum.column-1];
    if(decoded.players=='') decoded.players = 0;

    decoded.stage = actionSheet[tileIndex][colStage.column-1];
    if(decoded.stage=='') decoded.stage = '*';

    decoded.side = (tileIndex % 2 == 0) ? coin : !coin;
    actionTiles.push(
      _.pick(decoded, ['pos', 'x', 'y', 'type', 'side', 'xp', 'no', 'id', 'income', 'outgo', 'players', 'bonuscard', 'stage']));
    console.info('>>> placing the tile '+decoded.id+' onto grid '+grid.getHexAt(posBuffer).getKey()+' with side '+decoded.side);

    if(tileIndex % 2 == 1 && tileIndex<actionSheet.length){     // every 2 half of a tile is @same location
      // pick a random neighbor for the new tile from neighbors only
      coin = _.random(0, 9999) % 2 == 0 ? false : true;
      posBuffer = grid.placeAtBorder(posBuffer);
      if(!posBuffer){break;}
//      console.log('flushing buffer with '+grid.getHexAt(posBuffer).getKey());
    }
  }
  return actionTiles;
//  console.log(actionTiles);
}

function movableFields(tiles, players) {
  let fF = [];
  for(let i=0; i<tiles.length; i++) {
    tiles[i] = _.pick(tiles[i], ['pos']);
    tiles[i] = tiles[i].pos;
  }
  tiles = _.uniqWith(tiles, function(a,b){return a.x==b.x && a.y==b.y});
  // collect masters and subtract it from placed tile positions
  for(let i=0; i<players.length; i++) fF.push(players[i].workers.master.pos);
  fF = _.differenceWith(tiles, fF, function(a,b){return a.x==b.x && a.y==b.y});
  console.warn('tiles which slaves can move to:');
  console.log(fF);
  return(fF);
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
      if(players[p].workers.master){}
      changePlayerStats(p, 'xp', activatingCard.xp);
      players[p].activated.push(activatingCard);
    }
  }
}

function addSlave(p) {
  // rule: every slave addition costs a less income object for the master
  const slaveNames = ['slaveOne', 'slaveTwo', 'slaveThree'];

}

function flipWorker(p) {
  let buff = players[p].workers.slaveOne;
  players[p].workers.slaveOne = players[p].workers.master;
  players[p].workers.master = buff;
}

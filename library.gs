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
  let toGoFields = movableFields(actionTiles, players, []);
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

/**
 * Extracts fields with no master workers; if third parameter is passed,
 * it also extracts fields with slave workers as well.
 * It uses only the 'pos' attribute of the tiles. 
 * 
 * @param {array, tiles}     - Array of location objects where tiles are distributed 
 * @param {array, masters}   - Array of location objects with master workers, extracted from players
 * @param {array, slaves}    - Array of location objects with slave workers, extracted from players
 * 
 * @return {array}           - Array of location objects without masters and/or slaves
*/
function movableFields(tiles, masters, slaves) {
  let fF = [];
  for(let i=0; i<tiles.length; i++) {
    tiles[i] = _.pick(tiles[i], ['pos']);
    tiles[i] = tiles[i].pos;
  }
  tiles = _.uniqWith(tiles, function(a,b){return a.x==b.x && a.y==b.y});
  // collect masters and subtract it from placed tile positions
  for(let i=0; i<masters.length; i++) fF.push(masters[i].workers.master.pos);
  fF = _.differenceWith(tiles, fF, function(a,b){return a.x==b.x && a.y==b.y});
  if(slaves.length>0)
    fF = _.differenceWith(fF, slaves, function(a,b){return a.x==b.x && a.y==b.y});

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

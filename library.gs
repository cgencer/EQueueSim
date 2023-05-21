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
function decodeSheetRow(i, srcValues, calcValues) {
  let xpp, xtal, io, obj;
  if(_.isArray(srcValues) && _.isArray(calcValues)) {
    io = _.slice(srcValues, fromA1Notation('T1').column);     // i/o flags 
    const colStage =  fromA1Notation('BJ1').column;
    const colXtal =   fromA1Notation('R1').column;
    const colLevel =  fromA1Notation('F1').column;
    const colPay =    fromA1Notation('Q1').column;
    const colTitle =  fromA1Notation('BP1').column;

    const colCost =   fromA1Notation('D1').column;
    const colStr =    fromA1Notation('F1').column;
    const colXP =     fromA1Notation('A1').column;            // XP
    const colXPP =    fromA1Notation('B1').column;            // XPP

    if(!_.isUndefined(calcValues) && _.isArray(calcValues) && calcValues.length > colXPP)
      xpp = calcValues[colXPP-1];

    xtal = srcValues[colXtal-1];
  /*
    if(!_.isUndefined(xtal) && !_.isUndefined(srcValues[colPay]))
      xtal *= (srcValues[colPay] == true) ? -1 : 1;
  */
    obj = {
      no: i,
      id: srcValues[0],
      type: 'card',
      title:  srcValues[colTitle-1],
      xp:     Number(calcValues[colXP-1]),
      xpp:    Number(xpp.substr(2)),     // remove [/-slash] from cell content
      cost:   calcValues[colCost-1],
      str:    calcValues[colStr-1],
      stage:  srcValues[colStage-1],
      lvl:    srcValues[colLevel-1],
      q:      Number(xtal)+10,           // to sort also negatives, deduce this on usage
      income: (io[6] || io[11]) << 7 | 
              (io[5] || io[10]) << 6 | 
              (io[4] ||  io[9]) << 5 | 
              (io[3] ||  io[8]) << 4 | 
              (io[2] ||  io[7]) << 3 |
              // skipping 0x100 as there are only 3 poisons (0x11) 
              io[1] << 1 | 
              io[0],
      outgo: 
      // higher 5 bits are guardians, lower 3 bits are poisons
              (io[17] || io[22]) << 7 | 
              (io[18] || io[23]) << 6 | 
              (io[19] || io[24]) << 5 | 
              (io[20] || io[25]) << 4 | 
              (io[21] || io[26]) << 3 | 
              (io[27] || io[30] || io[33]) << 2 |
              (io[28] || io[31] || io[34]) << 1 | 
              (io[29] || io[32] || io[35])
    };
  }
  return (obj);
}


function chooseTiles(log, aT, playerObj) {
  // filter out bound tiles, which appear as doubles
  let sT = _.shuffle(_.concat(
    _.filter(aT, { players: 2, side: true, stage: '*' }), 
    _.filter(aT, { players: 2, side: true, stage: 'wood' })
  ));
  let vp = [];
  let lines = ['','','',''];
  let usedTiles = [];
  let theTile, status;
  // first select tiles for masters w/o colliding & tile-doubling
  // the slaves are placed onto any tiles w/o above priority-filters
  // - a players slave cant be placed where he has a master
  // - 
    for(let p=0; p<4*2; p++){
      vp[p] = {};
      theTile = sT.pop();
//      sT = _.reject(sT, { sibling: theTile.id });
      usedTiles.push(theTile.id);
      vp[p][((p<4)?'master':'slaveOne')] = theTile;
      status = ((p<4)?'master':'slave')+' on '+theTile.id + ' ('+theTile.title+') @' +
      theTile.pos.x + 'x' + theTile.pos.y +((p<4)?'\n':'');
      lines[p%4] += status;
      if(p==3){
        sT = _.shuffle(_.concat(
          _.filter(aT, { players: 2, side: true }),
          _.filter(aT, { players: 3, side: true })));
        for(let k=0; k<usedTiles.length; k++){
          sT = _.reject(sT, { id: usedTiles[k] });
        }
      }
    }
  logGameStats(log, 0, {info: ['places workers'], stats: lines});
  return vp;
}

function initPlayerDecks(sheet, log, deck, actionTiles, numplayers) {
  let players = [];
  let copySheet = sheet.getRange('Sheet1!A2:BP' + sheet.getLastRow()).getValues();
  let copyCalc = sheet.getRange('calc!A2:O' + sheet.getLastRow()).getValues();
  for (let j = 0; j < numplayers; j++) {
    players[j] = {
      index: j,
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

  logGameStats(log, players[0], {
    info: ['takes cards'], 
    stats: [
        players[0].deckIds.join(';'), 
        players[1].deckIds.join(';'), 
        players[2].deckIds.join(';'), 
        players[3].deckIds.join(';')
    ]
  });

  let tileSelection = chooseTiles(log, actionTiles, players[0]);

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

function shuffleCardIndexes(n) {
  var arr = [];
  for (let i = 0; i < n-1; i++) {
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

  let actionSheet = sheet.getRange('Sheet1!A200:BZ227').getValues();
  let actionCalcSheet = sheet.getRange('calc!A200:BZ227').getValues();
  let posBuffer = new BHex.Axial(0,0);
  let coin = true;

  const colPlayersNum = fromA1Notation('BI1');
  const colStage = fromA1Notation('BJ1');
  let sibA, sibB, decoded, decoFwd;

  for(let tileIndex=0; tileIndex<actionSheet.length; tileIndex++){
    decoded = decodeSheetRow(tileIndex, actionSheet[tileIndex], actionCalcSheet[tileIndex]);
    if(tileIndex<actionSheet.length-1){
      decoFwd = decodeSheetRow(tileIndex+1, actionSheet[tileIndex+1], actionCalcSheet[tileIndex+1]);
    }
    decoded.pos = _.pick(posBuffer, ['x', 'y']);
    decoded.type = 'tile';
    decoded.players = actionSheet[tileIndex][colPlayersNum.column-1];
    if(tileIndex % 2 == 0 && _.isObject(decoFwd)){
      decoded.sibling = decoFwd.id;
      sibA = decoded.id;
    }
    if(tileIndex % 2 == 1){
      decoded.sibling = sibA;
    }
    if(decoded.players=='') decoded.players = 0;

    decoded.stage = actionSheet[tileIndex][colStage.column-1];
    if(decoded.stage=='') decoded.stage = '*';

    decoded.side = (tileIndex % 2 == 0) ? coin : !coin;
    actionTiles.push(
      _.pick(decoded, ['pos', 'x', 'y', 'type', 'side', 'xp', 'no', 'id', 'income', 'outgo', 'players', 'bonuscard', 'stage', 'title', 'sibling']));
    console.info('>>> placing the tile '+decoded.id+' onto grid '+grid.getHexAt(posBuffer).getKey()+' with side '+decoded.side);

    if(tileIndex % 2 == 1 && tileIndex<actionSheet.length){     // every 2 half of a tile is @same location
      // pick a random neighbor for the new tile from neighbors only
      coin = _.random(0, 9999) % 2 == 0 ? false : true;
      // this patches up to ensure these tiles are selected initially, other tiles randomly...
      if(decoded.players == 2 || decoded.stage == 'wood' || decoded.stage == '*')
        coin = true;
      posBuffer = grid.placeAtBorder(posBuffer);

      if(!posBuffer){break;}
//      console.log('flushing buffer with '+grid.getHexAt(posBuffer).getKey());
    }
  }
//  console.log(actionTiles);
  return actionTiles;
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
    tiles[i] = _.pick(tiles[i], ['pos']).pos;
  }
  tiles = _.uniqWith(tiles, function(a,b){return a.x==b.x && a.y==b.y});
  // collect masters and subtract it from placed tile positions
  for(let i=0; i<masters.length; i++) {
    if(_.isObject(masters[i].workers.master))
      if(_.isObject(masters[i].workers.master.pos))
        fF.push(masters[i].workers.master.pos);
  }
  fF = _.differenceWith(tiles, fF, function(a,b){return a.x==b.x && a.y==b.y});
  if(slaves.length>0)
    fF = _.differenceWith(fF, slaves, function(a,b){return a.x==b.x && a.y==b.y});

  console.warn('tiles where slaves can move to:');
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

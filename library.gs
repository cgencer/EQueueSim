function initPlayers(numPlayers, tileSet) {
  let players = [];
  let playerColors = ['red', 'yellow', 'green', 'blue'];
  let latestHindrances = [];
  for (let j = 0; j < numPlayers; j++) {
    players[j] = {
      index: j,
      color: playerColors[j],
      deck: [],
      deckIds: [],
      activated: [],
      workers: tileSet.w[j],
      tracks: {
        heart: 0,
        mind: 0,
      },
      stats: {
        q: 6,       // crystals
        xp: 0,
        c: 0,       // calmness
        s: 0,       // stress
        h: 0,       // hindrances
        sh: 0,      // saved hindrance-deductions
        p: 0,       // poisons
        sp: 0,      // saved antidotes
        px: [0,0,0] // decoded poisons, [a,b,c] a is (rightmost) 1.poison
      }
    }
  };

  for(let p=0; p<4; p++){
    // OUTGOs are yellow shields! / INCOMEs are shields with MINUS

    pNewStats = modifyHindrances(players[p], tileSet.i[p], tileSet.o[p]);
    _.set(players, '['+(p%4)+'].stats.h', pNewStats.h);
    _.set(players, '['+(p%4)+'].stats.sh', pNewStats.sh);
    latestHindrances[p] = pNewStats.h;

    pNewStats = modifyPoisons(players[p], tileSet.i[p], tileSet.o[p]);
    _.set(players, '['+(p%4)+'].stats.px[0]', pNewStats.px[0]);
    _.set(players, '['+(p%4)+'].stats.px[1]', pNewStats.px[1]);
    _.set(players, '['+(p%4)+'].stats.px[2]', pNewStats.px[2]);
    _.set(players, '['+(p%4)+'].stats.sp', Number(pNewStats.sp));

    logPlayerStats(logSheet, players[p], {
      poiHind: players[p].stats,
      noCR: true
    });

  }

  logPlayerStats(logSheet, null, {
    infos: ['places workers'], 
    stats: tileSet.l, 
      noCR: true
  });

  logPlayerStats(logSheet, null, {
    infos: ['receives crystals'],
    crystals: [6]
  });

  return players;
}

function initPlayerDecks(sheet, logSheet, players, deckIndexes, workerSet, numplayers) {
  let copySheet = sheet.getRange('Sheet1!A2:BZ' + sheet.getLastRow()).getValues();
  let copyCalc = sheet.getRange('calc!A2:O' + sheet.getLastRow()).getValues();

  for (let j = 0; j < numplayers; j++) {
    for (let i = 0; i < 6; i++) {
      let aCard = deckIndexes.shift();
      if (!aCard) { aCard = deckIndexes.shift(); }
      let theCard = decodeSheetRow(aCard, copySheet[aCard], copyCalc[aCard]);
      players[j].deck.push(theCard);
      players[j].deckIds.push(theCard.id);
    }
    players[j].stats.px = [0,0,0];
  }

  logPlayerStats(logSheet, null, {
    infos: ['picks cards'], 
    stats: [
        players[0].deckIds.join(';'), 
        players[1].deckIds.join(';'), 
        players[2].deckIds.join(';'), 
        players[3].deckIds.join(';')
    ],
    calmstress: 0,
    noCR: true
  });

  for (let x = 0; x < numplayers; x++) {
    players[x].deck = _.sortBy(players[x].deck, ['xp', 'xpp', 'q']);
    for (let y = 0; y < 6; y++) {
      players[x].deck[y].q -= 10;
    }
  }
  return players;
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
  let sibA, sibB, decoded, decoFwd;
  let coin = true;

  let grid = new BHex.Grid(8);
  grid.initMarkers();

  let actionSheet = sheet.getRange('Sheet1!A200:BZ227').getValues();
  let actionCalcSheet = sheet.getRange('calc!A200:BZ227').getValues();
  let posBuffer = new BHex.Axial(0,0);
  const colPlayersNum = fromA1Notation('BI1');
  const colStage = fromA1Notation('BJ1');

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

    // every half of a tile is @same location
    if(tileIndex % 2 == 1 && tileIndex<actionSheet.length){     
      // pick a random neighbor for the new tile from neighbors only
      coin = _.random(0, 9999) % 2 == 0 ? false : true;
      // this patches up to ensure these tiles are selected initially, other tiles randomly...
      if(decoded.players == 2 || decoded.stage == 'wood' || decoded.stage == '*')
        coin = true;
      posBuffer = grid.placeAtBorder(posBuffer);

      if(!posBuffer){break;}
    }
  }
  console.log(actionTiles);
  return actionTiles;
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
 *                      income:   bit-masked flags for the 5-hindrances and 3-antidotes 
 *                      outgo:    bit-masked flags... higher 5 bits (xxxxx000) are hindrances 5-1, 
 *                                                    lower 3 bits (00000xxx) are poisons 3-1
 */

function chooseTiles(log, placedTiles) {
  let tileSet = [{},{},{},{}];
  let lines = ['','','',''];
  let usedTiles = [];
  let outgos = [];
  let incomes = [];
  let theTile, status, nama;
  let filteredTiles = _.shuffle(_.concat(
    _.filter(placedTiles, { players: 2, side: true, stage: '*' }), 
    _.filter(placedTiles, { players: 2, side: true, stage: 'wood' })
  ));

  // first select tiles for masters w/o colliding & tile-doubling
  // the slaves are placed onto any tiles w/o above priority-filters
  // - a players slave cant be placed where he has a master
  // - 
  while(filteredTiles.length > 1) {
    for(let p=0; p<4*2; p++){
      theTile = filteredTiles.pop();
      usedTiles.push(theTile.id);

      if(p<4) {
        tileSet[ p%4 ].master = theTile;  
        // save the outgos & incomes of the masters tiles for all players
        outgos[p] = theTile.outgo;
        incomes[p] = theTile.income;
        nama = 'master';
      }else{
        tileSet[ p%4 ].slaveOne = theTile;
        nama = 'slave';
      }

      status = nama + ' on ' + theTile.id + ' ('+theTile.title+') @' +
              theTile.pos.x + 'x' + theTile.pos.y + ((p<4)?'\n':'');
      lines[ p%4 ] += status;

      if(p==3){           // refresh the source for slaves
        filteredTiles = _.shuffle(_.concat(
          _.filter(placedTiles, { players: 2, side: true }),
          _.filter(placedTiles, { players: 3, side: true })));
        for(let k=0; k<usedTiles.length; k++){
          // do we need to remove the siblings also?
          filteredTiles = _.reject(filteredTiles, { id: usedTiles[k] });
        }
      }
    }
  //  console.warn('selected tiles are:');
  //  console.log(tileSet);
    return {w: tileSet, l: lines, o:outgos, i:incomes, t: usedTiles};
  }
}


function decodeSheetRow(i, srcValues, calcValues) {
  let xpp, xtal, io, obj;
  if(_.isArray(srcValues) && _.isArray(calcValues)) {
    io = _.slice(srcValues, fromA1Notation('T1').column);     // i/o flags 
    const colPay =    fromA1Notation('Q1').column;

    const colXP =     fromA1Notation('A1').column;            // XP
    const colXPP =    fromA1Notation('B1').column;            // XPP

    if(!_.isUndefined(calcValues) && _.isArray(calcValues) && calcValues.length > colXPP)
      xpp = calcValues[colXPP-1];

    xtal = srcValues[fromA1Notation('R1').column-1];
  /*
    if(!_.isUndefined(xtal) && !_.isUndefined(srcValues[colPay]))
      xtal *= (srcValues[colPay] == true) ? -1 : 1;
  */
    obj = {
      no: i,
      id: srcValues[0],
      type: 'card',
      title:  srcValues[fromA1Notation('BP1').column-1],
      xp:     Number(calcValues[fromA1Notation('A1').column-1]),
      xpp:    Number(xpp.substr(2)),     // remove [/-slash] from cell content
      cost:   calcValues[fromA1Notation('D1').column-1],
      str:    calcValues[fromA1Notation('F1').column-1],
      stage:  srcValues[fromA1Notation('BJ1').column-1],
      lvl:    srcValues[fromA1Notation('F1').column-1],
      q:      Number(xtal)+10,           // to sort also negatives, deduce this on usage
      act: {
        inRoundQ:     Number(srcValues[fromA1Notation('BS1').column-1]),
        endRoundXP:   Number(srcValues[fromA1Notation('BT1').column-1]),
        endRushedXP:  Number(srcValues[fromA1Notation('BU1').column-1])
      },
      calm:   ((io[13] && io[12]) ? 2 : ((io[13] || io[12]) ? 1 : 0)),
      stress: ((io[14] && io[15] && io[16]) ? 3 : ((io[14] && io[15]) ? 2 : (io[14] ? 1 : 0))),

      income: 
      (srcValues[fromA1Notation('Z1').column-1] || srcValues[fromA1Notation('AE1').column-1]) << 7 |
      (srcValues[fromA1Notation('Y1').column-1] || srcValues[fromA1Notation('AD1').column-1]) << 6 | 
      (srcValues[fromA1Notation('X1').column-1] || srcValues[fromA1Notation('AC1').column-1]) << 5 | 
      (srcValues[fromA1Notation('W1').column-1] || srcValues[fromA1Notation('AB1').column-1]) << 4 | 
      (srcValues[fromA1Notation('V1').column-1] || srcValues[fromA1Notation('AA1').column-1]) << 3 |
      // bit 2 is marker: adressed poisons / anonymous antidotes
      1 << 2 |
      srcValues[fromA1Notation('U1').column-1] << 1 | 
      srcValues[fromA1Notation('T1').column-1],

      outgo: 
      // higher 5 bits are hindrances, lower 3 bits are poisons
      (srcValues[fromA1Notation('AK1').column-1] || srcValues[fromA1Notation('AP1').column-1]) << 7 |
      (srcValues[fromA1Notation('AL1').column-1] || srcValues[fromA1Notation('AQ1').column-1]) << 6 | 
      (srcValues[fromA1Notation('AM1').column-1] || srcValues[fromA1Notation('AR1').column-1]) << 5 | 
      (srcValues[fromA1Notation('AN1').column-1] || srcValues[fromA1Notation('AS1').column-1]) << 4 | 
      (srcValues[fromA1Notation('AO1').column-1] || srcValues[fromA1Notation('AT1').column-1]) << 3 | 
      (srcValues[fromA1Notation('AU1').column-1] || srcValues[fromA1Notation('AX1').column-1] || srcValues[fromA1Notation('BA1').column-1]) |
      (srcValues[fromA1Notation('AV1').column-1] || srcValues[fromA1Notation('AY1').column-1] || srcValues[fromA1Notation('BB1').column-1]) << 1 |
      (srcValues[fromA1Notation('AW1').column-1] || srcValues[fromA1Notation('AZ1').column-1] || srcValues[fromA1Notation('BC1').column-1]) << 2
    };
  }
  return (obj);
}

function modifyPoisons(playerObj, incomeVal, outgoVal) {
  let oldSP = playerObj.stats.sp;
  let oldPX = playerObj.stats.px;
  //==============================================
  // 0x111  first 2 bits: value
  //   \---> if set: addressed poison nr (OUTGO)
  //(3rd bit) clear: number of antidotes (INCOME)
  //==============================================
  outgoVal &= 7;    // mask out upper bits
  incomeVal &= 3;

  if(isFlagSet(outgoVal, 1))
    oldPX[0]++;
  if(isFlagSet(outgoVal, 2))
    oldPX[1]++;
  if(isFlagSet(outgoVal, 4))
    oldPX[2]++;

  // 1. apply saved SPs to current poisons, higher-to-lower (e.g.ignorance(3) as first!)
  // 2. deduct outgo's from the current poisons
  // 3. add new antidotes number as saved SP's


  if(oldSP>0 && isFlagSet(incomeVal, 2) && isFlagSet(incomeVal, 1)){
    oldPX[2]--;
    oldSP--;
    if(oldSP>0 && isFlagSet(incomeVal, 2)){
      oldPX[1]--;
      oldSP--;
      if(oldSP>0 && isFlagSet(incomeVal, 1)){
        oldPX[0]--;
        oldSP--;
      }
    }
  }

  // save remaining SPs back...

  return {sp: oldSP, px: oldPX};
}

function modifyHindrances(playerObj, incomeVal, outgoVal) {
  // OUTGOs are yellow shields! / INCOMEs are shields with MINUS
  let oldH = playerObj.stats.h;
  let oldSH = playerObj.stats.sh;
  // OR flags from outcome into hindrances
  // if SH has flags, clear them on hindrances
  //
  //  01001     H
  //  01010     SH
  //        AND
  //  01000     >DIFF
  // x01001 NOT H
  //  00001     =RESULT = NEW H
  //  
  //  01010     SH
  //  01000     DIFF
  //  00010     AND&NOT = REMAINING SH
  //
  // set the hindrance-flags according to outgo

  oldH |= (outgoVal >> 3);                                                    // 32->4
  oldSH |= (incomeVal >> 3);
  // create a diff of flags and clear them on the hindrance-flags
  // diff is what is set on both sides, so only clear those flags afterwards
  let diff = oldH & oldSH;
  oldH |= diff;       // set the flags
  // now remove also the 'used' diff from SH, thus saving the remaining SH
  oldSH &= ~diff;     // kill the flags from sh

  return {h: oldH, sh: oldSH};
}

/**
 * Extracts fields with no master workers; if third parameter is passed,
 * it also extracts fields with slave workers as well.
 * It uses only the 'pos' attribute of the tiles. 
 * 
 * @param {array, tiles}     - Array of location objects where tiles are distributed 
 * @param {array, masters}   - Array of location objects for master workers, extracted from players
 * @param {array, slaves}    - Array of location objects for slave workers, extracted from players
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

function shuffleCardIndexes(n) {
  var arr = [];
  for (let i = 0; i < n-1; i++)
    arr[i] = i + 1;
  return _.shuffle(arr);
}

function changePlayerStats(p, v, s) {  // playerNo, whichStat, statNo or value (c/s/q)
  if(v == 'h') players[p].stats.h ^= (1 << (s+3));   // toggles the bit on/off
//  else if(v == 'p') players[p].stats.p ^= (1 << s);
//  else players[p].stats[v] += s;
}

function playACard(logSheet, players, playerNo) {

  let pNewStats, immediateEarn, tempXP;
  const pObj = players[playerNo];

  if(pObj.stats.q > 0 && pObj.deck.length > 0){

    if(pObj.stats.q >= pObj.deck[ _.size(pObj.deck)-1 ].q){

      // priority-values are:
      // - bigger crystal income
      // - smaller crystal outgo
      // - bigger xp
      // - level of players pyramid; next level is always prior; passed levels are unimportant
      // - lesser cost
      // - matching activity-icons with available prospects
      // - more activity-icons
      // - axes/required active emotiles corrolation
  
      // create a sorting based on the priority-score for cards

      const activatedCard = pObj.deck.pop();
      _.set(players, '['+(playerNo%4)+'].deckIds', _.pull(pObj.deckIds, activatedCard.id));

      // pay the crystals
      _.set(players, '['+(playerNo%4)+'].stats.xp', pObj.stats.q - activatedCard.q);

      // check for the need to push (e.g. receive crystal immediatly)

      // if immediatly, player only receives crystal with no leftover xp
      // if waits for turn end, receives crystal & leftover xp (turns into crystal)
      // if their workers are on a matching tile, they receive crystal & rushed xp

      
      immediateEarn = false;

      // matching workers check
      const workerNama = ['master', 'slaveOne', 'slaveTwo', 'slaveThree'];
      tempXP = activatedCard.act.endRoundXP;
      console.info('activating card "'+activatedCard.title+'" ('+activatedCard.id+') for player '+playerNo+' in stage '+activatedCard.stage);

      if(!immediateEarn){
        for(j=0; j<workerNama.length; j++){
          if(_.has(pObj.workers, workerNama[j])){
            if (pObj.workers[ workerNama[j] ].stage == '*' || 
                pObj.workers[ workerNama[j] ].stage == activatedCard.stage) {
                  tempXP = activatedCard.act.endRushedXP;
                  break;
            }
          }
        }
        _.set(players, '['+(playerNo%4)+'].stats.xp', pObj.stats.xp + tempXP);

      }else{
        _.set(players, '['+(playerNo%4)+'].stats.q', pObj.stats.q + activatedCard.act.inRoundQ);
      }
      pNewStats = modifyHindrances(pObj, activatedCard.income, activatedCard.outgo);
      gameBoardHindrances(pObj, activatedCard);
      _.set(players, '['+(playerNo%4)+'].stats.h', pNewStats.h);
      _.set(players, '['+(playerNo%4)+'].stats.sh', pNewStats.sh);

      pNewStats = modifyPoisons(pObj, activatedCard.income, activatedCard.outgo);
      _.set(players, '['+(playerNo%4)+'].stats.px[0]', pNewStats.px[0]);
      _.set(players, '['+(playerNo%4)+'].stats.px[1]', pNewStats.px[1]);
      _.set(players, '['+(playerNo%4)+'].stats.px[2]', pNewStats.px[2]);
      _.set(players, '['+(playerNo%4)+'].stats.sp', Number(pNewStats.sp));

      changePlayerStats(playerNo, 'xp', activatedCard.xp);
      const tempArr = pObj.activated;
      tempArr.push(activatedCard.id);
      _.set(players, '['+(playerNo%4)+'].activated', tempArr);

      logPlayerStats(logSheet, pObj, {
        info: 'plays a card', 
        stat: '"' + activatedCard.title + '" (' + activatedCard.id + ')',
        note: activatedCard.title + '\n' + JSON.stringify(activatedCard, null, 4),
        noCR: true
      });

      return activatedCard;
    }
  }
}

function gameBoardHindrances(playerObj, card) {
  // decode hindrances
  let obstacles = [];
  let intacles = [];
  const income = card.income >> 3;
  const outgo = card.outgo >> 3;
  // add them to the global tracks
  if(isFlagSet((outgo &  1),  1)){
    obstacles.push('1'); 
    gameBoard.tracks.hindrance1.push(playerObj.color);
  }
  if(isFlagSet((outgo &  2),  2)){ 
    obstacles.push('2'); 
    gameBoard.tracks.hindrance2.push(playerObj.color);
  }
  if(isFlagSet((outgo &  4),  4)){ 
    obstacles.push('3'); 
    gameBoard.tracks.hindrance3.push(playerObj.color);
  }
  if(isFlagSet((outgo &  8),  8)){ 
    obstacles.push('4'); 
    gameBoard.tracks.hindrance4.push(playerObj.color);
  }
  if(isFlagSet((outgo & 16), 16)){ 
    obstacles.push('5'); 
    gameBoard.tracks.hindrance5.push(playerObj.color);
  }
  if(isFlagSet((income &  1),  1)){
    intacles.push('1'); 
    gameBoard.tracks.hindrance1.shift();
  }
  if(isFlagSet((income &  2),  2)){ 
    intacles.push('2'); 
    gameBoard.tracks.hindrance2.shift();
  }
  if(isFlagSet((income &  4),  4)){ 
    intacles.push('3'); 
    gameBoard.tracks.hindrance3.shift();
  }
  if(isFlagSet((income &  8),  8)){ 
    intacles.push('4'); 
    gameBoard.tracks.hindrance4.shift();
  }
  if(isFlagSet((income & 16), 16)){ 
    intacles.push('5'); 
    gameBoard.tracks.hindrance5.shift();
  }

  logPlayerStats(logSheet, playerObj, {
    gameboard: {
      value: 
  (obstacles.length>0 ? 'puts cubes onto hindrance-tracks: '+obstacles.join(' & ') : '') +
  ( intacles.length>0 ? '\nremoves cubes from tracks: '+intacles.join(' & ') : ''),
      note: 'hindrances:\n\n'+
            'track-1: '+gameBoard.tracks.hindrance1.join(', ')+'\n'+
            'track-2: '+gameBoard.tracks.hindrance2.join(', ')+'\n'+
            'track-3: '+gameBoard.tracks.hindrance3.join(', ')+'\n'+
            'track-4: '+gameBoard.tracks.hindrance4.join(', ')+'\n'+
            'track-5: '+gameBoard.tracks.hindrance5.join(', ')+'\n\n'+
            'top1: '+topContributers(gameBoard.tracks.hindrance1)+'\n'+
            'top2: '+topContributers(gameBoard.tracks.hindrance2)+'\n'+
            'top3: '+topContributers(gameBoard.tracks.hindrance3)+'\n'+
            'top4: '+topContributers(gameBoard.tracks.hindrance4)+'\n'+
            'top5: '+topContributers(gameBoard.tracks.hindrance5)
    },
    noCR: true,
  });

}

// fetches top contributers on each track in an ugly way...
function topContributers(theArr) {
  if(theArr.length>0){
    const arr = _.invertBy(_.countBy(theArr));
    return arr[ _.max(_.keys(arr)) ];
  }
  return [];
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

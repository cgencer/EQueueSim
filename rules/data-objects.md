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
    cq: 0,      // collecting activated cards xp-crystals
    xp: 0,
    c: 0,       // calmness
    s: 0,       // stress
    h: 0,       // hindrances
    sh: 0,      // saved hindrance-deductions
    p: 0,       // poisons
    sp: 0,      // saved antidotes
    px: [0,0,0] // decoded poisons, [a,b,c] a is (rightmost) 1.poison
  }
};

cards = {
  no: 18,
  id: 'e019',
  type: 'card',
  title: 'Walking on Eggshells',
  xp: 19,
  xpp: 21,
  cost: 14,
  str: 68,
  stage: '*',
  lvl: 1,
  q: 12,
  act: { 
    inRoundQ: 1, 
    endRoundXP: 9, 
    endRushedXP: 11 
  },
  calm: 1,
  stress: 0,
  income: 0,
  antidotes: 0,
  outgo: 24,
  poisons: 0,
  nH: 0-5,        // number of hindrances on cost
  nHn: 0-5        // number of negative hindrances on result
};

tiles = { 
    pos: { 
      x: 3, 
      y: -3 
    },
    type: 'tile',
    side: true,
    xp: 17,
    no: 24,
    id: 'p25',
    income: 0,
    outgo: 8,
    poisons: 0,
    antidotes: 0,
    players: 2,
    stage: 'wood',
    title: 'Career',
    sibling: 'p26'
};
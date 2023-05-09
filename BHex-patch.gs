BHex.Grid.prototype.mark = function (a) {
  this.hexes.some(function(h) {
    if (h.compareTo(a)) 
      h.blocked = true;
  });
}

BHex.Grid.prototype.getNeighborsUnblocked = function (a) {
  var grid = this;
  console.log('call me once');
  var neighbors = [],
    directions = [
      new BHex.Axial(a.x + 1, a.y), new BHex.Axial(a.x + 1, a.y - 1), new BHex.Axial(a.x, a.y - 1),
      new BHex.Axial(a.x - 1, a.y), new BHex.Axial(a.x - 1, a.y + 1), new BHex.Axial(a.x, a.y + 1)
    ];

  for(let c=0; c<directions.length; c++){
    var thisHex = grid.getHexAt(directions[c]);
    if (thisHex) {
      if( !thisHex.blocked ) {
        neighbors.push(thisHex);
      } else {
        let others = grid.getNeighborsUnblocked(thisHex);
        for(let i=0; i<others.length; i++){
          let newHex = grid.getHexAt(others[i]);
          if( !newHex.blocked && !newHex.compareTo(a) ) {
            neighbors.push(newHex);
          }
        }
        grid.mark(thisHex);     //        thisHex.blocked = true;
      }
    }
  }
  let cleaned = _.uniq(neighbors);
  let joi = '';
  for(cl in cleaned){
    joi += grid.getHexAt(cleaned[cl]).getKey() + '...';
  }
  console.log('we got '+cleaned.length+' items: '+joi);
  return cleaned;
};
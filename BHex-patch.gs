BHex.Grid.prototype.mark = function (a) {
  this.hexes.some(function(h) {
    if (h.compareTo(a)){
      h.blocked = true;
    }
  });
}

/*
/ Simple recursive function
function recursiveFunction() {
  // Add base case
  if (...) {
    // Call the recursive function again
    recursiveFunction()
  } else {
    // Return something instead of calling
    // the recursive function again
  }
}
// Call the recursive function
recursiveFunction()
*/
BHex.Grid.prototype.investigate = function (a) {
  var grid = this;
  grid.skipList = grid.skipList || [];
  console.log('call me only once...::'+a.x+'::'+a.y+'::...');

  var neighbors = [],
    parentBorders = [
      new BHex.Axial(a.x + 1, a.y), new BHex.Axial(a.x + 1, a.y - 1), new BHex.Axial(a.x, a.y - 1),
      new BHex.Axial(a.x - 1, a.y), new BHex.Axial(a.x - 1, a.y + 1), new BHex.Axial(a.x, a.y + 1)
    ];

  grid.skipList.push(grid.getHexAt(a).getKey());
  console.log('>>> adding '+grid.getHexAt(a).getKey()+' to the skiplist...');

  for (let c = 0; c < parentBorders.length; c++) {

    let theHex = grid.getHexAt(parentBorders[c]);
    if(_.indexOf(grid.skipList, theHex.getKey()) == -1){
    if( theHex && !theHex.blocked ) {       // blocked=false

      grid.mark(a);
//      console.info('adding neighbors...: '+theHex.getKey());
      neighbors.push(theHex);

    } else {      // blocked=true ... there is a neighbor


          console.log('>>> adding '+theHex.getKey()+' to the skiplist...');
          grid.skipList.push(theHex.getKey());

          let childBorders = grid.investigate(theHex);
          for (let d = 0; d < childBorders.length; d++) {

            let childHex = grid.getHexAt(childBorders[d]);
            if(childHex && !childHex.blocked){
              neighbors.push(childHex);
            } else {
              continue;
            }

          };
      }
    }
  };
  grid.skipList = _.uniq(_.pull(neighbors, grid.skipList));
  console.log(grid.skipList);
  return grid.skipList;
};

BHex.Grid.prototype.placeAtBorder = function (a) {
  var grid = this;
  var colli = grid.investigate(a);
  if(colli.length>0){
    let putTo = grid.getHexAt(_.sample(colli));
    console.info('>>> the new tile will be placed at: '+putTo.getKey());
    return putTo;
  }
};

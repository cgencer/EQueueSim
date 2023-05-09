# EQueueSim
This is the simulator-code running on GoogleSheeps Apps-script for my upcoming boardgame EQueue (offline game)

This project is tied quite deeply into the GoogleSheet where I keep all my card-parameters for over 200 cards and action-tiles.
I will soon also create a simple dummy-sheet to show how it is used to calculate all possibilities, strength curves of each item, etc.

At the moment, these graphs/value-sets are calculated trough GoogleSheets own functions:

Following my gameplay rules, the simulator takes random sets of cards from the sheet, calculates their parameters, simulates 
the hexagonal action-tiles placements (within memory) and depending on players choices, takes action, plays cards, takes 
income etc.

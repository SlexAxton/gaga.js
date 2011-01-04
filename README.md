A Helper library for creating card and hand objects and evaluating their worth.

Still very early development.

More to come with:

- Direct Hand Comparison
- Hold em' mode (shared 5, plus 2 private)
- hand/card validation

Right now it's pretty simple.

Create a card:

    var aceOfClubs = gaga.createCard('A', 'C');

Create a hand:

    var royal_flush = gaga.createHand([
        ['T', 'clubs'],
        ['J', 'clubs'],
        ['Q', 'clubs'],
        ['K', 'clubs'],
        ['A', 'clubs']
    ]);

Then run the `identify` function on a hand, and get it's value:

    var result = royal_flush.identity();
    
    // this makes: 
    {
      cards: Array[5], // An array of the cards that caused the hand
      name: "Straight Flush", // Pretty name
      rank: 8, // The higher, the better
      type: "straight_flush" // key name
    }
    

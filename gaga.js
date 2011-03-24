/**
 *  gaga.js
 *  by Alex Sexton
 *
 //>>debugStart
 * Debug mode: On
 //>>debugEnd
 *
 *  A library for poker logic
 */
(function ( global, doc, _, undef ) {
  // The suit object contains the possible suits
  var s = "",
  
  //>>debugStart
  // Please jslint
  Exception = global.Exception,
  //>>debugEnd

  SUIT = {
   "diamonds" : "diamonds",
   "d"        : "diamonds",
   "spades"   : "spades",
   "s"        : "spades",
   "hearts"   : "hearts",
   "h"        : "hearts",
   "clubs"    : "clubs",
   "c"        : "clubs"
  },

  // Card Value Normalization
  C_NORMAL = {
    '1'  : 'A',
    '2'  : '2',
    '3'  : '3',
    '4'  : '4',
    '5'  : '5',
    '6'  : '6',
    '7'  : '7',
    '8'  : '8',
    '9'  : '9',
    'T'  : 'T',
    '10' : 'T',
    '11' : 'J',
    'J'  : 'J',
    '12' : 'Q',
    'Q'  : 'Q',
    '13' : 'K',
    'K'  : 'K',
    '14' : 'A',
    'A'  : 'A'
  },

  CARD_KEYS = [
    "", // so the indexes match up a little more nicely.
    "A", "2", "3", "4", "5", "6", "7", 
    "8", "9", "T", "J", "Q", "K", "A"
  ],

  CARD_ORDER = (function ( ks ) {
    var hash = {};

    // This automatically sets Ace as high.
    // So that needs to be taken into account
    // later.
    _( ks ).each(function ( k, i ) {
      hash[k] = i;
    });

    return hash;
  })( CARD_KEYS ),

  HAND_KEYS = [
    "high_card",
    "one_pair",
    "two_pair",
    "three_of_a_kind",
    "straight",
    "flush",
    "full_house",
    "four_of_a_kind",
    "straight_flush"
  ],

  PRETTY_HANDS = {
    "high_card"       : "High Card",
    "one_pair"        : "One Pair",
    "two_pair"        : "Two Pair",
    "three_of_a_kind" : "Three of a Kind",
    "straight"        : "Straight",
    "flush"           : "Flush",
    "full_house"      : "Full House",
    "four_of_a_kind"  : "Four of a Kind",
    "straight_flush"  : "Straight Flush"
  },

  /* Not using this... so leave it around in case i might  
  // Hands and their ranks
  HAND_VALUES = (function ( ks ) {
    var hash = {};
    // Set each one, the other direction
    _( ks ).each(function ( k, i ) {
      hash[ k ] = i;
    });
    return hash;
  })( HAND_KEYS ),
  */
  UTIL = {
    hashHand : function ( hand, key ) {
      var hash = {};
      key = key || 'value';

      // Go through each card and match up values
      _( hand.cards ).each(function ( card ) {
        if ( hash[ card[ key ] ] ) {
          // Add the card to the array
          hash[ card[ key ] ].push( card );
        }
        else {
          // Create the array and add the inital
          hash[ card[ key ] ] = [ card ];
        }
      });

      // Return the hash
      return hash;
    },

    orderCards : function ( cards, aceLow ) {
      var self = this;
      return _( cards ).sortBy(function ( card ) {
        return self.getCardOrderIndex( card, aceLow );
      });
    },

    getCardOrderIndex : function ( card, aceLow ) {
      // Special case
      if ( aceLow && card.value === 'A') {
        return 1;
      }
      // Hashed order
      return CARD_ORDER[ card.value ];
    },

    // Finds the set with the highest unique card
    // must be the same length arrays.
    reverseCompare : function ( cards1, cards2 ) {
      var i = cards1.length;

      while ( i-- ) {
        if ( cards1[ i ].value > cards2[ i ].value ) {
          return 1;
        }
        else if ( cards1[ i ].value < cards2[ i ].value ) {
          return -1;
        }
      }

      return 0;
    }
  },

  HAND_IDENTITY = {
    "straight_flush"  : function ( hand ) {
      // First check if it's a straight
      if ( this.straight( hand ) ) {
        // If so return the value of the flush function
        return this.flush( hand );
      }
      // Otherwise return false
      return false;
    },

    "four_of_a_kind"  : function ( hand ) {
      var hash = UTIL.hashHand( hand, 'value' ), 
          res  = false;

      // See if any of the items are of length four
      _( hash ).each(function ( val ) {
        // If any have 4 cards in the array, that's it
        if ( val.length == 4 ) {
          res = val;
        }
      });
      // This is either an array of cards or false
      return res;
    },

    "full_house"      : function ( hand ) {
      var hash = UTIL.hashHand( hand, 'value' ), 
          res2,
          res3;

      // This could use pair and toak, but this'll be quicker...
      // See if any of the items are of length 3 and 2
      _( hash ).each(function ( val ) {
        // If any have 3 cards in the array, that's one
        if ( val.length == 3 ) {
          res3 = val;
        }
        // Any with 2 is the other
        else if ( val.length == 2 ) {
          // May override in the case of 2 pair, but no matter
          res2 = val;
        }
      });

      // See if both exist
      if ( res2 && res3 ) {
        return _.flatten( [ res2, res3 ] );
      }
      // Otherwise return false
      return false;
    },

    "flush"           : function ( hand ) {
      var hash = UTIL.hashHand( hand, 'suit' ),
          res  = false;

      _( hash ).each(function ( val ) {
        if ( val.length == 5 ) {
          res = val;
        }
      });

      return res;
    },

    "straight"        : function ( hand ) {
      var findStraight = function ( cards, aceLow ) {
        // Find first location
        var pre = UTIL.getCardOrderIndex( cards[ 0 ], aceLow ) - 1,
            res = cards;

        // See if they're in direct order sequence
        _( cards ).each(function ( card ) {
          // Shortcut if we've already figured out a non-straight
          if ( res ) {
            // Get the order index of this one
            var cur = UTIL.getCardOrderIndex( card, aceLow );

            // The difference should be 1
            if ( (cur - pre) !== 1 ) {
              res = false;
            }

            // Move the current to the previous
            pre = cur;
          }
        });

        return res;
      };

      // Don't do more work than we have to
      if ( hand.cardsAceLow[ 0 ].value === 'A' ) {
        // Since we have an ace, try both ways
        return findStraight( hand.cards ) || findStraight( hand.cardsAceLow, 1 );
      }
      // Just try one way
      return findStraight( hand.cards );
    },

    "three_of_a_kind" : function ( hand ) {
      var hash = UTIL.hashHand( hand, 'value' ), 
          res = false;

      // See if any of the items are of length 3
      _( hash ).each(function ( val ) {
        // If any have 3 cards in the array, that's it
        if ( val.length >= 3 ) {
          res = val.slice( 0, 3 );
        }
      });

      // Otherwise return false
      return res;
    },

    "two_pair"        : function ( hand ) {
      var hash = UTIL.hashHand( hand, 'value' ), 
          res1,
          res2;

      // See if any of the items are of 2 
      _( hash ).each(function ( val ) {
        // Find two sets of two
        if ( val.length >= 2 ) {
          if ( !res1 ) {
            res1 = val.slice( 0, 2 );
          }
          else {
            // No need to check against res1, since they're unique
            res2 = val.slice( 0, 2 );
          }
        }
      });

      // See if both exist
      if ( res1 && res2 ) {
        return _.flatten( [ res1, res2 ] );
      }

      // Otherwise return false
      return false;
    },

    "one_pair"        : function ( hand ) {
      var hash = UTIL.hashHand( hand, 'value' ), 
      res = false;

      // See if any of the items are of length 2
      _( hash ).each(function ( val, key ) {
        // If any have 2 cards in the array, that's it
        if ( val.length >= 2 ) {
          if ( res ) {
            // If the new one is higher than the last
            // Aces are always high in this case
            if ( UTIL.getCardOrderIndex( res[ 0 ].value ) < UTIL.getCardOrderIndex( key ) ) {
              res = val.slice( 0, 2 );
            }
          }
          else {
            res = val.slice( 0, 2 );
          }
        }
      });

      // Will return the highest pair
      // Otherwise return false
      return res;
    },

    "high_card"       : function ( hand ) {
        return hand.cards[4];
    }
  },

  // Functions to compare equal hands - comparator style
  // assumes ordered cards (which is why it takes hands)
  COMPARE_SELF = {
    "high_card"       : function ( h1, h2 ) {
      return UTIL.reverseCompare( h1.cards, h2.cards );
    },

    "one_pair"        : function ( h1, h2 ) {
      var h1c = h1.identify().cards[ 0 ].value,
          h2c = h2.identify().cards[ 0 ].value;

      // First check the value of the pairs
      if ( h1c > h2c ) {
        return 1;
      }
      else if ( h1c < h2c ) {
        return -1;
      }

      // Loop through the ordered cards backwards
      // The first non equal index is a diff we can
      // use for a winner
      return UTIL.reverseCompare( h1.cards, h2.cards );
    },

    "two_pair"        : function ( h1, h2 ) {
      var h1c = h1.identify().cards,
          h2c = h2.identify().cards,
          valFunc = function ( card ) {
            return card.value;
          },
          h1c_1 = _.max( h1c, valFunc ).value,
          h1c_2 = _.min( h1c, valFunc ).value,
          h2c_1 = _.max( h2c, valFunc ).value,
          h2c_2 = _.min( h2c, valFunc ).value;

      if ( h1c_1 > h2c_1 ) {
        return 1;
      }
      else if ( h1c_1 < h2c_1 ) {
        return -1;
      }
      else if ( h1c_2 > h2c_2 ) {
        return 1;
      }
      else if ( h1c_2 < h2c_2 ) {
        return -1;
      }
    },

    "three_of_a_kind" : function ( h1, h2 ) {
      var h1c = h1.identify().cards[ 0 ].value,
          h2c = h2.identify().cards[ 0 ].value;

      if ( h1c > h2c ) {
        return 1;
      }
      else if ( h1c < h2c ) {
        return -1;
      }
      return UTIL.reverseCompare( h1.cards, h2.cards );
    },

    "straight"        : function ( h1, h2 ) {
      return UTIL.reverseCompare( h1.cards, h2.cards );
    },

    "flush"           : function ( h1, h2 ) {
      return UTIL.reverseCompare( h1.cards, h2.cards );
    },

    "full_house"      : function ( h1, h2 ) {
      var h1c = UTIL.hashHand( h1, 'value' ),
          h2c = UTIL.hashHand( h2, 'value' ),
          h1c_2,
          h1c_3,
          h2c_2,
          h2c_3;

      // The threes are more important than the twos.
      // find them.
      _( h1c ).each(function ( cards, val ) {
        if ( cards.length === 3 ) {
          h1c_3 = val;
        }
        else if ( cards.length === 2 ) {
          h1c_2 = val;
        }
      });
      
      _( h2c ).each(function ( cards, val ) {
        if ( cards.length === 3 ) {
          h2c_3 = val;
        }
        else if ( cards.length === 2 ) {
          h2c_2 = val;
        }
      });

      // Check 3s then 2s then tie.
      if ( h1c_3 > h2c_3 ) {
        return 1;
      }
      else if ( h1c_3 < h2c_3 ) {
        return -1;
      }
      else if ( h1c_2 > h2c_2 ) {
        return 1;
      }
      else if ( h1c_2 < h2c_2 ) {
        return -1;
      }

      return 0;
    },

    "four_of_a_kind"  : function ( h1, h2 ) {
      var h1c = h1.identify().cards[ 0 ].value,
          h2c = h2.identify().cards[ 0 ].value;
      
      if ( h1c > h2c ) {
        return 1;
      }
      else if ( h1c < h2c ) {
        return -1;
      }
      return UTIL.reverseCompare( h1.cards, h2.cards );
    },

    "straight_flush"  : function ( h1, h2 ) {
      return UTIL.reverseCompare( h1.cards, h2.cards );
    }
  },

  // The card object represents a single card
  // which makes a up a hand.
  Card  = {
    init : function ( value, suit ) {
      // Normalize the values and set them
      this.value     = C_NORMAL[ value + s ];
      this.suit      = SUIT[ suit.toLowerCase() ];
      return this;
    }
  },
  
  Hand = {

    init : function ( cards ) {
      //>>debugStart
      if ( cards.length !== 5 ) {
        throw new Exception( 'A hand must have 5 cards to use that operation. (You have: ' + cards.length + ')' );
      }
      //>>debugEnd
      this.cards       = UTIL.orderCards(cards);
      this.cardsAceLow = UTIL.orderCards(cards, 1);

      return this;
    },

    identify : function () {
      var i = HAND_KEYS.length,
          handVal,
          res;

      // Go through backwards and find the first fit
      while ( !handVal && i-- ) {
        handVal = HAND_IDENTITY[ HAND_KEYS[ i ] ]( this ); 
      }

      res = {
        type  : HAND_KEYS[ i ],
        rank  : i,
        cards : handVal,
        name  : PRETTY_HANDS[ HAND_KEYS[ i ] ]
      };

      // Memoize Me!
      this.identify = function () {
        return res;
      };

      return res;
    }
  };

  // Expose the gaga library
  global.gaga = {
    // Takes to strings
    createCard : function ( value, suit ) {
      //>>debugStart
      // Check for validity
      if ( !value || !suit ) {
        // Throw an exception if it's invalid
        throw new Exception( 'createCard: Value or Suit not valid. Value: `' + value + '` | Suit: `' + suit + '`' );
      }
      //>>debugEnd

      // Return a new instance
      return Object.create( Card ).init( value, suit );
    },

    // Takes an array of array pairs or Card objects
    createHand : function ( cards ) {
      var self    = this,
          cardArr = [];

      // Make sure that we have an array with values
      if ( _.isArray( cards ) && cards.length ) {

        // Go through each card in the array
        _( cards ).each(function ( card ) {

          // If the card is an array, create a card
          if ( _.isArray( card ) ) {
            //>>debugStart
            // Make sure our array seems right
            if ( card.length != 2 ) {
              throw new Exception( 'createHand: Individual card array has incorrect length (!2): ' + card.length );
            }
            //>>debugEnd

            // Create a new card object
            card = self.createCard.apply( this, card );

            // Build up an array of card objects
            cardArr.push( card );
          }

        });

        // Create a Hand object and return it
        return Object.create( Hand ).init( cardArr );
      }

      //>>debugStart
      // Throw an error if input is bad
      else {
        throw new Exception( 'createHand: `cards` is not an array.' );
      }
      //>>debugEnd
    },

    // Since there can be ties, this is a comparator function, you do what you want after that
    // if h1 is less than h2    -> return -1
    // if h1 is equal to h2     -> return 0
    // if h1 is greater than h2 -> return 1
    compareHands: function ( hand1, hand2 ) {
      var hident1 = hand1.identify(),
          hident2 = hand2.identify();

      // Handle initial tie
      if ( hident1.rank === hident2.rank ) {
        // Run logic on matching hand types, but different values.
        return COMPARE_SELF[ hident1.type ]( hand1, hand2 );
      }
      // Handle each being greater than the other
      else if ( hident1.rank > hident2.rank ) {
        return 1;
      }
      // The only other option
      return -1;
    }
  };
})(this, this.document, this._);

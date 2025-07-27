describe('Blackjack Game', () => {
  beforeEach(() => {
    // Set sessionStorage to prevent the tutorial modal from appearing
    cy.visit('/blackjackgame', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('blackjack_tutorial_seen', 'true');
      },
    });
    // Intercept the initial shuffle, ensure a high card count, and wait for it
    cy.intercept('GET', '**/new/shuffle/**', (req) => {
      req.reply((res) => {
        // Ensure the response body has alot of remaining cards to prevent a re-shuffle
        if (res.body && typeof res.body.remaining !== 'undefined') {
          res.body.remaining = 100;
        }
        return res;
      });
    }).as('shuffle');
    cy.wait('@shuffle');
  });

  it("Check if 'Deal' button deals the cards for the game", () => {
    cy.intercept('GET', '**/draw/?count=4').as('dealCards');
    cy.get('button').contains('Deal').click();
    cy.wait('@dealCards');
    cy.contains(/^Hand 1:/).prev('section').find('img').should('have.length', 2);
    cy.contains(/^Dealer:/).next('section').find('img').should('have.length', 2);
  });

  it("Check if 'Hit' button allows user to draw an additional card", () => {
    cy.intercept('GET', '**/draw/?count=4').as('dealCards');
    cy.intercept('GET', '**/draw/?count=1').as('hitCard');
    cy.get('button').contains('Deal').click();
    cy.wait('@dealCards');
    cy.get('button').contains('Hit').click();
    cy.wait('@hitCard');
    cy.contains(/^Hand 1:/).prev('section').find('img').should('have.length', 3);
  });

  it("Check if 'Stand' button allows user to stand and moves on to the dealer", () => {
    cy.intercept('GET', '**/draw/?count=4').as('dealCards');
    cy.get('button').contains('Deal').click();
    cy.wait('@dealCards');
    cy.get('button').contains('Stand').click();
    cy.get('button').contains('Hit').should('not.exist');
    cy.get('button').contains('Stand').should('not.exist');
    cy.contains(/Hand 1: (You win!|You lose|Push – tie.)/, { timeout: 10000 }).should('be.visible');
  });

  it("Check if 'Double' button appears only when user is allowed to double, and the double logic is properly handled", () => {
    cy.intercept('GET', '**/draw/?count=4', {
      body: {
        success: true, deck_id: 'test_deck', remaining: 48,
        cards: [
          { code: '6S', value: '6', suit: 'SPADES', image: 'https://deckofcardsapi.com/static/img/6S.png' },
          { code: '2D', value: '2', suit: 'DIAMONDS', image: 'https://deckofcardsapi.com/static/img/2D.png' },
          { code: '4H', value: '4', suit: 'HEARTS', image: 'https://deckofcardsapi.com/static/img/4H.png' },
          { code: '9H', value: '9', suit: 'HEARTS', image: 'https://deckofcardsapi.com/static/img/9H.png' },
        ]
      }
    }).as('dealCards');

    cy.intercept('GET', '**/draw/?count=1', {
        body: {
            success: true, deck_id: 'test_deck', remaining: 47,
            cards: [
                { code: 'JS', value: 'JACK', suit: 'SPADES', image: 'https://deckofcardsapi.com/static/img/JS.png' },
            ]
        }
    }).as('doubleCard');

    cy.get('button').contains('Deal').click();
    cy.wait('@dealCards');
    cy.get('button').contains('Double').should('be.visible').click();
    cy.wait('@doubleCard');
    cy.contains(/^Hand 1:/).prev('section').find('img').should('have.length', 3);
    cy.get('button').contains('Hit').should('not.exist');
  });

  it("Check if 'Split' button appears only when user is allowed to split, and the split logic is properly handled", () => {
    cy.intercept('GET', '**/draw/?count=4', {
        body: {
            success: true, deck_id: 'test_deck', remaining: 48,
            cards: [
                { code: '8S', value: '8', suit: 'SPADES', image: 'https://deckofcardsapi.com/static/img/8S.png' },
                { code: '5D', value: '5', suit: 'DIAMONDS', image: 'https://deckofcardsapi.com/static/img/5D.png' },
                { code: '8H', value: '8', suit: 'HEARTS', image: 'https://deckofcardsapi.com/static/img/8H.png' },
                { code: 'KH', value: 'KING', suit: 'HEARTS', image: 'https://deckofcardsapi.com/static/img/KH.png' },
            ]
        }
    }).as('dealCards');

    cy.intercept('GET', '**/draw/?count=2', {
         body: {
            success: true, deck_id: 'test_deck', remaining: 46,
            cards: [
                { code: '3S', value: '3', suit: 'SPADES', image: 'https://deckofcardsapi.com/static/img/3S.png' },
                { code: 'AS', value: 'ACE', suit: 'SPADES', image: 'https://deckofcardsapi.com/static/img/AS.png' },
            ]
        }
    }).as('splitCards');
    
    cy.get('button').contains('Deal').click();
    cy.wait('@dealCards');
    cy.get('button').contains('Split').should('be.visible').click();
    cy.wait('@splitCards');
    cy.contains(/^Hand 1:/).should('be.visible');
    cy.contains(/^Hand 2:/).should('be.visible');
    cy.contains(/^Hand 1:/).prev('section').find('img').should('have.length', 2);
    cy.contains(/^Hand 2:/).prev('section').find('img').should('have.length', 2);
  });
});

describe.only('Blackjack Game - Logged In Features', () => {
  beforeEach(() => {
    // Log in before each test in this suite
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
    // Set sessionStorage to prevent the tutorial modal from appearing
    cy.visit('/blackjackgame', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('blackjack_tutorial_seen', 'true');
      },
    });
    // Intercept the initial shuffle, ensure a high card count, and wait for it
    cy.intercept('GET', '**/new/shuffle/**', (req) => {
      req.reply((res) => {
        if (res.body && typeof res.body.remaining !== 'undefined') {
          res.body.remaining = 100;
        }
        return res;
      });
    }).as('shuffle');
    cy.wait('@shuffle');
  });

  it("Check if 'Credit' button is only clickable when user is logged in", () => {
    // When logged in, the button should be enabled (and thus clickable)
    cy.get('button').contains('Credit').should('not.be.disabled');

    // log out
    cy.get('button').contains('Sign out').click();

    // Re-visit the page (now logged out)
    cy.visit('/blackjackgame', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('blackjack_tutorial_seen', 'true');
      },
    });

    // When logged out, the button should be disabled
    cy.get('button').contains('Credit').should('be.disabled');
  });

  it("Check if 'Use Previous Bet' button allows user to bet his previous bet", () => {
    // Switch to credit mode and wait for the UI to update
    cy.get('button').contains('Credit').click()
      .should('have.class', 'bg-white'); 

    // Place a bet and play a hand
    cy.get('input[type="number"]').type('{selectall}{backspace}25');
    // Set up the interceptor BEFORE the action that triggers the request
    cy.intercept('GET', '**/draw/?count=4').as('dealCards');
    cy.get('button').contains('Deal').click();
    cy.wait('@dealCards');
    cy.get('button').contains('Stand').click();
    cy.contains(/Hand 1: (You win!|You lose|Push – tie.)/, { timeout: 10000 }).should('be.visible');

    // Change the bet amount, then click 'Use Previous Bet'
    cy.get('input[type="number"]').type('{selectall}{backspace}10');
    cy.get('button').contains('Use Previous Bet').click();
    cy.get('input[type="number"]').should('have.value', '25');
  });

  it('Check if user can retrieve previously calculated statistics from Firestore', () => {
    const testStats = {
      correctMoves: 5,
      wrongMoves: 2,
      handsPlayed: 7,
    };
    
    // Set the stats for the logged-in user using their email
    cy.task('setStats', {
      email: Cypress.env('TEST_USER_EMAIL'),
      stats: testStats
    });

    // Reload the page to fetch the new stats
    cy.reload();

    // Verify that the stats are displayed correctly
    cy.get('.fixed.bottom-4.right-4').within(() => {
        cy.contains('5 CORRECT').should('be.visible');
        cy.contains('2 WRONG').should('be.visible');
        cy.contains('71% SCORE').should('be.visible'); // (5/7) * 100
        cy.contains('7 HANDS PLAYED').should('be.visible');
    });
  });
}); 
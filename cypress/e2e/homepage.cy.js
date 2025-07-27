describe('Navigation', () => {
  it("Check if 'Home' button brings user to Home page", () => {
    cy.visit('http://localhost:3000');
    cy.contains('Home').click();
    cy.url().should('include', '/');
  });

  it("Check if 'Strategies' button brings user to Strategies page", () => {
    cy.visit('http://localhost:3000');
    cy.contains('Strategies').click();
    cy.url().should('include', '/strategies');
  });

  it("Check if 'About' button brings user to About page", () => {
    cy.visit('http://localhost:3000');
    cy.contains('About').click();
    cy.url().should('include', '/about');
  });

  it("Check if 'Log In' button brings user to login page", () => {
    cy.visit('http://localhost:3000');
    cy.contains('Log in').click();
    cy.url().should('include', '/login');
  });

  it("Check if 'Play Now!' button brings user to Blackjack Game", () => {
    cy.visit('http://localhost:3000');
    cy.contains('Play Now!').click();
    cy.url().should('include', '/blackjackgame');
  });
}); 
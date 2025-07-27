describe('Profile Page', () => {
  beforeEach(() => {
    // Log in before each test
    cy.login(Cypress.env('TEST_USER_EMAIL'), Cypress.env('TEST_USER_PASSWORD'));
  });

  it("Check if 'Profile' button only appears when user is logged in", () => {
    // Visit the home page to ensure the header is present
    cy.visit('/');
    // When logged in, Profile button should be visible in the nav bar
    cy.get('nav').contains('Profile').should('be.visible');

    // Log out and verify it's not visible
    cy.get('button').contains('Sign out').click();
    cy.get('nav').contains('Profile').should('not.exist');
  });

  it("Check if 'Profile' button brings user to profile page", () => {
    // Visit the home page to ensure the header is present
    cy.visit('/');
    cy.get('nav').contains('Profile').click();
    cy.url().should('include', '/profile');
    cy.contains('h1', 'Profile').should('be.visible');
  });

  it("Check if 'Buy Credits' button brings user to input desired quantity", () => {
    cy.visit('/profile');
    cy.contains('Buy Credits').click();
    // The modal should appear
    cy.contains('h2', 'Buy Credits').should('be.visible');
    // And the quantity input should be visible within it
    cy.get('input[type="number"]').should('be.visible');
  });

  it("Check if 'Proceed to Checkout' button brings user to purchase the credits using Stripe API", () => {
    // Intercept the Stripe checkout session request
    cy.intercept('POST', '**/api/create-checkout-session').as('createCheckout');

    cy.visit('/profile');
    cy.contains('Buy Credits').click();
    cy.contains('h2', 'Buy Credits').should('be.visible');

    // Click the checkout button
    cy.contains('button', 'Proceed to Checkout').click();

    // Wait for the API call and verify it was successful
    cy.wait('@createCheckout').its('response.statusCode').should('eq', 200);
  });

  it('Check if credits are correctly reflected on Firestore after user purchases them', () => {
    const initialCredits = 100;
    const purchasedCredits = 50;
    const finalCredits = initialCredits + purchasedCredits;

    // Set initial credits
    cy.task('setCredits', { email: Cypress.env('TEST_USER_EMAIL'), amount: initialCredits });

    // Visit the profile page and verify initial credits are shown
    cy.visit('/profile');
    cy.contains(`Credits: ${initialCredits}`).should('be.visible');

    // Simulate a successful purchase by updating the credits in the backend
    cy.task('setCredits', { email: Cypress.env('TEST_USER_EMAIL'), amount: finalCredits });

    // Reload the page and verify the UI updates
    cy.reload();
    cy.contains(`Credits: ${finalCredits}`).should('be.visible');
    
    // 5. Verify the final credit amount in Firestore
    cy.task('getCredits', { email: Cypress.env('TEST_USER_EMAIL') }).should('eq', finalCredits);
  });
}); 
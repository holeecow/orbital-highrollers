describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  it("Check if 'Sign up' button brings user to sign up page", () => {
    cy.contains('Sign up.').click();
    cy.url().should('include', '/signup');
  });

  it("Check if 'Forgot Password' button allows user to reset their password", () => {
    cy.contains('Forgot password?').click();
    cy.contains("Enter your email address!").should('be.visible');
    cy.get('input[placeholder="example@example.com"]').type(Cypress.env('TEST_USER_EMAIL'));
    cy.contains('Reset password').click();
    cy.contains("Enter your email address!").should('not.exist');
  });

  it('Check if user can enter log-in credentials and successfully log in', () => {
    cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
    cy.get('input[name="password"]').type(Cypress.env('TEST_USER_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('Check if user can register for new account', () => {
    cy.contains('Sign up.').click();
    const randomEmail = `testuser_${Date.now()}@example.com`;
    cy.get('input[type="email"]').type(randomEmail);
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });
}); 
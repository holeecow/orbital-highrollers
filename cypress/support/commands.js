// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    // Intercept the Firebase sign-in call
    cy.intercept('POST', '**/accounts:signInWithPassword**').as('firebaseLogin');

    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Wait for the login request to complete and check for a 200 (OK) status
    cy.wait('@firebaseLogin').its('response.statusCode').should('eq', 200);

    // A more reliable way to ensure the app has processed the login
    // is to check for the user's email in the header.
    cy.contains(email).should('be.visible');
  });
});
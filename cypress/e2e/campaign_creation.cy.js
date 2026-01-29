describe('Flow Crítico: Creación de Campaña', () => {
// ...
    // Save
    cy.get('[data-testid="save-campaign-btn"]').click({ force: true });

    // Verify Toast
  beforeEach(() => {
    // Mock Supabase Auth
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: "fake-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "fake-refresh-token",
        user: {
          id: "test-user-123",
          aud: "authenticated",
          role: "authenticated",
          email: "admin@360.com",
          app_metadata: { provider: "email" },
          user_metadata: {}
        }
      }
    }).as('loginRequest');

    // Also mock the subsequent getSession/getUser calls if needed, 
    // but usually onAuthStateChange handles the login response.
    // However, if the app reloads or checks session on app start:
    // We might need to mock that too. But for "Login Flow", the POST return is key.

    cy.visit('/login');
    
    // Login flow
    cy.get('input[type="email"]').type('admin@360.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Ingresar').click();

    // Wait for the mock
    cy.wait('@loginRequest');

    // Verify dashboard load
    cy.url().should('not.include', '/login');
    cy.contains('Dashboard 2026', { timeout: 10000 }).should('be.visible');
  });

  it('Debe crear una nueva campaña y verificar que aparece en la lista', () => {
    const campaignName = `Cypress Test ${Date.now()}`;

    // Navigate to Projects
    // Assuming there is a sidebar or navigation. If not, visit URL.
    // Based on previous files, there is a Sidebar.
    // Let's force visit to be safe for this first test.
    cy.visit('/projects');

    // Click "Nueva Campaña"
    cy.contains('button', 'Nueva Campaña').click();

    // Wait for modal to be visible
    cy.contains('h3', 'Nueva Campaña', { timeout: 10000 }).should('be.visible');

    // Fill Modal
    cy.get('input[placeholder="Ej. Verano 2026"]').should('be.visible').type(campaignName);
    cy.get('select').eq(0).select('En Curso'); // Status
    cy.get('input[type="date"]').eq(0).type('2026-06-01'); // Start
    cy.get('input[type="date"]').eq(1).type('2026-06-30'); // End

    // Save
    cy.get('[data-testid="save-campaign-btn"]').click({ force: true });

    // Verify Toast
    cy.contains('Campaña creada').should('be.visible');

    // Verify in List
    cy.contains(campaignName).should('be.visible');
  });
});

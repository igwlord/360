describe('Flow Crítico: Gestión de Campaña (Edición y Eliminación)', () => {
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

    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@360.com');
    cy.get('input[type="password"]').type('admin123');
    cy.contains('button', 'Ingresar').click();
    cy.wait('@loginRequest');
    
    // MOCK DATA REQUESTS
    // 1. Initial Get (Empty or some data)
    cy.intercept('GET', '**/rest/v1/campaigns*', {
      statusCode: 200,
      body: []
    }).as('getCampaigns');

    // 2. Mock Create
    cy.intercept('POST', '**/rest/v1/campaigns*', (req) => {
      req.reply({
        statusCode: 201,
        body: { id: 999, ...req.body }
      });
    }).as('createCampaign');

    // 3. Mock Update
    cy.intercept('PATCH', '**/rest/v1/campaigns*', (req) => {
        req.reply({
            statusCode: 200,
            body: { ...req.body }
        });
    }).as('updateCampaign');

    // 4. Mock Delete
    cy.intercept('DELETE', '**/rest/v1/campaigns*', {
        statusCode: 204
    }).as('deleteCampaign');

    cy.url().should('not.include', '/login');
  });

  const createCampaign = (campaignName) => {
    cy.visit('/projects');
    cy.contains('button', 'Nueva Campaña').should('be.visible').click();
    cy.contains('h3', 'Nueva Campaña', { timeout: 10000 }).should('be.visible');
    
    // Wait for animation
    cy.wait(500); 

    cy.get('input[placeholder="Ej. Verano 2026"]').should('be.visible').type(campaignName);
    cy.get('select').eq(0).select('Planificación');
    
    cy.get('[data-testid="save-campaign-btn"]').should('be.visible').click({ force: true });
    
    // Verify success toast (App considers it done)
    cy.contains('Campaña creada', { timeout: 10000 }).should('be.visible');

    // Verify Optimistic Update in List (without reload)
    cy.contains(campaignName, { timeout: 10000 }).should('be.visible');
  };

  it('Debe editar una campaña existente', () => {
    const campaignName = `Edit Test ${Date.now()}`;
    const newName = `Edited ${Date.now()}`;

    // 1. Create a campaign to edit
    createCampaign(campaignName);

    // 2. Open Edit Modal (Assuming row click or edit button)
    cy.contains(campaignName).click({ force: true });

    // 3. Edit Name
    cy.get('input[placeholder="Ej. Verano 2026"]').should('be.visible').clear().type(newName);
    
    // 4. Save
    cy.get('[data-testid="save-campaign-btn"]').click({ force: true });

    // 5. Verify Update
    cy.contains('Campaña actualizada').should('be.visible');
    cy.contains(newName).should('be.visible');
  });

  it('Debe eliminar una campaña', () => {
    const campaignName = `Delete Test ${Date.now()}`;

    // 1. Create a campaign to delete
    createCampaign(campaignName);

    // 2. Click Delete Button (ContextMenu or Row Action)
    // Projects.jsx has a trash icon button in the "Actions" column
    // We need to find the row containing the campaignName
    
    // Assuming table layout, let's find the row and click the delete button within it.
    cy.contains(campaignName)
      .parents('[role="row"]')
      .find('button')
      .filter(':contains("Trash"), :has(svg)') // Generalized selector as title might fail
      .last() // Assuming last button is delete
      .click({ force: true });

    // 3. Confirm Deletion in Modal
    cy.contains('¿Eliminar').should('be.visible');
    cy.contains('button', 'Confirmar').click({ force: true }); // Adjust selector based on ConfirmModal

    // 4. Verify Deletion
    cy.contains('eliminado correctamente').should('be.visible');
    cy.contains(campaignName).should('not.exist');
  });
});

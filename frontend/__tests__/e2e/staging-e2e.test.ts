/**
 * End-to-End Tests for Staging Environment
 * 
 * These tests verify complete user workflows from the frontend perspective.
 * 
 * Note: These tests require the staging environment to be deployed and accessible.
 * Run with: npm run test:e2e
 */

import axios from 'axios';

// Load environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws';

// Test user credentials (should be created in staging environment)
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'E2ETestPassword123!',
  name: 'E2E Test User',
};

describe('Staging E2E Tests', () => {
  let authToken: string;
  let userId: string;

  describe('User Login and Dashboard Workflow', () => {
    test('User should be able to register a new account', async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email: TEST_USER.email,
          password: TEST_USER.password,
          name: TEST_USER.name,
        });

        // Either success (201) or user already exists (409)
        expect([201, 409]).toContain(response.status);

        if (response.status === 201) {
          expect(response.data).toHaveProperty('userId');
          userId = response.data.userId;
        }
      } catch (error: any) {
        // User might already exist
        if (error.response?.status === 409) {
          console.log('Test user already exists, continuing...');
        } else {
          throw error;
        }
      }
    }, 30000);

    test('User should be able to login', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('idToken');
      expect(response.data).toHaveProperty('refreshToken');

      authToken = response.data.accessToken;
      userId = response.data.userId || userId;
    }, 30000);

    test('User should be able to access dashboard data', async () => {
      expect(authToken).toBeDefined();

      const response = await axios.get(`${API_URL}/digital-twin`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('nodes');
      expect(response.data).toHaveProperty('lastUpdated');
    }, 30000);

    test('User should be able to fetch active alerts', async () => {
      expect(authToken).toBeDefined();

      const response = await axios.get(`${API_URL}/alerts`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.alerts)).toBe(true);
    }, 30000);

    test('User should be able to fetch key metrics', async () => {
      expect(authToken).toBeDefined();

      const response = await axios.get(`${API_URL}/sustainability/metrics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('carbonFootprint');
      expect(response.data).toHaveProperty('sustainabilityScore');
    }, 30000);
  });

  describe('Scenario Simulation Workflow', () => {
    let scenarioId: string;

    test('User should be able to create a new scenario', async () => {
      expect(authToken).toBeDefined();

      const response = await axios.post(
        `${API_URL}/scenarios/simulate`,
        {
          type: 'supplier_disruption',
          location: 'Asia',
          severity: 'high',
          duration: 7,
          affectedNodes: ['supplier-001', 'supplier-002'],
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('scenarioId');
      expect(response.data).toHaveProperty('status');

      scenarioId = response.data.scenarioId;
    }, 60000); // Longer timeout for simulation

    test('User should be able to fetch scenario results', async () => {
      expect(authToken).toBeDefined();
      expect(scenarioId).toBeDefined();

      // Wait a bit for simulation to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      const response = await axios.get(
        `${API_URL}/scenarios/${scenarioId}/results`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('impacts');
      expect(response.data).toHaveProperty('strategies');
      expect(response.data.impacts).toHaveProperty('cost');
      expect(response.data.impacts).toHaveProperty('time');
      expect(response.data.impacts).toHaveProperty('inventory');
    }, 30000);

    test('User should be able to view decision tree', async () => {
      expect(authToken).toBeDefined();
      expect(scenarioId).toBeDefined();

      const response = await axios.get(
        `${API_URL}/scenarios/${scenarioId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('decisionTree');
      expect(response.data.decisionTree).toHaveProperty('nodes');
      expect(response.data.decisionTree).toHaveProperty('edges');
    }, 30000);
  });

  describe('Marketplace Browsing and Rating Workflow', () => {
    let marketplaceScenarioId: string;

    test('User should be able to browse marketplace scenarios', async () => {
      const response = await axios.get(`${API_URL}/marketplace/scenarios`, {
        params: {
          page: 1,
          limit: 10,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.scenarios)).toBe(true);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');

      if (response.data.scenarios.length > 0) {
        marketplaceScenarioId = response.data.scenarios[0].id;
      }
    }, 30000);

    test('User should be able to search marketplace scenarios', async () => {
      const response = await axios.get(`${API_URL}/marketplace/scenarios`, {
        params: {
          search: 'supplier',
          industry: 'manufacturing',
          page: 1,
          limit: 10,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.scenarios)).toBe(true);
    }, 30000);

    test('User should be able to view scenario details', async () => {
      if (!marketplaceScenarioId) {
        console.log('No marketplace scenarios available, skipping test');
        return;
      }

      const response = await axios.get(
        `${API_URL}/marketplace/scenarios/${marketplaceScenarioId}`
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('description');
      expect(response.data).toHaveProperty('rating');
      expect(response.data).toHaveProperty('usageCount');
    }, 30000);

    test('Authenticated user should be able to rate a scenario', async () => {
      if (!marketplaceScenarioId || !authToken) {
        console.log('Prerequisites not met, skipping test');
        return;
      }

      const response = await axios.put(
        `${API_URL}/marketplace/scenarios/${marketplaceScenarioId}/rating`,
        {
          score: 4,
          review: 'Great scenario for testing supplier disruptions',
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          validateStatus: () => true,
        }
      );

      // Should succeed (200) or already rated (409)
      expect([200, 409]).toContain(response.status);
    }, 30000);

    test('Authenticated user should be able to fork a scenario', async () => {
      if (!marketplaceScenarioId || !authToken) {
        console.log('Prerequisites not met, skipping test');
        return;
      }

      const response = await axios.post(
        `${API_URL}/marketplace/scenarios/${marketplaceScenarioId}/fork`,
        {
          customizations: {
            severity: 'medium',
            duration: 14,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('scenarioId');
      expect(response.data).toHaveProperty('originalAuthor');
    }, 30000);
  });

  describe('Alert Acknowledgment Workflow', () => {
    let alertId: string;

    test('User should be able to fetch alerts', async () => {
      expect(authToken).toBeDefined();

      const response = await axios.get(`${API_URL}/alerts`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.alerts)).toBe(true);

      if (response.data.alerts.length > 0) {
        alertId = response.data.alerts[0].id;
      }
    }, 30000);

    test('User should be able to acknowledge an alert', async () => {
      if (!alertId || !authToken) {
        console.log('No alerts available, skipping test');
        return;
      }

      const response = await axios.put(
        `${API_URL}/alerts/${alertId}/acknowledge`,
        {
          notes: 'Acknowledged and investigating',
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('acknowledged');
      expect(response.data).toHaveProperty('acknowledgedBy');
      expect(response.data.acknowledgedBy).toBe(userId);
    }, 30000);

    test('Acknowledged alert should appear in alert history', async () => {
      if (!alertId || !authToken) {
        console.log('Prerequisites not met, skipping test');
        return;
      }

      const response = await axios.get(`${API_URL}/alerts`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          status: 'acknowledged',
        },
      });

      expect(response.status).toBe(200);
      const acknowledgedAlert = response.data.alerts.find((a: any) => a.id === alertId);
      expect(acknowledgedAlert).toBeDefined();
      expect(acknowledgedAlert.status).toBe('acknowledged');
    }, 30000);
  });

  describe('Cleanup', () => {
    test('User should be able to logout', async () => {
      if (!authToken) {
        console.log('No auth token, skipping logout');
        return;
      }

      const response = await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
    }, 30000);
  });
});

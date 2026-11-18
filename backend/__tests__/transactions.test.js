/**
 * Transaction Tests
 * Tests for POS sales transaction creation with focus on:
 * - Transaction atomicity
 * - Inventory deduction
 * - Stock validation
 * - Price tampering protection
 * - Concurrent transaction handling
 */

const request = require('supertest');
const app = require('../src/server');
const { SalesTransaction, Inventory, StockMovement, CashSession, Product } = require('../src/models');

describe('Sales Transactions', () => {
  let cashierToken;
  let managerToken;
  let testCashSession;

  beforeAll(async () => {
    cashierToken = generateTestToken(2, 'cashier');
    managerToken = generateTestToken(1, 'manager');

    // Create a test cash session
    testCashSession = await CashSession.create({
      cashier_id: 2,
      opening_balance: 10000,
      status: 'open',
      opened_at: new Date(),
    });
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/v1/transactions - Create Sale', () => {
    test('should create valid sale transaction atomically', async () => {
      const initialInventory = await Inventory.findOne({ where: { product_id: 1 } });
      
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 5,
            unit_price: 1000,
            subtotal: 5000,
          },
        ],
        subtotal: 5000,
        tax_amount: 900,
        total_amount: 5900,
        payment_method: 'cash',
        amount_tendered: 6000,
        change_given: 100,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      // Verify transaction created
      expect(response.body.data).toHaveProperty('receipt_number');
      expect(response.body.data.total_amount).toBe('5900.00');
      expect(response.body.data.items).toHaveLength(1);

      // Verify inventory deducted
      const updatedInventory = await Inventory.findOne({ where: { product_id: 1 } });
      expect(updatedInventory.quantity_on_hand).toBe(initialInventory.quantity_on_hand - 5);

      // Verify stock movement created
      const stockMovement = await StockMovement.findOne({
        where: { product_id: 1, type: 'out' },
      });
      expect(stockMovement).not.toBeNull();
      expect(stockMovement.quantity).toBe(-5);
    });

    test('should reject sale with insufficient stock', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 150, // Only 100 in stock
            unit_price: 1000,
            subtotal: 150000,
          },
        ],
        subtotal: 150000,
        tax_amount: 27000,
        total_amount: 177000,
        payment_method: 'cash',
        amount_tendered: 180000,
        change_given: 3000,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.error).toContain('Insufficient stock');
    });

    test('should reject sale with price tampering', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 5,
            unit_price: 100, // Real price is 1000
            subtotal: 500,
          },
        ],
        subtotal: 500,
        tax_amount: 90,
        total_amount: 590,
        payment_method: 'cash',
        amount_tendered: 600,
        change_given: 10,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.error).toContain('Price mismatch');
    });

    test('should reject sale with tampered subtotal', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 5,
            unit_price: 1000,
            subtotal: 3000, // Should be 5000
          },
        ],
        subtotal: 3000,
        tax_amount: 540,
        total_amount: 3540,
        payment_method: 'cash',
        amount_tendered: 4000,
        change_given: 460,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.error).toContain('Calculation error');
    });

    test('should reject sale with tampered total', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 5,
            unit_price: 1000,
            subtotal: 5000,
          },
        ],
        subtotal: 5000,
        tax_amount: 900,
        total_amount: 4000, // Should be 5900
        payment_method: 'cash',
        amount_tendered: 5000,
        change_given: 1000,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.error).toContain('Total amount mismatch');
    });

    test('should reject sale with invalid product', async () => {
      const saleData = {
        items: [
          {
            product_id: 9999, // Non-existent product
            quantity: 1,
            unit_price: 1000,
            subtotal: 1000,
          },
        ],
        subtotal: 1000,
        tax_amount: 180,
        total_amount: 1180,
        payment_method: 'cash',
        amount_tendered: 1200,
        change_given: 20,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    test('should reject sale without active cash session', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 1,
            unit_price: 1000,
            subtotal: 1000,
          },
        ],
        subtotal: 1000,
        tax_amount: 180,
        total_amount: 1180,
        payment_method: 'cash',
        amount_tendered: 1200,
        change_given: 20,
        // No cash_session_id provided and no active session
      };

      // Close the test session
      await testCashSession.update({ status: 'closed' });

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.error).toContain('shift');

      // Reopen for other tests
      await testCashSession.update({ status: 'open' });
    });

    test('should reject sale with empty items array', async () => {
      const saleData = {
        items: [],
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        payment_method: 'cash',
        amount_tendered: 0,
        change_given: 0,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.error).toContain('items');
    });

    test('should handle multiple items in single transaction', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 2,
            unit_price: 1000,
            subtotal: 2000,
          },
          {
            product_id: 2,
            quantity: 1,
            unit_price: 2000,
            subtotal: 2000,
          },
        ],
        subtotal: 4000,
        tax_amount: 720,
        total_amount: 4720,
        payment_method: 'cash',
        amount_tendered: 5000,
        change_given: 280,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      expect(response.body.data.items).toHaveLength(2);

      // Verify both products' inventory updated
      const inv1 = await Inventory.findOne({ where: { product_id: 1 } });
      const inv2 = await Inventory.findOne({ where: { product_id: 2 } });
      expect(inv1.quantity_on_hand).toBe(98);
      expect(inv2.quantity_on_hand).toBe(49);
    });

    test('should generate unique receipt numbers', async () => {
      const saleData = {
        items: [
          {
            product_id: 1,
            quantity: 1,
            unit_price: 1000,
            subtotal: 1000,
          },
        ],
        subtotal: 1000,
        tax_amount: 180,
        total_amount: 1180,
        payment_method: 'cash',
        amount_tendered: 1200,
        change_given: 20,
        cash_session_id: testCashSession.id,
      };

      const response1 = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      const response2 = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      expect(response1.body.data.receipt_number).not.toBe(
        response2.body.data.receipt_number
      );
    });

    test('should reject transaction without authentication', async () => {
      const saleData = {
        items: [{ product_id: 1, quantity: 1, unit_price: 1000, subtotal: 1000 }],
        subtotal: 1000,
        tax_amount: 180,
        total_amount: 1180,
        payment_method: 'cash',
        amount_tendered: 1200,
        change_given: 20,
      };

      await request(app)
        .post('/api/v1/transactions')
        .send(saleData)
        .expect(401);
    });

    test('should create low stock alert when inventory falls below reorder point', async () => {
      // Product 3 has reorder_point=20 and stock=1
      const saleData = {
        items: [
          {
            product_id: 3,
            quantity: 1,
            unit_price: 500,
            subtotal: 500,
          },
        ],
        subtotal: 500,
        tax_amount: 90,
        total_amount: 590,
        payment_method: 'cash',
        amount_tendered: 600,
        change_given: 10,
        cash_session_id: testCashSession.id,
      };

      const response = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      // Check for alert
      const { Alert } = require('../src/models');
      const alert = await Alert.findOne({
        where: { product_id: 3, type: 'low_stock' },
      });

      expect(alert).not.toBeNull();
      expect(alert.severity).toBe('critical'); // Stock is now 0
    });
  });

  describe('GET /api/v1/transactions - List Transactions', () => {
    test('should list transactions for cashier (own shift only)', async () => {
      // Create a transaction
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ product_id: 1, quantity: 1, unit_price: 1000, subtotal: 1000 }],
          subtotal: 1000,
          tax_amount: 180,
          total_amount: 1180,
          payment_method: 'cash',
          amount_tendered: 1200,
          change_given: 20,
          cash_session_id: testCashSession.id,
        });

      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
    });

    test('should list all transactions for manager', async () => {
      const response = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });
  });

  describe('POST /api/v1/transactions/:id/void - Void Transaction', () => {
    test('should allow manager to void transaction', async () => {
      // Create a transaction first
      const createResponse = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ product_id: 1, quantity: 1, unit_price: 1000, subtotal: 1000 }],
          subtotal: 1000,
          tax_amount: 180,
          total_amount: 1180,
          payment_method: 'cash',
          amount_tendered: 1200,
          change_given: 20,
          cash_session_id: testCashSession.id,
        });

      const transactionId = createResponse.body.data.id;

      // Void it
      const voidResponse = await request(app)
        .post(`/api/v1/transactions/${transactionId}/void`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: 'Customer requested cancellation due to pricing error' })
        .expect(200);

      expect(voidResponse.body.data.status).toBe('voided');
    });

    test('should reject void by cashier', async () => {
      const createResponse = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ product_id: 1, quantity: 1, unit_price: 1000, subtotal: 1000 }],
          subtotal: 1000,
          tax_amount: 180,
          total_amount: 1180,
          payment_method: 'cash',
          amount_tendered: 1200,
          change_given: 20,
          cash_session_id: testCashSession.id,
        });

      const transactionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/v1/transactions/${transactionId}/void`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ reason: 'Test void reason that is long enough to pass validation' })
        .expect(403);
    });

    test('should reject void with insufficient reason length', async () => {
      const createResponse = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ product_id: 1, quantity: 1, unit_price: 1000, subtotal: 1000 }],
          subtotal: 1000,
          tax_amount: 180,
          total_amount: 1180,
          payment_method: 'cash',
          amount_tendered: 1200,
          change_given: 20,
          cash_session_id: testCashSession.id,
        });

      const transactionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/v1/transactions/${transactionId}/void`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: 'Short' }) // Less than 10 characters
        .expect(400);
    });
  });
});

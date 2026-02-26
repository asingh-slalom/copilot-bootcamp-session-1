const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      // First create an item to delete
      const createResponse = await request(app)
        .post('/api/items')
        .send({ name: 'Item to delete' })
        .set('Accept', 'application/json');

      const itemId = createResponse.body.id;

      const deleteResponse = await request(app).delete(`/api/items/${itemId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('message', 'Item deleted successfully');
      expect(deleteResponse.body).toHaveProperty('id', itemId);
    });

    it('should return 404 when deleting a non-existent item', async () => {
      const response = await request(app).delete('/api/items/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should actually remove the item from the database', async () => {
      // Create an item
      const createResponse = await request(app)
        .post('/api/items')
        .send({ name: 'Temporary item' })
        .set('Accept', 'application/json');

      const itemId = createResponse.body.id;

      // Delete it
      await request(app).delete(`/api/items/${itemId}`);

      // Get all items and confirm it's gone
      const getResponse = await request(app).get('/api/items');
      const ids = getResponse.body.map((item) => item.id);
      expect(ids).not.toContain(itemId);
    });
  });
});
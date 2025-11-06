const express = require('express');
const router = express.Router();

/**
 * Get all products
 */
router.get('/', (req, res) => {
  const { category, minPrice, maxPrice, sort } = req.query;
  res.json({ products: [] });
});

/**
 * Get product by ID
 */
router.get('/:productId', (req, res) => {
  const { productId } = req.params;
  res.json({ product: { id: productId } });
});

/**
 * Create product
 */
router.post('/', (req, res) => {
  const { name, description, price, category, stock } = req.body;
  res.status(201).json({ product: { name, price, category } });
});

/**
 * Update product
 */
router.patch('/:productId', (req, res) => {
  const { productId } = req.params;
  const { price, stock } = req.body;
  res.json({ product: { id: productId, price, stock } });
});

/**
 * Delete product
 */
router.delete('/:productId', (req, res) => {
  const { productId } = req.params;
  res.json({ success: true });
});

module.exports = router;

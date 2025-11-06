const express = require('express');
const router = express.Router();

/**
 * Get all users
 */
router.get('/', (req, res) => {
  const { page, limit, search } = req.query;
  res.json({ users: [], page, limit, search });
});

/**
 * Get user by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ user: { id } });
});

/**
 * Create new user
 */
router.post('/', (req, res) => {
  const { name, email, password, age } = req.body;
  res.status(201).json({ user: { name, email, age } });
});

/**
 * Update user
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, age } = req.body;
  res.json({ user: { id, name, email, age } });
});

/**
 * Delete user
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ success: true });
});

/**
 * Upload user avatar
 */
router.post('/:id/avatar', (req, res) => {
  const { id } = req.params;
  const file = req.file; // multer middleware
  res.json({ avatarUrl: '/uploads/avatar.jpg' });
});

module.exports = router;

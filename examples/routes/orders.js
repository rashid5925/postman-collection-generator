const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');

router.get('/', orderController.getAllOrders);
router.get('/:orderId', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:orderId', orderController.updateOrder);
router.delete('/:orderId', orderController.cancelOrder);

module.exports = router;

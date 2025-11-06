const orderService = require('../service/orderService');

const getAllOrders = (req, res) => {
  const { status, page, limit, customerId } = req.query;
  const orders = orderService.fetchOrders({ status, page, limit, customerId });
  res.json(orders);
};

const getOrderById = (req, res) => {
  const { orderId } = req.params;
  const order = orderService.getOrder(orderId);
  res.json(order);
};

const createOrder = (req, res) => {
  const { customerId, items, shippingAddress, paymentMethod } = req.body;
  const order = orderService.createNewOrder({
    customerId,
    items,
    shippingAddress,
    paymentMethod
  });
  res.status(201).json(order);
};

const updateOrder = (req, res) => {
  const { orderId } = req.params;
  const { status, trackingNumber } = req.body;
  const updated = orderService.updateOrderStatus(orderId, status, trackingNumber);
  res.json(updated);
};

const cancelOrder = (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  orderService.cancelOrder(orderId, reason);
  res.json({ success: true });
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder
};

import { 
  countUserOrdersByType,
  createOrderOrThrow,
  getFullOrdersByCustomerIdAndStatusOrThrow,
  updateOrderStatusOrThrow,
} from '../../services/orders.service.js';
import { isCorrectUser } from '../../services/auth.utils.js';
import { getOrderById } from '../repositories/orders.repo.js';


export const createOrder = async (req, res, next) => {
  try {
    const jwtUserId = Number(req.user.id);
    const customer_id  = Number(req.body.order.customer_id);
    const customer_email = req.user.email;

    // Only allow users to create orders for themselves
    if (jwtUserId !== customer_id) {
      return res.status(403).json({ message: 'You can only create orders for your own account.' });
    }

    const idempotencyKey = req.body.idempotency_key;
    console.log("idempotency_key in controller: ", idempotencyKey);
    console.log("req.body in controller:", req.body);
    //create the order in the database

      const {newOrder, qrCode, paymentReference, paynowNumber} = await createOrderOrThrow({body: req.body.order ,idempotencyKey, customer_email} );
      //if order creation failed, return error
      if (!newOrder) {
        return res.status(400).json({ message: 'Failed to create order' });
      }
      
      //output order and qr code
      return res.status(201).json({
        order: newOrder,
        qrCode,
        paymentReference,
        paynowNumber
      });
  } catch (err) {
    // Handle foreign key violations for customer_id, merchant_id, or menu_item_id
    const constraint = err.constraint || err.details || '';
    if (err.code === '23503') {
      if (constraint.includes('orders_customer_id_fkey')) {
        return res.status(400).json({ message: 'Invalid customer_id: user does not exist' });
      }
      if (constraint.includes('orders_merchant_id_fkey')) {
        return res.status(400).json({ message: 'Invalid merchant_id: merchant does not exist' });
      }
      if (constraint.includes('order_items_menu_item_id_fkey')) {
        return res.status(400).json({ message: 'Invalid menu_item_id: menu item does not exist' });
      }
    }
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await updateOrderStatusOrThrow(orderId, status);
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/user/:userId?type=active|history&limit=10&offset=0
 * Retrieves full orders (including items) for a specific user.
 */
export const getUserOrders = async (req, res, next) => {
  try {
    // extracting params
    const { userId } = req.params;

    //check that authorised to view. if not will throw error
    const requesterId = req.user.id;
    const role = req.user.role;
    // create a dummy order so that can use the method "isCorrectUser"
    const dummyOrder = { customer_id: parseInt(userId) }; // simulate order object
    const { allowed, reason } = isCorrectUser({
      role,
      userId: requesterId,
      order: dummyOrder
    });
    if (!allowed){
      return res.status(403).json({ error: reason });
    }

    const { type, limit = 10, offset = 0 } = req.query;

    // Use promise to run these concurrently
    const [orders, total] = await Promise.all([
      await getFullOrdersByCustomerIdAndStatusOrThrow({userId, type, limit, offset}),
      await countUserOrdersByType({ userId, type })
    ]);
    
    res.json({ total, orders });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/orders/:orderId/refresh-status
 *
 * Returns the `order_status` of a specific order.
 * Only accessible by the order owner or an admin.
 */
export const getOrderStatus = async (req, res, next) => {
  try {
    const {orderId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await getOrderById( orderId, ['customer_id','order_status']);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const { customer_id, order_status } = order;

    const {allowed, reason} = isCorrectUser({ role, userId, order: { customer_id}});
    if (!allowed) return res.status(403).json({ error: reason });

    // output
    res.status(200).json({
      order_id: orderId,
      order_status
    });
  } catch (err){
    next(err);
  }
}

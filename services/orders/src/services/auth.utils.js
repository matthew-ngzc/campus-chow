/**
 * Checks whether a user (or admin) is authorized to view or modify a given order.
 *
 * - Admins are always allowed.
 * - Users must match the customer ID of the order.
 * - All other roles are denied.
 *
 * @param {Object} params
 * @param {'admin' | 'user' | string} params.role - The role of the requester.
 * @param {number} params.userId - The user ID making the request.
 * @param {Object} params.order - The order being accessed.
 * @param {number} params.order.customer_id - The owner of the order.
 *
 * @returns {{ allowed: boolean, reason?: string }}
 *   Returns an object indicating whether the access is allowed,
 *   and an optional reason if denied.
 */
export function isCorrectUser({ role, userId, order}) {
    // admins are allowed
    if (role === 'ADMIN') {
        return { allowed: true };
    }
    
    // not user and not admin
    if (role !== 'USER') {
        return { allowed: false, reason: 'Only users or admins may view or edit this order.' };
    }
    
    // is user, check id matching anot
    if (order.customer_id != userId) {
        //console.log(order.customer_id, userId);
        return { allowed: false, reason: 'You can only view or edit your own orders.' };
    }
    
    return { allowed: true };
}

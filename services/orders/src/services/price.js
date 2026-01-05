import { fetchMenuItemDetails } from './menus.client.js';

/**
 * Pure pricing calculator that works entirely in cents (integers).
 * Input shape: [{ unitPriceCents, qty }]
 * Output: { subtotalCents, deliveryFeeCents, totalCents }
 *
 * Note: kept as a pure helper; used by computePricingFromOrderItems.
 *
 * @param {Array<{unitPriceCents:number, qty:number}>} items
 * @throws {Error} when an item has invalid/missing price or quantity
 * @returns {{ subtotalCents: number, deliveryFeeCents: number, totalCents: number }}
 */
export function computePricing(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const e = new Error('items must be a non-empty array');
    e.status = 400;
    throw e;
  }

  const deliveryFeeCents = Number(process.env.DELIVERY_FEE_CENTS ?? 100);
  if (!Number.isInteger(deliveryFeeCents) || deliveryFeeCents < 0) {
    const e = new Error('DELIVERY_FEE_CENTS must be a non-negative integer');
    e.status = 500;
    throw e;
  }

  let subtotalCents = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i] ?? {};
    const qty = toInt(it.qty);
    const price = toInt(it.unitPriceCents);

    if (!Number.isInteger(price) || price < 0) {
      const e = new Error(`item[${i}]: unit price (cents) is required and must be a non-negative integer`);
      e.status = 400;
      throw e;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      const e = new Error(`item[${i}]: quantity must be a positive integer`);
      e.status = 400;
      throw e;
    }

    subtotalCents += price * qty;
  }

  const totalCents = subtotalCents + deliveryFeeCents;
  return { subtotalCents, deliveryFeeCents, totalCents };
}

function toInt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.trunc(v) : NaN;
}

/**
 * High-level pricing helper that accepts the UI payload shape and queries Menu service.
 *
 * Input shape (from request):
 *   merchantId: string
 *   orderItems: [
 *     { menu_item_id: number|string, quantity: number, customisations?: object, notes?: string }
 *   ]
 *
 * Returns:
 *   {
 *     amounts: { subtotalCents, deliveryFeeCents, totalCents },
 *     itemSnapshots: [
 *       { menu_item_id, name, unit_price_cents, qty, options }
 *     ]
 *   }
 *
 * Contract/validation notes:
 * - All menu_item_ids must belong to the merchant; Menu service enforces this (404 if not).
 * - If any fetched item is marked available:false, this throws 422 ITEM_UNAVAILABLE.
 * - Quantity must be a positive integer.
 *
 * @param {Object} params
 * @param {string} params.merchantId
 * @param {Array<{menu_item_id:number|string, quantity:number, customisations?:object, notes?:string}>} params.orderItems
 * @throws {Error} 400 invalid input, 404 from Menu, 422 item unavailable
 */
export async function computePricingFromOrderItems({ merchantId, orderItems }) {
  // basic shape checks
  if (!merchantId) {
    const e = new Error('merchantId is required');
    e.status = 400;
    throw e;
  }
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    const e = new Error('order_items must be a non-empty array');
    e.status = 400;
    throw e;
  }

  // collect ids, validate qty early
  const itemIds = [];
  for (let i = 0; i < orderItems.length; i++) {
    const it = orderItems[i] ?? {};
    if (it.menu_item_id === undefined || it.menu_item_id === null) {
      const e = new Error(`order_items[${i}]: menu_item_id is required`);
      e.status = 400;
      throw e;
    }
    const qty = toInt(it.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      const e = new Error(`order_items[${i}]: quantity must be a positive integer`);
      e.status = 400;
      throw e;
    }
    itemIds.push(Number(it.menu_item_id));
  }

  // fetch current details/prices from Menu service
  // (Menu service returns 404 if any ID is invalid or doesn't belong to merchant)
  const detailsMap = await fetchMenuItemDetails(merchantId, itemIds);

  // map into pricing inputs + build snapshots
  const pricingItems = [];
  const itemSnapshots = [];

  for (let i = 0; i < orderItems.length; i++) {
    const input = orderItems[i];
    const id = Number(input.menu_item_id);
    const details = detailsMap.get(id);

    if (!details) {
      // Defensive: the Menu API should 404 before we get here, but just in case:
      const e = new Error(`menu_item_id ${id} not found for merchant ${merchantId}`);
      e.status = 404;
      throw e;
    }

    // Reject items flagged unavailable
    if (details.available === false) {
      const e = new Error(`menu_item_id ${id} ('${details.name}') is currently unavailable`);
      e.status = 422; // Unprocessable (business rule)
      e.code = 'ITEM_UNAVAILABLE';
      throw e;
    }

    const qty = toInt(input.quantity);
    pricingItems.push({
      unitPriceCents: details.priceCents,
      qty,
    });

    // Snapshot for persistence (history-friendly)
    itemSnapshots.push({
      menu_item_id: id,
      name: details.name,
      unit_price_cents: details.priceCents,
      qty,
      options: input.customisations ?? {}, // store customisations as options
      // notes are typically stored on order_items separately if your schema supports it
    });
  }

  const amounts = computePricing(pricingItems);
  return { amounts, itemSnapshots };
}

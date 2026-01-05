/**
 * @file tests/unit/services/menus.client.test.js
 */
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';

// --- 1️⃣ Define mock function and realistic data ---
const mockPost = jest.fn();

const mockRequestBody = { itemIds: [1, 2] };
const mockResponseData = {
  items: [
    { itemId: 1, name: 'Chicken Rice', available: true, priceCents: 550 },
    { itemId: 2, name: 'Soup', available: true, priceCents: 1000 },
  ],
};

// --- 2️⃣ Register Axios mock BEFORE import ---
await jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => ({ post: mockPost })),
  },
}));

// --- 3️⃣ Import client AFTER mocks registered ---
async function loadClient() {
  jest.resetModules();

  await jest.unstable_mockModule('axios', () => ({
    default: {
      create: jest.fn(() => ({ post: mockPost })),
    },
  }));

  const { fetchMenuItemDetails } = await import('../../../src/services/menus.client.js');
  return fetchMenuItemDetails;
}
// --- 4️⃣ Tests ---
describe('menus.client', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // ✅ Reload environment fresh before each test
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  });

  it('returns map of items for valid request', async () => {
    // Simulate API response
    mockPost.mockResolvedValue({ data: mockResponseData });

    const fetchMenuItemDetails = await loadClient();
    const map = await fetchMenuItemDetails('1', [1, 2]);

    // ✅ Verify request details
    expect(mockPost).toHaveBeenCalledWith('/api/merchants/1/menu/items', mockRequestBody);

    // ✅ Verify transformation
    expect(map.get(1)).toEqual({
      name: 'Chicken Rice',
      available: true,
      priceCents: 550,
    });
    expect(map.get(2)).toEqual({
      name: 'Soup',
      available: true,
      priceCents: 1000,
    });

    expect(map.size).toBe(2);
  });
});

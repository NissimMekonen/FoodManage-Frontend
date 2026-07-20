import { computeWeeklyInventoryNeed, normalizeInventoryCheckResponse } from './inventoryCheck';

// נתוני בסיס לבדיקה 

const guests = {
  sunday: 50, monday: 60, tuesday: 55, wednesday: 50,
  thursday: 65, friday: 70, saturday: 80
};

const dishes = [
  {
    id: 'd1',
    mealType: 'lunch',
    daysOfWeek: ['sunday', 'monday', 'tuesday'],
    ingredients: [
      { name: 'עוף', amount: 0.3, unit: "ק''ג" },
      { name: 'אורז', amount: 0.2, unit: "ק''ג" },
    ],
  },
  {
    id: 'd2',
    mealType: 'dinner',
    daysOfWeek: ['wednesday', 'thursday'],
    ingredients: [
      { name: 'בקר', amount: 0.4, unit: "ק''ג" },
      { name: 'תפוחי אדמה', amount: 0.3, unit: "ק''ג" },
    ],
  },
];

const richInventory = [
  { id: 'p1', name: 'עוף', quantity: 1000 },
  { id: 'p2', name: 'אורז', quantity: 1000 },
  { id: 'p3', name: 'בקר', quantity: 1000 },
  { id: 'p4', name: 'תפוחי אדמה', quantity: 1000 },
];

const poorInventory = [
  { id: 'p1', name: 'עוף', quantity: 1000 },
  { id: 'p2', name: 'אורז', quantity: 1000 },
  { id: 'p3', name: 'בקר', quantity: 5 },    // חסר
  { id: 'p4', name: 'תפוחי אדמה', quantity: 2 }, // חסר
];

// --- computeWeeklyInventoryNeed ---

describe('computeWeeklyInventoryNeed', () => {
  test('מחזיר totalGuestsWeek=0 כשאין סועדים', () => {
    const result = computeWeeklyInventoryNeed({}, dishes, richInventory);
    expect(result.totalGuestsWeek).toBe(0);
    expect(result.isSufficient).toBe(false);
    expect(result.products).toHaveLength(0);
  });

  test('מחזיר dishesCounted=0 כשאין מנות', () => {
    const result = computeWeeklyInventoryNeed(guests, [], richInventory);
    expect(result.dishesCounted).toBe(0);
    expect(result.isSufficient).toBe(false);
  });

  test('מחשב נכון את סך הסועדים השבועי', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, richInventory);
    expect(result.totalGuestsWeek).toBe(430); // 50+60+55+50+65+70+80
  });

  test('מחשב נכון את מספר המנות', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, richInventory);
    expect(result.dishesCounted).toBe(2);
  });

  test('isSufficient=true כשהמלאי מספיק', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, richInventory);
    expect(result.isSufficient).toBe(true);
    expect(result.missingProducts).toHaveLength(0);
  });

  test('isSufficient=false כשיש מוצר חסר', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, poorInventory);
    expect(result.isSufficient).toBe(false);
  });

  test('מזהה נכון מוצרים חסרים', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, poorInventory);
    const beefMissing = result.missingProducts.find(p => p.productName === 'בקר');
    expect(beefMissing).toBeDefined();
    expect(beefMissing.shortage).toBeGreaterThan(0);
  });

  test('מוצרים עם מלאי מספיק לא מסומנים כחסרים', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, poorInventory);
    const chicken = result.products.find(p => p.productName === 'עוף');
    expect(chicken).toBeDefined();
    expect(chicken.isMissing).toBe(false);
  });

  test('מוצרים חסרים מופיעים ראשונים ברשימה', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, poorInventory);
    const firstMissing = result.products.findIndex(p => p.isMissing);
    const firstOk = result.products.findIndex(p => !p.isMissing);
    if (firstMissing !== -1 && firstOk !== -1) {
      expect(firstMissing).toBeLessThan(firstOk);
    }
  });

  test('עובד גם כשרשימת המלאי ריקה', () => {
    const result = computeWeeklyInventoryNeed(guests, dishes, []);
    expect(result.isSufficient).toBe(false);
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.every(p => p.currentStock === 0)).toBe(true);
  });

  test('מטפל נכון בסועדים חלקיים (ימים מסוימים בלבד)', () => {
    const partialGuests = { sunday: 100 };
    const result = computeWeeklyInventoryNeed(partialGuests, dishes, richInventory);
    expect(result.totalGuestsWeek).toBe(100);
  });
});

// --- normalizeInventoryCheckResponse ---

describe('normalizeInventoryCheckResponse', () => {
  test('מחזיר null עבור קלט null', () => {
    expect(normalizeInventoryCheckResponse(null)).toBeNull();
  });

  test('מנרמל תשובת API ב-camelCase', () => {
    const input = {
      isSufficient: true,
      message: 'המלאי מספיק',
      totalGuestsWeek: 300,
      dishesCounted: 5,
      products: [
        {
          productId: '1', productName: 'עוף',
          currentStock: 100, requiredAmount: 50,
          shortage: 0, unit: "ק''ג", isMissing: false
        }
      ],
      missingProducts: []
    };
    const result = normalizeInventoryCheckResponse(input);
    expect(result.isSufficient).toBe(true);
    expect(result.message).toBe('המלאי מספיק');
    expect(result.totalGuestsWeek).toBe(300);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].productName).toBe('עוף');
    expect(result.missingProducts).toHaveLength(0);
  });

  test('מנרמל תשובת API ב-PascalCase', () => {
    const input = {
      IsSufficient: false,
      Message: 'חסר מלאי',
      TotalGuestsWeek: 200,
      DishesCounted: 3,
      Products: [
        {
          ProductId: '2', ProductName: 'בקר',
          CurrentStock: 5, RequiredAmount: 50,
          Shortage: 45, Unit: "ק''ג", IsMissing: true
        }
      ],
      MissingProducts: [
        {
          ProductId: '2', ProductName: 'בקר',
          CurrentStock: 5, RequiredAmount: 50,
          Shortage: 45, Unit: "ק''ג", IsMissing: true
        }
      ]
    };
    const result = normalizeInventoryCheckResponse(input);
    expect(result.isSufficient).toBe(false);
    expect(result.message).toBe('חסר מלאי');
    expect(result.products[0].productName).toBe('בקר');
    expect(result.products[0].currentStock).toBe(5);
    expect(result.missingProducts).toHaveLength(1);
  });

  test('ערכי shortage ו-orderUrgent הם מספרים', () => {
    const input = {
      isSufficient: false,
      products: [
        { productId: '1', productName: 'שמן', currentStock: '2', requiredAmount: '10', shortage: '8', unit: 'ליטר', isMissing: true }
      ],
      missingProducts: []
    };
    const result = normalizeInventoryCheckResponse(input);
    expect(typeof result.products[0].shortage).toBe('number');
    expect(typeof result.products[0].currentStock).toBe('number');
  });
});

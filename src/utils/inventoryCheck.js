/**
 * חישוב צריכת מלאי שבועית לפי צפי סועדים ותפריט.
 *
 * לכל יום ולכל סוג ארוחה (בוקר/צהריים/ערב):
 * מחשבים מתכון ממוצע ממנות הארוחה (הסועד אוכל מנה אחת מתוך האפשרויות),
 * ואז: נדרש += סועדים_ביום × כמות_לסועד.
 */

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

function dishOnDay(dish, day) {
  const days = dish.daysOfWeek || dish.DaysOfWeek;
  if (!days || days.length === 0) return true;
  return days.some(d => String(d).toLowerCase() === day);
}

function findStock(inventory, productId, name) {
  if (productId) {
    const byId = inventory.find(p => String(p.id) === String(productId));
    if (byId) return byId;
  }
  if (!name) return null;
  const n = name.toLowerCase();
  return inventory.find(p =>
    p.name.toLowerCase() === n ||
    p.name.toLowerCase().includes(n) ||
    n.includes(p.name.toLowerCase())
  ) || null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @returns {{
 *   isSufficient: boolean,
 *   message: string,
 *   totalGuestsWeek: number,
 *   dishesCounted: number,
 *   products: Array,
 *   missingProducts: Array
 * }}
 */
export function computeWeeklyInventoryNeed(guests, dishes, inventory = []) {
  const totalGuestsWeek = DAY_KEYS.reduce((s, d) => s + (Number(guests?.[d]) || 0), 0);
  const dishesCounted = Array.isArray(dishes) ? dishes.length : 0;

  if (totalGuestsWeek <= 0) {
    return {
      isSufficient: false,
      message: 'יש להזין צפי סועדים לפחות ליום אחד ואז לבדוק שוב.',
      totalGuestsWeek: 0,
      dishesCounted,
      products: [],
      missingProducts: []
    };
  }

  if (!dishesCounted) {
    return {
      isSufficient: false,
      message: 'אין מנות בתפריט — הוסף מנות עם מרכיבים לפני הבדיקה.',
      totalGuestsWeek,
      dishesCounted: 0,
      products: [],
      missingProducts: []
    };
  }

  // key → { name, productId, unit, required }
  const required = {};

  for (const day of DAY_KEYS) {
    const guestsDay = Number(guests?.[day]) || 0;
    if (guestsDay <= 0) continue;

    for (const meal of MEAL_TYPES) {
      const mealDishes = dishes.filter(
        d => d.mealType === meal && dishOnDay(d, day) && (d.ingredients || []).length > 0
      );
      if (mealDishes.length === 0) continue;

      // ממוצע מרכיבים בין מנות הארוחה = כמות משוערת לסועד בארוחה זו
      const mealAgg = {};
      for (const dish of mealDishes) {
        for (const ing of dish.ingredients || []) {
          const amount = Number(ing.amount);
          if (!amount || amount <= 0) continue;
          const key = ing.productId
            ? `id:${ing.productId}`
            : `name:${(ing.name || '').trim().toLowerCase()}`;
          if (!mealAgg[key]) {
            mealAgg[key] = {
              name: ing.name,
              productId: ing.productId || null,
              unit: ing.unit || '',
              sum: 0
            };
          }
          mealAgg[key].sum += amount;
        }
      }

      for (const row of Object.values(mealAgg)) {
        const perGuest = row.sum / mealDishes.length;
        const need = guestsDay * perGuest;
        const key = row.productId
          ? `id:${row.productId}`
          : `name:${(row.name || '').trim().toLowerCase()}`;

        if (!required[key]) {
          required[key] = {
            name: row.name,
            productId: row.productId,
            unit: row.unit,
            required: 0
          };
        }
        required[key].required += need;
        if (!required[key].unit && row.unit) required[key].unit = row.unit;
        if (row.name) required[key].name = row.name;
      }
    }
  }

  const products = Object.values(required).map(row => {
    const stockItem = findStock(inventory, row.productId, row.name);
    const currentStock = stockItem ? Number(stockItem.quantity) || 0 : 0;
    const requiredAmount = round2(row.required);
    const shortage = round2(Math.max(0, requiredAmount - currentStock));
    const orderUrgent = shortage > 0 ? round2(Math.ceil(shortage * 100) / 100) : 0;

    return {
      productId: stockItem?.id || row.productId || null,
      productName: stockItem?.name || row.name || 'לא ידוע',
      currentStock: round2(currentStock),
      requiredAmount,
      shortage,
      orderUrgent,
      unit: row.unit || stockItem?.unit || '',
      isMissing: shortage > 0.001,
      inInventory: !!stockItem
    };
  }).sort((a, b) => {
    if (a.isMissing !== b.isMissing) return a.isMissing ? -1 : 1;
    return b.shortage - a.shortage;
  });

  const missingProducts = products.filter(p => p.isMissing);
  const isSufficient = missingProducts.length === 0 && products.length > 0;

  let message;
  if (products.length === 0) {
    message = 'לא נמצאו מרכיבים מקושרים במנות — עדכן מרכיבים עם כמויות לסועד.';
  } else if (isSufficient) {
    message = 'המלאי מספיק לכל השבוע לפי צפי הסועדים והתפריט!';
  } else {
    message = `יש פיגור ב־${missingProducts.length} מוצרים — חובה להזמין אותם לפני תחילת השבוע.`;
  }

  return {
    isSufficient,
    message,
    totalGuestsWeek,
    dishesCounted,
    products,
    missingProducts
  };
}

/** מנרמל תשובת API (PascalCase / camelCase) למבנה אחיד */
export function normalizeInventoryCheckResponse(data) {
  if (!data) return null;
  const products = (data.products || data.Products || []).map(p => ({
    productId: p.productId ?? p.ProductId ?? null,
    productName: p.productName ?? p.ProductName ?? '',
    currentStock: Number(p.currentStock ?? p.CurrentStock ?? 0),
    requiredAmount: Number(p.requiredAmount ?? p.RequiredAmount ?? 0),
    shortage: Number(p.shortage ?? p.Shortage ?? 0),
    orderUrgent: Number(p.shortage ?? p.Shortage ?? 0),
    unit: p.unit ?? p.Unit ?? '',
    isMissing: !!(p.isMissing ?? p.IsMissing),
    inInventory: true
  }));
  const missingProducts = (data.missingProducts || data.MissingProducts || products.filter(p => p.isMissing))
    .map(p => ({
      productId: p.productId ?? p.ProductId ?? null,
      productName: p.productName ?? p.ProductName ?? '',
      currentStock: Number(p.currentStock ?? p.CurrentStock ?? 0),
      requiredAmount: Number(p.requiredAmount ?? p.RequiredAmount ?? 0),
      shortage: Number(p.shortage ?? p.Shortage ?? 0),
      orderUrgent: Number(p.shortage ?? p.Shortage ?? 0),
      unit: p.unit ?? p.Unit ?? '',
      isMissing: true
    }));

  const isSufficient = !!(data.isSufficient ?? data.IsSufficient);
  return {
    isSufficient,
    message: data.message ?? data.Message ?? '',
    totalGuestsWeek: data.totalGuestsWeek ?? data.TotalGuestsWeek ?? 0,
    dishesCounted: data.dishesCounted ?? data.DishesCounted ?? 0,
    products,
    missingProducts
  };
}

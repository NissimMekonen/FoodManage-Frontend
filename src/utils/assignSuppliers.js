/**
 * התאמת ספק למוצר לפי קטגוריה — לפי מילות מפתח בשם הספק.
 * למשל: dairy → "מחלבות תנובה", meat → "בשרי האחים"
 */
const CATEGORY_KEYWORDS = {
  dairy:  ['תנובה', 'חלב', 'מחלבות', 'גבינ', 'dairy'],
  meat:   ['בשר', 'עוף', 'דג', 'אחים', 'meat'],
  dry:    ['יבש', 'יבשים', 'dry'],
  veg:    ['ירק', 'פירות', 'שוק', 'veg'],
  drinks: ['משקאות', 'שתייה', 'שתיה', 'drinks', 'משקה'],
  other:  ['כללי', 'מטבח', 'general'],
};

/** מוצא ספק מתאים לקטגוריה מתוך רשימת הספקים */
export function findSupplierForCategory(suppliers, category) {
  if (!suppliers?.length) return null;
  const keywords = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.other;

  const match = suppliers.find(s => {
    const name = (s.name || '').toLowerCase();
    return keywords.some(kw => name.includes(kw.toLowerCase()));
  });

  if (match) return match;

  // גיבוי: ספק "כללי" אם קיים
  const general = suppliers.find(s =>
    /כללי|מטבח|general/i.test(s.name || '')
  );
  return general || null;
}

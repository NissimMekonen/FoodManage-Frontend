import { findSupplierForCategory } from './assignSuppliers';

const suppliers = [
  { id: '1', name: 'מחלבות תנובה' },
  { id: '2', name: 'בשרי האחים' },
  { id: '3', name: 'ירקות השוק' },
  { id: '4', name: 'ספק כללי למטבח' },
  { id: '5', name: 'משקאות פז' },
  { id: '6', name: 'מוצרי יבשים' },
];

describe('findSupplierForCategory', () => {
  test('מוצא ספק מתאים לקטגוריית dairy', () => {
    const result = findSupplierForCategory(suppliers, 'dairy');
    expect(result).not.toBeNull();
    expect(result.id).toBe('1');
  });

  test('מוצא ספק מתאים לקטגוריית meat', () => {
    const result = findSupplierForCategory(suppliers, 'meat');
    expect(result).not.toBeNull();
    expect(result.id).toBe('2');
  });

  test('מוצא ספק מתאים לקטגוריית veg', () => {
    const result = findSupplierForCategory(suppliers, 'veg');
    expect(result).not.toBeNull();
    expect(result.id).toBe('3');
  });

  test('מוצא ספק מתאים לקטגוריית drinks', () => {
    const result = findSupplierForCategory(suppliers, 'drinks');
    expect(result).not.toBeNull();
    expect(result.id).toBe('5');
  });

  test('מוצא ספק מתאים לקטגוריית dry', () => {
    const result = findSupplierForCategory(suppliers, 'dry');
    expect(result).not.toBeNull();
    expect(result.id).toBe('6');
  });

  test('חוזר לספק כללי כשאין התאמה מדויקת', () => {
    const result = findSupplierForCategory(suppliers, 'other');
    expect(result).not.toBeNull();
    expect(result.id).toBe('4');
  });

  test('מחזיר null כשרשימת הספקים ריקה', () => {
    expect(findSupplierForCategory([], 'dairy')).toBeNull();
  });

  test('מחזיר null כשרשימת הספקים null', () => {
    expect(findSupplierForCategory(null, 'dairy')).toBeNull();
  });

  test('מחזיר null כשאין ספק מתאים ואין ספק כללי', () => {
    const limited = [
      { id: '1', name: 'מחלבות תנובה' },
      { id: '2', name: 'בשרי האחים' },
    ];
    expect(findSupplierForCategory(limited, 'drinks')).toBeNull();
  });

  test('השוואה לא תלוית רישיות', () => {
    const mixedCase = [{ id: '10', name: 'Dairy Products' }];
    const result = findSupplierForCategory(mixedCase, 'dairy');
    expect(result).not.toBeNull();
    expect(result.id).toBe('10');
  });
});

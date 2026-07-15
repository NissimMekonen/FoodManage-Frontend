import React, { useState, useEffect } from 'react';
import './styles/menu.css';
import { getDishes, createDish, updateDish, deleteDish, getWeeklySurvival, suggestReplacement, getExpectedGuests, saveExpectedGuests, checkMenuInventory } from '../api';
import { computeWeeklyInventoryNeed, normalizeInventoryCheckResponse } from '../utils/inventoryCheck';
import ConfirmModal from './ConfirmModal';

const MEALS = [
  { key: 'breakfast', label: 'ארוחת בוקר',   icon: 'bi-sunrise-fill',   cssClass: 'meal-breakfast' },
  { key: 'lunch',     label: 'ארוחת צהריים', icon: 'bi-sun-fill',        cssClass: 'meal-lunch'     },
  { key: 'dinner',    label: 'ארוחת ערב',    icon: 'bi-moon-stars-fill', cssClass: 'meal-dinner'    },
];

const WEEK_DAYS = [
  { key: 'sunday',    label: 'א׳', full: 'ראשון' },
  { key: 'monday',    label: 'ב׳', full: 'שני' },
  { key: 'tuesday',   label: 'ג׳', full: 'שלישי' },
  { key: 'wednesday', label: 'ד׳', full: 'רביעי' },
  { key: 'thursday',  label: 'ה׳', full: 'חמישי' },
  { key: 'friday',    label: 'ו׳', full: 'שישי' },
  { key: 'saturday',  label: 'ש׳', full: 'שבת' },
];

const EMPTY_GUESTS = {
  sunday: 0, monday: 0, tuesday: 0, wednesday: 0,
  thursday: 0, friday: 0, saturday: 0
};

const UNITS = ["ק\"ג", 'גרם', 'ליטר', "מ\"ל", "יח'", 'כוס', 'כף', 'כפית'];
const EMPTY_FORM = { name: '', ingredients: [], recipe: [] };
const STATUS_ICON = { ok: '✅', low: '⚠️', out: '❌', unknown: '❓' };

function WeeklyMenu({ inventory = [], isAdmin, showToast }) {
  const [dishes, setDishes]             = useState([]);
  const [showSurvival, setShowSurvival] = useState(false);
  const [survivalData, setSurvivalData] = useState(null);
  const [loadingSurvival, setLoadingSurvival] = useState(false);
  const [dishModal, setDishModal] = useState(null);
  const [replacements, setReplacements] = useState({});
  const [loadingRepl, setLoadingRepl]   = useState({});
  const [showForm, setShowForm]         = useState(false);
  const [formMeal, setFormMeal]         = useState('');
  const [editingDish, setEditingDish]   = useState(null);
  const [dishForm, setDishForm]         = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [guests, setGuests] = useState(EMPTY_GUESTS);
  const [savingGuests, setSavingGuests] = useState(false);
  const [showInvCheck, setShowInvCheck] = useState(false);
  const [invCheckData, setInvCheckData] = useState(null);
  const [loadingInvCheck, setLoadingInvCheck] = useState(false);

  useEffect(() => {
    loadDishes();
    loadGuests();
  }, []);

  const loadDishes = async () => {
    try { setDishes(await getDishes()); } catch {}
  };

  const loadGuests = async () => {
    try {
      const data = await getExpectedGuests();
      setGuests({ ...EMPTY_GUESTS, ...data });
    } catch {}
  };

  const handleGuestChange = (dayKey, value) => {
    const n = parseInt(value, 10);
    setGuests(prev => ({ ...prev, [dayKey]: isNaN(n) || n < 0 ? 0 : n }));
  };

  const handleSaveGuests = async () => {
    if (!isAdmin) return;
    setSavingGuests(true);
    try {
      const saved = await saveExpectedGuests(guests);
      setGuests({ ...EMPTY_GUESTS, ...saved });
      showToast?.('צפי הסועדים נשמר בהצלחה', 'success');
    } catch {
      showToast?.('שגיאה בשמירת צפי הסועדים', 'error');
    } finally {
      setSavingGuests(false);
    }
  };

  const handleInventoryCheck = async () => {
    setShowInvCheck(true);
    setLoadingInvCheck(true);
    setInvCheckData(null);

    const totalGuests = WEEK_DAYS.reduce((s, d) => s + (Number(guests[d.key]) || 0), 0);
    if (totalGuests <= 0) {
      setInvCheckData({
        isSufficient: false,
        message: 'יש להזין צפי סועדים לפחות ליום אחד ואז לבדוק שוב.',
        totalGuestsWeek: 0,
        dishesCounted: dishes.length,
        products: [],
        missingProducts: []
      });
      setLoadingInvCheck(false);
      showToast?.('הזן קודם צפי סועדים לימים בשבוע', 'error');
      return;
    }

    // שמירה ברקע אם אפשר — לא חוסם את החישוב
    if (isAdmin) {
      saveExpectedGuests(guests).catch(() => {});
    }

    // חישוב מקומי תמיד (עובד גם בלי Backend)
    const localResult = computeWeeklyInventoryNeed(guests, dishes, inventory);

    try {
      const apiRaw = await checkMenuInventory();
      const apiResult = normalizeInventoryCheckResponse(apiRaw);
      // אם ה־API החזיר תוצאה עם מוצרים — נשתמש בו; אחרת מקומי
      if (apiResult && (apiResult.products?.length > 0 || apiResult.totalGuestsWeek > 0)) {
        // השלם orderUrgent אם חסר
        const withOrder = {
          ...apiResult,
          products: (apiResult.products || []).map(p => ({
            ...p,
            orderUrgent: p.orderUrgent ?? p.shortage ?? 0
          })),
          missingProducts: (apiResult.missingProducts || []).map(p => ({
            ...p,
            orderUrgent: p.orderUrgent ?? p.shortage ?? 0
          }))
        };
        setInvCheckData(withOrder.products.length ? withOrder : localResult);
      } else {
        setInvCheckData(localResult);
      }
    } catch (err) {
      console.warn('check-inventory API failed, using local calc', err);
      setInvCheckData(localResult);
    } finally {
      setLoadingInvCheck(false);
    }
  };

  const getStatus = (ing) => {
    const match = ing.productId
      ? inventory.find(p => String(p.id) === String(ing.productId))
      : inventory.find(p =>
          p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(p.name.toLowerCase())
        );
    if (!match) return 'unknown';
    if (match.quantity === 0) return 'out';
    if (match.quantity <= match.minQuantity) return 'low';
    return 'ok';
  };

  const handleSuggestReplacement = async (ing) => {
    const key = ing.name;
    if (replacements[key] !== undefined) {
      setReplacements(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    setLoadingRepl(prev => ({ ...prev, [key]: true }));
    try {
      const result = await suggestReplacement(ing.name, '');
      setReplacements(prev => ({ ...prev, [key]: result.alternatives || [] }));
    } catch {
      setReplacements(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoadingRepl(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSurvivalCheck = async () => {
    setShowSurvival(true);
    setLoadingSurvival(true);
    try { setSurvivalData(await getWeeklySurvival()); } catch {} finally { setLoadingSurvival(false); }
  };

  const openAdd = (mealKey) => {
    setEditingDish(null);
    setDishForm(EMPTY_FORM);
    setFormMeal(mealKey);
    setShowForm(true);
  };

  const openEdit = (dish, e) => {
    e.stopPropagation();
    setEditingDish(dish);
    setDishForm({ name: dish.name, ingredients: dish.ingredients.map(i => ({ ...i })), recipe: [...(dish.recipe || [])] });
    setFormMeal(dish.mealType);
    setShowForm(true);
  };

  const handleDelete = (dish, e) => {
    e.stopPropagation();
    setConfirm({
      open: true,
      title: 'מחיקת מנה',
      message: `האם למחוק את "${dish.name}" מהתפריט?`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        try {
          await deleteDish(dish.id);
          setDishes(prev => prev.filter(d => d.id !== dish.id));
          if (dishModal?.id === dish.id) setDishModal(null);
        } catch {}
      }
    });
  };

  const addIngRow = () =>
    setDishForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: '', amount: '', unit: "ק\"ג", productId: null }] }));

  const updIng = (i, field, value) =>
    setDishForm(prev => {
      const ings = [...prev.ingredients];
      ings[i] = { ...ings[i], [field]: value };
      return { ...prev, ingredients: ings };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      name: dishForm.name,
      mealType: formMeal,
      recipe: dishForm.recipe.filter(s => s.trim()),
      ingredients: dishForm.ingredients.filter(i => i.name.trim()).map(i => ({
        ...i, amount: parseFloat(i.amount) || 0, productId: i.productId || null
      }))
    };
    try {
      if (editingDish) {
        await updateDish(editingDish.id, payload);
        setDishes(prev => prev.map(d => d.id === editingDish.id ? { ...d, ...payload, id: editingDish.id } : d));
      } else {
        const newDish = await createDish(payload);
        setDishes(prev => [...prev, newDish]);
      }
      setShowForm(false);
    } catch {} finally { setIsSubmitting(false); }
  };

  return (
    <div className="weekly-menu animate-fade-in">

      {/* כותרת */}
      <div className="wm-header">
        <h2 className="wm-title">תפריט המטבח 🍽️</h2>
        <div className="wm-header-actions">
          <button className="inventory-check-btn" onClick={handleInventoryCheck}>
            <i className="bi bi-box-seam"></i> בדוק זמינות מלאי
          </button>
          <button className="survival-btn" onClick={handleSurvivalCheck}>
            <i className="bi bi-shield-check"></i> נשרוד את השבוע?
          </button>
        </div>
      </div>

      {/* צפי סועדים לשבוע */}
      <section className="guests-forecast-panel">
        <div className="guests-forecast-header">
          <div>
            <h3><i className="bi bi-people-fill"></i> צפי סועדים שבועי</h3>
            <p>הזן כמה סועדים צפויים בכל יום — החישוב מול המלאי יתבסס על כמות לסועד בכל מנה</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              className="guests-save-btn"
              onClick={handleSaveGuests}
              disabled={savingGuests}
            >
              {savingGuests ? 'שומר...' : 'שמור צפי'}
            </button>
          )}
        </div>
        <div className="guests-days-grid">
          {WEEK_DAYS.map(day => (
            <div key={day.key} className="guests-day-cell">
              <label title={day.full}>
                <span className="guests-day-label">{day.label}</span>
                <span className="guests-day-full">{day.full}</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={guests[day.key] ?? 0}
                onChange={e => handleGuestChange(day.key, e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          ))}
        </div>
        <div className="guests-total">
          סה״כ סועדים בשבוע:{' '}
          <strong>{WEEK_DAYS.reduce((sum, d) => sum + (Number(guests[d.key]) || 0), 0)}</strong>
        </div>
      </section>

      {/* 3 עמודות */}
      <div className="wm-columns">
        {MEALS.map(meal => {
          const mealDishes = dishes.filter(d => d.mealType === meal.key);
          return (
            <div key={meal.key} className={`wm-column ${meal.cssClass}`}>
              {/* כותרת עמודה */}
              <div className="wm-col-header">
                <span className="wm-col-title">
                  <i className={`bi ${meal.icon}`}></i> {meal.label}
                </span>
                <span className="wm-col-count">{mealDishes.length} מנות</span>
              </div>

              {/* רשימת מנות */}
              <div className="wm-col-body">
                {mealDishes.length === 0 && (
                  <div className="wm-empty">אין מנות עדיין</div>
                )}

                {mealDishes.map(dish => (
                  <div key={dish.id} className="wm-dish-card">
                    <div className="wm-dish-card-header" onClick={() => { setDishModal(dish); setReplacements({}); }}>
                      <span className="wm-dish-card-name">
                        <i className="bi bi-star-fill"></i>{dish.name}
                      </span>
                      <div className="wm-dish-card-actions">
                        {isAdmin && (
                          <>
                            <button className="wm-icon-btn" onClick={(e) => openEdit(dish, e)} title="עריכה"><i className="bi bi-pencil"></i></button>
                            <button className="wm-icon-btn" onClick={(e) => handleDelete(dish, e)} title="מחיקה"><i className="bi bi-trash3"></i></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <button className="wm-add-dish-btn" onClick={() => openAdd(meal.key)}>
                    <i className="bi bi-plus-lg"></i> הוסף מנה
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* מודאל טופס מנה */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDish ? 'עריכת מנה' : `הוספת מנה — ${MEALS.find(m => m.key === formMeal)?.label}`}</h3>
              <button className="wm-close-btn" onClick={() => setShowForm(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם המנה *</label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={e => setDishForm(p => ({ ...p, name: e.target.value }))}
                  placeholder='למשל: שניצל עם אורז'
                  required
                />
              </div>
              <div className="form-group">
                <label>מרכיבים <span className="form-hint">(כמות לסועד בודד)</span></label>
                {dishForm.ingredients.map((ing, i) => (
                  <div key={i} className="ing-form-row">
                    <select
                      value={ing.productId || ''}
                      onChange={e => {
                        const p = inventory.find(p => String(p.id) === e.target.value);
                        updIng(i, 'productId', e.target.value || null);
                        if (p) updIng(i, 'name', p.name);
                      }}
                    >
                      <option value="">ממלאי (אופציונלי)</option>
                      {inventory.map(p => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                    <input type="text" value={ing.name} onChange={e => updIng(i, 'name', e.target.value)} placeholder="שם מרכיב" />
                    <input type="number" value={ing.amount} onChange={e => updIng(i, 'amount', e.target.value)} placeholder="לסועד" min="0" step="any" title="כמות לסועד" />
                    <select value={ing.unit} onChange={e => updIng(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <button type="button" className="ing-remove-btn" onClick={() =>
                      setDishForm(p => ({ ...p, ingredients: p.ingredients.filter((_, idx) => idx !== i) }))
                    }>✕</button>
                  </div>
                ))}
                <button type="button" className="add-ing-btn" onClick={addIngRow}><i className="bi bi-plus-lg"></i> הוסף מרכיב</button>
              </div>

              <div className="form-group">
                <label>אופן הכנה (שלבים)</label>
                {dishForm.recipe.map((step, i) => (
                  <div key={i} className="ing-form-row">
                    <input
                      type="text"
                      value={step}
                      onChange={e => setDishForm(p => { const r = [...p.recipe]; r[i] = e.target.value; return { ...p, recipe: r }; })}
                      placeholder={`שלב ${i + 1}`}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="ing-remove-btn" onClick={() =>
                      setDishForm(p => ({ ...p, recipe: p.recipe.filter((_, idx) => idx !== i) }))
                    }>✕</button>
                  </div>
                ))}
                <button type="button" className="add-ing-btn" onClick={() =>
                  setDishForm(p => ({ ...p, recipe: [...p.recipe, ''] }))
                }><i className="bi bi-plus-lg"></i> הוסף שלב</button>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'שומר...' : editingDish ? 'עדכן מנה' : 'הוסף מנה'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* מודאל פרטי מנה */}
      {dishModal && (
        <div className="modal-overlay" onClick={() => { setDishModal(null); setReplacements({}); }}>
          <div className="modal-box modal-dish-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-star-fill"></i> {dishModal.name}</h3>
              <button className="wm-close-btn" onClick={() => { setDishModal(null); setReplacements({}); }}><i className="bi bi-x-lg"></i></button>
            </div>

            {/* מרכיבים */}
            {dishModal.ingredients?.length > 0 && (
              <div className="wm-detail-section">
                <div className="wm-detail-title"><i className="bi bi-basket2-fill"></i> מרכיבים</div>
                <div className="wm-detail-ings">
                  {dishModal.ingredients.map((ing, i) => {
                    const status = getStatus(ing);
                    const hasIssue = status === 'out' || status === 'low';
                    const replList = replacements[ing.name];
                    return (
                      <div key={i} className={`wm-ing wm-ing-${status}`}>
                        <span className="wm-ing-icon">{STATUS_ICON[status]}</span>
                        <span className="wm-ing-name">{ing.name}</span>
                        <span className="wm-ing-amount">{ing.amount} {ing.unit}</span>
                        {hasIssue && (
                          <button
                            className="wm-repl-btn"
                            onClick={() => handleSuggestReplacement(ing)}
                            disabled={loadingRepl[ing.name]}
                          >
                            {loadingRepl[ing.name] ? '...' : replList !== undefined ? 'סגור' : '💡 תחליף'}
                          </button>
                        )}
                        {replList !== undefined && (
                          <div className="wm-repl-list">
                            {replList.length === 0
                              ? <span className="wm-repl-none">לא נמצאו תחליפים זמינים</span>
                              : replList.map((alt, j) => (
                                <div key={j} className="wm-repl-item">
                                  <span className="wm-repl-name">{alt.name}</span>
                                  <span className="wm-repl-qty">במלאי: {alt.quantity}</span>
                                  <span className="wm-repl-score">{Math.min(alt.matchScore || 0, 100)}% התאמה</span>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* אופן הכנה */}
            {dishModal.recipe?.length > 0 && (
              <div className="wm-detail-section">
                <div className="wm-detail-title"><i className="bi bi-journal-text"></i> אופן הכנה</div>
                <div className="wm-recipe-steps">
                  {dishModal.recipe.map((step, i) => (
                    <div key={i} className="wm-recipe-step">
                      <span className="wm-step-num">{i + 1}</span>
                      <p className="wm-step-text">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!dishModal.ingredients?.length && !dishModal.recipe?.length && (
              <div className="wm-empty">אין פרטים רשומים למנה זו</div>
            )}
          </div>
        </div>
      )}

      {/* מודאל בדיקת זמינות מלאי לפי צפי סועדים */}
      {showInvCheck && (
        <div className="modal-overlay" onClick={() => setShowInvCheck(false)}>
          <div className="modal-box modal-inventory-check" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-box-seam"></i> בדיקת זמינות מלאי לשבוע</h3>
              <button className="wm-close-btn" onClick={() => setShowInvCheck(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            {loadingInvCheck ? (
              <div className="wm-loading">מחשב צריכה מול מלאי...</div>
            ) : invCheckData ? (
              <div>
                <div className={`inv-check-verdict ${invCheckData.isSufficient ? 'inv-ok' : 'inv-critical'}`}>
                  {invCheckData.isSufficient ? '✅' : '🚨'} {invCheckData.message}
                </div>
                <div className="survival-stats">
                  <div className="survival-stat"><span>סועדים בשבוע</span><strong>{invCheckData.totalGuestsWeek}</strong></div>
                  <div className="survival-stat"><span>מנות בתפריט</span><strong>{invCheckData.dishesCounted}</strong></div>
                  <div className="survival-stat"><span>מוצרים בפיגור</span><strong>{invCheckData.missingProducts?.length || 0}</strong></div>
                </div>

                {invCheckData.missingProducts?.length > 0 && (
                  <div className="inv-check-table-wrap">
                    <h4 className="inv-check-subtitle">🚨 חובה להזמין דחוף</h4>
                    <p className="inv-check-explain">
                      לפי צפי הסועדים והמרכיבים במנות — אלה המוצרים שאין מספיק מהם במלאי עד סוף השבוע:
                    </p>
                    <table className="inv-check-table">
                      <thead>
                        <tr>
                          <th>מוצר</th>
                          <th>במלאי כעת</th>
                          <th>נדרש לשבוע</th>
                          <th>חוסר</th>
                          <th>להזמין דחוף</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invCheckData.missingProducts.map((p, i) => (
                          <tr key={i} className="inv-row-missing">
                            <td><strong>{p.productName}</strong></td>
                            <td>{p.currentStock} {p.unit}</td>
                            <td>{p.requiredAmount} {p.unit}</td>
                            <td className="inv-shortage">{p.shortage} {p.unit}</td>
                            <td>
                              <span className="inv-order-badge">
                                {p.orderUrgent ?? p.shortage} {p.unit}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {invCheckData.isSufficient && invCheckData.products?.length > 0 && (
                  <div className="inv-check-ok-box">
                    כל חומרי הגלם הדרושים לתפריט השבועי קיימים במלאי לפי הצפי שהוזן.
                  </div>
                )}

                {invCheckData.products?.length > 0 && (
                  <details className="inv-check-all">
                    <summary>פירוט מלא של כל המוצרים בחישוב ({invCheckData.products.length})</summary>
                    <div className="inv-check-table-wrap">
                      <table className="inv-check-table">
                        <thead>
                          <tr>
                            <th>מוצר</th>
                            <th>במלאי</th>
                            <th>נדרש</th>
                            <th>סטטוס</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invCheckData.products.map((p, i) => (
                            <tr key={i} className={p.isMissing ? 'inv-row-missing' : 'inv-row-ok'}>
                              <td>{p.productName}</td>
                              <td>{p.currentStock} {p.unit}</td>
                              <td>{p.requiredAmount} {p.unit}</td>
                              <td>{p.isMissing ? `חסר ${p.shortage} — להזמין` : 'מספיק ✓'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div className="wm-empty">לא התקבלו נתונים לבדיקה</div>
            )}
          </div>
        </div>
      )}

      {/* מודאל נשרוד את השבוע */}
      {showSurvival && (
        <div className="modal-overlay" onClick={() => setShowSurvival(false)}>
          <div className="modal-box modal-survival" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="bi bi-shield-check"></i> בדיקת שרידות שבועית</h3>
              <button className="wm-close-btn" onClick={() => setShowSurvival(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            {loadingSurvival ? (
              <div className="wm-loading">בודק מלאי...</div>
            ) : survivalData ? (
              <div>
                <div className={`survival-verdict ${survivalData.canSurvive ? 'survival-ok' : 'survival-critical'}`}>
                  {survivalData.message}
                </div>
                <div className="survival-stats">
                  <div className="survival-stat"><span>סה"כ מוצרים</span><strong>{survivalData.totalProducts}</strong></div>
                  <div className="survival-stat"><span>עומדים לפוג</span><strong>{survivalData.expiringProducts}</strong></div>
                  <div className="survival-stat"><span>מלאי נמוך</span><strong>{survivalData.lowStockProducts}</strong></div>
                </div>
                {survivalData.issues?.length > 0 && (
                  <div className="survival-issues">
                    {survivalData.issues.map((issue, i) => (
                      <div key={i} className={`survival-issue survival-issue-${issue.severity?.toLowerCase()}`}>
                        <span className="si-name">{issue.productName}</span>
                        <span className="si-desc">{issue.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}

export default WeeklyMenu;

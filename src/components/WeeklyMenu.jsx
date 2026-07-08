import React, { useState, useEffect } from 'react';
import './styles/menu.css';
import { getDishes, createDish, updateDish, deleteDish, getWeeklySurvival, suggestReplacement } from '../api';
import ConfirmModal from './ConfirmModal';

const MEALS = [
  { key: 'breakfast', label: 'ארוחת בוקר',   icon: 'bi-sunrise-fill',   cssClass: 'meal-breakfast' },
  { key: 'lunch',     label: 'ארוחת צהריים', icon: 'bi-sun-fill',        cssClass: 'meal-lunch'     },
  { key: 'dinner',    label: 'ארוחת ערב',    icon: 'bi-moon-stars-fill', cssClass: 'meal-dinner'    },
];

const UNITS = ["ק\"ג", 'גרם', 'ליטר', "מ\"ל", "יח'", 'כוס', 'כף', 'כפית'];
const EMPTY_FORM = { name: '', ingredients: [], recipe: [] };
const STATUS_ICON = { ok: '✅', low: '⚠️', out: '❌', unknown: '❓' };

function WeeklyMenu({ inventory = [], isAdmin }) {
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

  useEffect(() => { loadDishes(); }, []);

  const loadDishes = async () => {
    try { setDishes(await getDishes()); } catch {}
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
        <button className="survival-btn" onClick={handleSurvivalCheck}>
          <i className="bi bi-shield-check"></i> נשרוד את השבוע?
        </button>
      </div>

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
                <label>מרכיבים</label>
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
                    <input type="number" value={ing.amount} onChange={e => updIng(i, 'amount', e.target.value)} placeholder="כמות" min="0" step="any" />
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

import { useMemo, useState } from "react";
import {
  Wallet, Plus, Trash2, Pencil, Download, TrendingUp, CalendarDays,
  Tags, X, LayoutDashboard, ReceiptText, ChevronDown
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import useLocalStorage from "./hooks/useLocalStorage";

const starterCategories = [
  { id: "food", name: "Food", color: "#f59e0b" },
  { id: "transport", name: "Transport", color: "#3b82f6" },
  { id: "bills", name: "Bills", color: "#8b5cf6" },
  { id: "shopping", name: "Shopping", color: "#ec4899" },
  { id: "entertainment", name: "Entertainment", color: "#14b8a6" },
  { id: "other", name: "Other", color: "#64748b" }
];
const money = n => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(n || 0));
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const monthKey = date => date.slice(0, 7);
const monthLabel = key => new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
const createId = () => globalThis.crypto?.randomUUID
  ? globalThis.crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function monthBefore(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthDayCount(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function App() {
  const [expenses, setExpenses] = useLocalStorage("expense-tracker-expenses", []);
  const [categories, setCategories] = useLocalStorage("expense-tracker-categories", starterCategories);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(today()));
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ amount: "", category: starterCategories[0].id, date: today(), note: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#0f9f83" });
  const [categoryEditing, setCategoryEditing] = useState(null);

  const monthExpenses = useMemo(
    () => expenses.filter(e => monthKey(e.date) === selectedMonth),
    [expenses, selectedMonth]
  );
  const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const previousKey = monthBefore(selectedMonth);
  const previousTotal = expenses.filter(e => monthKey(e.date) === previousKey)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const change = previousTotal ? ((total - previousTotal) / previousTotal) * 100 : null;
  const currentMonthKey = monthKey(today());
  const averageDays = selectedMonth === currentMonthKey
    ? new Date().getDate()
    : monthDayCount(selectedMonth);

  const categoryData = categories.map(c => ({
    name: c.name,
    value: monthExpenses.filter(e => e.category === c.id).reduce((s, e) => s + Number(e.amount), 0),
    color: c.color
  })).filter(c => c.value > 0);

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(`${selectedMonth}-01T00:00:00`);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amount = expenses.filter(e => monthKey(e.date) === key)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { month: monthLabel(key), amount };
  });

  const sortedExpenses = [...monthExpenses].sort((a, b) => b.date.localeCompare(a.date));
  const categoryName = id => categories.find(c => c.id === id)?.name || "Deleted category";
  const categoryColor = id => categories.find(c => c.id === id)?.color || "#94a3b8";

  function openAdd() {
    setEditing(null);
    setForm({ amount: "", category: categories[0]?.id || "", date: today(), note: "" });
    setShowForm(true);
  }
  function openEdit(expense) {
    setEditing(expense.id);
    setForm({ amount: String(expense.amount), category: expense.category, date: expense.date, note: expense.note || "" });
    setShowForm(true);
  }
  function saveExpense(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return alert("Enter an amount greater than zero.");
    if (!form.category) return alert("Please choose a category.");
    if (!form.date) return alert("Please choose a date.");
    if (form.note.length > 120) return alert("Note must be 120 characters or fewer.");
    if (editing) {
      setExpenses(expenses.map(e => e.id === editing ? { ...e, ...form, amount } : e));
    } else {
      setExpenses([...expenses, { id: createId(), ...form, amount }]);
    }
    setShowForm(false);
  }
  function deleteExpense(id) {
    if (window.confirm("Delete this expense?")) setExpenses(expenses.filter(e => e.id !== id));
  }
  function saveCategory(event) {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) return alert("Enter a category name.");
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== categoryEditing))
      return alert("A category with this name already exists.");
    if (categoryEditing) {
      setCategories(categories.map(c => c.id === categoryEditing ? { ...c, name, color: categoryForm.color } : c));
    } else {
      setCategories([...categories, { id: createId(), name, color: categoryForm.color }]);
    }
    setCategoryForm({ name: "", color: "#0f9f83" });
    setCategoryEditing(null);
  }
  function editCategory(category) {
    setCategoryEditing(category.id);
    setCategoryForm({ name: category.name, color: category.color });
  }
  function deleteCategory(id) {
    if (expenses.some(e => e.category === id)) {
      alert("This category is in use. Reassign or delete its expenses before deleting it.");
      return;
    }
    if (window.confirm("Delete this category?")) setCategories(categories.filter(c => c.id !== id));
  }
  function exportCSV() {
    const rows = [["Date", "Amount (INR)", "Category", "Note"],
      ...expenses.slice().sort((a, b) => a.date.localeCompare(b.date))
        .map(e => [e.date, e.amount, categoryName(e.category), e.note || ""])];
    const csv = rows.map(row => row.map(value => {
      let text = String(value);
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><Wallet size={21}/></span><span>SpendWise</span></div>
      <div className="side-label">WORKSPACE</div>
      <button className="side-link active"><LayoutDashboard size={18}/> Overview</button>
      <button className="side-link" onClick={() => setShowCategories(true)}><Tags size={18}/> Categories</button>

    </aside>

    <main className="main-content">
      <header className="topbar">
        <div><div className="eyebrow">PERSONAL FINANCE</div><h1>Expense overview</h1><p className="subtitle">Keep track of where your money goes.</p></div>
        <div className="top-actions">
          <button className="button button-light" onClick={exportCSV}><Download size={17}/> Export CSV</button>
          <button className="button button-primary" onClick={openAdd}><Plus size={18}/> Add expense</button>
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card total-card"><div className="summary-top"><span>Total spent this month</span><span className="summary-icon"><Wallet size={19}/></span></div><div className="big-number">{money(total)}</div><div className="summary-foot">{change === null ? "No previous month data" : <><span className={change <= 0 ? "positive" : "negative"}>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span> vs last month</>}</div></div>
        <div className="summary-card"><div className="summary-top"><span>Number of expenses</span><span className="summary-icon blue"><ReceiptText size={19}/></span></div><div className="big-number">{monthExpenses.length}</div><div className="summary-foot">Recorded this month</div></div>
        <div className="summary-card"><div className="summary-top"><span>Daily average</span><span className="summary-icon purple"><TrendingUp size={19}/></span></div><div className="big-number">{money(total / Math.max(1, averageDays))}</div><div className="summary-foot">{selectedMonth === currentMonthKey ? "Based on days elapsed" : "Based on calendar days"}</div></div>
      </section>

      <section className="section-heading"><div><h2>Spending activity</h2><p>Review your monthly spending patterns.</p></div><label className="month-picker"><CalendarDays size={17}/><input type="month" value={selectedMonth} onChange={e => e.target.value && setSelectedMonth(e.target.value)}/></label></section>

      <section className="charts-grid">
        <div className="panel"><div className="panel-heading"><div><h3>Category breakdown</h3><p>Where your money is going</p></div></div>
          {categoryData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3}>{categoryData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}</Pie><Tooltip formatter={v => money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(total)}</strong><span>Total spend</span></div></div><div className="legend">{categoryData.map(c => <div className="legend-item" key={c.name}><span style={{ background: c.color }}/><span>{c.name}</span><strong>{money(c.value)}</strong></div>)}</div></> : <div className="chart-empty">No spending data for this month yet.</div>}
        </div>
        <div className="panel"><div className="panel-heading"><div><h3>Monthly trend</h3><p>Your spending over the last 6 months</p></div></div>
          <div className="trend-chart"><ResponsiveContainer width="100%" height={290}><BarChart data={trendData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8b95a7", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b95a7", fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/><Tooltip formatter={v => money(v)}/><Bar dataKey="amount" fill="#16a085" radius={[6,6,0,0]} maxBarSize={38}/></BarChart></ResponsiveContainer></div>
        </div>
      </section>

      <section className="panel expenses-panel"><div className="panel-heading list-heading"><div><h3>Recent expenses</h3><p>Your transactions for {monthLabel(selectedMonth)}</p></div><button className="text-button" onClick={openAdd}><Plus size={16}/> Add new</button></div>
        {sortedExpenses.length ? <div className="table-scroll"><table><thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th></th></tr></thead><tbody>{sortedExpenses.map(e => <tr key={e.id}><td><div className="expense-title">{e.note || categoryName(e.category)}</div><div className="expense-subtitle">{e.note ? categoryName(e.category) : "Expense"}</div></td><td><span className="category-pill"><i style={{ background: categoryColor(e.category) }}/>{categoryName(e.category)}</span></td><td className="date-cell">{new Date(`${e.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td className="amount-cell">{money(e.amount)}</td><td><div className="row-actions"><button aria-label="Edit expense" onClick={() => openEdit(e)}><Pencil size={16}/></button><button aria-label="Delete expense" onClick={() => deleteExpense(e.id)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><ReceiptText size={25}/></div><h3>No expenses yet</h3><p>Add your first expense to start tracking your spending.</p><button className="button button-primary" onClick={openAdd}><Plus size={17}/> Add expense</button></div>}
      </section>
      <footer>SpendWise · Your data is saved locally in this browser.</footer>
    </main>

    {showForm && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowForm(false)}><div className="modal"><div className="modal-header"><div><h2>{editing ? "Edit expense" : "Add expense"}</h2><p>Enter the details of your transaction.</p></div><button className="close-button" onClick={() => setShowForm(false)}><X/></button></div><form onSubmit={saveExpense} className="form-grid"><label>Amount (₹)<input type="number" min="0.01" step="0.01" required placeholder="e.g. 450" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}/></label><label>Category<select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Date<input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></label><label>Note <span className="optional">(optional, max 120 characters)</span><input maxLength="120" placeholder="What was this expense for?" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}/></label><div className="modal-actions"><button type="button" className="button button-light" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" type="submit">{editing ? "Save changes" : "Add expense"}</button></div></form></div></div>}

    {showCategories && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowCategories(false)}><div className="modal category-modal"><div className="modal-header"><div><h2>Manage categories</h2><p>Create, rename or recolour your categories.</p></div><button className="close-button" onClick={() => setShowCategories(false)}><X/></button></div><form className="category-add-form" onSubmit={saveCategory}><input aria-label="Category name" placeholder="New category name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}/><input aria-label="Category colour" type="color" value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}/><button className="button button-primary">{categoryEditing ? "Update" : "Add"}</button>{categoryEditing && <button type="button" className="button button-light" onClick={() => {setCategoryEditing(null);setCategoryForm({name:"",color:"#0f9f83"});}}>Cancel</button>}</form><div className="category-list">{categories.map(c => <div className="category-row" key={c.id}><span className="category-swatch" style={{background:c.color}}/><strong>{c.name}</strong><div><button onClick={() => editCategory(c)} aria-label={`Edit ${c.name}`}><Pencil size={16}/></button><button onClick={() => deleteCategory(c.id)} aria-label={`Delete ${c.name}`}><Trash2 size={16}/></button></div></div>)}</div></div></div>}
  </div>;
}

export default App;
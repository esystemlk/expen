import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PieChart, 
  History, 
  User as UserIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Wallet,
  Bell,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  HeartPulse,
  Gamepad2,
  Briefcase,
  MoreHorizontal,
  X,
  ChevronRight,
  LogOut,
  Mail,
  Lock,
  Chrome
} from 'lucide-react';
import { useTransactionStore } from './store/useTransactionStore';
import { useUserStore } from './store/useUserStore';
import { useGoalStore, SavingsGoal } from './store/useGoalStore';
import { useAccountStore } from './store/useAccountStore';
import { getFinancialInsights } from './services/geminiService';
import { cn, formatCurrency } from './lib/utils';
import { COUNTRIES, CURRENCIES } from './constants';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Search, 
  Filter, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowRight,
  Sparkles,
  Zap,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mb-6">
            <X className="text-red w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Oops! An error occurred</h2>
          <p className="text-text-2 text-sm mb-8 max-w-xs">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-accent text-white font-bold rounded-xl shadow-lg"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- App Components ---

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'analytics', icon: PieChart, label: 'Stats' },
    { id: 'add', icon: Plus, label: '', isFab: true },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-2 border-t border-border px-4 py-1.5 flex justify-between items-center z-50 safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-300 min-w-[44px] min-h-[44px]",
            tab.isFab ? "relative -top-4" : "",
            activeTab === tab.id ? "text-accent" : "text-text-2"
          )}
        >
          {tab.isFab ? (
            <div className="w-11 h-11 gradient-fab rounded-full flex items-center justify-center shadow-lg shadow-accent/30 active:scale-90 transition-transform">
              <Plus className="text-white w-6 h-6" />
            </div>
          ) : (
            <>
              <tab.icon className={cn("w-4.5 h-4.5 mb-0.5", activeTab === tab.id && "animate-pulse")} />
              <span className="text-[8px] font-medium">{tab.label}</span>
            </>
          )}
        </button>
      ))}
    </nav>
  );
};

const BalanceCard = ({ balance, income, expense }: { balance: number, income: number, expense: number }) => {
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-balance rounded-xl p-3.5 shadow-xl relative overflow-hidden mb-5"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="relative z-10">
        <p className="text-white/80 text-[10px] font-medium mb-0.5">Total Balance</p>
        <h2 className="text-white text-xl font-bold mb-3 tracking-tight">
          {formatCurrency(balance, currency)}
        </h2>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg">
            <div className="w-6 h-6 bg-green/20 rounded-full flex items-center justify-center">
              <ArrowDownLeft className="text-green w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-white/60 text-[7px] uppercase font-bold tracking-wider">Income</p>
              <p className="text-white text-[10px] font-bold">{formatCurrency(income, currency)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg">
            <div className="w-6 h-6 bg-red/20 rounded-full flex items-center justify-center">
              <ArrowUpRight className="text-red w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-white/60 text-[7px] uppercase font-bold tracking-wider">Expenses</p>
              <p className="text-white text-[10px] font-bold">{formatCurrency(expense, currency)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CategoryGrid = ({ transactions }: { transactions: any[] }) => {
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';
  const categories = [
    { name: 'Food', icon: Utensils, color: 'bg-amber' },
    { name: 'Transport', icon: Car, color: 'bg-blue' },
    { name: 'Shopping', icon: ShoppingBag, color: 'bg-pink' },
    { name: 'Bills', icon: Receipt, color: 'bg-red' },
    { name: 'Health', icon: HeartPulse, color: 'bg-green' },
    { name: 'Fun', icon: Gamepad2, color: 'bg-accent' },
    { name: 'Salary', icon: Briefcase, color: 'bg-emerald-500' },
    { name: 'Other', icon: MoreHorizontal, color: 'bg-text-3' },
  ];

  const getSpent = (cat: string) => {
    return transactions
      .filter(t => t.category === cat)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <div className="grid grid-cols-4 gap-1.5 mb-4">
      {categories.map((cat) => (
        <div key={cat.name} className="flex flex-col items-center gap-1">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm", cat.color)}>
            <cat.icon className="text-white w-4 h-4" />
          </div>
          <div className="text-center">
            <p className="text-[8px] text-text-2 font-medium leading-tight">{cat.name}</p>
            <p className="text-[8px] text-text font-bold leading-tight">{formatCurrency(getSpent(cat.name), currency)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const isExpense = transaction.type === 'EXPENSE';
  const date = new Date(transaction.date);
  const { profile } = useUserStore();
  const { accounts } = useAccountStore();
  const currency = profile?.currency || 'LKR';
  const account = accounts.find(a => a.id === transaction.accountId);
  
  return (
    <div className="flex items-center justify-between p-2 bg-bg-2 rounded-lg mb-1 border border-border/40 active:bg-bg-3 transition-colors">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-6.5 h-6.5 rounded-md flex items-center justify-center",
          isExpense ? "bg-red/10 text-red" : "bg-green/10 text-green"
        )}>
          {isExpense ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
        </div>
        <div>
          <p className="text-[10px] font-bold text-text leading-tight">{transaction.description}</p>
          <div className="flex items-center gap-1">
            <span className="text-[7px] text-text-2 uppercase font-bold tracking-tighter">{transaction.category}</span>
            {account && (
              <span className="text-[7px] text-accent font-bold uppercase tracking-tighter">• {account.name}</span>
            )}
            {transaction.mode === 'COMPANY' && (
              <span className="text-[5px] bg-accent/20 text-accent px-1 py-0.1 rounded font-black">BIZ</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-[10px] font-black leading-tight", isExpense ? "text-red" : "text-green")}>
          {isExpense ? '-' : '+'}{formatCurrency(transaction.amount, currency)}
        </p>
        <p className="text-[7px] text-text-3 font-medium">
          {date.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

const AddExpenseSheet = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [mode, setMode] = useState<'PERSONAL' | 'COMPANY'>('PERSONAL');
  const { accounts, updateBalance } = useAccountStore();
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const addTransaction = useTransactionStore(state => state.addTransaction);
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';

  const expenseCategories = [
    'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Fun', 'Education', 
    'Rent', 'Utilities', 'Groceries', 'Dining Out', 'Entertainment', 'Travel', 
    'Insurance', 'Personal Care', 'Gifts', 'Taxes', 'Debt Payment', 'Subscriptions', 
    'Maintenance', 'Pets', 'Charity', 'Other'
  ];
  const incomeCategories = [
    'Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Rental', 
    'Dividends', 'Interest', 'Cashback', 'Refund', 'Grants', 'Scholarship', 
    'Commission', 'Royalties', 'Stipend', 'Other'
  ];

  useEffect(() => {
    if (type === 'INCOME') setCategory('Salary');
    else setCategory('Food');
    setCustomCategory('');
  }, [type]);

  const handleSave = async () => {
    const finalCategory = category === 'Other' ? (customCategory || 'Other') : category;
    const numAmount = parseFloat(amount);
    const payload = {
      type,
      amount: numAmount,
      accountId,
      description,
      category: finalCategory,
      mode,
      date: new Date().toISOString(),
    };

    await addTransaction(payload);
    await updateBalance(accountId, numAmount, type);
    onClose();
  };

  const appendNum = (num: string) => {
    if (amount === '0') setAmount(num);
    else setAmount(amount + num);
  };

  const deleteNum = () => {
    if (amount.length === 1) setAmount('0');
    else setAmount(amount.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-bg flex flex-col pt-safe"
    >
      <div className="flex items-center justify-between p-2.5 border-b border-border">
        <button onClick={onClose} className="text-text-2 p-1"><X size={16} /></button>
        <h2 className="text-xs font-bold">Add Transaction</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="flex bg-bg-2 p-1 rounded-lg mb-3">
          <button 
            onClick={() => setType('EXPENSE')}
            className={cn("flex-1 py-1 rounded-md text-[10px] font-bold transition-all", type === 'EXPENSE' ? "bg-red text-white shadow-md" : "text-text-2")}
          >
            Expense
          </button>
          <button 
            onClick={() => setType('INCOME')}
            className={cn("flex-1 py-1 rounded-md text-[10px] font-bold transition-all", type === 'INCOME' ? "bg-green text-white shadow-md" : "text-text-2")}
          >
            Income
          </button>
        </div>

        <div className="text-center mb-3">
          <p className="text-text-3 text-[7px] font-bold uppercase tracking-widest mb-0.5">Amount</p>
          <h1 className={cn("text-2xl font-black tracking-tighter", type === 'EXPENSE' ? "text-red" : "text-green")}>
            {formatCurrency(parseFloat(amount), currency)}
          </h1>
        </div>

        <div className="space-y-2.5">
          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Account</p>
            <select 
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-bg-2">{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Description</p>
            <input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full bg-transparent text-xs text-text font-bold outline-none placeholder:text-text-3"
            />
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border relative">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Category</p>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-xs text-text font-bold outline-none appearance-none pr-8"
              >
                {(type === 'EXPENSE' ? expenseCategories : incomeCategories).map(cat => (
                  <option key={cat} value={cat} className="bg-bg-2 text-text">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-text-3">
                <MoreHorizontal size={12} />
              </div>
            </div>
          </div>

          {category === 'Other' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-2 p-2 rounded-lg border border-border"
            >
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Custom Category Name</p>
              <input 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter category name"
                className="w-full bg-transparent text-xs text-text font-bold outline-none placeholder:text-text-3"
              />
            </motion.div>
          )}

          <div className="flex items-center justify-between bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-2 text-[10px] font-bold">Company Expense</p>
            <button 
              onClick={() => setMode(mode === 'PERSONAL' ? 'COMPANY' : 'PERSONAL')}
              className={cn(
                "w-8 h-4 rounded-full relative transition-all",
                mode === 'COMPANY' ? "bg-accent" : "bg-bg-3"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                mode === 'COMPANY' ? "left-4.5" : "left-0.5"
              )} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-bg-2 p-2.5 border-t border-border">
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'DEL'].map((n) => (
            <button
              key={n}
              onClick={() => n === 'DEL' ? deleteNum() : appendNum(n.toString())}
              className="h-8.5 flex items-center justify-center text-sm font-bold text-text active:bg-bg-3 rounded-lg"
            >
              {n}
            </button>
          ))}
        </div>
        <button 
          onClick={handleSave}
          className="w-full py-2.5 gradient-fab text-white text-[10px] font-black rounded-lg shadow-lg active:scale-95 transition-transform"
        >
          SAVE TRANSACTION
        </button>
      </div>
    </motion.div>
  );
};

// --- Pages ---

const BudgetAlert = () => {
  const { transactions } = useTransactionStore();
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';
  const budgets = profile?.categoryBudgets || {};
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'EXPENSE' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const alerts = Object.keys(budgets).map(cat => {
    const budget = budgets[cat];
    if (budget <= 0) return null;
    const spent = monthlyExpenses.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0);
    const percent = (spent / budget) * 100;
    
    if (percent >= 90) {
      return {
        category: cat,
        spent,
        budget,
        percent,
        isExceeded: percent >= 100
      };
    }
    return null;
  }).filter(Boolean);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {alerts.map((alert: any) => (
        <div key={alert.category} className={cn(
          "p-2.5 rounded-xl border flex items-center gap-3",
          alert.isExceeded ? "bg-red/5 border-red/20" : "bg-amber/5 border-amber/20"
        )}>
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            alert.isExceeded ? "bg-red/10 text-red" : "bg-amber/10 text-amber"
          )}>
            <AlertTriangle size={14} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[9px] font-black uppercase tracking-tight">
                {alert.isExceeded ? 'Budget Exceeded' : 'Budget Warning'}
              </p>
              <span className="text-[8px] font-bold">{alert.percent.toFixed(0)}%</span>
            </div>
            <p className="text-[10px] font-medium text-text-2">
              You've spent <span className="font-bold text-text">{formatCurrency(alert.spent, currency)}</span> on <span className="font-bold text-text">{alert.category}</span>.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { transactions } = useTransactionStore();
  const { profile } = useUserStore();
  const { goals } = useGoalStore();
  const { accounts } = useAccountStore();
  const currency = profile?.currency || 'LKR';
  const budgets = profile?.categoryBudgets || {};
  
  const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const budgetCategories = Object.keys(budgets).filter(cat => budgets[cat] > 0);

  // Advanced Stats
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailyAverage = expense / currentDay;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const [insights, setInsights] = useState<string>('');
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (transactions.length > 0) {
        setIsInsightsLoading(true);
        const res = await getFinancialInsights(transactions, profile);
        setInsights(res);
        setIsInsightsLoading(false);
      }
    };
    fetchInsights();
  }, [transactions.length, profile]);

  return (
    <div className="p-2.5 pb-20">
      <header className="flex justify-between items-center mb-3">
        <div>
          <p className="text-text-2 text-[8px] font-medium">Welcome back,</p>
          <h1 className="text-sm font-black tracking-tight leading-tight flex items-center gap-1.5">
            {profile?.displayName || 'User'} <Sparkles className="w-3 h-3 text-amber" />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 bg-bg-2 rounded-full flex items-center justify-center border border-border">
            <Bell className="text-text-2 w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="text-accent w-3.5 h-3.5" />
              )}
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green border-2 border-bg rounded-full" />
          </div>
        </div>
      </header>

      <BalanceCard balance={balance} income={income} expense={expense} />

      <BudgetAlert />

      {/* Accounts Overview */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">My Accounts</h3>
          <button 
            onClick={() => (window as any).openAddAccount()}
            className="text-accent text-[8px] font-bold flex items-center gap-1"
          >
            Manage <Plus size={8} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {accounts.map(acc => (
            <div key={acc.id} className="min-w-[120px] bg-bg-2 p-2.5 rounded-xl border border-border flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded bg-bg-3 flex items-center justify-center">
                  <Wallet size={10} style={{ color: acc.color }} />
                </div>
                <span className="text-[9px] font-bold truncate">{acc.name}</span>
              </div>
              <p className="text-[11px] font-black">{formatCurrency(acc.balance, currency)}</p>
              <p className="text-[7px] text-text-3 font-bold uppercase mt-0.5">{acc.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Insights */}
      <div className="mb-5 bg-accent/5 p-3 rounded-2xl border border-accent/10 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-accent">Smart Insights</h3>
        </div>
        {isInsightsLoading ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-2 bg-accent/10 rounded w-full" />
            <div className="h-2 bg-accent/10 rounded w-5/6" />
            <div className="h-2 bg-accent/10 rounded w-4/6" />
          </div>
        ) : (
          <div className="text-[9px] font-medium text-text-2 leading-relaxed whitespace-pre-line">
            {insights}
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-bg-2 p-2.5 rounded-xl border border-border flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber/10 rounded-lg flex items-center justify-center">
            <TrendingDown className="text-amber w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-text-3 text-[7px] font-bold uppercase">Daily Avg</p>
            <p className="text-[10px] font-black">{formatCurrency(dailyAverage, currency)}</p>
          </div>
        </div>
        <div className="bg-bg-2 p-2.5 rounded-xl border border-border flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green/10 rounded-lg flex items-center justify-center">
            <Zap className="text-green w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-text-3 text-[7px] font-bold uppercase">Savings Rate</p>
            <p className="text-[10px] font-black">{savingsRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      {/* Savings Goals Overview */}
      {goals.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">Savings Goals</h3>
            <button 
              onClick={() => setActiveTab('goals')}
              className="text-[8px] font-black text-accent flex items-center gap-0.5"
            >
              View All <ArrowRight size={8} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {goals.map(goal => {
              const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <div key={goal.id} className="min-w-[140px] bg-bg-2 p-2.5 rounded-xl border border-border flex-shrink-0">
                  <p className="text-[9px] font-bold mb-1 truncate">{goal.title}</p>
                  <div className="flex justify-between items-end mb-1.5">
                    <p className="text-[8px] text-text-2">{formatCurrency(goal.currentAmount, currency)}</p>
                    <p className="text-[8px] font-black text-accent">{percent.toFixed(0)}%</p>
                  </div>
                  <div className="h-1 w-full bg-bg-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {budgetCategories.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2 mb-2">Budget Progress</h3>
          <div className="space-y-2">
            {budgetCategories.map(cat => {
              const spent = transactions
                .filter(t => t.category === cat && t.type === 'EXPENSE')
                .reduce((acc, t) => acc + t.amount, 0);
              const budget = budgets[cat];
              const percent = Math.min((spent / budget) * 100, 100);
              
              return (
                <div key={cat} className="bg-bg-2 p-2 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold">{cat}</span>
                    <span className="text-[9px] text-text-2">
                      {formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className={cn(
                        "h-full rounded-full",
                        percent > 90 ? "bg-red" : percent > 70 ? "bg-amber" : "bg-green"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">Categories</h3>
        <button className="text-accent text-[8px] font-bold flex items-center gap-1">
          View All <ChevronRight className="w-2 h-2" />
        </button>
      </div>
      <CategoryGrid transactions={transactions} />

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">Recent Activity</h3>
        <button 
          onClick={() => setActiveTab('transactions')}
          className="text-accent text-[8px] font-bold flex items-center gap-1"
        >
          See More <ChevronRight className="w-2 h-2" />
        </button>
      </div>
      <div className="space-y-0.5">
        {transactions.slice(0, 5).map(t => (
          <TransactionItem key={t.id} transaction={t} />
        ))}
        {transactions.length === 0 && (
          <div className="text-center py-8 bg-bg-2 rounded-lg border border-dashed border-border">
            <Wallet className="w-8 h-8 text-text-3 mx-auto mb-2 opacity-20" />
            <p className="text-text-3 text-[10px] font-medium">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Analytics = () => {
  const { transactions } = useTransactionStore();
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

  const byCategoryMap = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const byCategory = Object.entries(byCategoryMap).map(([name, value]) => ({ name, value }));

  const COLORS = ['#6C5CE7', '#00B894', '#FF6B6B', '#FDCB6E', '#74B9FF', '#FD79A8'];

  // Trend Data (Last 7 days)
  const trendData = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toLocaleDateString();
    const dayIncome = transactions
      .filter(t => t.type === 'INCOME' && new Date(t.date).toLocaleDateString() === dateStr)
      .reduce((acc, t) => acc + t.amount, 0);
    const dayExpense = transactions
      .filter(t => t.type === 'EXPENSE' && new Date(t.date).toLocaleDateString() === dateStr)
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      name: date.toLocaleDateString(undefined, { weekday: 'short' }),
      income: dayIncome,
      expense: dayExpense,
      balance: dayIncome - dayExpense
    };
  });

  return (
    <div className="p-2.5 pb-20">
      <h1 className="text-base font-black mb-3 tracking-tight">Analytics</h1>

      <div className="bg-bg-2 p-3 rounded-xl border border-border mb-4">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2 mb-3">Balance Trend</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
              <XAxis dataKey="name" stroke="#ADB5BD" fontSize={7} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '9px' }}
                formatter={(value: number) => formatCurrency(value, currency)}
              />
              <Area type="monotone" dataKey="balance" stroke="#6C5CE7" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-bg-2 p-2 rounded-lg border border-border">
          <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Total Spent</p>
          <p className="text-xs font-black text-red">{formatCurrency(totalExpense, currency)}</p>
        </div>
        <div className="bg-bg-2 p-2 rounded-lg border border-border">
          <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Total Income</p>
          <p className="text-xs font-black text-green">{formatCurrency(totalIncome, currency)}</p>
        </div>
      </div>

      <div className="bg-bg-2 p-2.5 rounded-lg border border-border mb-3">
        <h3 className="text-[8px] font-black uppercase tracking-widest text-text-2 mb-2">Spending by Category</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={byCategory}
                innerRadius={35}
                outerRadius={50}
                paddingAngle={5}
                dataKey="value"
              >
                {byCategory.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '9px' }}
                itemStyle={{ color: '#1A1A1A' }}
                formatter={(value: number) => formatCurrency(value, currency)}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {byCategory.map((item: any, index: number) => (
            <div key={item.name} className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-[7px] text-text-2 font-medium">{item.name}</span>
              <span className="text-[7px] text-text font-bold ml-auto">{formatCurrency(item.value as number, currency)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-2 p-2.5 rounded-lg border border-border">
        <h3 className="text-[8px] font-black uppercase tracking-widest text-text-2 mb-2">Monthly Overview</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={[
              { name: 'Income', amount: totalIncome },
              { name: 'Expense', amount: totalExpense },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
              <XAxis dataKey="name" stroke="#ADB5BD" fontSize={7} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '9px' }}
                itemStyle={{ color: '#1A1A1A' }}
                formatter={(value: number) => formatCurrency(value, currency)}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={28}>
                {[{ name: 'Income', color: '#00B894' }, { name: 'Expense', color: '#FF6B6B' }].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { transactions } = useTransactionStore();
  const { profile, updateProfile } = useUserStore();
  const currency = profile?.currency || 'LKR';

  const expenseCategories = [
    'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Fun', 'Education', 
    'Rent', 'Utilities', 'Groceries', 'Dining Out', 'Entertainment', 'Travel', 
    'Insurance', 'Personal Care', 'Gifts', 'Taxes', 'Debt Payment', 'Subscriptions', 
    'Maintenance', 'Pets', 'Charity', 'Other'
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ExpenS - Financial Report', 14, 20);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);

    const tableData = transactions.map(t => {
      const date = new Date(t.date);
      return [
        date.toLocaleDateString(),
        t.description,
        t.category,
        t.type,
        t.mode,
        formatCurrency(t.amount, currency)
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Description', 'Category', 'Type', 'Mode', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [108, 92, 231], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
    });

    doc.save('ExpenS_Report.pdf');
  };

  const handleBudgetChange = (cat: string, amount: string) => {
    const newBudgets = { ...(profile?.categoryBudgets || {}) };
    newBudgets[cat] = parseFloat(amount) || 0;
    updateProfile({ categoryBudgets: newBudgets });
  };

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    if (country) {
      updateProfile({ country: code, currency: country.currency });
    }
  };

  return (
    <div className="p-2.5 pb-20">
      <h1 className="text-base font-black mb-3 tracking-tight">Profile</h1>
      
      <div className="flex flex-col items-center mb-3">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border-2 border-bg-2 mb-1.5 overflow-hidden">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="text-accent w-5 h-5" />
          )}
        </div>
        <h2 className="text-sm font-bold">{profile?.displayName || 'User'}</h2>
        <p className="text-text-2 text-[9px]">{profile?.email}</p>
      </div>

      <div className="space-y-4">
        {/* Accounts Management */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">Financial Accounts</h3>
            <button 
              onClick={() => (window as any).openAddAccount()}
              className="text-accent text-[8px] font-bold flex items-center gap-1"
            >
              Add New <Plus size={8} />
            </button>
          </div>
          <div className="space-y-2">
            {useAccountStore.getState().accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-2 bg-bg-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${acc.color}20` }}>
                    <Wallet size={12} style={{ color: acc.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold">{acc.name}</p>
                    <p className="text-[7px] text-text-3 font-bold uppercase">{acc.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black">{formatCurrency(acc.balance, currency)}</p>
                  <button 
                    onClick={() => useAccountStore.getState().deleteAccount(acc.id)}
                    className="text-[7px] text-red font-bold uppercase mt-0.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country & Currency */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2 mb-3">Region & Currency</h3>
          <div className="space-y-3">
            <div>
              <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Country</p>
              <select 
                value={profile?.country || 'LK'}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-bg-3 p-2 rounded-lg text-[11px] font-bold outline-none"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Currency</p>
              <select 
                value={profile?.currency || 'LKR'}
                onChange={(e) => updateProfile({ currency: e.target.value })}
                className="w-full bg-bg-3 p-2 rounded-lg text-[11px] font-bold outline-none"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Budgets */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2 mb-3">Monthly Category Budgets</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {expenseCategories.map(cat => (
              <div key={cat} className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold text-text-2 flex-1">{cat}</span>
                <div className="flex items-center gap-1 bg-bg-3 px-2 py-1 rounded-lg w-24">
                  <span className="text-[8px] text-text-3">{currency}</span>
                  <input 
                    type="number"
                    value={profile?.categoryBudgets?.[cat] || ''}
                    onChange={(e) => handleBudgetChange(cat, e.target.value)}
                    placeholder="0"
                    className="bg-transparent w-full text-[10px] font-bold outline-none text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2 bg-bg-2 rounded-lg border border-border active:bg-bg-3">
            <div className="w-6.5 h-6.5 rounded-lg bg-bg-3 flex items-center justify-center">
              <Bell className="text-accent w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold">Notifications</p>
              <p className="text-[7px] text-text-2">Alerts, Reminders</p>
            </div>
            <ChevronRight className="text-text-3 w-3 h-3" />
          </div>

          <button 
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2 p-2 bg-bg-2 rounded-lg border border-border active:bg-bg-3 text-left"
          >
            <div className="w-6.5 h-6.5 rounded-lg bg-bg-3 flex items-center justify-center">
              <Receipt className="text-accent w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold">Export Data</p>
              <p className="text-[7px] text-text-2">Download PDF Report</p>
            </div>
            <ChevronRight className="text-text-3 w-3 h-3" />
          </button>
        </div>

        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all data?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full mt-5 py-2 bg-red/10 text-red text-[10px] font-bold rounded-lg active:bg-red/20 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3 h-3" />
          Clear All Local Data
        </button>
      </div>
    </div>
  );
};

const SavingsGoals = () => {
  const { goals, deleteGoal, updateGoal } = useGoalStore();
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [savingToGoal, setSavingToGoal] = useState<SavingsGoal | null>(null);
  const [saveAmount, setSaveAmount] = useState('');

  const handleSaveMore = async () => {
    if (!savingToGoal || !saveAmount) return;
    const newAmount = savingToGoal.currentAmount + parseFloat(saveAmount);
    await updateGoal(savingToGoal.id, { currentAmount: newAmount });
    setSavingToGoal(null);
    setSaveAmount('');
  };

  return (
    <div className="p-2.5 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-base font-black tracking-tight">Savings Goals</h1>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="w-7 h-7 gradient-fab rounded-lg flex items-center justify-center shadow-lg shadow-accent/20"
        >
          <Plus className="text-white w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {goals.map(goal => {
          const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
          
          return (
            <motion.div 
              layout
              key={goal.id} 
              className="bg-bg-2 p-3 rounded-xl border border-border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xs font-black">{goal.title}</h3>
                  <p className="text-[8px] text-text-3 font-bold uppercase tracking-widest">{goal.category}</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setEditingGoal(goal)}
                    className="w-6 h-6 bg-bg-3 rounded-md flex items-center justify-center text-text-2 hover:text-accent transition-colors"
                  >
                    <Edit2 size={10} />
                  </button>
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="w-6 h-6 bg-bg-3 rounded-md flex items-center justify-center text-text-2 hover:text-red transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-end mb-1.5">
                <div>
                  <p className="text-[10px] font-black">{formatCurrency(goal.currentAmount, currency)}</p>
                  <p className="text-[7px] text-text-3 font-bold uppercase">of {formatCurrency(goal.targetAmount, currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-accent">{percent.toFixed(1)}%</p>
                  <p className="text-[7px] text-text-3 font-bold uppercase">{formatCurrency(remaining, currency)} left</p>
                </div>
              </div>

              <div className="h-2 w-full bg-bg-3 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className="h-full gradient-fab rounded-full shadow-[0_0_8px_rgba(108,92,231,0.4)]"
                />
              </div>

              <div className="flex justify-between items-center">
                {goal.deadline ? (
                  <div className="flex items-center gap-1 text-text-3">
                    <Calendar size={8} />
                    <span className="text-[7px] font-bold uppercase">Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>
                ) : <div />}
                <button 
                  onClick={() => setSavingToGoal(goal)}
                  className="px-2 py-0.5 bg-accent/10 text-accent text-[8px] font-black rounded-md border border-accent/20 flex items-center gap-1"
                >
                  <Plus size={8} /> Save More
                </button>
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-16 bg-bg-2 rounded-2xl border-2 border-dashed border-border">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="text-accent w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-text-2 mb-1">No goals yet</p>
            <p className="text-[9px] text-text-3 max-w-[160px] mx-auto">Start saving for your dreams by creating your first goal.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(isAddOpen || editingGoal) && (
          <AddGoalSheet 
            isOpen={true} 
            onClose={() => {
              setIsAddOpen(false);
              setEditingGoal(null);
            }} 
            editingGoal={editingGoal}
          />
        )}
        {savingToGoal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-bg w-full max-w-[300px] p-4 rounded-2xl border border-border shadow-2xl"
            >
              <h3 className="text-xs font-black mb-1">Save to {savingToGoal.title}</h3>
              <p className="text-[8px] text-text-2 mb-3">How much would you like to add?</p>
              
              <div className="bg-bg-2 p-2 rounded-lg border border-border mb-4 flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-3">{currency}</span>
                <input 
                  autoFocus
                  type="number"
                  value={saveAmount}
                  onChange={(e) => setSaveAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent outline-none flex-1 text-xs font-black"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setSavingToGoal(null)}
                  className="flex-1 py-2 bg-bg-3 text-text-2 text-[10px] font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveMore}
                  className="flex-1 py-2 bg-accent text-white text-[10px] font-bold rounded-lg shadow-lg shadow-accent/20"
                >
                  Add Savings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AddGoalSheet = ({ isOpen, onClose, editingGoal }: { isOpen: boolean, onClose: () => void, editingGoal?: SavingsGoal | null }) => {
  const { addGoal, updateGoal } = useGoalStore();
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';
  
  const [title, setTitle] = useState(editingGoal?.title || '');
  const [targetAmount, setTargetAmount] = useState(editingGoal?.targetAmount.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(editingGoal?.currentAmount.toString() || '0');
  const [category, setCategory] = useState(editingGoal?.category || 'General');
  const [deadline, setDeadline] = useState(editingGoal?.deadline || '');

  const handleSave = async () => {
    const payload = {
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      category,
      deadline,
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, payload);
    } else {
      await addGoal(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-[110] bg-bg flex flex-col pt-safe"
    >
      <div className="flex items-center justify-between p-2.5 border-b border-border">
        <button onClick={onClose} className="text-text-2 p-1"><X size={16} /></button>
        <h2 className="text-xs font-bold">{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-bg-2 p-3 rounded-xl border border-border">
          <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Goal Title</p>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Laptop, Dream Vacation"
            className="w-full bg-transparent text-sm font-black outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-2 p-3 rounded-xl border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Target Amount</p>
            <input 
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-sm font-black outline-none text-accent"
            />
          </div>
          <div className="bg-bg-2 p-3 rounded-xl border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Current Savings</p>
            <input 
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-sm font-black outline-none text-green"
            />
          </div>
        </div>

        <div className="bg-bg-2 p-3 rounded-xl border border-border">
          <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Category</p>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent text-xs font-bold outline-none appearance-none"
          >
            {['General', 'Travel', 'Tech', 'Emergency', 'Education', 'Home', 'Vehicle', 'Other'].map(cat => (
              <option key={cat} value={cat} className="bg-bg-2">{cat}</option>
            ))}
          </select>
        </div>

        <div className="bg-bg-2 p-3 rounded-xl border border-border">
          <p className="text-text-3 text-[7px] font-bold uppercase mb-1">Deadline (Optional)</p>
          <input 
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-transparent text-xs font-bold outline-none"
          />
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleSave}
          disabled={!title || !targetAmount}
          className="w-full py-3 gradient-fab rounded-xl text-white text-xs font-black shadow-xl shadow-accent/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
        >
          {editingGoal ? 'Update Goal' : 'Create Goal'}
        </button>
      </div>
    </motion.div>
  );
};

const Transactions = () => {
  const { transactions } = useTransactionStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  
  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || t.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-2.5 pb-20">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-base font-black tracking-tight">History</h1>
        <div className="flex gap-1.5">
          {['ALL', 'EXPENSE', 'INCOME'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-2 py-0.5 rounded-md text-[8px] font-bold transition-all",
                filter === f ? "bg-accent text-white" : "bg-bg-2 text-text-2 border border-border"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-bg-2 p-2 rounded-xl border border-border mb-3 flex items-center gap-2">
        <Search className="text-text-3 w-3.5 h-3.5" />
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="bg-transparent outline-none flex-1 text-[10px] font-medium"
        />
      </div>

      <div className="space-y-0.5">
        {filtered.map(t => (
          <TransactionItem key={t.id} transaction={t} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-3 text-[10px]">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

const AddAccountSheet = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<any>('CASH');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#6C5CE7');
  const addAccount = useAccountStore(state => state.addAccount);

  const handleSave = async () => {
    if (!name) return;
    await addAccount({
      name,
      type,
      balance: parseFloat(balance),
      color,
      icon: 'wallet',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full max-w-md bg-bg-1 rounded-t-3xl p-5 pb-8 shadow-2xl border-t border-border"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm font-black uppercase tracking-widest">New Account</h2>
          <button onClick={onClose} className="w-7 h-7 bg-bg-2 rounded-full flex items-center justify-center text-text-2">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Account Name</p>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Savings, Wallet"
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            />
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Type</p>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="CREDIT">Credit Card</option>
              <option value="SAVINGS">Savings</option>
              <option value="INVESTMENT">Investment</option>
            </select>
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Initial Balance</p>
            <input 
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            />
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Color Theme</p>
            <div className="flex gap-2 mt-1">
              {['#6C5CE7', '#00B894', '#FF7675', '#FDCB6E', '#0984E3', '#E17055'].map(c => (
                <button 
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2",
                    color === c ? "border-text" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-6 py-3 gradient-fab text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-transform"
        >
          Create Account
        </button>
      </motion.div>
    </div>
  );
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (window as any).openAddAccount = () => setIsAddAccountOpen(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setIsAddOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 gradient-fab rounded-xl flex items-center justify-center shadow-2xl shadow-accent/40 mb-2.5 mx-auto">
            <Wallet className="text-white w-6 h-6" />
          </div>
          <h1 className="text-lg font-black tracking-tighter mb-1">ExpenS</h1>
          <p className="text-text-2 text-[9px] font-medium">Smart tracking for your future</p>
        </motion.div>
        
        <div className="absolute bottom-10 left-6 right-6">
          <div className="h-1 w-full bg-bg-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5 }}
              className="h-full gradient-fab"
            />
          </div>
          <p className="text-center text-[7px] text-text-3 font-bold uppercase tracking-widest mt-2">
            Loading your local data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text max-w-[430px] mx-auto relative shadow-2xl shadow-black/10">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <Dashboard setActiveTab={handleTabChange} />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'goals' && <SavingsGoals />}
          {activeTab === 'transactions' && <Transactions />}
          {activeTab === 'profile' && <Profile />}
        </motion.div>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <AnimatePresence>
        {isAddOpen && (
          <AddExpenseSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        )}
        {isAddAccountOpen && (
          <AddAccountSheet isOpen={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

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
import { useRecurringStore, RecurringTransaction } from './store/useRecurringStore';
import { useDebtStore } from './store/useDebtStore';
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
  AlertCircle,
  Sparkles,
  Zap,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Upload,
  Repeat,
  HandCoins,
  Users,
  Moon,
  Sun,
  Shield,
  Fingerprint,
  FileSpreadsheet,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useSplitStore, SplitMember, SplitExpense } from './store/useSplitStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';
import logo from './assets/logo.png';

// --- Helpers ---

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  ).join('\n');
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DevelopedBy = () => (
  <div className="mt-12 py-6 border-t border-border text-center opacity-80">
    <p className="text-[7px] text-text-2 font-bold uppercase tracking-widest mb-1">this app is developed by</p>
    <a 
      href="https://www.esystemlk.xyz" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-[9px] font-black text-accent hover:underline transition-all tracking-tight"
    >
      esystemlk
    </a>
  </div>
);

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

// --- Security & Summary Components ---

const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const { profile } = useUserStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const [isScanning, setIsScanning] = useState(false);

  const handleBiometricUnlock = async () => {
    if (!window.PublicKeyCredential) {
      alert('Biometric authentication is not supported by this browser.');
      return;
    }

    try {
      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        alert('Biometric authentication is not available on this device.');
        return;
      }

      setIsScanning(true);
      
      // Simulate biometric prompt/scan
      // In a real production app, you would use navigator.credentials.get() here
      setTimeout(() => {
        setIsScanning(false);
        onUnlock();
      }, 1500);

    } catch (e) {
      console.error('Biometric error:', e);
      setIsScanning(false);
      alert('Biometric authentication failed. Please use your PIN.');
    }
  };

  useEffect(() => {
    if (profile?.security?.biometricEnabled) {
      handleBiometricUnlock();
    }
  }, []);

  const handleInput = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === profile.security.pin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-8">
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <div className="relative w-24 h-24 mb-6">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-accent/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="text-accent w-12 h-12" />
              </div>
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_10px_#6c5ce7]"
              />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Authenticating...</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Scanning Biometrics</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-12 text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="text-accent w-8 h-8" />
        </div>
        <h2 className="text-xl font-black tracking-tight">App Locked</h2>
        <p className="text-text-2 text-xs">Enter your 4-digit PIN to continue</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all duration-300",
              pin.length > i ? "bg-accent border-accent scale-110" : "border-border",
              error && "bg-red border-red animate-shake"
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, profile?.security?.biometricEnabled ? 'biometric' : '', 0, 'delete'].map((val, i) => (
          <button
            key={i}
            onClick={() => {
              if (val === 'delete') setPin(pin.slice(0, -1));
              else if (val === 'biometric') handleBiometricUnlock();
              else if (val !== '') handleInput(val.toString());
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all active:bg-accent/10",
              val === '' && "invisible"
            )}
          >
            {val === 'delete' ? <X size={20} /> : val === 'biometric' ? <Shield size={24} className="text-accent" /> : val}
          </button>
        ))}
      </div>
    </div>
  );
};

const WeeklySummary = ({ onClose }: { onClose: () => void }) => {
  const { transactions } = useTransactionStore();
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';

  const last7Days = transactions.filter(t => {
    const date = new Date(t.date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && t.type === 'EXPENSE';
  });

  const totalSpent = last7Days.reduce((acc, t) => acc + t.amount, 0);
  const topCategory = last7Days.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCats = Object.entries(topCategory).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-bg rounded-3xl p-6 shadow-2xl border border-border"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-accent w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-widest">Week in Review</h2>
          </div>
          <button onClick={onClose} className="text-text-3"><X size={18} /></button>
        </div>

        <div className="text-center mb-8">
          <p className="text-text-2 text-[10px] font-bold uppercase mb-1">Total Spent this week</p>
          <h3 className="text-3xl font-black text-accent">{formatCurrency(totalSpent, currency)}</h3>
        </div>

        <div className="space-y-4 mb-8">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-text-3">Top Categories</h4>
          {sortedCats.slice(0, 3).map(([cat, amount]: any) => (
            <div key={cat} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-[11px] font-bold">{cat}</span>
              </div>
              <span className="text-[11px] font-black">{formatCurrency(amount, currency)}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-accent text-white font-bold rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          Got it!
        </button>
      </motion.div>
    </div>
  );
};

// --- App Components ---

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'analytics', icon: PieChart, label: 'Stats' },
    { id: 'add', icon: Plus, label: '', isFab: true },
    { id: 'split', icon: Users, label: 'Split' },
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

const SplitExpenses = () => {
  const { members, expenses, addMember, deleteMember, addExpense, deleteExpense } = useSplitStore();
  const { profile } = useUserStore();
  const currency = profile?.currency || 'LKR';
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    if (!memberName) return;
    addMember(memberName);
    setMemberName('');
    setIsAddMemberOpen(false);
  };

  const handleAddExpense = () => {
    if (!expenseDesc || !expenseAmount || !paidBy || selectedMembers.length === 0) return;
    const amount = parseFloat(expenseAmount);
    const splitAmount = amount / (selectedMembers.length + 1); // +1 for the person who paid if they are also part of it
    
    addExpense({
      description: expenseDesc,
      totalAmount: amount,
      paidBy,
      splitWith: selectedMembers.map(mId => ({ memberId: mId, amount: splitAmount })),
      date: new Date().toISOString(),
    });

    setExpenseDesc('');
    setExpenseAmount('');
    setPaidBy('');
    setSelectedMembers([]);
    setIsAddExpenseOpen(false);
  };

  // Calculate balances
  const balances: Record<string, number> = {};
  members.forEach(m => balances[m.id] = 0);

  expenses.forEach(e => {
    // The person who paid is owed
    const totalOwedToPayer = e.splitWith.reduce((acc, sw) => acc + sw.amount, 0);
    balances[e.paidBy] += totalOwedToPayer;

    // The people split with owe
    e.splitWith.forEach(sw => {
      balances[sw.memberId] -= sw.amount;
    });
  });

  return (
    <div className="p-2.5 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-base font-black tracking-tight">Split Expenses</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddMemberOpen(true)}
            className="px-3 py-1.5 bg-bg-2 border border-border rounded-lg text-[9px] font-bold uppercase flex items-center gap-1"
          >
            <Users size={12} /> Add Friend
          </button>
          <button 
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-3 py-1.5 bg-accent text-white rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 shadow-lg shadow-accent/20"
          >
            <Plus size={12} /> Split
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className="mb-6">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-text-3 mb-2">Friends & Balances</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {members.map(m => (
            <div key={m.id} className="min-w-[100px] bg-bg-2 p-2.5 rounded-xl border border-border flex-shrink-0">
              <div className="flex justify-between items-start mb-1">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-[10px]">
                  {m.name[0]}
                </div>
                <button onClick={() => deleteMember(m.id)} className="text-text-3 hover:text-red"><X size={10} /></button>
              </div>
              <p className="text-[10px] font-bold truncate">{m.name}</p>
              <p className={cn(
                "text-[9px] font-black",
                balances[m.id] > 0 ? "text-green" : balances[m.id] < 0 ? "text-red" : "text-text-3"
              )}>
                {balances[m.id] > 0 ? 'Owes you' : balances[m.id] < 0 ? 'You owe' : 'Settled'}
              </p>
              <p className="text-[10px] font-black">{formatCurrency(Math.abs(balances[m.id]), currency)}</p>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-[9px] text-text-3 italic py-4">No friends added yet</p>
          )}
        </div>
      </div>

      {/* Recent Splits */}
      <div className="space-y-2">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-text-3 mb-2">Recent Splits</h3>
        {expenses.map(e => {
          const payer = members.find(m => m.id === e.paidBy);
          return (
            <div key={e.id} className="bg-bg-2 p-3 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-bold">{e.description}</p>
                  <p className="text-[8px] text-text-3 font-bold uppercase">
                    Paid by {payer?.name || 'You'} • {new Date(e.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black">{formatCurrency(e.totalAmount, currency)}</p>
                <button onClick={() => deleteExpense(e.id)} className="text-[8px] text-red font-bold uppercase">Delete</button>
              </div>
            </div>
          );
        })}
        {expenses.length === 0 && (
          <div className="text-center py-12 bg-bg-2 rounded-2xl border border-dashed border-border">
            <Users className="w-8 h-8 text-text-3 mx-auto mb-2 opacity-20" />
            <p className="text-text-3 text-[10px] font-medium">No split expenses yet</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-bg rounded-3xl p-6 shadow-2xl border border-border"
            >
              <h2 className="text-sm font-black uppercase tracking-widest mb-4">Add Friend</h2>
              <input 
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                placeholder="Friend's Name"
                className="w-full bg-bg-2 p-3 rounded-xl text-xs font-bold outline-none border border-border mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsAddMemberOpen(false)} className="flex-1 py-3 bg-bg-2 text-text-2 font-bold rounded-xl">Cancel</button>
                <button onClick={handleAddMember} className="flex-1 py-3 bg-accent text-white font-bold rounded-xl">Add</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-bg rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest">Split Expense</h2>
                <button onClick={() => setIsAddExpenseOpen(false)} className="text-text-3"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-text-3 text-[8px] font-bold uppercase mb-1">Description</p>
                  <input 
                    value={expenseDesc}
                    onChange={e => setExpenseDesc(e.target.value)}
                    placeholder="Dinner, Rent, etc."
                    className="w-full bg-bg-2 p-3 rounded-xl text-xs font-bold outline-none border border-border"
                  />
                </div>
                <div>
                  <p className="text-text-3 text-[8px] font-bold uppercase mb-1">Amount</p>
                  <input 
                    type="number"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-2 p-3 rounded-xl text-xs font-bold outline-none border border-border"
                  />
                </div>
                <div>
                  <p className="text-text-3 text-[8px] font-bold uppercase mb-1">Paid By</p>
                  <select 
                    value={paidBy}
                    onChange={e => setPaidBy(e.target.value)}
                    className="w-full bg-bg-2 p-3 rounded-xl text-xs font-bold outline-none border border-border"
                  >
                    <option value="">Select Payer</option>
                    <option value="local-user">You</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-text-3 text-[8px] font-bold uppercase mb-2">Split With</p>
                  <div className="grid grid-cols-2 gap-2">
                    {members.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          if (selectedMembers.includes(m.id)) {
                            setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                          } else {
                            setSelectedMembers([...selectedMembers, m.id]);
                          }
                        }}
                        className={cn(
                          "p-2 rounded-lg border text-[10px] font-bold transition-all",
                          selectedMembers.includes(m.id) ? "bg-accent text-white border-accent" : "bg-bg-2 text-text-2 border-border"
                        )}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAddExpense}
                  className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 mt-4"
                >
                  Confirm Split
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DevelopedBy />
    </div>
  );
};

const Dashboard = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { transactions } = useTransactionStore();
  const { profile } = useUserStore();
  const { goals } = useGoalStore();
  const { accounts } = useAccountStore();
  const currency = profile?.currency || 'LKR';
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
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
          <div className="flex items-center gap-2 mb-0.5">
            <img src={logo} alt="Logo" className="w-5 h-5 object-contain" />
            <p className="text-text-2 text-[8px] font-medium">Welcome back,</p>
          </div>
          <h1 className="text-sm font-black tracking-tight leading-tight flex items-center gap-1.5">
            {profile?.displayName || 'User'} <Sparkles className="w-3 h-3 text-amber" />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isOffline && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red/10 text-red text-[8px] font-black uppercase rounded-full border border-red/20 animate-pulse">
              <AlertCircle size={10} /> Offline
            </div>
          )}
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

      <DevelopedBy />
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

      <DevelopedBy />
    </div>
  );
};

const Profile = () => {
  const { transactions } = useTransactionStore();
  const { profile, updateProfile } = useUserStore();
  const { recurringTransactions, deleteRecurring, toggleRecurring } = useRecurringStore();
  const { debts, deleteDebt, repayDebt } = useDebtStore();
  const { accounts } = useAccountStore();
  const { goals } = useGoalStore();
  const currency = profile?.currency || 'LKR';

  const handleBackup = () => {
    const data = {
      transactions,
      profile,
      goals,
      accounts,
      recurringTransactions,
      debts
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm('This will overwrite all current data. Are you sure?')) {
          // Manually update each store (this is a bit hacky but works for local-only)
          // In a real app, we'd have a global reset/load function
          localStorage.setItem('transaction-storage', JSON.stringify({ state: { transactions: data.transactions }, version: 0 }));
          localStorage.setItem('user-storage', JSON.stringify({ state: { profile: data.profile }, version: 0 }));
          localStorage.setItem('goal-storage', JSON.stringify({ state: { goals: data.goals }, version: 0 }));
          localStorage.setItem('account-storage', JSON.stringify({ state: { accounts: data.accounts }, version: 0 }));
          localStorage.setItem('recurring-storage', JSON.stringify({ state: { recurringTransactions: data.recurringTransactions }, version: 0 }));
          localStorage.setItem('debt-storage', JSON.stringify({ state: { debts: data.debts }, version: 0 }));
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

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

  const handleExportCSV = () => {
    const data = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Description: t.description,
      Category: t.category,
      Type: t.type,
      Mode: t.mode,
      Amount: t.amount,
      Currency: currency
    }));
    exportToCSV(data, 'ExpenS_Transactions.csv');
  };

  const toggleTheme = () => {
    updateProfile({ theme: profile?.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleSetPIN = () => {
    const pin = window.prompt('Enter new 4-digit PIN:');
    if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
      updateProfile({ security: { ...profile?.security, pin, isLocked: false } });
      alert('PIN set successfully!');
    } else if (pin) {
      alert('Invalid PIN. Please enter 4 digits.');
    }
  };

  const toggleLock = () => {
    if (!profile?.security?.pin) {
      alert('Please set a PIN first.');
      return;
    }
    updateProfile({ security: { ...profile.security, isLocked: !profile.security.isLocked } });
  };

  const toggleBiometric = async () => {
    if (!profile?.security?.biometricEnabled) {
      if (window.PublicKeyCredential) {
        try {
          const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isAvailable) {
            updateProfile({ security: { ...profile?.security, biometricEnabled: true } });
            alert('Biometric lock enabled!');
          } else {
            alert('Biometric authentication is not available on this device.');
          }
        } catch (e) {
          console.error(e);
          alert('Failed to enable biometric lock.');
        }
      } else {
        alert('Biometric authentication is not supported by this browser.');
      }
    } else {
      updateProfile({ security: { ...profile?.security, biometricEnabled: false } });
    }
  };

  return (
    <div className="p-2.5 pb-20">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-base font-black tracking-tight">Profile</h1>
        <button 
          onClick={toggleTheme}
          className="p-1.5 bg-bg-2 rounded-lg border border-border text-text-2 hover:text-accent transition-colors"
        >
          {profile?.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
      
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
        {/* Security & Theme */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2 mb-3">Security & Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleSetPIN}
              className="flex items-center gap-2 p-2 bg-bg-3 rounded-lg border border-border/50 text-left"
            >
              <div className="w-6 h-6 rounded bg-accent/10 text-accent flex items-center justify-center">
                <Lock size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">{profile?.security?.pin ? 'Change PIN' : 'Set PIN'}</p>
                <p className="text-[7px] text-text-3">App Protection</p>
              </div>
            </button>
            <button 
              onClick={toggleLock}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                profile?.security?.isLocked ? "bg-accent/10 border-accent text-accent" : "bg-bg-3 border-border/50 text-text-2"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center",
                profile?.security?.isLocked ? "bg-accent text-white" : "bg-text-3/10 text-text-3"
              )}>
                <Lock size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">Lock App</p>
                <p className="text-[7px] text-text-3">{profile?.security?.isLocked ? 'Locked' : 'Unlocked'}</p>
              </div>
            </button>
            <button 
              onClick={toggleBiometric}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                profile?.security?.biometricEnabled ? "bg-accent/10 border-accent text-accent" : "bg-bg-3 border-border/50 text-text-2"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center",
                profile?.security?.biometricEnabled ? "bg-accent text-white" : "bg-text-3/10 text-text-3"
              )}>
                <Shield size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">Biometric</p>
                <p className="text-[7px] text-text-3">{profile?.security?.biometricEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Export & Data */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2 mb-3">Export & Data</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 p-2 bg-bg-3 rounded-lg border border-border/50 text-left"
            >
              <div className="w-6 h-6 rounded bg-red/10 text-red flex items-center justify-center">
                <Download size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">Export PDF</p>
                <p className="text-[7px] text-text-3">Financial Report</p>
              </div>
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 p-2 bg-bg-3 rounded-lg border border-border/50 text-left"
            >
              <div className="w-6 h-6 rounded bg-green/10 text-green flex items-center justify-center">
                <FileSpreadsheet size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">Export CSV</p>
                <p className="text-[7px] text-text-3">Excel Compatible</p>
              </div>
            </button>
            <button 
              onClick={handleBackup}
              className="flex items-center gap-2 p-2 bg-bg-3 rounded-lg border border-border/50 text-left"
            >
              <div className="w-6 h-6 rounded bg-accent/10 text-accent flex items-center justify-center">
                <Upload size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">Backup Data</p>
                <p className="text-[7px] text-text-3">Save to JSON</p>
              </div>
            </button>
            <label className="flex items-center gap-2 p-2 bg-bg-3 rounded-lg border border-border/50 text-left cursor-pointer">
              <div className="w-6 h-6 rounded bg-orange/10 text-orange flex items-center justify-center">
                <Download size={12} className="rotate-180" />
              </div>
              <div>
                <p className="text-[9px] font-bold">Restore Data</p>
                <p className="text-[7px] text-text-3">Load from JSON</p>
              </div>
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
            <a 
              href="https://www.esystemlk.xyz/expens/reports"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-bg-3 rounded-lg border border-border/50 text-left"
            >
              <div className="w-6 h-6 rounded bg-red/10 text-red flex items-center justify-center">
                <AlertTriangle size={12} />
              </div>
              <div>
                <p className="text-[9px] font-bold">Bug Report</p>
                <p className="text-[7px] text-text-3">Report Issues</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recurring Transactions */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">Recurring Payments</h3>
            <button 
              onClick={() => (window as any).openAddRecurring()}
              className="text-accent text-[8px] font-bold flex items-center gap-1"
            >
              Add <Plus size={8} />
            </button>
          </div>
          <div className="space-y-2">
            {recurringTransactions.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 bg-bg-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center",
                    r.type === 'EXPENSE' ? "bg-red/10 text-red" : "bg-green/10 text-green"
                  )}>
                    <Repeat size={12} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold">{r.description}</p>
                    <p className="text-[7px] text-text-3 font-bold uppercase">{r.frequency} • {formatCurrency(r.amount, currency)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleRecurring(r.id)}
                    className={cn(
                      "text-[7px] font-bold uppercase px-1.5 py-0.5 rounded",
                      r.isActive ? "bg-green/10 text-green" : "bg-text-3/10 text-text-3"
                    )}
                  >
                    {r.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button 
                    onClick={() => deleteRecurring(r.id)}
                    className="text-text-3 hover:text-red transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
            {recurringTransactions.length === 0 && (
              <p className="text-[8px] text-text-3 text-center py-2 italic">No recurring payments set up</p>
            )}
          </div>
        </div>

        {/* Debts & Loans */}
        <div className="bg-bg-2 p-3 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-text-2">Debts & Loans</h3>
            <button 
              onClick={() => (window as any).openAddDebt()}
              className="text-accent text-[8px] font-bold flex items-center gap-1"
            >
              Add <Plus size={8} />
            </button>
          </div>
          <div className="space-y-2">
            {debts.filter(d => d.status === 'ACTIVE').map(d => (
              <div key={d.id} className="p-2 bg-bg-3 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center",
                      d.type === 'OWED_BY_ME' ? "bg-red/10 text-red" : "bg-green/10 text-green"
                    )}>
                      <HandCoins size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold">{d.title}</p>
                      <p className="text-[7px] text-text-3 font-bold uppercase">{d.person}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black">{formatCurrency(d.currentAmount, currency)}</p>
                    <p className="text-[6px] text-text-3 font-bold uppercase">of {formatCurrency(d.amount, currency)}</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <button 
                    onClick={() => {
                      const amount = parseFloat(prompt('Enter repayment amount:') || '0');
                      if (amount > 0) repayDebt(d.id, amount);
                    }}
                    className="flex-1 py-1 bg-accent/10 text-accent text-[7px] font-bold rounded uppercase"
                  >
                    Repay
                  </button>
                  <button 
                    onClick={() => deleteDebt(d.id)}
                    className="px-2 py-1 bg-red/10 text-red text-[7px] font-bold rounded uppercase"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {debts.filter(d => d.status === 'ACTIVE').length === 0 && (
              <p className="text-[8px] text-text-3 text-center py-2 italic">No active debts or loans</p>
            )}
          </div>
        </div>

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
          <button 
            onClick={handleBackup}
            className="w-full flex items-center gap-2 p-2 bg-bg-2 rounded-lg border border-border active:bg-bg-3 text-left"
          >
            <div className="w-6.5 h-6.5 rounded-lg bg-bg-3 flex items-center justify-center">
              <Download className="text-accent w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold">Backup Data</p>
              <p className="text-[7px] text-text-2">Export all data to JSON</p>
            </div>
            <ChevronRight className="text-text-3 w-3 h-3" />
          </button>

          <label className="w-full flex items-center gap-2 p-2 bg-bg-2 rounded-lg border border-border active:bg-bg-3 text-left cursor-pointer">
            <div className="w-6.5 h-6.5 rounded-lg bg-bg-3 flex items-center justify-center">
              <Upload className="text-accent w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold">Restore Data</p>
              <p className="text-[7px] text-text-2">Import data from backup file</p>
            </div>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            <ChevronRight className="text-text-3 w-3 h-3" />
          </label>

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

        <DevelopedBy />
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
      <DevelopedBy />
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || t.type === filter;
    
    const tDate = new Date(t.date);
    const matchesStartDate = !startDate || tDate >= new Date(startDate);
    const matchesEndDate = !endDate || tDate <= new Date(endDate + 'T23:59:59');
    
    return matchesSearch && matchesFilter && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="p-2.5 pb-20">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-base font-black tracking-tight">History</h1>
        <div className="flex gap-1.5">
          <button 
            onClick={() => {
              const data = filtered.map(t => ({
                Date: new Date(t.date).toLocaleDateString(),
                Description: t.description,
                Category: t.category,
                Type: t.type,
                Mode: t.mode,
                Amount: t.amount
              }));
              exportToCSV(data, 'ExpenS_Filtered_Transactions.csv');
            }}
            className="p-1.5 bg-bg-2 rounded-lg border border-border text-text-2 hover:text-accent transition-colors"
            title="Export to CSV"
          >
            <FileSpreadsheet size={12} />
          </button>
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

      <div className="space-y-2 mb-3">
        <div className="bg-bg-2 p-2 rounded-xl border border-border flex items-center gap-2">
          <Search className="text-text-3 w-3.5 h-3.5" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="bg-transparent outline-none flex-1 text-[10px] font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg-2 p-2 rounded-xl border border-border flex items-center gap-2">
            <Calendar className="text-text-3 w-3.5 h-3.5" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none flex-1 text-[8px] font-bold text-text uppercase"
            />
          </div>
          <div className="bg-bg-2 p-2 rounded-xl border border-border flex items-center gap-2">
            <Calendar className="text-text-3 w-3.5 h-3.5" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none flex-1 text-[8px] font-bold text-text uppercase"
            />
          </div>
        </div>
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

      <DevelopedBy />
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

const AddRecurringSheet = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const { accounts } = useAccountStore();
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const addRecurring = useRecurringStore(state => state.addRecurring);

  const handleSave = async () => {
    if (!description || !accountId) return;
    await addRecurring({
      type,
      amount: parseFloat(amount),
      accountId,
      description,
      category,
      frequency,
      startDate: new Date(startDate).toISOString(),
      isActive: true,
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
          <h2 className="text-sm font-black uppercase tracking-widest">Recurring Transaction</h2>
          <button onClick={onClose} className="w-7 h-7 bg-bg-2 rounded-full flex items-center justify-center text-text-2">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex bg-bg-2 p-1 rounded-lg">
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

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Description</p>
            <input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Rent, Netflix"
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-2 p-2 rounded-lg border border-border">
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Amount</p>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-xs text-text font-bold outline-none"
              />
            </div>
            <div className="bg-bg-2 p-2 rounded-lg border border-border">
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Frequency</p>
              <select 
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full bg-transparent text-xs text-text font-bold outline-none"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-2 p-2 rounded-lg border border-border">
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Account</p>
              <select 
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-transparent text-xs text-text font-bold outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-bg-2 p-2 rounded-lg border border-border">
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Start Date</p>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-[10px] text-text font-bold outline-none"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-6 py-3 gradient-fab text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-transform"
        >
          Add Recurring
        </button>
      </motion.div>
    </div>
  );
};

const AddDebtSheet = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('0');
  const [type, setType] = useState<'OWED_TO_ME' | 'OWED_BY_ME'>('OWED_BY_ME');
  const [dueDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const addDebt = useDebtStore(state => state.addDebt);

  const handleSave = async () => {
    if (!title || !person) return;
    await addDebt({
      title,
      person,
      amount: parseFloat(amount),
      currentAmount: parseFloat(amount),
      type,
      dueDate: new Date(dueDate).toISOString(),
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
          <h2 className="text-sm font-black uppercase tracking-widest">New Debt/Loan</h2>
          <button onClick={onClose} className="w-7 h-7 bg-bg-2 rounded-full flex items-center justify-center text-text-2">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex bg-bg-2 p-1 rounded-lg">
            <button 
              onClick={() => setType('OWED_BY_ME')}
              className={cn("flex-1 py-1 rounded-md text-[10px] font-bold transition-all", type === 'OWED_BY_ME' ? "bg-red text-white shadow-md" : "text-text-2")}
            >
              I Owe
            </button>
            <button 
              onClick={() => setType('OWED_TO_ME')}
              className={cn("flex-1 py-1 rounded-md text-[10px] font-bold transition-all", type === 'OWED_TO_ME' ? "bg-green text-white shadow-md" : "text-text-2")}
            >
              Owed to Me
            </button>
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Title</p>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Home Loan, Lunch Money"
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            />
          </div>

          <div className="bg-bg-2 p-2 rounded-lg border border-border">
            <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Person/Institution</p>
            <input 
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Who is this with?"
              className="w-full bg-transparent text-xs text-text font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-2 p-2 rounded-lg border border-border">
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Amount</p>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-xs text-text font-bold outline-none"
              />
            </div>
            <div className="bg-bg-2 p-2 rounded-lg border border-border">
              <p className="text-text-3 text-[7px] font-bold uppercase mb-0.5">Due Date</p>
              <input 
                type="date"
                value={dueDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-[10px] text-text font-bold outline-none"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-6 py-3 gradient-fab text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-transform"
        >
          Add Debt
        </button>
      </motion.div>
    </div>
  );
};

const AgreementModal = ({ onAccept }: { onAccept: () => void }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-2 border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
          <AlertCircle className="text-accent w-6 h-6" />
        </div>
        
        <h2 className="text-lg font-black tracking-tight mb-2">Welcome to ExpenS</h2>
        <p className="text-text-2 text-[10px] leading-relaxed mb-4">
          By using this app, you agree to our terms of service and privacy policy. 
          Please note that this application is currently <span className="text-accent font-bold">under development</span>.
        </p>
        
        <div className="bg-bg-3 rounded-lg p-3 border border-border/50 mb-6">
          <p className="text-[9px] text-text-2 leading-relaxed">
            If you encounter any bugs, issues, or have suggestions, please send a bug report using the button in the <span className="font-bold">Profile</span> section.
          </p>
        </div>
        
        <button 
          onClick={onAccept}
          className="w-full py-3 bg-accent text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 active:scale-95 transition-transform"
        >
          I UNDERSTAND & ACCEPT
        </button>
      </motion.div>
    </div>
  );
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { profile, updateProfile } = useUserStore();
  const { recurringTransactions, updateRecurring } = useRecurringStore();
  const { addTransaction } = useTransactionStore();
  const { updateBalance } = useAccountStore();

  useEffect(() => {
    (window as any).openAddAccount = () => setIsAddAccountOpen(true);
    (window as any).openAddRecurring = () => setIsAddRecurringOpen(true);
    (window as any).openAddDebt = () => setIsAddDebtOpen(true);
  }, []);

  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  // Apply Dark Mode
  useEffect(() => {
    if (profile?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.theme]);

  // Weekly Summary Trigger (Show on Sunday)
  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const lastSummaryDate = localStorage.getItem('last_weekly_summary_date');
    const todayStr = today.toISOString().split('T')[0];

    if (isSunday && lastSummaryDate !== todayStr) {
      setShowWeeklySummary(true);
      localStorage.setItem('last_weekly_summary_date', todayStr);
    }
  }, []);

  // Process Recurring Transactions
  useEffect(() => {
    if (isLoading) return;

    const processRecurring = async () => {
      const now = new Date();
      const processedIds: string[] = [];

      for (const recurring of recurringTransactions) {
        if (!recurring.isActive) continue;

        let nextDate = new Date(recurring.nextDate);
        
        while (nextDate <= now) {
          // Add transaction
          addTransaction({
            type: recurring.type,
            amount: recurring.amount,
            accountId: recurring.accountId,
            description: `[Recurring] ${recurring.description}`,
            category: recurring.category,
            mode: 'PERSONAL',
            date: nextDate.toISOString(),
          });

          // Update account balance
          updateBalance(recurring.accountId, recurring.amount, recurring.type);

          // Calculate next date
          const newNextDate = new Date(nextDate);
          if (recurring.frequency === 'DAILY') newNextDate.setDate(newNextDate.getDate() + 1);
          else if (recurring.frequency === 'WEEKLY') newNextDate.setDate(newNextDate.getDate() + 7);
          else if (recurring.frequency === 'MONTHLY') newNextDate.setMonth(newNextDate.getMonth() + 1);
          else if (recurring.frequency === 'YEARLY') newNextDate.setFullYear(newNextDate.getFullYear() + 1);
          
          nextDate = newNextDate;
          processedIds.push(recurring.id);
        }

        if (processedIds.includes(recurring.id)) {
          updateRecurring(recurring.id, { 
            lastProcessed: now.toISOString(),
            nextDate: nextDate.toISOString()
          });
        }
      }
    };

    processRecurring();
  }, [isLoading, recurringTransactions.length]);

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
          <div className="w-16 h-16 mb-4 mx-auto drop-shadow-2xl">
            <img src={logo} alt="Logo" className="w-full h-full object-contain animate-float" />
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

  if (profile?.security?.isLocked) {
    return <LockScreen onUnlock={() => updateProfile({ security: { ...profile.security, isLocked: false } })} />;
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
          {activeTab === 'split' && <SplitExpenses />}
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
        {isAddRecurringOpen && (
          <AddRecurringSheet isOpen={isAddRecurringOpen} onClose={() => setIsAddRecurringOpen(false)} />
        )}
        {isAddDebtOpen && (
          <AddDebtSheet isOpen={isAddDebtOpen} onClose={() => setIsAddDebtOpen(false)} />
        )}
        {showWeeklySummary && (
          <WeeklySummary onClose={() => setShowWeeklySummary(false)} />
        )}
        {!profile?.agreedToTerms && (
          <AgreementModal onAccept={() => updateProfile({ agreedToTerms: true })} />
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

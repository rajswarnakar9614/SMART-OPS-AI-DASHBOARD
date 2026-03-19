/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, MessageSquare, TrendingUp, Package, BarChart3, 
  Settings, ShieldCheck, Bell, User, Search, ArrowRight, 
  CheckCircle2, AlertTriangle, Clock, Filter, ChevronRight,
  Zap, Target, Users, Wallet, Activity, Shield, Send, Bot, User as UserIcon,
  Plus, MoreVertical, RefreshCw, Download, ExternalLink, X, ShoppingCart, MapPin, Star, Volume2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatINR = (val: number) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(val);

// --- Mock Data ---
const SALES_DATA = [
  { name: '01 Mar', sales: 42000 }, { name: '05 Mar', sales: 58000 },
  { name: '10 Mar', sales: 45000 }, { name: '15 Mar', sales: 89000 },
  { name: '20 Mar', sales: 62000 }, { name: '25 Mar', sales: 95000 },
  { name: '30 Mar', sales: 112000 },
];

const FORECAST_DATA = [
  { name: 'Apr', demand: 120000 }, { name: 'May', demand: 145000 },
  { name: 'Jun', demand: 138000 }, { name: 'Jul', demand: 165000 },
];

const LEAD_SCORES = [
  { range: '0-20', count: 45 }, { range: '21-40', count: 82 },
  { range: '41-60', count: 156 }, { range: '61-80', count: 94 },
  { range: '81-100', count: 38 },
];

const CHAT_LOGS = [
  { id: 1, query: "Price of ProCrunch Masala?", intent: "Inquiry", status: "Resolved (AI)" },
  { id: 2, query: "Bulk order for Fitbite bars?", intent: "Purchase", status: "Lead Created" },
  { id: 3, query: "Where is my order #IND992?", intent: "Support", status: "Escalated" },
  { id: 4, query: "Makhana health benefits?", intent: "Inquiry", status: "Resolved (AI)" },
];

const INVENTORY = [
  { id: 1, name: "ProCrunch Masala (500g)", stock: 450, threshold: 100, supplierId: 1, status: "Healthy" },
  { id: 2, name: "Fitbite Snack Bar - Choco", stock: 12, threshold: 50, supplierId: 2, status: "Low Stock" },
  { id: 3, name: "Premium Fox Nuts (Makhana)", stock: 85, threshold: 40, supplierId: 1, status: "Healthy" },
  { id: 4, name: "Spicy Moong Dal (200g)", stock: 120, threshold: 30, supplierId: 3, status: "Healthy" },
  { id: 5, name: "Roasted Peanut Mix", stock: 65, threshold: 25, supplierId: 2, status: "Healthy" },
];

const SUPPLIERS = [
  { id: 1, name: "Bharat FMCG Logistics", contact: "Rajesh Kumar", phone: "+91 98765 43210", email: "orders@bharatfmcg.in", category: "Snacks" },
  { id: 2, name: "HealthyBites Wholesale", contact: "Anjali Gupta", phone: "+91 87654 32109", email: "anjali@healthybites.com", category: "Health Bars" },
  { id: 3, name: "Namkeen World Dist.", contact: "Vikram Singh", phone: "+91 76543 21098", email: "sales@namkeenworld.com", category: "Traditional Snacks" },
];

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg glass-card p-6 shadow-2xl border border-white/10"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const GlassCard = ({ children, className, style }: any) => (
  <div className={cn("glass-card p-6 relative overflow-hidden group", className)}>
    <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    {children}
  </div>
);

const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
  <GlassCard className="border-l-4 group" style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white neon-text-blue">{value}</h3>
        {change && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn("text-[10px] font-black", change.startsWith('+') ? "text-emerald-400" : "text-rose-500")}>
              {change}
            </span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase">vs last month</span>
          </div>
        )}
      </div>
      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </GlassCard>
);

// --- Panels ---

const Overview = ({ inventory, leads }: any) => {
  const lowStockCount = inventory.filter((i: any) => i.stock < i.threshold).length;
  const totalLeadValue = leads.reduce((acc: number, lead: any) => acc + lead.val, 0);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Leads" value={leads.length.toString()} change="+12.5%" icon={Users} color="#00f2ff" />
        <MetricCard title="Pipeline Value" value={formatINR(totalLeadValue)} change="+8.2%" icon={Wallet} color="#bc13fe" />
        <MetricCard title="Low Stock" value={lowStockCount.toString()} change={lowStockCount > 0 ? "Action Required" : "Healthy"} icon={Package} color={lowStockCount > 0 ? "#f43f5e" : "#39ff14"} />
        <MetricCard title="Active Users" value="856" change="-1.4%" icon={Zap} color="#ff00e0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-neon-blue" />
              Recent Transactions
            </h3>
            <button className="text-[10px] font-bold text-neon-blue hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4 px-2">Order ID</th>
                  <th className="pb-4 px-2">Customer</th>
                  <th className="pb-4 px-2">Amount</th>
                  <th className="pb-4 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { id: "#IND-9942", name: "Kiran Supermart", amt: 12400, status: "Paid" },
                  { id: "#IND-9941", name: "Organic Hub", amt: 8500, status: "Processing" },
                  { id: "#IND-9940", name: "Metro Retail", amt: 45200, status: "Paid" },
                  { id: "#IND-9939", name: "Zomato Blink", amt: 2100, status: "Shipped" },
                  { id: "#IND-9938", name: "Reliance Fresh", amt: 98000, status: "Paid" },
                ].map((tx) => (
                  <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2 text-xs font-bold text-zinc-400">{tx.id}</td>
                    <td className="py-4 px-2 text-sm font-bold text-white">{tx.name}</td>
                    <td className="py-4 px-2 text-sm font-black text-neon-green">{formatINR(tx.amt)}</td>
                    <td className="py-4 px-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                        tx.status === "Paid" ? "bg-emerald-500/20 text-emerald-400" : 
                        tx.status === "Processing" ? "bg-neon-blue/20 text-neon-blue" : "bg-neon-purple/20 text-neon-purple"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-4 h-4 text-neon-purple" />
            Top Selling Products
          </h3>
          <div className="space-y-6">
            {inventory.slice(0, 4).map((prod: any, i: number) => (
              <div key={prod.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: i % 2 === 0 ? "#00f2ff" : "#bc13fe" }} />
                  <div>
                    <p className="text-sm font-bold text-white">{prod.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{prod.stock} Units In Stock</p>
                  </div>
                </div>
                <span className={cn("text-xs font-black", prod.stock > prod.threshold ? "text-neon-green" : "text-rose-500")}>
                  {prod.stock > prod.threshold ? "+Stable" : "-Low"}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard>
          <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neon-green" />
            Regional Performance
          </h3>
          <div className="space-y-4">
            {[
              { region: "Mumbai Metro", share: 42, color: "#00f2ff" },
              { region: "Delhi NCR", share: 28, color: "#bc13fe" },
              { region: "Bangalore Hub", share: 18, color: "#39ff14" },
              { region: "Others", share: 12, color: "#ff00e0" },
            ].map((reg) => (
              <div key={reg.region} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-zinc-400">{reg.region}</span>
                  <span className="text-white">{reg.share}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${reg.share}%` }}
                    className="h-full"
                    style={{ backgroundColor: reg.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-neon-blue" />
            Lead Pipeline Status
          </h3>
          <div className="space-y-4">
            {[
              { stage: "New Leads", count: leads.filter((l: any) => l.status === 'Initial Contact').length, color: "#00f2ff" },
              { stage: "Proposal", count: leads.filter((l: any) => l.status === 'Proposal').length, color: "#bc13fe" },
              { stage: "Negotiation", count: leads.filter((l: any) => l.status === 'Negotiation').length, color: "#39ff14" },
              { stage: "Closed", count: 95, color: "#ff00e0" },
            ].map((stage) => (
              <div key={stage.stage} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-bold text-zinc-300">{stage.stage}</span>
                </div>
                <span className="text-sm font-black text-white">{stage.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="bg-rose-500/5 border-rose-500/20">
          <h3 className="text-sm font-bold text-rose-500 mb-6 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Critical Alerts
          </h3>
          <div className="space-y-4">
            {inventory.filter((i: any) => i.stock < i.threshold).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-rose-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-rose-500" />
                  <div>
                    <p className="text-xs font-bold text-zinc-200">Restock {item.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Stock: {item.stock}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
              </div>
            ))}
            {leads.filter((l: any) => l.val > 200000).map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-neon-blue/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-neon-blue" />
                  <div>
                    <p className="text-xs font-bold text-zinc-200">High Value: {lead.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{formatINR(lead.val)}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

const AIChatbot = ({ inventory, sales, onAction }: any) => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your SmartOps AI assistant. How can I help you optimize your business today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "Which products are low on stock?",
    "Analyze my sales performance",
    "How many high-value leads do I have?",
    "Give me business growth tips"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Live dynamic context from the app state
      const lowStockItems = inventory.filter((i: any) => i.stock < i.threshold);
      const highValueLeads = sales.filter((l: any) => l.val > 100000);
      
      const businessContext = `
        Current LIVE Business State:
        - Total Inventory Items: ${inventory.length}
        - Low Stock Items: ${lowStockItems.length} (${lowStockItems.map((i: any) => i.name).join(', ')})
        - Total Leads: ${sales.length}
        - High Value Leads (>1L): ${highValueLeads.length}
        - Top Lead: ${sales.sort((a: any, b: any) => b.val - a.val)[0]?.name}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMsg].map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: `You are SmartOps AI, a specialized business assistant for Indian SME owners. 
          You help with inventory management, sales strategy, and operational efficiency. 
          Use Indian business context and currency (INR) where appropriate. 
          Be concise, professional, and data-driven.
          
          ${businessContext}
          
          When asked about business performance, refer to the LIVE data provided above. 
          If asked to "restock" or "add a lead", tell the user you can help with that and suggest they use the respective panels, or if you had tools you would use them.`
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI intelligence. Please check your network or API configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you now?' }]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-280px)] flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="AI Accuracy" value="98.2%" change="+0.5%" icon={CheckCircle2} color="#39ff14" />
        <MetricCard title="Response Time" value="1.2s" change="-0.2s" icon={Zap} color="#00f2ff" />
        <MetricCard title="Leads Captured" value="142" change="+12" icon={Target} color="#bc13fe" />
      </div>

      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">SmartOps Intelligence</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online & Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-rose-500"
              title="Clear Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {quickActions.map(action => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:border-neon-blue/50 hover:bg-white/10 transition-all group"
                >
                  <p className="text-xs font-bold text-zinc-400 group-hover:text-neon-blue transition-colors">{action}</p>
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-neon-purple/20 text-neon-purple" : "bg-neon-blue/20 text-neon-blue"
              )}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed relative group/msg",
                msg.role === 'user' 
                  ? "bg-neon-purple/10 text-zinc-200 rounded-tr-none border border-neon-purple/20" 
                  : "bg-white/5 text-zinc-300 rounded-tl-none border border-white/10"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => {
                      const utterance = new SpeechSynthesisUtterance(msg.content);
                      utterance.rate = 1.1;
                      window.speechSynthesis.speak(utterance);
                    }}
                    className="absolute -right-10 top-0 p-2 opacity-0 group-hover/msg:opacity-100 transition-opacity text-zinc-500 hover:text-neon-blue"
                    title="Read Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-neon-blue" />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about inventory, sales trends, or business advice..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-blue/50 transition-all"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading}
              className="bg-neon-blue text-black p-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const SalesCRM = ({ leads, onSelectLead }: any) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Lead Pipeline</h3>
            <button className="text-xs font-bold text-neon-blue flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> Add New Lead
            </button>
          </div>
          <div className="space-y-3">
            {leads.map((lead: any) => (
              <div 
                key={lead.id} 
                onClick={() => onSelectLead(lead)}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-blue/30 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-black">
                    {lead.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-neon-blue transition-colors">{lead.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lead.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-neon-green">{formatINR(lead.val)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-neon-purple" style={{ width: `${lead.score}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500">{lead.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">Conversion Funnel</h3>
            <div className="space-y-6">
              {[
                { label: "Awareness", val: 1200, color: "#00f2ff" },
                { label: "Interest", val: 850, color: "#bc13fe" },
                { label: "Decision", val: 420, color: "#ff00e0" },
                { label: "Action", val: 156, color: "#39ff14" }
              ].map((step, i) => (
                <div key={step.label} className="relative">
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                    <span className="text-zinc-500">{step.label}</span>
                    <span className="text-white">{step.val}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(step.val / 1200) * 100}%` }}
                      className="h-full"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          
          <GlassCard className="bg-neon-blue/5 border-neon-blue/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-neon-blue/20">
                <TrendingUp className="w-4 h-4 text-neon-blue" />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">AI Prediction</p>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Based on current trends, we expect a <span className="text-neon-green font-bold">15% increase</span> in bulk orders from North India next month.
            </p>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
};

const InventoryOps = ({ items, setItems, suppliers, reorderLogs, setReorderLogs }: any) => {
  const [isRestocking, setIsRestocking] = useState<number | null>(null);
  const [view, setView] = useState<'inventory' | 'suppliers'>('inventory');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Automated Reorder Trigger Logic
  useEffect(() => {
    items.forEach((item: any) => {
      if (item.stock < item.threshold && !reorderLogs.some((log: any) => log.itemId === item.id && log.status === 'Pending')) {
        const supplier = suppliers.find((s: any) => s.id === item.supplierId);
        const newLog = {
          id: Date.now() + item.id,
          itemId: item.id,
          itemName: item.name,
          supplierName: supplier?.name,
          timestamp: new Date().toLocaleTimeString(),
          status: 'Pending',
          quantity: item.threshold * 2
        };
        setReorderLogs((prev: any) => [newLog, ...prev]);
      }
    });
  }, [items, suppliers, reorderLogs, setReorderLogs]);

  const handleRestock = (id: number) => {
    setIsRestocking(id);
    setTimeout(() => {
      setItems((prev: any) => prev.map((item: any) => 
        item.id === id ? { ...item, stock: item.stock + 100, status: "Healthy" } : item
      ));
      setReorderLogs((prev: any) => prev.map((log: any) => 
        log.itemId === id ? { ...log, status: 'Completed' } : log
      ));
      setIsRestocking(null);
    }, 1500);
  };

  const updateThreshold = (id: number, newThreshold: number) => {
    setItems((prev: any) => prev.map((item: any) => 
      item.id === id ? { ...item, threshold: newThreshold } : item
    ));
    setEditingItem(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-4 mb-2">
        <button 
          onClick={() => setView('inventory')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black transition-all border",
            view === 'inventory' ? "bg-neon-blue text-black border-neon-blue" : "bg-white/5 text-zinc-500 border-white/10 hover:text-white"
          )}
        >
          Inventory Management
        </button>
        <button 
          onClick={() => setView('suppliers')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black transition-all border",
            view === 'suppliers' ? "bg-neon-blue text-black border-neon-blue" : "bg-white/5 text-zinc-500 border-white/10 hover:text-white"
          )}
        >
          Supplier Directory
        </button>
      </div>

      {view === 'inventory' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Total SKU" value="124" icon={Package} color="#00f2ff" />
            <MetricCard title="Auto-Reorders" value={reorderLogs.filter(l => l.status === 'Pending').length} icon={RefreshCw} color="#bc13fe" />
            <MetricCard title="Stock Health" value="92%" icon={Activity} color="#39ff14" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Live Stock & Thresholds</h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 px-2">Product Details</th>
                      <th className="pb-4 px-2">Stock / Threshold</th>
                      <th className="pb-4 px-2">Supplier</th>
                      <th className="pb-4 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map(item => {
                      const supplier = suppliers.find(s => s.id === item.supplierId);
                      const isLow = item.stock < item.threshold;
                      return (
                        <tr key={item.id} className={cn("group transition-all", isLow && "bg-rose-500/5")}>
                          <td className="py-4 px-2">
                            <p className="text-sm font-bold text-white">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">SKU: IND-{1000 + item.id}</p>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className={cn("text-sm font-black", isLow ? "text-rose-500" : "text-zinc-300")}>
                                  {item.stock} <span className="text-[10px] text-zinc-600 font-normal">/ {item.threshold}</span>
                                </span>
                                <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                  <div 
                                    className={cn("h-full transition-all duration-1000", isLow ? "bg-rose-500" : "bg-neon-blue")} 
                                    style={{ width: `${Math.min((item.stock / (item.threshold * 2)) * 100, 100)}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <p className="text-xs text-zinc-400">{supplier?.name}</p>
                            <p className="text-[10px] text-zinc-600">{supplier?.contact}</p>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingItem(item)}
                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-zinc-500 hover:text-neon-blue transition-colors"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleRestock(item.id)}
                                disabled={isRestocking === item.id}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                                  isLow 
                                    ? "bg-neon-blue text-black hover:brightness-110" 
                                    : "bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                                )}
                              >
                                {isRestocking === item.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                {isRestocking === item.id ? "..." : "Restock"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">Auto-Reorder Logs</h3>
              <div className="space-y-4">
                {reorderLogs.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic text-center py-8">No active reorder workflows.</p>
                ) : (
                  reorderLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-white">{log.itemName}</p>
                          <p className="text-[10px] text-zinc-500">{log.supplierName}</p>
                        </div>
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                          log.status === 'Pending' ? "bg-neon-purple/20 text-neon-purple animate-pulse" : "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-zinc-600 font-bold uppercase">
                        <span>Qty: {log.quantity}</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(supplier => (
            <GlassCard key={supplier.id} className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                  {supplier.category}
                </span>
              </div>
              <div>
                <h4 className="text-lg font-black text-white">{supplier.name}</h4>
                <p className="text-sm text-zinc-400 mb-4">{supplier.contact}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>Response: ~4h</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Target className="w-3 h-3" />
                    <span>Reliability: 98%</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button className="flex-1 bg-white/5 border border-white/10 text-zinc-300 py-2 rounded-lg text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Contact
                </button>
                <button className="p-2 bg-white/5 border border-white/10 text-zinc-500 rounded-lg hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
          <GlassCard className="border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center justify-center text-center py-12 group hover:border-neon-blue/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-neon-blue transition-colors mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">Register New Supplier</p>
          </GlassCard>
        </div>
      )}

      <Modal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        title="Inventory Configuration"
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Product</p>
              <p className="text-lg font-black text-white">{editingItem.name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                  Reorder Threshold (Units)
                </label>
                <input 
                  type="number" 
                  defaultValue={editingItem.threshold}
                  onChange={(e) => editingItem.threshold = parseInt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-blue/50 transition-all"
                />
                <p className="text-[10px] text-zinc-500 mt-2">
                  System will automatically trigger a reorder when stock falls below this value.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                  Primary Supplier
                </label>
                <select 
                  defaultValue={editingItem.supplierId}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-blue/50 transition-all appearance-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => updateThreshold(editingItem.id, editingItem.threshold)}
                className="flex-1 bg-neon-blue text-black font-black py-3 rounded-xl hover:brightness-110 transition-all"
              >
                Save Configuration
              </button>
              <button 
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

const Analytics = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard>
        <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">Sales Trend (30D)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SALES_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #ffffff10' }} />
              <Line type="monotone" dataKey="sales" stroke="#00f2ff" strokeWidth={3} dot={{ r: 4, fill: '#00f2ff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-widest">Demand Forecast</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FORECAST_DATA}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #ffffff10' }} />
              <Area type="monotone" dataKey="demand" stroke="#bc13fe" fillOpacity={1} fill="url(#colorDemand)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { label: "Top Region", val: "Mumbai Metro" },
        { label: "Peak Hours", val: "11 AM - 3 PM" },
        { label: "Top Product", val: "ProCrunch Masala" }
      ].map(i => (
        <GlassCard key={i.label} className="text-center">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{i.label}</p>
          <p className="text-lg font-black text-white">{i.val}</p>
        </GlassCard>
      ))}
    </div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [active, setActive] = useState('Overview');
  
  // Lifted State
  const [inventory, setInventory] = useState(INVENTORY);
  const [suppliers] = useState(SUPPLIERS);
  const [reorderLogs, setReorderLogs] = useState<any[]>([]);
  const [leads, setLeads] = useState([
    { id: 1, name: "Reliance Retail", val: 450000, status: "Negotiation", score: 85, contact: "Amit Shah", email: "amit@reliance.com" },
    { id: 2, name: "BigBasket Hub", val: 125000, status: "Proposal", score: 62, contact: "Priya Rai", email: "priya@bigbasket.in" },
    { id: 3, name: "Zomato Blink", val: 85000, status: "Initial Contact", score: 45, contact: "Rahul K.", email: "rahul@blinkit.com" },
    { id: 4, name: "Spencers Mart", val: 210000, status: "Negotiation", score: 78, contact: "Sanjay D.", email: "sanjay@spencers.in" }
  ]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const menu = [
    { id: 'Overview', icon: LayoutDashboard },
    { id: 'AI Assist', icon: MessageSquare },
    { id: 'AI Sales', icon: TrendingUp },
    { id: 'AI Ops', icon: Package },
    { id: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-2xl fixed h-full flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.5)]">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">SmartOps <span className="text-neon-blue">AI</span></h1>
          </div>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Unified Business OS</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                active === item.id 
                  ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20 neon-glow-blue" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.id}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          
          <div className="space-y-3">
            <div className="px-4 flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">
              <ShieldCheck className="w-3 h-3" /> Security
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                <Shield className="w-3 h-3 text-neon-blue" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">DPDP Act 2023</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                <ShieldCheck className="w-3 h-3 text-neon-purple" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">RBAC & E2E</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                <Zap className="w-3 h-3 text-neon-green" />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">ISO 27001</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 flex flex-col">
        <header className="h-20 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <p className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                System Operational
              </p>
              <p className="text-[10px] font-medium text-zinc-500 italic">
                "SmartOps AI: Unified Intelligence for Indian SMEs"
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full w-64 group focus-within:border-neon-blue/50 transition-all">
              <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-neon-blue" />
              <input type="text" placeholder="Search operations..." className="bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-600 w-full" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-zinc-400 hover:text-neon-blue transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-white">Raj Swarnakar</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SME Owner</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="w-6 h-6 text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 flex-1">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{active}</h2>
                <p className="text-zinc-500 text-sm">Real-time intelligence for your business operations.</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button className="px-4 py-2 rounded-lg bg-neon-blue text-black text-xs font-black hover:brightness-110 transition-all flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Last 24h
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {active === 'Overview' && <Overview inventory={inventory} leads={leads} />}
                {active === 'AI Assist' && <AIChatbot inventory={inventory} sales={leads} />}
                {active === 'AI Sales' && <SalesCRM leads={leads} onSelectLead={setSelectedLead} />}
                {active === 'AI Ops' && (
                  <InventoryOps 
                    items={inventory} 
                    setItems={setInventory} 
                    suppliers={suppliers} 
                    reorderLogs={reorderLogs} 
                    setReorderLogs={setReorderLogs} 
                  />
                )}
                {active === 'Analytics' && <Analytics />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <Modal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          title="System Settings"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Profile Configuration</h4>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Display Name</label>
                  <input type="text" defaultValue="Raj Swarnakar" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue/50 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Email Address</label>
                  <input type="email" defaultValue="rajswarnakar9563@gmail.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon-blue/50 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">System Preferences</h4>
              <div className="space-y-3">
                {[
                  { label: "Push Notifications", desc: "Real-time alerts for low stock & leads", enabled: true },
                  { label: "AI Auto-Optimization", desc: "Allow AI to suggest inventory reorders", enabled: true },
                  { label: "High Contrast Mode", desc: "Enhance visibility for dashboard charts", enabled: false },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-white">{pref.label}</p>
                      <p className="text-[10px] text-zinc-500">{pref.desc}</p>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-all cursor-pointer",
                      pref.enabled ? "bg-neon-blue" : "bg-zinc-800"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                        pref.enabled ? "right-1" : "left-1"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-neon-blue text-black font-black py-3 rounded-xl hover:brightness-110 transition-all">
                Save Changes
              </button>
              <button onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all border border-white/10">
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        <Modal 
          isOpen={!!selectedLead} 
          onClose={() => setSelectedLead(null)} 
          title="Lead Intelligence"
        >
          {selectedLead && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 flex items-center justify-center text-2xl font-black text-neon-purple">
                  {selectedLead.name[0]}
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">{selectedLead.name}</h4>
                  <p className="text-sm text-zinc-500">{selectedLead.contact} • {selectedLead.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Potential Value</p>
                  <p className="text-lg font-black text-neon-green">{formatINR(selectedLead.val)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Lead Score</p>
                  <p className="text-lg font-black text-neon-purple">{selectedLead.score}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Activity</p>
                <div className="space-y-2">
                  {[
                    { date: "2 hours ago", action: "Email opened by client" },
                    { date: "Yesterday", action: "Proposal document shared" },
                    { date: "3 days ago", action: "Initial discovery call completed" }
                  ].map((act, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-zinc-600 shrink-0 w-20">{act.date}</span>
                      <span className="text-zinc-300">{act.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 bg-neon-blue text-black font-black py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Send Message
                </button>
                <button className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Modal>

        <footer className="p-8 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          <p>© 2026 SmartOps AI • Next-Gen Business OS</p>
        </footer>
      </main>
    </div>
  );
}

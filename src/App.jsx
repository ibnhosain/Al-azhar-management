import React, { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ──────────────────────── SHARED STYLES ────────────────────────
const G = "#2E7D32";
const card = { background:"#fff", borderRadius:10, padding:"16px 20px", marginBottom:16 };
const sectionTitle = { fontWeight:600, fontSize:14, color:"#263238", borderLeft:`3px solid ${G}`, paddingLeft:10, marginBottom:14 };
const badge = (color) => ({ background:color+"22", color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:500 });
const inputStyle = { width:"100%", padding:"8px 12px", border:"1px solid #E0E0E0", borderRadius:8, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
const btn = (color="#2E7D32") => ({ background:color, color:"#fff", border:"none", padding:"8px 18px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" });
const tbl = { width:"100%", borderCollapse:"collapse", fontSize:13 };
const th = { background:"#F5F5F5", padding:"10px 12px", textAlign:"left", color:"#546E7A", fontWeight:600, borderBottom:"1px solid #E0E0E0" };
const td = { padding:"10px 12px", borderBottom:"1px solid #F5F5F5", color:"#37474F" };

// ──────────────────────── DATA ────────────────────────
const pieData = [
  { name:"ভর্তি ফান্ড", value:95, color:"#FF7043" },
  { name:"বেতন ফান্ড", value:2432, color:"#4CAF50" },
  { name:"যাকাত ফান্ড", value:1, color:"#FFC107" },
  { name:"মাহফিল ফান্ড", value:1, color:"#9E9E9E" },
  { name:"বোর্ডিং", value:1545, color:"#9C27B0" },
  { name:"বিদ্যুৎ বিল", value:90, color:"#F44336" },
];
const barData = [
  { month:"Jan", সংগ্রহ:0, খরচ:0 },
  { month:"Feb", সংগ্রহ:0, খরচ:0 },
  { month:"Mar", সংগ্রহ:12000, খরচ:10000 },
  { month:"Apr", সংগ্রহ:65000, খরচ:60000 },
  { month:"May", সংগ্রহ:50000, খরচ:47000 },
  { month:"Jun", সংগ্রহ:8000, খরচ:6000 },
];
const classData = [
  { name:"নার্সারি গ্রুপ", count:20, color:"#4CAF50", rank:1 },
  { name:"১ম শ্রেণি", count:13, color:"#26C6DA", rank:2 },
  { name:"২য় শ্রেণি", count:9, color:"#00BCD4", rank:3 },
  { name:"১ম বর্ষ", count:3, color:"#4DD0E1", rank:4 },
  { name:"নাজেরা বিভাগ", count:6, color:"#80DEEA", rank:5 },
];
const attendancePieData = [
  { name:"হাজিরা নেওয়া", value:30, color:"#4CAF50" },
  { name:"হাজিরা বাকি", value:70, color:"#FFC107" },
];
const genderPieData = [
  { name:"ছাত্র", value:70, color:"#26A69A" },
  { name:"ছাত্রী", value:30, color:"#FFC107" },
];
const topFundsBar = [
  { name:"বেতন", value:2432, color:"#26A69A" },
  { name:"বোর্ডিং", value:1545, color:"#FFC107" },
  { name:"ভর্তি", value:95, color:"#42A5F5" },
];

// ──────────────────────── STUDENTS DATA ────────────────────────
const initStudents = [
  { id:"STD-001", name:"মোঃ আরিফ হোসেন", class:"নার্সারি গ্রুপ", roll:"০১", gender:"ছাত্র", fee:"৳৫০০", status:"সক্রিয়" },
  { id:"STD-002", name:"ফাতেমা বেগম", class:"১ম শ্রেণি", roll:"০২", gender:"ছাত্রী", fee:"৳৬০০", status:"সক্রিয়" },
  { id:"STD-003", name:"মোঃ রাফি আহমেদ", class:"২য় শ্রেণি", roll:"০৩", gender:"ছাত্র", fee:"৳৭০০", status:"সক্রিয়" },
  { id:"STD-004", name:"সুমাইয়া আক্তার", class:"নার্সারি গ্রুপ", roll:"০৪", gender:"ছাত্রী", fee:"৳৫০০", status:"নিষ্ক্রিয়" },
  { id:"STD-005", name:"মোঃ ইমরান খান", class:"১ম বর্ষ", roll:"০৫", gender:"ছাত্র", fee:"৳৮০০", status:"সক্রিয়" },
];

// ──────────────────────── TEACHERS DATA ────────────────────────
const initTeachers = [
  { id:"TCH-001", name:"মোঃ আবদুল করিম", subject:"আরবি", phone:"01711-000001", salary:"৳১৫,০০০", status:"সক্রিয়" },
  { id:"TCH-002", name:"মোছা. রহিমা খাতুন", subject:"বাংলা", phone:"01711-000002", salary:"৳১২,০০০", status:"সক্রিয়" },
  { id:"TCH-003", name:"মোঃ সালাহউদ্দিন", subject:"গণিত", phone:"01711-000003", salary:"৳১৩,০০০", status:"সক্রিয়" },
  { id:"TCH-004", name:"মোছা. নাজমা বেগম", subject:"ইংরেজি", phone:"01711-000004", salary:"৳১২,৫০০", status:"ছুটিতে" },
  { id:"TCH-005", name:"মোঃ হাফিজুর রহমান", subject:"হাদিস", phone:"01711-000005", salary:"৳১৪,০০০", status:"সক্রিয়" },
];

// ──────────────────────── RECEIPTS DATA ────────────────────────
const initReceipts = [
  { id:"RCP-001", student:"মোঃ আরিফ হোসেন", type:"বেতন", amount:"৳৫০০", date:"০১/০৬/২০২৬", status:"পরিশোধিত" },
  { id:"RCP-002", student:"ফাতেমা বেগম", type:"ভর্তি", amount:"৳৯৫", date:"০২/০৬/২০২৬", status:"পরিশোধিত" },
  { id:"RCP-003", student:"মোঃ রাফি আহমেদ", type:"বেতন", amount:"৳৭০০", date:"০৩/০৬/২০২৬", status:"বকেয়া" },
  { id:"RCP-004", student:"মোঃ ইমরান খান", type:"বোর্ডিং", amount:"৳৮০০", date:"০৪/০৬/২০২৬", status:"পরিশোধিত" },
];

// ──────────────────────── NOTICE DATA ────────────────────────
const initNotices = [
  { id:1, title:"বার্ষিক পরীক্ষার সময়সূচি", date:"০৫/০৬/২০২৬", priority:"জরুরি", body:"আগামী ১৫ জুন থেকে বার্ষিক পরীক্ষা শুরু হবে।" },
  { id:2, title:"ঈদুল আযহার ছুটি", date:"০৩/০৬/২০২৬", priority:"সাধারণ", body:"ঈদুল আযহা উপলক্ষে ৫ দিন ছুটি থাকবে।" },
  { id:3, title:"মাসিক বেতন পরিশোধের নোটিশ", date:"০১/০৬/২০২৬", priority:"গুরুত্বপূর্ণ", body:"জুন মাসের বেতন ১০ তারিখের মধ্যে পরিশোধ করতে হবে।" },
];

// ──────────────────────── BOARDING DATA ────────────────────────
const initBoarding = [
  { id:"BRD-001", name:"মোঃ আরিফ হোসেন", room:"A-১০১", floor:"১ম তলা", fee:"৳৮০০", status:"সক্রিয়" },
  { id:"BRD-002", name:"মোঃ ইমরান খান", room:"A-১০২", floor:"১ম তলা", fee:"৳৮০০", status:"সক্রিয়" },
  { id:"BRD-003", name:"মোঃ রাফি আহমেদ", room:"B-২০১", floor:"২য় তলা", fee:"৳৯০০", status:"বকেয়া" },
];

// ──────────────────────── SPONSORS DATA ────────────────────────
const initSponsors = [
  { id:"SPN-001", name:"হাজী মোঃ করিম", phone:"01800-000001", amount:"৳৫,০০০", type:"মাসিক", date:"০১/০৬/২০২৬" },
  { id:"SPN-002", name:"মোছা. আমেনা বেগম", phone:"01800-000002", amount:"৳২,০০০", type:"এককালীন", date:"০২/০৬/২০২৬" },
  { id:"SPN-003", name:"মোঃ রহিম উদ্দিন", phone:"01800-000003", amount:"৳৩,০০০", type:"মাসিক", date:"০৩/০৬/২০২৬" },
];

// ──────────────────────── LOANS DATA ────────────────────────
const initLoans = [
  { id:"LN-001", name:"মোঃ আরিফ হোসেন", amount:"৳২,০০০", due:"৳৫০০", date:"০১/০৬/২০২৬", status:"বকেয়া" },
  { id:"LN-002", name:"ফাতেমা বেগম", amount:"৳১,৫০০", due:"৳০", date:"০২/০৬/২০২৬", status:"পরিশোধিত" },
];

// ──────────────────────── ORPHAN SPONSORS ────────────────────────
const initOrphans = [
  { id:"ORP-001", orphan:"মোঃ সাইফুল ইসলাম", sponsor:"হাজী মোঃ করিম", amount:"৳১,০০০", month:"জুন ২০২৬", status:"পরিশোধিত" },
  { id:"ORP-002", orphan:"মোছা. হালিমা বেগম", sponsor:"মোঃ রহিম উদ্দিন", amount:"৳৮০০", month:"জুন ২০২৬", status:"বকেয়া" },
];

// ──────────────────────── MODAL ────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, width:480, maxWidth:"95vw", maxHeight:"85vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <span style={{ fontWeight:700, fontSize:15, color:"#263238" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#78909C" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, color:"#546E7A", marginBottom:5, fontWeight:500 }}>{label}</label>
      {children}
    </div>
  );
}

// ──────────────────────── PAGE: DASHBOARD ────────────────────────

// সমস্ত ট্র্যানজেকশন ডেটা (তারিখ সহ)
const allTransactions = [
  { date: new Date(2026,5,8),  type:"বেতন",   income:600,  expense:0   },
  { date: new Date(2026,5,7),  type:"বোর্ডিং", income:800,  expense:0   },
  { date: new Date(2026,5,6),  type:"বেতন",   income:500,  expense:0   },
  { date: new Date(2026,5,5),  type:"খরচ",    income:0,    expense:300 },
  { date: new Date(2026,5,1),  type:"ভর্তি",  income:95,   expense:0   },
  { date: new Date(2026,4,20), type:"বেতন",   income:2432, expense:0   },
  { date: new Date(2026,4,15), type:"বোর্ডিং",income:1545, expense:0   },
  { date: new Date(2026,4,10), type:"খরচ",    income:0,    expense:2222},
  { date: new Date(2026,3,5),  type:"যাকাত",  income:0,    expense:0   },
  { date: new Date(2025,11,1), type:"বেতন",   income:1800, expense:0   },
  { date: new Date(2025,11,1), type:"খরচ",    income:0,    expense:1500},
  { date: new Date(2025,10,1), type:"বেতন",   income:1700, expense:0   },
  { date: new Date(2025,10,1), type:"খরচ",    income:0,    expense:1400},
];

function getFilteredData(period) {
  const now = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let from, to;
  if (period === "আজ") {
    from = startOf(now); to = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
  } else if (period === "এই সপ্তাহ") {
    const day = now.getDay() === 0 ? 6 : now.getDay()-1;
    from = startOf(new Date(now.getFullYear(), now.getMonth(), now.getDate()-day));
    to = new Date(from.getTime() + 7*86400000);
  } else if (period === "এই মাস") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth()+1, 1);
  } else if (period === "এই বছর") {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear()+1, 0, 1);
  } else if (period === "গত বছর") {
    from = new Date(now.getFullYear()-1, 0, 1);
    to = new Date(now.getFullYear(), 0, 1);
  } else {
    from = null; to = null; // সর্বকাল
  }
  const filtered = from
    ? allTransactions.filter(t => t.date >= from && t.date < to)
    : allTransactions;
  const totalIncome  = filtered.reduce((s,t) => s+t.income,  0);
  const totalExpense = filtered.reduce((s,t) => s+t.expense, 0);
  const balance      = totalIncome - totalExpense;
  return { totalIncome, totalExpense, balance, count: filtered.length };
}

function toBn(n) {
  return ("৳" + n.toLocaleString("en")).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
}

function Dashboard() {
  const [activePeriod, setActivePeriod] = useState("সর্বকাল");
  const periods = ["সর্বকাল","আজ","এই সপ্তাহ","এই মাস","এই বছর","গত বছর"];

  const { totalIncome, totalExpense, balance } = getFilteredData(activePeriod);

  const stats = [
    { icon:"🎓", label:"মোট শিক্ষার্থী", value:"৫১", color:"#FF7043", bg:"#FFF3F0" },
    { icon:"💵", label:"সর্বমোট সংগ্রহ", value: toBn(totalIncome), color:"#00BCD4", bg:"#E0F7FA" },
    { icon:"💸", label:"সর্বমোট খরচ",    value: toBn(totalExpense), color:"#4CAF50", bg:"#E8F5E9" },
    { icon:"💳", label:"বর্তমান ব্যালেন্স", value: toBn(balance),  color:"#FFC107", bg:"#FFF8E1" },
    { icon:"👨‍🏫", label:"মোট শিক্ষক", value:"৬", color:"#9C27B0", bg:"#F3E5F5" },
    { icon:"👤", label:"ইনঅ্যাক্টিভ শিক্ষার্থী", value:"৩", color:"#F44336", bg:"#FFEBEE" },
  ];

  // ফান্ড কার্ডের মান পিরিয়ড অনুযায়ী
  const periodFunds = {
    "সর্বকাল": [95, 2432, 0, 0, 1545, 90],
    "আজ":      [0,  600,  0, 0, 0,    0 ],
    "এই সপ্তাহ":[0, 1100, 0, 0, 800,  0 ],
    "এই মাস":  [95, 600,  0, 0, 800,  0 ],
    "এই বছর":  [95, 2432, 0, 0, 1545, 90],
    "গত বছর":  [0,  3500, 0, 0, 0,    0 ],
  };
  const fv = periodFunds[activePeriod] || periodFunds["সর্বকাল"];
  const funds = [
    { icon:"📥", label:"ভর্তি ফান্ড", value:toBn(fv[0]), color:"#FF7043", bg:"#FFF3F0" },
    { icon:"💼", label:"বেতন ফান্ড",  value:toBn(fv[1]), color:"#00BCD4", bg:"#E0F7FA" },
    { icon:"🤲", label:"যাকাত ফান্ড", value:toBn(fv[2]), color:"#4CAF50", bg:"#E8F5E9" },
    { icon:"🕌", label:"মাহফিল ফান্ড",value:toBn(fv[3]), color:"#FFC107", bg:"#FFF8E1" },
    { icon:"🏠", label:"বোর্ডিং",     value:toBn(fv[4]), color:"#9C27B0", bg:"#F3E5F5" },
    { icon:"⚡", label:"বিদ্যুৎ বিল", value:toBn(fv[5]), color:"#F44336", bg:"#FFEBEE" },
  ];

  // বার চার্ট ডেটা পিরিয়ড অনুযায়ী
  const chartData = {
    "সর্বকাল": barData,
    "আজ":       [{ month:"আজ", সংগ্রহ:600, খরচ:0 }],
    "এই সপ্তাহ":[{ month:"সোম", সংগ্রহ:600, খরচ:0 },{ month:"মঙ্গল", সংগ্রহ:500, খরচ:300 },{ month:"বুধ", সংগ্রহ:0, খরচ:0 },{ month:"বৃহ", সংগ্রহ:800, খরচ:0 },{ month:"শুক্র", সংগ্রহ:0, খরচ:0 }],
    "এই মাস":  [{ month:"সপ্তাহ ১", সংগ্রহ:95, খরচ:0 },{ month:"সপ্তাহ ২", সংগ্রহ:1100, খরচ:300 }],
    "এই বছর":  barData,
    "গত বছর":  [{ month:"Nov", সংগ্রহ:1700, খরচ:1400 },{ month:"Dec", সংগ্রহ:1800, খরচ:1500 }],
  };
  const activeBarData = chartData[activePeriod] || barData;

  // পাই ডেটা পিরিয়ড অনুযায়ী
  const activePieData = [
    { name:"ভর্তি ফান্ড", value:Math.max(fv[0],1), color:"#FF7043" },
    { name:"বেতন ফান্ড",  value:Math.max(fv[1],1), color:"#4CAF50" },
    { name:"যাকাত ফান্ড", value:Math.max(fv[2],1), color:"#FFC107" },
    { name:"মাহফিল ফান্ড",value:Math.max(fv[3],1), color:"#9E9E9E" },
    { name:"বোর্ডিং",     value:Math.max(fv[4],1), color:"#9C27B0" },
    { name:"বিদ্যুৎ বিল", value:Math.max(fv[5],1), color:"#F44336" },
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{ background:"linear-gradient(135deg,#1B5E20,#2E7D32,#388E3C)", borderRadius:12, padding:"18px 24px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, border:"2px solid rgba(255,255,255,0.3)", flexShrink:0 }}>🕌</div>
        <div style={{ color:"#fff", fontWeight:700, fontSize:20 }}>মাদরাসাতুল আযহার আল-আরাবিয়া</div>
      </div>

      {/* Period filter */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        {periods.map(p => (
          <button key={p} onClick={() => setActivePeriod(p)} style={{ padding:"6px 16px", borderRadius:20, border:"1px solid", borderColor:activePeriod===p?G:"#E0E0E0", background:activePeriod===p?G:"#fff", color:activePeriod===p?"#fff":"#546E7A", cursor:"pointer", fontSize:13, fontFamily:"inherit", transition:"all 0.15s" }}>{p}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:12, color:"#78909C", background:"#F5F5F5", padding:"5px 12px", borderRadius:20 }}>
          সময়কাল: <strong>{activePeriod}</strong>
        </span>
      </div>

      {/* Stats */}
      <div style={card}>
        <div style={sectionTitle}>প্রধান পরিসংখ্যান</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
          {stats.map((c,i) => (
            <div key={i} style={{ background:c.bg, borderRadius:10, padding:"14px 12px", textAlign:"center", transition:"transform 0.2s" }}>
              <div style={{ width:44, height:44, borderRadius:10, background:c.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, margin:"0 auto 10px" }}>{c.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#263238" }}>{c.value}</div>
              <div style={{ fontSize:12, color:"#78909C", marginTop:3 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Funds */}
      <div style={card}>
        <div style={sectionTitle}>সকল ফান্ড</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
          {funds.map((c,i) => (
            <div key={i} style={{ background:c.bg, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ width:44, height:44, borderRadius:10, background:c.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, margin:"0 auto 10px" }}>{c.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#263238" }}>{c.value}</div>
              <div style={{ fontSize:12, color:"#78909C", marginTop:3 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={card}>
        <div style={sectionTitle}>ড্যাশবোর্ড বিশ্লেষণ</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:"#FAFAFA", borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#37474F", marginBottom:12 }}>ফান্ড বণ্টন (পাই)</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ position:"relative", width:150, height:150, flexShrink:0 }}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={activePieData} cx={70} cy={70} innerRadius={45} outerRadius={68} dataKey="value">
                      {activePieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#263238" }}>{toBn(totalIncome)}</div>
                  <div style={{ fontSize:10, color:"#90A4AE" }}>মোট</div>
                </div>
              </div>
              <div>
                {activePieData.map((d,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:"#546E7A" }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background:"#FAFAFA", borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#37474F", marginBottom:12 }}>সংগ্রহ ও খরচ — {activePeriod}</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={activeBarData} margin={{ left:-20, right:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0"/>
                <XAxis dataKey="month" tick={{ fontSize:9 }}/>
                <YAxis tick={{ fontSize:9 }}/>
                <Tooltip formatter={(v) => toBn(v)}/>
                <Bar dataKey="সংগ্রহ" fill="#26A69A" radius={[3,3,0,0]}/>
                <Bar dataKey="খরচ" fill="#FF7043" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", gap:12, marginTop:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:10, height:10, background:"#26A69A", borderRadius:2 }}/><span style={{ fontSize:11, color:"#546E7A" }}>সংগ্রহ</span></div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:10, height:10, background:"#FF7043", borderRadius:2 }}/><span style={{ fontSize:11, color:"#546E7A" }}>খরচ</span></div>
            </div>
          </div>
        </div>
      </div>
      {/* Class-wise */}
      <div style={card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={sectionTitle}>শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা</div>
          <div style={badge("#2E7D32")}>সর্বোচ্চ: নার্সারি (২০)</div>
        </div>
        {classData.map((c,i) => (
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:i===0?"#FFC107":"#E0E0E0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:i===0?"#fff":"#546E7A" }}>{c.rank}</div>
                <span style={{ fontSize:13, color:"#37474F" }}>{c.name}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:c.color }}>{c.count}</span>
            </div>
            <div style={{ background:"#F5F5F5", borderRadius:4, height:8 }}>
              <div style={{ height:"100%", width:`${(c.count/20)*100}%`, background:c.color, borderRadius:4 }}/>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={{ background:"#fff", borderRadius:10, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#37474F", marginBottom:8 }}>ক্লাস ভিত্তিক হাজিরা</div>
          <div style={{ display:"flex", justifyContent:"center" }}>
            <PieChart width={130} height={120}>
              <Pie data={attendancePieData} cx={60} cy={60} innerRadius={35} outerRadius={55} dataKey="value">
                {attendancePieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
            </PieChart>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:10 }}>
            {attendancePieData.map((d,i) => <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:8, height:8, borderRadius:"50%", background:d.color }}/><span style={{ fontSize:10, color:"#546E7A" }}>{d.name}</span></div>)}
          </div>
        </div>
        <div style={{ background:"#fff", borderRadius:10, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#37474F", marginBottom:8 }}>লিঙ্গ অনুপাত</div>
          <div style={{ display:"flex", justifyContent:"center" }}>
            <PieChart width={130} height={120}>
              <Pie data={genderPieData} cx={60} cy={60} innerRadius={35} outerRadius={55} dataKey="value">
                {genderPieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
            </PieChart>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:10 }}>
            {genderPieData.map((d,i) => <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:8, height:8, borderRadius:"50%", background:d.color }}/><span style={{ fontSize:10, color:"#546E7A" }}>{d.name}</span></div>)}
          </div>
        </div>
        <div style={{ background:"#fff", borderRadius:10, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#37474F", marginBottom:8 }}>শীর্ষ ৩টি ফান্ড</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={topFundsBar} margin={{ left:-25, right:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:9 }}/>
              <YAxis tick={{ fontSize:9 }}/>
              <Tooltip/>
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {topFundsBar.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: STUDENTS ────────────────────────
function Students() {
  const [students, setStudents] = useState(initStudents);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name:"", class:"নার্সারি গ্রুপ", roll:"", gender:"ছাত্র", fee:"", status:"সক্রিয়" });
  const filtered = students.filter(s => s.name.includes(search) || s.id.includes(search));
  const save = () => {
    if (!form.name || !form.roll) return alert("নাম ও রোল নম্বর আবশ্যক");
    setStudents([...students, { ...form, id:`STD-00${students.length+1}` }]);
    setModal(false);
    setForm({ name:"", class:"নার্সারি গ্রুপ", roll:"", gender:"ছাত্র", fee:"", status:"সক্রিয়" });
  };
  const del = (id) => setStudents(students.filter(s => s.id !== id));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>শিক্ষার্থী ব্যবস্থাপনা <span style={badge("#00BCD4")}>মোট: {students.length}</span></div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন শিক্ষার্থী</button>
      </div>
      <div style={{ ...card }}>
        <input placeholder="নাম বা আইডি দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom:14, width:280 }}/>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>নাম</th><th style={th}>শ্রেণি</th><th style={th}>রোল</th><th style={th}>লিঙ্গ</th><th style={th}>ফি</th><th style={th}>অবস্থা</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {filtered.map((s,i) => (
              <tr key={i}>
                <td style={td}>{s.id}</td>
                <td style={td}>{s.name}</td>
                <td style={td}>{s.class}</td>
                <td style={td}>{s.roll}</td>
                <td style={td}>{s.gender}</td>
                <td style={td}>{s.fee}</td>
                <td style={td}><span style={badge(s.status==="সক্রিয়"?"#4CAF50":"#F44336")}>{s.status}</span></td>
                <td style={td}><button onClick={() => del(s.id)} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="নতুন শিক্ষার্থী ভর্তি" onClose={() => setModal(false)}>
          <FormRow label="পূর্ণ নাম"><input style={inputStyle} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="শিক্ষার্থীর নাম"/></FormRow>
          <FormRow label="শ্রেণি"><select style={inputStyle} value={form.class} onChange={e => setForm({...form,class:e.target.value})}><option>নার্সারি গ্রুপ</option><option>১ম শ্রেণি</option><option>২য় শ্রেণি</option><option>১ম বর্ষ</option><option>নাজেরা বিভাগ</option></select></FormRow>
          <FormRow label="রোল নম্বর"><input style={inputStyle} value={form.roll} onChange={e => setForm({...form,roll:e.target.value})} placeholder="রোল নম্বর"/></FormRow>
          <FormRow label="লিঙ্গ"><select style={inputStyle} value={form.gender} onChange={e => setForm({...form,gender:e.target.value})}><option>ছাত্র</option><option>ছাত্রী</option></select></FormRow>
          <FormRow label="মাসিক ফি"><input style={inputStyle} value={form.fee} onChange={e => setForm({...form,fee:e.target.value})} placeholder="যেমন: ৳৫০০"/></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={{ ...btn("#9E9E9E") }}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: ATTENDANCE ────────────────────────
function Attendance() {
  const today = new Date().toLocaleDateString("bn-BD");
  const [attendance, setAttendance] = useState(
    initStudents.map(s => ({ ...s, present:"উপস্থিত" }))
  );
  const [saved, setSaved] = useState(false);
  const statuses = ["উপস্থিত","অনুপস্থিত","দেরিতে উপস্থিত","ছুটি"];
  const counts = { উপস্থিত:0, অনুপস্থিত:0, "দেরিতে উপস্থিত":0, ছুটি:0 };
  attendance.forEach(a => counts[a.present]++);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>ডিজিটাল হাজিরা — {today}</div>
        <button onClick={() => setSaved(true)} style={btn()}>{saved?"✅ সংরক্ষিত":"হাজিরা সংরক্ষণ করুন"}</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {Object.entries(counts).map(([k,v]) => {
          const colors = { উপস্থিত:"#4CAF50", অনুপস্থিত:"#F44336", "দেরিতে উপস্থিত":"#FFC107", ছুটি:"#42A5F5" };
          return <div key={k} style={{ background:colors[k]+"11", border:`1px solid ${colors[k]}44`, borderRadius:10, padding:"12px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:colors[k] }}>{v}</div>
            <div style={{ fontSize:12, color:"#546E7A" }}>{k}</div>
          </div>;
        })}
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>নাম</th><th style={th}>শ্রেণি</th><th style={th}>রোল</th><th style={th}>উপস্থিতি</th></tr></thead>
          <tbody>
            {attendance.map((s,i) => (
              <tr key={i}>
                <td style={td}>{s.name}</td>
                <td style={td}>{s.class}</td>
                <td style={td}>{s.roll}</td>
                <td style={td}>
                  <div style={{ display:"flex", gap:6 }}>
                    {statuses.map(st => {
                      const colors = { উপস্থিত:"#4CAF50", অনুপস্থিত:"#F44336", "দেরিতে উপস্থিত":"#FFC107", ছুটি:"#42A5F5" };
                      return <button key={st} onClick={() => setAttendance(attendance.map((a,j) => j===i?{...a,present:st}:a))} style={{ padding:"4px 10px", fontSize:11, borderRadius:20, border:`1px solid ${colors[st]}`, background:s.present===st?colors[st]:"#fff", color:s.present===st?"#fff":colors[st], cursor:"pointer", fontFamily:"inherit" }}>{st}</button>;
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: TEACHERS ────────────────────────
function Teachers() {
  const [teachers, setTeachers] = useState(initTeachers);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", subject:"", phone:"", salary:"", status:"সক্রিয়" });
  const save = () => {
    if (!form.name) return alert("নাম আবশ্যক");
    setTeachers([...teachers, { ...form, id:`TCH-00${teachers.length+1}` }]);
    setModal(false);
    setForm({ name:"", subject:"", phone:"", salary:"", status:"সক্রিয়" });
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>শিক্ষক ব্যবস্থাপনা <span style={badge("#9C27B0")}>মোট: {teachers.length}</span></div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন শিক্ষক</button>
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>নাম</th><th style={th}>বিষয়</th><th style={th}>ফোন</th><th style={th}>বেতন</th><th style={th}>অবস্থা</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {teachers.map((t,i) => (
              <tr key={i}>
                <td style={td}>{t.id}</td><td style={td}>{t.name}</td><td style={td}>{t.subject}</td><td style={td}>{t.phone}</td><td style={td}>{t.salary}</td>
                <td style={td}><span style={badge(t.status==="সক্রিয়"?"#4CAF50":t.status==="ছুটিতে"?"#FFC107":"#F44336")}>{t.status}</span></td>
                <td style={td}><button onClick={() => setTeachers(teachers.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="নতুন শিক্ষক যোগ" onClose={() => setModal(false)}>
          <FormRow label="পূর্ণ নাম"><input style={inputStyle} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="শিক্ষকের নাম"/></FormRow>
          <FormRow label="বিষয়"><input style={inputStyle} value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} placeholder="যেমন: আরবি, গণিত"/></FormRow>
          <FormRow label="ফোন নম্বর"><input style={inputStyle} value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="01XXXXXXXXX"/></FormRow>
          <FormRow label="মাসিক বেতন"><input style={inputStyle} value={form.salary} onChange={e => setForm({...form,salary:e.target.value})} placeholder="যেমন: ৳১৫,০০০"/></FormRow>
          <FormRow label="অবস্থা"><select style={inputStyle} value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>সক্রিয়</option><option>ছুটিতে</option><option>নিষ্ক্রিয়</option></select></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: FINANCE ────────────────────────
function Finance() {
  const [expenses, setExpenses] = useState([
    { id:"EXP-001", title:"শিক্ষক বেতন", amount:"৳১৫,০০০", date:"০১/০৬/২০২৬", category:"বেতন" },
    { id:"EXP-002", title:"বিদ্যুৎ বিল", amount:"৳৯০", date:"০২/০৬/২০২৬", category:"ইউটিলিটি" },
    { id:"EXP-003", title:"পরিষ্কার সামগ্রী", amount:"৳৩০০", date:"০৩/০৬/২০২৬", category:"রক্ষণাবেক্ষণ" },
  ]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title:"", amount:"", date:"", category:"বেতন" });
  const save = () => {
    if (!form.title || !form.amount) return alert("শিরোনাম ও পরিমাণ আবশ্যক");
    setExpenses([...expenses, { ...form, id:`EXP-00${expenses.length+1}` }]);
    setModal(false);
    setForm({ title:"", amount:"", date:"", category:"বেতন" });
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>হিসাব ও অর্থ বিভাগ</div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন খরচ এন্ট্রি</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        <div style={{ background:"#E0F7FA", borderRadius:10, padding:16, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, color:"#00BCD4" }}>৳৪,১৬২</div><div style={{ fontSize:12, color:"#546E7A" }}>মোট সংগ্রহ</div></div>
        <div style={{ background:"#FFEBEE", borderRadius:10, padding:16, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, color:"#F44336" }}>৳২,৫২২</div><div style={{ fontSize:12, color:"#546E7A" }}>মোট খরচ</div></div>
        <div style={{ background:"#E8F5E9", borderRadius:10, padding:16, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:700, color:"#4CAF50" }}>৳১,৬৪০</div><div style={{ fontSize:12, color:"#546E7A" }}>বর্তমান ব্যালেন্স</div></div>
      </div>
      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:"#37474F", marginBottom:12 }}>খরচের তালিকা</div>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>শিরোনাম</th><th style={th}>পরিমাণ</th><th style={th}>তারিখ</th><th style={th}>ক্যাটাগরি</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {expenses.map((e,i) => (
              <tr key={i}><td style={td}>{e.id}</td><td style={td}>{e.title}</td><td style={td}>{e.amount}</td><td style={td}>{e.date}</td><td style={td}><span style={badge("#FF7043")}>{e.category}</span></td><td style={td}><button onClick={() => setExpenses(expenses.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="নতুন খরচ এন্ট্রি" onClose={() => setModal(false)}>
          <FormRow label="শিরোনাম"><input style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="খরচের বিবরণ"/></FormRow>
          <FormRow label="পরিমাণ"><input style={inputStyle} value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="যেমন: ৳৫০০"/></FormRow>
          <FormRow label="তারিখ"><input type="date" style={inputStyle} value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></FormRow>
          <FormRow label="ক্যাটাগরি"><select style={inputStyle} value={form.category} onChange={e => setForm({...form,category:e.target.value})}><option>বেতন</option><option>ইউটিলিটি</option><option>রক্ষণাবেক্ষণ</option><option>শিক্ষা উপকরণ</option><option>অন্যান্য</option></select></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PRINT HELPER ────────────────────────
function printHTML(html) {
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Hind Siliguri',sans-serif;padding:20px;color:#263238;font-size:13px}
    @media print{body{padding:0}.no-print{display:none}}
  </style></head><body>${html}
  <div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="background:#2E7D32;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট করুন</button>
    <button onclick="window.close()" style="background:#9E9E9E;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;font-family:inherit">বন্ধ করুন</button>
  </div>
  </body></html>`);
  w.document.close();
}

// ──────────────────────── PAGE: RECEIPTS ────────────────────────
function Receipts() {
  const [receipts, setReceipts] = useState(initReceipts);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ student:"", class:"নার্সারি গ্রুপ", roll:"", type:"বেতন", amount:"", date:"", status:"পরিশোধিত" });

  const save = () => {
    if (!form.student || !form.amount) return alert("শিক্ষার্থী ও পরিমাণ আবশ্যক");
    const today = new Date().toLocaleDateString("bn-BD");
    setReceipts([...receipts, { ...form, id:`RCP-00${receipts.length+1}`, date: form.date || today }]);
    setModal(false);
    setForm({ student:"", class:"নার্সারি গ্রুপ", roll:"", type:"বেতন", amount:"", date:"", status:"পরিশোধিত" });
  };

  const printReceipt = (r) => {
    printHTML(`
      <div style="border:2px solid #2E7D32;border-radius:10px;max-width:420px;margin:auto;padding:0;overflow:hidden">
        <div style="background:#2E7D32;color:#fff;padding:16px 20px;text-align:center">
          <div style="font-size:18px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
          <div style="font-size:12px;opacity:0.85;margin-top:4px">সদর, ময়মনসিংহ | +880 1747-658744</div>
        </div>
        <div style="background:#E8F5E9;padding:10px 20px;text-align:center;font-size:15px;font-weight:700;color:#1B5E20;letter-spacing:1px">
          💳 অর্থ প্রদানের রশিদ
        </div>
        <div style="padding:20px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr><td style="padding:8px 0;color:#546E7A;width:40%">রশিদ নং</td><td style="padding:8px 0;font-weight:600">: ${r.id}</td></tr>
            <tr><td style="padding:8px 0;color:#546E7A">শিক্ষার্থীর নাম</td><td style="padding:8px 0;font-weight:600">: ${r.student}</td></tr>
            <tr><td style="padding:8px 0;color:#546E7A">শ্রেণি</td><td style="padding:8px 0;font-weight:600">: ${r.class||"—"}</td></tr>
            <tr><td style="padding:8px 0;color:#546E7A">রোল নম্বর</td><td style="padding:8px 0;font-weight:600">: ${r.roll||"—"}</td></tr>
            <tr><td style="padding:8px 0;color:#546E7A">ফি-এর ধরন</td><td style="padding:8px 0;font-weight:600">: ${r.type}</td></tr>
            <tr><td style="padding:8px 0;color:#546E7A">তারিখ</td><td style="padding:8px 0;font-weight:600">: ${r.date}</td></tr>
            <tr style="border-top:2px dashed #E0E0E0"><td style="padding:12px 0;color:#546E7A;font-size:15px">পরিমাণ</td>
              <td style="padding:12px 0;font-weight:700;font-size:18px;color:#2E7D32">: ${r.amount}</td>
            </tr>
            <tr><td style="padding:8px 0;color:#546E7A">অবস্থা</td>
              <td style="padding:8px 0"><span style="background:${r.status==='পরিশোধিত'?'#E8F5E9':'#FFEBEE'};color:${r.status==='পরিশোধিত'?'#2E7D32':'#F44336'};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600">: ${r.status}</span></td>
            </tr>
          </table>
        </div>
        <div style="border-top:1px dashed #E0E0E0;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:11px;color:#90A4AE">ধন্যবাদ আপনার পেমেন্টের জন্য</div>
          <div style="font-size:11px;color:#90A4AE">Easy Coding Space</div>
        </div>
      </div>
    `);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>রশিদ ব্যবস্থাপনা <span style={badge("#00BCD4")}>মোট: {receipts.length}</span></div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন রশিদ</button>
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={th}>রশিদ নং</th>
              <th style={th}>শিক্ষার্থী</th>
              <th style={th}>ধরন</th>
              <th style={th}>পরিমাণ</th>
              <th style={th}>তারিখ</th>
              <th style={th}>অবস্থা</th>
              <th style={th}>কার্যক্রম</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r,i) => (
              <tr key={i}>
                <td style={td}>{r.id}</td>
                <td style={td}>{r.student}</td>
                <td style={td}>{r.type}</td>
                <td style={td}>{r.amount}</td>
                <td style={td}>{r.date}</td>
                <td style={td}><span style={badge(r.status==="পরিশোধিত"?"#4CAF50":"#F44336")}>{r.status}</span></td>
                <td style={td}>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => printReceipt(r)} style={{ ...btn("#1565C0"), padding:"4px 10px", fontSize:11 }}>🖨️ প্রিন্ট</button>
                    <button onClick={() => setReceipts(receipts.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="নতুন রশিদ তৈরি" onClose={() => setModal(false)}>
          <FormRow label="শিক্ষার্থীর নাম"><input style={inputStyle} value={form.student} onChange={e=>setForm({...form,student:e.target.value})} placeholder="শিক্ষার্থীর নাম"/></FormRow>
          <FormRow label="শ্রেণি"><select style={inputStyle} value={form.class} onChange={e=>setForm({...form,class:e.target.value})}><option>নার্সারি গ্রুপ</option><option>১ম শ্রেণি</option><option>২য় শ্রেণি</option><option>১ম বর্ষ</option><option>নাজেরা বিভাগ</option></select></FormRow>
          <FormRow label="রোল নম্বর"><input style={inputStyle} value={form.roll} onChange={e=>setForm({...form,roll:e.target.value})} placeholder="রোল নম্বর"/></FormRow>
          <FormRow label="ফি-এর ধরন"><select style={inputStyle} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>বেতন</option><option>ভর্তি</option><option>বোর্ডিং</option><option>পরীক্ষা ফি</option><option>যাকাত</option></select></FormRow>
          <FormRow label="পরিমাণ"><input style={inputStyle} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="যেমন: ৳৫০০"/></FormRow>
          <FormRow label="তারিখ"><input type="date" style={inputStyle} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></FormRow>
          <FormRow label="অবস্থা"><select style={inputStyle} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>পরিশোধিত</option><option>বকেয়া</option></select></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: NOTICES ────────────────────────
function Notices() {
  const [notices, setNotices] = useState(initNotices);
  const [modal, setModal] = useState(false);
  const [expand, setExpand] = useState(null);
  const [form, setForm] = useState({ title:"", priority:"সাধারণ", body:"" });
  const save = () => {
    if (!form.title || !form.body) return alert("শিরোনাম ও বিষয়বস্তু আবশ্যক");
    const today = new Date().toLocaleDateString("bn-BD");
    setNotices([{ ...form, id:notices.length+1, date:today }, ...notices]);
    setModal(false);
    setForm({ title:"", priority:"সাধারণ", body:"" });
  };
  const priColors = { জরুরি:"#F44336", গুরুত্বপূর্ণ:"#FF7043", সাধারণ:"#4CAF50" };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>নোটিশ এবং ঘোষণা <span style={badge("#FFC107")}>মোট: {notices.length}</span></div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন নোটিশ</button>
      </div>
      {notices.map((n,i) => (
        <div key={i} style={{ ...card, cursor:"pointer", borderLeft:`4px solid ${priColors[n.priority]||"#9E9E9E"}` }} onClick={() => setExpand(expand===i?null:i)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <span style={{ fontWeight:600, fontSize:14, color:"#263238" }}>{n.title}</span>
              <span style={{ ...badge(priColors[n.priority]||"#9E9E9E"), marginLeft:10 }}>{n.priority}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:12, color:"#90A4AE" }}>{n.date}</span>
              <button onClick={e => { e.stopPropagation(); setNotices(notices.filter((_,j)=>j!==i)); }} style={{ ...btn("#F44336"), padding:"3px 9px", fontSize:11 }}>মুছুন</button>
            </div>
          </div>
          {expand===i && <div style={{ marginTop:12, padding:12, background:"#F9F9F9", borderRadius:8, fontSize:13, color:"#546E7A", lineHeight:1.6 }}>{n.body}</div>}
        </div>
      ))}
      {modal && (
        <Modal title="নতুন নোটিশ প্রকাশ" onClose={() => setModal(false)}>
          <FormRow label="শিরোনাম"><input style={inputStyle} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="নোটিশের শিরোনাম"/></FormRow>
          <FormRow label="অগ্রাধিকার"><select style={inputStyle} value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option>সাধারণ</option><option>গুরুত্বপূর্ণ</option><option>জরুরি</option></select></FormRow>
          <FormRow label="বিষয়বস্তু"><textarea style={{ ...inputStyle, height:100, resize:"vertical" }} value={form.body} onChange={e => setForm({...form,body:e.target.value})} placeholder="নোটিশের বিস্তারিত লিখুন..."/></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>প্রকাশ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: BOARDING ────────────────────────
function Boarding() {
  const [list, setList] = useState(initBoarding);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", room:"", floor:"", fee:"", status:"সক্রিয়" });
  const save = () => {
    if (!form.name || !form.room) return alert("নাম ও রুম নম্বর আবশ্যক");
    setList([...list, { ...form, id:`BRD-00${list.length+1}` }]);
    setModal(false);
    setForm({ name:"", room:"", floor:"", fee:"", status:"সক্রিয়" });
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>বোর্ডিং ব্যবস্থাপনা <span style={badge("#9C27B0")}>মোট: {list.length}</span></div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন এন্ট্রি</button>
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>নাম</th><th style={th}>রুম</th><th style={th}>তলা</th><th style={th}>ফি</th><th style={th}>অবস্থা</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {list.map((b,i) => (
              <tr key={i}><td style={td}>{b.id}</td><td style={td}>{b.name}</td><td style={td}>{b.room}</td><td style={td}>{b.floor}</td><td style={td}>{b.fee}</td>
                <td style={td}><span style={badge(b.status==="সক্রিয়"?"#4CAF50":"#F44336")}>{b.status}</span></td>
                <td style={td}><button onClick={() => setList(list.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="বোর্ডিং এন্ট্রি" onClose={() => setModal(false)}>
          <FormRow label="শিক্ষার্থীর নাম"><input style={inputStyle} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="নাম"/></FormRow>
          <FormRow label="রুম নম্বর"><input style={inputStyle} value={form.room} onChange={e => setForm({...form,room:e.target.value})} placeholder="যেমন: A-১০১"/></FormRow>
          <FormRow label="তলা"><input style={inputStyle} value={form.floor} onChange={e => setForm({...form,floor:e.target.value})} placeholder="যেমন: ১ম তলা"/></FormRow>
          <FormRow label="মাসিক ফি"><input style={inputStyle} value={form.fee} onChange={e => setForm({...form,fee:e.target.value})} placeholder="যেমন: ৳৮০০"/></FormRow>
          <FormRow label="অবস্থা"><select style={inputStyle} value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>সক্রিয়</option><option>বকেয়া</option><option>নিষ্ক্রিয়</option></select></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: SPONSORS ────────────────────────
function Sponsors() {
  const [list, setList] = useState(initSponsors);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", amount:"", type:"মাসিক", date:"" });
  const save = () => {
    if (!form.name || !form.amount) return alert("নাম ও পরিমাণ আবশ্যক");
    setList([...list, { ...form, id:`SPN-00${list.length+1}` }]);
    setModal(false);
    setForm({ name:"", phone:"", amount:"", type:"মাসিক", date:"" });
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>স্পনসর এবং অনুদান বিভাগ <span style={badge("#E91E63")}>মোট: {list.length}</span></div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন স্পনসর</button>
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>নাম</th><th style={th}>ফোন</th><th style={th}>পরিমাণ</th><th style={th}>ধরন</th><th style={th}>তারিখ</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {list.map((s,i) => (
              <tr key={i}><td style={td}>{s.id}</td><td style={td}>{s.name}</td><td style={td}>{s.phone}</td><td style={td}>{s.amount}</td><td style={td}><span style={badge("#E91E63")}>{s.type}</span></td><td style={td}>{s.date}</td>
                <td style={td}><button onClick={() => setList(list.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="নতুন স্পনসর যোগ" onClose={() => setModal(false)}>
          <FormRow label="স্পনসরের নাম"><input style={inputStyle} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="পূর্ণ নাম"/></FormRow>
          <FormRow label="ফোন নম্বর"><input style={inputStyle} value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="01XXXXXXXXX"/></FormRow>
          <FormRow label="অনুদানের পরিমাণ"><input style={inputStyle} value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="যেমন: ৳৫,০০০"/></FormRow>
          <FormRow label="ধরন"><select style={inputStyle} value={form.type} onChange={e => setForm({...form,type:e.target.value})}><option>মাসিক</option><option>এককালীন</option><option>বার্ষিক</option></select></FormRow>
          <FormRow label="তারিখ"><input type="date" style={inputStyle} value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: LOANS ────────────────────────
function Loans() {
  const [list, setList] = useState(initLoans);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", amount:"", due:"", date:"", status:"বকেয়া" });
  const save = () => {
    if (!form.name || !form.amount) return alert("নাম ও পরিমাণ আবশ্যক");
    setList([...list, { ...form, id:`LN-00${list.length+1}` }]);
    setModal(false);
    setForm({ name:"", amount:"", due:"", date:"", status:"বকেয়া" });
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>ঋণ এবং বকেয়া ব্যবস্থাপনা</div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন ঋণ এন্ট্রি</button>
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>নাম</th><th style={th}>মোট ঋণ</th><th style={th}>বকেয়া</th><th style={th}>তারিখ</th><th style={th}>অবস্থা</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {list.map((l,i) => (
              <tr key={i}><td style={td}>{l.id}</td><td style={td}>{l.name}</td><td style={td}>{l.amount}</td><td style={td}>{l.due}</td><td style={td}>{l.date}</td>
                <td style={td}><span style={badge(l.status==="পরিশোধিত"?"#4CAF50":"#F44336")}>{l.status}</span></td>
                <td style={td}><button onClick={() => setList(list.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="নতুন ঋণ/বকেয়া এন্ট্রি" onClose={() => setModal(false)}>
          <FormRow label="নাম"><input style={inputStyle} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="শিক্ষার্থীর নাম"/></FormRow>
          <FormRow label="মোট ঋণের পরিমাণ"><input style={inputStyle} value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="যেমন: ৳২,০০০"/></FormRow>
          <FormRow label="বকেয়া পরিমাণ"><input style={inputStyle} value={form.due} onChange={e => setForm({...form,due:e.target.value})} placeholder="যেমন: ৳৫০০"/></FormRow>
          <FormRow label="তারিখ"><input type="date" style={inputStyle} value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></FormRow>
          <FormRow label="অবস্থা"><select style={inputStyle} value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>বকেয়া</option><option>পরিশোধিত</option></select></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: ORPHAN SPONSORS ────────────────────────
function OrphanSponsors() {
  const [list, setList] = useState(initOrphans);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ orphan:"", sponsor:"", amount:"", month:"", status:"বকেয়া" });
  const save = () => {
    if (!form.orphan || !form.sponsor) return alert("এতিম ও স্পনসরের নাম আবশ্যক");
    setList([...list, { ...form, id:`ORP-00${list.length+1}` }]);
    setModal(false);
    setForm({ orphan:"", sponsor:"", amount:"", month:"", status:"বকেয়া" });
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={sectionTitle}>এতিম স্পনসর বিভাগ</div>
        <button onClick={() => setModal(true)} style={btn()}>+ নতুন এন্ট্রি</button>
      </div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>আইডি</th><th style={th}>এতিমের নাম</th><th style={th}>স্পনসর</th><th style={th}>পরিমাণ</th><th style={th}>মাস</th><th style={th}>অবস্থা</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {list.map((o,i) => (
              <tr key={i}><td style={td}>{o.id}</td><td style={td}>{o.orphan}</td><td style={td}>{o.sponsor}</td><td style={td}>{o.amount}</td><td style={td}>{o.month}</td>
                <td style={td}><span style={badge(o.status==="পরিশোধিত"?"#4CAF50":"#F44336")}>{o.status}</span></td>
                <td style={td}><button onClick={() => setList(list.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="এতিম স্পনসর এন্ট্রি" onClose={() => setModal(false)}>
          <FormRow label="এতিমের নাম"><input style={inputStyle} value={form.orphan} onChange={e => setForm({...form,orphan:e.target.value})} placeholder="এতিমের নাম"/></FormRow>
          <FormRow label="স্পনসরের নাম"><input style={inputStyle} value={form.sponsor} onChange={e => setForm({...form,sponsor:e.target.value})} placeholder="স্পনসরের নাম"/></FormRow>
          <FormRow label="পরিমাণ"><input style={inputStyle} value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="যেমন: ৳১,০০০"/></FormRow>
          <FormRow label="মাস"><input style={inputStyle} value={form.month} onChange={e => setForm({...form,month:e.target.value})} placeholder="যেমন: জুন ২০২৬"/></FormRow>
          <FormRow label="অবস্থা"><select style={inputStyle} value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>বকেয়া</option><option>পরিশোধিত</option></select></FormRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button onClick={() => setModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
            <button onClick={save} style={btn()}>সংরক্ষণ করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: CALCULATOR ────────────────────────
function Calculator() {
  const [display, setDisplay] = useState("০");
  const [expr, setExpr] = useState("");
  const keys = ["C","±","%","÷","৭","৮","৯","×","৪","৫","৬","−","১","২","৩","+","০",".","="];
  const toEn = s => s.replace(/[০-৯]/g,d=>"০১২৩৪৫৬৭৮৯".indexOf(d));
  const toBn = s => String(s).replace(/[0-9]/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
  const press = (k) => {
    if(k==="C"){ setDisplay("০"); setExpr(""); return; }
    if(k==="="){ try{ const r=eval(toEn(expr).replace("×","*").replace("÷","/").replace("−","-")); setDisplay(toBn(parseFloat(r.toFixed(8)))); setExpr(""); }catch{ setDisplay("ত্রুটি"); setExpr(""); } return; }
    if(k==="±"){ setDisplay(d => d.startsWith("-")?d.slice(1):"-"+d); return; }
    if(k==="%"){ try{ setDisplay(d=>toBn(parseFloat(toEn(d))/100)); }catch{} return; }
    const op={"÷":"÷","×":"×","−":"−","+":"+"};
    if(op[k]){ setExpr(toEn(display)+op[k]); setDisplay("০"); return; }
    setDisplay(d => { const nd = d==="০"||d==="ত্রুটি" ? k : d+k; setExpr(e=>e?e+toEn(k):toEn(nd)); return nd; });
  };
  const colors = { "C":"#FF5252","÷":"#FF7043","×":"#FF7043","−":"#FF7043","+":"#FF7043","=":"#2E7D32","±":"#607D8B","%":"#607D8B" };
  return (
    <div style={{ display:"flex", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:20, width:280, boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize:12, color:"#90A4AE", textAlign:"right", minHeight:18, marginBottom:4 }}>{expr}</div>
        <div style={{ fontSize:36, fontWeight:700, color:"#263238", textAlign:"right", marginBottom:16, letterSpacing:1 }}>{display}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {keys.map((k,i) => (
            <button key={i} onClick={() => press(k)} style={{ padding:"14px 0", fontSize:18, fontWeight:500, border:"none", borderRadius:10, background:colors[k]||"#F5F5F5", color:colors[k]?"#fff":"#263238", cursor:"pointer", fontFamily:"inherit", gridColumn:k==="০"?"span 2":undefined }}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: SETTINGS ────────────────────────
function Settings() {
  const [form, setForm] = useState({ instituteName:"মাদরাসাতুল আযহার আল-আরাবিয়া", address:"সদর, ময়মনসিংহ", phone:"01804909500", email:"", academicYear:"২০২৬", currency:"৳" });
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div>
      <div style={sectionTitle}>সিস্টেম সেটিংস</div>
      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:"#546E7A", marginBottom:14 }}>প্রতিষ্ঠানের তথ্য</div>
        <FormRow label="প্রতিষ্ঠানের নাম"><input style={inputStyle} value={form.instituteName} onChange={e=>setForm({...form,instituteName:e.target.value})}/></FormRow>
        <FormRow label="ঠিকানা"><input style={inputStyle} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></FormRow>
        <FormRow label="ফোন নম্বর"><input style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></FormRow>
        <FormRow label="ইমেইল"><input style={inputStyle} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="info@madrasa.com"/></FormRow>
        <FormRow label="শিক্ষাবর্ষ"><input style={inputStyle} value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/></FormRow>
        <FormRow label="মুদ্রা চিহ্ন"><input style={inputStyle} value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}/></FormRow>
        <button onClick={save} style={btn()}>{saved?"✅ সংরক্ষিত হয়েছে!":"পরিবর্তন সংরক্ষণ করুন"}</button>
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: ACADEMIC ────────────────────────
function Academic() {
  const [tab, setTab] = useState("ফলাফল");
  const tabs = ["ফলাফল","পরীক্ষার রুটিন","এডমিট কার্ড"];

  // ── ফলাফল ──
  const [results, setResults] = useState([
    { student:"মোঃ আরিফ হোসেন", class:"নার্সারি গ্রুপ", roll:"০১", bangla:85, arabic:90, math:78, total:253, grade:"A+" },
    { student:"ফাতেমা বেগম",      class:"১ম শ্রেণি",     roll:"০২", bangla:72, arabic:80, math:68, total:220, grade:"A"  },
    { student:"মোঃ রাফি আহমেদ",  class:"২য় শ্রেণি",    roll:"০৩", bangla:60, arabic:70, math:55, total:185, grade:"B"  },
  ]);
  const [resModal, setResModal] = useState(false);
  const [resForm, setResForm] = useState({ student:"", class:"নার্সারি গ্রুপ", roll:"", bangla:"", arabic:"", math:"" });
  const saveResult = () => {
    if (!resForm.student) return alert("নাম আবশ্যক");
    const t = (Number(resForm.bangla)||0)+(Number(resForm.arabic)||0)+(Number(resForm.math)||0);
    const g = t>=270?"A+":t>=240?"A":t>=210?"A-":t>=180?"B+":t>=150?"B":"C";
    setResults([...results, { ...resForm, bangla:Number(resForm.bangla)||0, arabic:Number(resForm.arabic)||0, math:Number(resForm.math)||0, total:t, grade:g }]);
    setResModal(false);
    setResForm({ student:"", class:"নার্সারি গ্রুপ", roll:"", bangla:"", arabic:"", math:"" });
  };
  const gradeColor = {"A+":"#2E7D32","A":"#4CAF50","A-":"#8BC34A","B+":"#FFC107","B":"#FF9800","C":"#F44336"};

  const printMarksheet = (r) => {
    printHTML(`
      <div style="border:2px solid #1A237E;border-radius:10px;max-width:480px;margin:auto;overflow:hidden">
        <div style="background:#1A237E;color:#fff;padding:16px 20px;text-align:center">
          <div style="font-size:18px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
          <div style="font-size:13px;margin-top:6px;opacity:0.85">পরীক্ষার মার্কশিট — শিক্ষাবর্ষ ২০২৬</div>
        </div>
        <div style="padding:20px">
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
            <tr><td style="padding:6px 0;color:#546E7A;width:40%">শিক্ষার্থীর নাম</td><td style="font-weight:600">: ${r.student}</td></tr>
            <tr><td style="padding:6px 0;color:#546E7A">শ্রেণি</td><td style="font-weight:600">: ${r.class}</td></tr>
            <tr><td style="padding:6px 0;color:#546E7A">রোল নম্বর</td><td style="font-weight:600">: ${r.roll||"—"}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#F5F5F5"><th style="padding:10px;text-align:left;border:1px solid #E0E0E0">বিষয়</th><th style="padding:10px;text-align:center;border:1px solid #E0E0E0">পূর্ণমান</th><th style="padding:10px;text-align:center;border:1px solid #E0E0E0">প্রাপ্ত নম্বর</th></tr></thead>
            <tbody>
              <tr><td style="padding:10px;border:1px solid #E0E0E0">বাংলা</td><td style="padding:10px;text-align:center;border:1px solid #E0E0E0">১০০</td><td style="padding:10px;text-align:center;border:1px solid #E0E0E0;font-weight:600">${r.bangla}</td></tr>
              <tr><td style="padding:10px;border:1px solid #E0E0E0">আরবি</td><td style="padding:10px;text-align:center;border:1px solid #E0E0E0">১০০</td><td style="padding:10px;text-align:center;border:1px solid #E0E0E0;font-weight:600">${r.arabic}</td></tr>
              <tr><td style="padding:10px;border:1px solid #E0E0E0">গণিত</td><td style="padding:10px;text-align:center;border:1px solid #E0E0E0">১০০</td><td style="padding:10px;text-align:center;border:1px solid #E0E0E0;font-weight:600">${r.math}</td></tr>
              <tr style="background:#E8F5E9"><td style="padding:10px;border:1px solid #C8E6C9;font-weight:700">মোট</td><td style="padding:10px;text-align:center;border:1px solid #C8E6C9;font-weight:700">৩০০</td><td style="padding:10px;text-align:center;border:1px solid #C8E6C9;font-weight:700;font-size:16px;color:#2E7D32">${r.total}</td></tr>
            </tbody>
          </table>
          <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px">গ্রেড পয়েন্ট: <strong style="font-size:20px;color:#1A237E">${r.grade}</strong></div>
            <div style="font-size:12px;color:#90A4AE">স্বাক্ষর: _______________</div>
          </div>
        </div>
      </div>
    `);
  };

  // ── পরীক্ষার রুটিন ──
  const [routine, setRoutine] = useState([
    { date:"১৫/০৬/২০২৬", day:"রবিবার",   subject:"বাংলা",    time:"সকাল ৯টা–১১টা",   class:"সকল শ্রেণি" },
    { date:"১৭/০৬/২০২৬", day:"মঙ্গলবার", subject:"আরবি",    time:"সকাল ৯টা–১১টা",   class:"সকল শ্রেণি" },
    { date:"১৯/০৬/২০২৬", day:"বৃহস্পতিবার",subject:"গণিত",   time:"সকাল ৯টা–১১টা",  class:"সকল শ্রেণি" },
    { date:"২২/০৬/২০২৬", day:"রবিবার",   subject:"ইসলাম",   time:"সকাল ৯টা–১১টা",   class:"সকল শ্রেণি" },
    { date:"২৪/০৬/২০২৬", day:"মঙ্গলবার", subject:"ইংরেজি",  time:"সকাল ৯টা–১১টা",   class:"সকল শ্রেণি" },
  ]);
  const [routineModal, setRoutineModal] = useState(false);
  const [routineForm, setRoutineForm] = useState({ date:"", day:"রবিবার", subject:"", time:"", class:"সকল শ্রেণি" });
  const saveRoutine = () => {
    if (!routineForm.subject || !routineForm.date) return alert("তারিখ ও বিষয় আবশ্যক");
    setRoutine([...routine, routineForm]);
    setRoutineModal(false);
    setRoutineForm({ date:"", day:"রবিবার", subject:"", time:"", class:"সকল শ্রেণি" });
  };
  const printRoutine = () => {
    printHTML(`
      <div style="border:2px solid #2E7D32;border-radius:10px;max-width:600px;margin:auto;overflow:hidden">
        <div style="background:#2E7D32;color:#fff;padding:16px 20px;text-align:center">
          <div style="font-size:18px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
          <div style="font-size:14px;margin-top:6px;font-weight:600">বার্ষিক পরীক্ষার রুটিন — ২০২৬</div>
        </div>
        <div style="padding:20px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#E8F5E9">
              <th style="padding:10px;text-align:left;border:1px solid #C8E6C9">তারিখ</th>
              <th style="padding:10px;text-align:left;border:1px solid #C8E6C9">দিন</th>
              <th style="padding:10px;text-align:left;border:1px solid #C8E6C9">বিষয়</th>
              <th style="padding:10px;text-align:left;border:1px solid #C8E6C9">সময়</th>
              <th style="padding:10px;text-align:left;border:1px solid #C8E6C9">শ্রেণি</th>
            </tr></thead>
            <tbody>
              ${routine.map((r,i) => `<tr style="background:${i%2===0?'#fff':'#F9F9F9'}">
                <td style="padding:10px;border:1px solid #E0E0E0;font-weight:600">${r.date}</td>
                <td style="padding:10px;border:1px solid #E0E0E0">${r.day}</td>
                <td style="padding:10px;border:1px solid #E0E0E0;font-weight:600;color:#1A237E">${r.subject}</td>
                <td style="padding:10px;border:1px solid #E0E0E0">${r.time}</td>
                <td style="padding:10px;border:1px solid #E0E0E0">${r.class}</td>
              </tr>`).join("")}
            </tbody>
          </table>
          <div style="margin-top:20px;font-size:12px;color:#90A4AE;text-align:center">
            পরীক্ষা শুরুর ৩০ মিনিট আগে উপস্থিত থাকতে হবে
          </div>
        </div>
      </div>
    `);
  };

  // ── এডমিট কার্ড ──
  const [admitModal, setAdmitModal] = useState(false);
  const [admitForm, setAdmitForm] = useState({ student:"", class:"নার্সারি গ্রুপ", roll:"", exam:"বার্ষিক পরীক্ষা ২০২৬", center:"মাদরাসাতুল আযহার আল-আরাবিয়া" });
  const printAdmit = (f) => {
    printHTML(`
      <div style="border:3px solid #1A237E;border-radius:10px;max-width:450px;margin:auto;overflow:hidden">
        <div style="background:#1A237E;color:#fff;padding:14px 20px;text-align:center">
          <div style="font-size:17px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
          <div style="font-size:13px;margin-top:4px;opacity:0.85">সদর, ময়মনসিংহ</div>
        </div>
        <div style="background:#FFF9C4;padding:10px;text-align:center;font-size:15px;font-weight:700;color:#F57F17;letter-spacing:1px;border-bottom:2px dashed #1A237E">
          🎓 প্রবেশপত্র (Admit Card)
        </div>
        <div style="padding:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <table style="font-size:13px;border-collapse:collapse;flex:1">
              <tr><td style="padding:7px 0;color:#546E7A;width:45%">শিক্ষার্থীর নাম</td><td style="font-weight:700">: ${f.student}</td></tr>
              <tr><td style="padding:7px 0;color:#546E7A">শ্রেণি</td><td style="font-weight:600">: ${f.class}</td></tr>
              <tr><td style="padding:7px 0;color:#546E7A">রোল নম্বর</td><td style="font-weight:700;font-size:15px;color:#1A237E">: ${f.roll}</td></tr>
              <tr><td style="padding:7px 0;color:#546E7A">পরীক্ষার নাম</td><td style="font-weight:600">: ${f.exam}</td></tr>
              <tr><td style="padding:7px 0;color:#546E7A">কেন্দ্র</td><td style="font-weight:600">: ${f.center}</td></tr>
            </table>
            <div style="width:80px;height:90px;border:2px solid #E0E0E0;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-left:16px;background:#F5F5F5;color:#90A4AE;font-size:11px;text-align:center">ছবি<br/>Photo</div>
          </div>
          <div style="margin-top:16px;border-top:2px dashed #E0E0E0;padding-top:14px">
            <div style="font-size:12px;color:#37474F;font-weight:600;margin-bottom:8px">পরীক্ষার সময়সূচি:</div>
            ${routine.slice(0,3).map(r => `<div style="font-size:12px;color:#546E7A;padding:3px 0">• ${r.date} (${r.day}) — ${r.subject} — ${r.time}</div>`).join("")}
          </div>
          <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:12px;color:#90A4AE;border-top:1px solid #E0E0E0;padding-top:12px">
            <div>পরীক্ষার্থীর স্বাক্ষর: ___________</div>
            <div>প্রধান শিক্ষকের স্বাক্ষর: ___________</div>
          </div>
        </div>
      </div>
    `);
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:"2px solid #E0E0E0" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"10px 20px", border:"none", background:"none", cursor:"pointer", fontSize:13, fontFamily:"inherit", color:tab===t?G:"#546E7A", borderBottom:tab===t?`2px solid ${G}`:"2px solid transparent", marginBottom:-2, fontWeight:tab===t?600:400 }}>{t}</button>
        ))}
      </div>

      {/* ফলাফল */}
      {tab==="ফলাফল" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={sectionTitle}>পরীক্ষার ফলাফল</div>
            <button onClick={() => setResModal(true)} style={btn()}>+ ফলাফল যোগ</button>
          </div>
          <div style={card}>
            <table style={tbl}>
              <thead><tr><th style={th}>শিক্ষার্থী</th><th style={th}>শ্রেণি</th><th style={th}>রোল</th><th style={th}>বাংলা</th><th style={th}>আরবি</th><th style={th}>গণিত</th><th style={th}>মোট</th><th style={th}>গ্রেড</th><th style={th}>কার্যক্রম</th></tr></thead>
              <tbody>
                {results.map((r,i) => (
                  <tr key={i}>
                    <td style={td}>{r.student}</td><td style={td}>{r.class}</td><td style={td}>{r.roll||"—"}</td>
                    <td style={td}>{r.bangla}</td><td style={td}>{r.arabic}</td><td style={td}>{r.math}</td><td style={td}>{r.total}</td>
                    <td style={td}><span style={badge(gradeColor[r.grade]||"#9E9E9E")}>{r.grade}</span></td>
                    <td style={td}><button onClick={() => printMarksheet(r)} style={{ ...btn("#1565C0"), padding:"4px 10px", fontSize:11 }}>🖨️ মার্কশিট</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resModal && (
            <Modal title="নতুন ফলাফল যোগ" onClose={() => setResModal(false)}>
              <FormRow label="শিক্ষার্থীর নাম"><input style={inputStyle} value={resForm.student} onChange={e=>setResForm({...resForm,student:e.target.value})} placeholder="নাম"/></FormRow>
              <FormRow label="শ্রেণি"><select style={inputStyle} value={resForm.class} onChange={e=>setResForm({...resForm,class:e.target.value})}><option>নার্সারি গ্রুপ</option><option>১ম শ্রেণি</option><option>২য় শ্রেণি</option><option>১ম বর্ষ</option></select></FormRow>
              <FormRow label="রোল নম্বর"><input style={inputStyle} value={resForm.roll} onChange={e=>setResForm({...resForm,roll:e.target.value})} placeholder="রোল নম্বর"/></FormRow>
              <FormRow label="বাংলা (১০০)"><input type="number" style={inputStyle} value={resForm.bangla} onChange={e=>setResForm({...resForm,bangla:e.target.value})} placeholder="নম্বর"/></FormRow>
              <FormRow label="আরবি (১০০)"><input type="number" style={inputStyle} value={resForm.arabic} onChange={e=>setResForm({...resForm,arabic:e.target.value})} placeholder="নম্বর"/></FormRow>
              <FormRow label="গণিত (১০০)"><input type="number" style={inputStyle} value={resForm.math} onChange={e=>setResForm({...resForm,math:e.target.value})} placeholder="নম্বর"/></FormRow>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
                <button onClick={() => setResModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
                <button onClick={saveResult} style={btn()}>সংরক্ষণ করুন</button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* রুটিন */}
      {tab==="পরীক্ষার রুটিন" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={sectionTitle}>পরীক্ষার রুটিন</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setRoutineModal(true)} style={btn()}>+ রুটিন যোগ</button>
              <button onClick={printRoutine} style={btn("#1565C0")}>🖨️ রুটিন প্রিন্ট</button>
            </div>
          </div>
          <div style={card}>
            <table style={tbl}>
              <thead><tr><th style={th}>তারিখ</th><th style={th}>দিন</th><th style={th}>বিষয়</th><th style={th}>সময়</th><th style={th}>শ্রেণি</th><th style={th}>কার্যক্রম</th></tr></thead>
              <tbody>
                {routine.map((r,i) => (
                  <tr key={i}>
                    <td style={td}><strong>{r.date}</strong></td><td style={td}>{r.day}</td>
                    <td style={td}><strong style={{ color:"#1A237E" }}>{r.subject}</strong></td>
                    <td style={td}>{r.time}</td><td style={td}>{r.class}</td>
                    <td style={td}><button onClick={() => setRoutine(routine.filter((_,j)=>j!==i))} style={{ ...btn("#F44336"), padding:"4px 10px", fontSize:11 }}>মুছুন</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {routineModal && (
            <Modal title="রুটিনে পরীক্ষা যোগ" onClose={() => setRoutineModal(false)}>
              <FormRow label="তারিখ"><input style={inputStyle} value={routineForm.date} onChange={e=>setRoutineForm({...routineForm,date:e.target.value})} placeholder="যেমন: ২৫/০৬/২০২৬"/></FormRow>
              <FormRow label="দিন"><select style={inputStyle} value={routineForm.day} onChange={e=>setRoutineForm({...routineForm,day:e.target.value})}><option>রবিবার</option><option>সোমবার</option><option>মঙ্গলবার</option><option>বুধবার</option><option>বৃহস্পতিবার</option><option>শুক্রবার</option><option>শনিবার</option></select></FormRow>
              <FormRow label="বিষয়"><input style={inputStyle} value={routineForm.subject} onChange={e=>setRoutineForm({...routineForm,subject:e.target.value})} placeholder="যেমন: বাংলা, আরবি"/></FormRow>
              <FormRow label="সময়"><input style={inputStyle} value={routineForm.time} onChange={e=>setRoutineForm({...routineForm,time:e.target.value})} placeholder="যেমন: সকাল ৯টা–১১টা"/></FormRow>
              <FormRow label="শ্রেণি"><input style={inputStyle} value={routineForm.class} onChange={e=>setRoutineForm({...routineForm,class:e.target.value})} placeholder="যেমন: সকল শ্রেণি, ১ম শ্রেণি"/></FormRow>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
                <button onClick={() => setRoutineModal(false)} style={btn("#9E9E9E")}>বাতিল</button>
                <button onClick={saveRoutine} style={btn()}>যোগ করুন</button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* এডমিট কার্ড */}
      {tab==="এডমিট কার্ড" && (
        <div>
          <div style={sectionTitle}>এডমিট কার্ড তৈরি করুন</div>
          <div style={card}>
            <FormRow label="শিক্ষার্থীর নাম"><input style={inputStyle} value={admitForm.student} onChange={e=>setAdmitForm({...admitForm,student:e.target.value})} placeholder="শিক্ষার্থীর পূর্ণ নাম"/></FormRow>
            <FormRow label="শ্রেণি"><select style={inputStyle} value={admitForm.class} onChange={e=>setAdmitForm({...admitForm,class:e.target.value})}><option>নার্সারি গ্রুপ</option><option>১ম শ্রেণি</option><option>২য় শ্রেণি</option><option>১ম বর্ষ</option><option>নাজেরা বিভাগ</option></select></FormRow>
            <FormRow label="রোল নম্বর"><input style={inputStyle} value={admitForm.roll} onChange={e=>setAdmitForm({...admitForm,roll:e.target.value})} placeholder="রোল নম্বর"/></FormRow>
            <FormRow label="পরীক্ষার নাম"><input style={inputStyle} value={admitForm.exam} onChange={e=>setAdmitForm({...admitForm,exam:e.target.value})} placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬"/></FormRow>
            <FormRow label="পরীক্ষা কেন্দ্র"><input style={inputStyle} value={admitForm.center} onChange={e=>setAdmitForm({...admitForm,center:e.target.value})} placeholder="পরীক্ষা কেন্দ্রের নাম"/></FormRow>
            <div style={{ marginTop:8 }}>
              <button onClick={() => { if(!admitForm.student||!admitForm.roll) return alert("নাম ও রোল নম্বর আবশ্যক"); printAdmit(admitForm); }} style={{ ...btn("#1A237E"), padding:"10px 24px", fontSize:14 }}>
                🖨️ এডমিট কার্ড প্রিন্ট করুন
              </button>
            </div>
          </div>
          <div style={{ ...card, background:"#E8F5E9", borderLeft:`4px solid ${G}` }}>
            <div style={{ fontSize:13, color:"#2E7D32", fontWeight:600, marginBottom:6 }}>💡 নোট</div>
            <div style={{ fontSize:12, color:"#546E7A", lineHeight:1.7 }}>
              এডমিট কার্ডে স্বয়ংক্রিয়ভাবে রুটিন পেজে যোগ করা প্রথম ৩টি পরীক্ষার সময়সূচি যুক্ত হবে।<br/>
              প্রিন্ট করার আগে "পরীক্ষার রুটিন" ট্যাবে রুটিন সম্পূর্ণ করুন।
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────── PAGE: PROMOTION ────────────────────────
function Promotion() {
  const [list, setList] = useState([
    { student:"মোঃ আরিফ হোসেন", from:"নার্সারি গ্রুপ", to:"১ম শ্রেণি", year:"২০২৬", status:"প্রমোশনপ্রাপ্ত" },
    { student:"ফাতেমা বেগম", from:"১ম শ্রেণি", to:"২য় শ্রেণি", year:"২০২৬", status:"অপেক্ষমান" },
  ]);
  return (
    <div>
      <div style={sectionTitle}>প্রমোশন এবং গ্র্যাজুয়েশন</div>
      <div style={card}>
        <table style={tbl}>
          <thead><tr><th style={th}>শিক্ষার্থী</th><th style={th}>পূর্ববর্তী শ্রেণি</th><th style={th}>পরবর্তী শ্রেণি</th><th style={th}>বছর</th><th style={th}>অবস্থা</th><th style={th}>কার্যক্রম</th></tr></thead>
          <tbody>
            {list.map((l,i) => (
              <tr key={i}><td style={td}>{l.student}</td><td style={td}>{l.from}</td><td style={td}>{l.to}</td><td style={td}>{l.year}</td>
                <td style={td}><span style={badge(l.status==="প্রমোশনপ্রাপ্ত"?"#4CAF50":"#FFC107")}>{l.status}</span></td>
                <td style={td}><button onClick={() => setList(list.map((x,j) => j===i?{...x,status:"প্রমোশনপ্রাপ্ত"}:x))} style={{ ...btn(), padding:"4px 10px", fontSize:11 }}>অনুমোদন</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: ADMIN ────────────────────────
function Admin() {
  const [staff, setStaff] = useState([
    { name:"মোঃ আবদুল মতিন", role:"অফিস সহায়ক", phone:"01711-111111", status:"সক্রিয়" },
    { name:"মোছা. রাহেলা বেগম", role:"হিসাবরক্ষক", phone:"01711-222222", status:"সক্রিয়" },
  ]);
  return (
    <div>
      <div style={sectionTitle}>প্রশাসনিক বিভাগ</div>
      <div style={card}>
        <div style={{ fontSize:13, fontWeight:600, color:"#546E7A", marginBottom:12 }}>প্রশাসনিক কর্মীবৃন্দ</div>
        <table style={tbl}>
          <thead><tr><th style={th}>নাম</th><th style={th}>পদবি</th><th style={th}>ফোন</th><th style={th}>অবস্থা</th></tr></thead>
          <tbody>
            {staff.map((s,i) => (
              <tr key={i}><td style={td}>{s.name}</td><td style={td}>{s.role}</td><td style={td}>{s.phone}</td><td style={td}><span style={badge("#4CAF50")}>{s.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: CONTACT ────────────────────────
function Helpline() {
  return (
    <div>
      <div style={sectionTitle}>যোগাযোগ</div>
      <div style={card}>
        {[
          { icon:"📞", label:"ফোন", value:"+880 1747-658744", color:"#4CAF50", href:"tel:+8801747658744" },
          { icon:"💬", label:"WhatsApp", value:"+880 1747-658744", color:"#25D366", href:"https://wa.me/8801747658744" },
        ].map((h,i) => (
          <a key={i} href={h.href} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 0", borderBottom:"1px solid #F5F5F5", textDecoration:"none" }}>
            <div style={{ width:48, height:48, borderRadius:12, background:h.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{h.icon}</div>
            <div>
              <div style={{ fontSize:12, color:"#90A4AE", marginBottom:3 }}>{h.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color:h.color }}>{h.value}</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:18, color:"#B0BEC5" }}>›</div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────── PAGE: CHANGELOG ────────────────────────
function Changelog() {
  const logs = [
    { version:"v1.0.4", date:"০৮/০৬/২০২৬", changes:["হেল্পলাইন বাদ দিয়ে যোগাযোগ পেজ যোগ (+880 1747-658744)","সুপার অ্যাডমিন ও ভাষা সেকশন হেডার থেকে বাদ","সাইডবার টগল আইকন SVG দিয়ে আপডেট","চেঞ্জলগ আপডেট করা হয়েছে"] },
    { version:"v1.0.3", date:"০৮/০৬/২০২৬", changes:["সাইডবারের সব ১৮টি মডিউল সম্পূর্ণ কার্যকর","+ বাটনে কুইক অ্যাকশন মেনু — সরাসরি পেজে নিয়ে যায়","ব্রেডক্রাম্ব নেভিগেশন যোগ"] },
    { version:"v1.0.2", date:"০৫/০৬/২০২৬", changes:["ব্যানার থেকে সাপোর্ট তথ্য সরানো হয়েছে","মেয়াদ ব্যাজ সরানো হয়েছে","ফুটারে কপিরাইট যোগ (Easy Coding Space)"] },
    { version:"v1.0.1", date:"০১/০৬/২০২৬", changes:["প্রাথমিক ড্যাশবোর্ড তৈরি","পাই চার্ট ও বার চার্ট যোগ","শ্রেণিভিত্তিক পরিসংখ্যান"] },
  ];
  return (
    <div>
      <div style={sectionTitle}>চেঞ্জলগ</div>
      {logs.map((l,i) => (
        <div key={i} style={{ ...card, borderLeft:`4px solid ${i===0?G:"#B0BEC5"}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontWeight:700, color:"#263238", fontSize:15 }}>{l.version}</span>
              {i===0 && <span style={{ ...badge(G), fontSize:10 }}>সর্বশেষ</span>}
            </div>
            <span style={{ fontSize:12, color:"#90A4AE" }}>{l.date}</span>
          </div>
          {l.changes.map((c,j) => (
            <div key={j} style={{ fontSize:13, color:"#546E7A", padding:"5px 0", display:"flex", alignItems:"flex-start", gap:8 }}>
              <span style={{ color:G, flexShrink:0, marginTop:1 }}>✓</span>{c}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────── QUICK ACTIONS ────────────────────────
const quickActions = [
  { icon:"🎓", label:"নতুন শিক্ষার্থী ভর্তি", color:"#FF7043", menu:3 },
  { icon:"👨‍🏫", label:"নতুন শিক্ষক যোগ", color:"#9C27B0", menu:6 },
  { icon:"💵", label:"নতুন পেমেন্ট/রশিদ", color:"#00BCD4", menu:9 },
  { icon:"📋", label:"হাজিরা নিন", color:"#4CAF50", menu:2 },
  { icon:"🔔", label:"নোটিশ প্রকাশ", color:"#FFC107", menu:14 },
  { icon:"📅", label:"পরীক্ষার ফলাফল", color:"#3F51B5", menu:4 },
  { icon:"🏠", label:"বোর্ডিং এন্ট্রি", color:"#795548", menu:13 },
  { icon:"🤝", label:"নতুন স্পনসর", color:"#E91E63", menu:10 },
  { icon:"💸", label:"খরচ এন্ট্রি", color:"#F44336", menu:8 },
];

// ──────────────────────── MENU ITEMS ────────────────────────
const menuItems = [
  { icon:"📊", label:"মডিউল ড্যাশবোর্ড" },
  { icon:"⚙️", label:"সিস্টেম সেটিংস" },
  { icon:"📋", label:"ডিজিটাল হাজিরা" },
  { icon:"👥", label:"শিক্ষার্থী ব্যবস্থাপনা" },
  { icon:"🎓", label:"একাডেমিক বিভাগ" },
  { icon:"📈", label:"প্রমোশন এবং গ্র্যাজুয়েশন" },
  { icon:"👨‍🏫", label:"শিক্ষক ব্যবস্থাপনা" },
  { icon:"🏛️", label:"প্রশাসনিক বিভাগ" },
  { icon:"💰", label:"হিসাব ও অর্থ বিভাগ" },
  { icon:"🧾", label:"রশিদ ব্যবস্থাপনা" },
  { icon:"🤝", label:"স্পনসর এবং অনুদান" },
  { icon:"📅", label:"ঋণ এবং বকেয়া" },
  { icon:"👤", label:"এতিম স্পনসর বিভাগ" },
  { icon:"🏠", label:"বোর্ডিং ব্যবস্থাপনা" },
  { icon:"🔔", label:"নোটিশ এবং ঘোষণা" },
  { icon:"🖩", label:"ক্যালকুলেটর" },
  { icon:"📞", label:"যোগাযোগ" },
  { icon:"📝", label:"চেঞ্জলগ" },
];

// ──────────────────────── PAGE ROUTER ────────────────────────
function PageContent({ index }) {
  switch(index) {
    case 0: return <Dashboard/>;
    case 1: return <Settings/>;
    case 2: return <Attendance/>;
    case 3: return <Students/>;
    case 4: return <Academic/>;
    case 5: return <Promotion/>;
    case 6: return <Teachers/>;
    case 7: return <Admin/>;
    case 8: return <Finance/>;
    case 9: return <Receipts/>;
    case 10: return <Sponsors/>;
    case 11: return <Loans/>;
    case 12: return <OrphanSponsors/>;
    case 13: return <Boarding/>;
    case 14: return <Notices/>;
    case 15: return <Calculator/>;
    case 16: return <Helpline/>;
    case 17: return <Changelog/>;
    default: return <Dashboard/>;
  }
}

// ──────────────────────── APP ────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const goTo = (menuIndex) => {
    setActiveMenu(menuIndex);
    setFabOpen(false);
  };

  const handleQuickAction = (action) => {
    goTo(action.menu);
    setToast(action.label);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Hind Siliguri','Noto Sans Bengali',sans-serif", background:"#F0F2F5", overflow:"hidden" }}>

      {/* Sidebar */}
      <div style={{ width:sidebarOpen?240:0, minWidth:sidebarOpen?240:0, background:"#fff", borderRight:"1px solid #E8ECEF", display:"flex", flexDirection:"column", transition:"all 0.25s", overflow:"hidden", flexShrink:0 }}>
        <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid #F0F2F5" }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:G, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🕌</div>
          <span style={{ fontWeight:600, fontSize:13, color:"#263238" }}>ড্যাশবোর্ড</span>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"8px 0" }}>
          {menuItems.map((item,i) => (
            <div key={i} onClick={() => goTo(i)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", cursor:"pointer", background:activeMenu===i?"#E8F5E9":"transparent", borderLeft:activeMenu===i?`3px solid ${G}`:"3px solid transparent", color:activeMenu===i?G:"#546E7A", fontSize:13, transition:"all 0.15s" }}>
              <span style={{ fontSize:15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:"#fff", borderBottom:"1px solid #E8ECEF", padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          {/* Sidebar toggle icon */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#546E7A" }} title={sidebarOpen?"সাইডবার বন্ধ":"সাইডবার খুলুন"}>
            {sidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <polyline points="15 9 12 12 15 15"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <polyline points="12 9 15 12 12 15"/>
              </svg>
            )}
          </button>
          <span style={{ fontWeight:700, fontSize:16, color:"#1A237E" }}>মাদরাসাতুল আযহার আল-আরাবিয়া</span>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"#E8F5E9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🕌</div>
            <span style={{ fontSize:18, cursor:"pointer" }}>🔔</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ padding:"8px 20px", background:"#fff", borderBottom:"1px solid #F0F2F5", fontSize:12, color:"#78909C" }}>
          <span style={{ cursor:"pointer", color:G }} onClick={() => goTo(0)}>ড্যাশবোর্ড</span>
          {activeMenu !== 0 && <><span style={{ margin:"0 6px" }}>›</span><span style={{ color:"#263238" }}>{menuItems[activeMenu].label}</span></>}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
          <PageContent index={activeMenu}/>
          {/* Footer */}
          <div style={{ borderTop:"1px solid #E8ECEF", marginTop:8, padding:"16px 0", textAlign:"center" }}>
            <div style={{ fontSize:13, color:"#78909C" }}>© {new Date().getFullYear()} মাদরাসাতুল আযহার আল-আরাবিয়া। সর্বস্বত্ব সংরক্ষিত।</div>
            <div style={{ fontSize:11, color:"#B0BEC5", marginTop:4 }}>Developed & Designed by <span style={{ color:G, fontWeight:600 }}>Easy Coding Space</span> · easycoding.space</div>
          </div>
        </div>
      </div>

      {/* FAB Overlay */}
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:98 }}/>}

      {/* Quick Action Menu */}
      {fabOpen && (
        <div style={{ position:"fixed", bottom:84, right:24, zIndex:99, background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", padding:"8px 0", minWidth:220 }}>
          <div style={{ padding:"10px 16px 8px", borderBottom:"1px solid #F0F2F5", fontSize:12, fontWeight:600, color:"#78909C" }}>দ্রুত যোগ করুন</div>
          {quickActions.map((a,i) => (
            <div key={i} onClick={() => handleQuickAction(a)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.background="#F5F5F5"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ width:32, height:32, borderRadius:8, background:a.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{a.icon}</div>
              <span style={{ fontSize:13, color:"#37474F" }}>{a.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <div onClick={() => setFabOpen(!fabOpen)} style={{ position:"fixed", bottom:24, right:24, zIndex:100, width:52, height:52, borderRadius:"50%", background:fabOpen?"#C62828":G, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, cursor:"pointer", boxShadow:"0 4px 16px rgba(46,125,50,0.4)", transition:"all 0.2s", transform:fabOpen?"rotate(45deg)":"rotate(0deg)", userSelect:"none" }}>+</div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:"#263238", color:"#fff", padding:"10px 20px", borderRadius:24, fontSize:13, zIndex:200, boxShadow:"0 4px 16px rgba(0,0,0,0.2)", whiteSpace:"nowrap" }}>
          ✅ {toast} পেজে এসেছেন
        </div>
      )}
    </div>
  );
}

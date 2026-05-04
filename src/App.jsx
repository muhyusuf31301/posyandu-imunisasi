import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const N8N_BASE = "https://n8n.srv860107.hstgr.cloud/webhook";

const API = {
  getData: async () => {
    const r = await fetch(N8N_BASE + "/posyandu/data");
    const text = await r.text();
    const clean = text.trim().startsWith("=") ? text.trim().slice(1) : text.trim();
    try { return JSON.parse(clean); } catch(e) { return { mothers: [] }; }
  },
  saveIbu: async (ibu) => {
    const r = await fetch(N8N_BASE + "/posyandu/ibu", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(ibu) });
    const text = await r.text();
    try { return JSON.parse(text); } catch(e) { return { success: true }; }
  },
  saveAnak: async (anak) => {
    const r = await fetch(N8N_BASE + "/posyandu/anak", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(anak) });
    const text = await r.text();
    try { return JSON.parse(text); } catch(e) { return { success: true }; }
  },
  deleteIbu: async (nik) => {
    const r = await fetch(N8N_BASE + "/posyandu/delete-ibu", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ nik }) });
    const text = await r.text();
    try { return JSON.parse(text); } catch(e) { return { success: true }; }
  },
  deleteAnak: async (nikIbu, name) => {
    const r = await fetch(N8N_BASE + "/posyandu/delete-anak", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ nikIbu, name }) });
    const text = await r.text();
    try { return JSON.parse(text); } catch(e) { return { success: true }; }
  },
};

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const POSYANDU_LIST = [
  { id:"bougenville", name:"Posyandu Bougenville", kelurahan:"Kel. Dupak", kecamatan:"Kec. Krembangan", kota:"Kota Surabaya", jadwal:"Setiap Sabtu minggu ke-1", kader:"Perawat Dwi & Bidan Yolanda" },
  { id:"tomat", name:"Posyandu Tomat", kelurahan:"Kel. Dupak", kecamatan:"Kec. Krembangan", kota:"Kota Surabaya", jadwal:"Setiap Sabtu minggu ke-2", kader:"Perawat Salsa & Bidan Manda" },
  { id:"leci", name:"Posyandu Leci", kelurahan:"Kel. Dupak", kecamatan:"Kec. Krembangan", kota:"Kota Surabaya", jadwal:"Setiap Sabtu minggu ke-3", kader:"Perawat Hartini & Bidan Rina" },
];

const VACCINES = [
  { id:"hb0",  name:"HB-0",           full:"Hepatitis B dosis pertama",       dueWeeks:0,  maxWeeks:1,  color:"#FF6B6B", group:"Lahir" },
  { id:"bcg",  name:"BCG",            full:"BCG + Polio tetes 1",             dueWeeks:4,  maxWeeks:8,  color:"#FF8E53", group:"1 Bulan" },
  { id:"dpt1", name:"DPT-HB-Hib 1",  full:"DPT-HB-Hib 1 + Polio tetes 2",   dueWeeks:8,  maxWeeks:16, color:"#F9A825", group:"2 Bulan" },
  { id:"dpt2", name:"DPT-HB-Hib 2",  full:"DPT-HB-Hib 2 + Polio tetes 3",   dueWeeks:12, maxWeeks:20, color:"#A8D672", group:"3 Bulan" },
  { id:"dpt3", name:"DPT-HB-Hib 3",  full:"DPT-HB-Hib 3 + Polio 4 + IPV",   dueWeeks:16, maxWeeks:24, color:"#4CAF50", group:"4 Bulan" },
  { id:"mr1",  name:"MR / Campak 1", full:"Measles-Rubella dosis 1",          dueWeeks:36, maxWeeks:52, color:"#26A69A", group:"9 Bulan" },
  { id:"dpt4", name:"DPT-HB-Hib 4",  full:"DPT-HB-Hib 4 + Polio tetes 5",   dueWeeks:72, maxWeeks:96, color:"#5C6BC0", group:"18 Bulan" },
  { id:"mr2",  name:"MR / Campak 2", full:"Measles-Rubella dosis 2",          dueWeeks:72, maxWeeks:96, color:"#AB47BC", group:"18 Bulan" },
];

const FAQ_DATA = [
  { q:"Apakah imunisasi aman untuk bayi saya?", a:"Ya, sangat aman. Vaksin telah melalui uji klinis bertahun-tahun. Efek samping ringan seperti demam adalah tanda sistem imun tubuh bekerja." },
  { q:"Apa yang harus dilakukan jika jadwal imunisasi terlewat?", a:"Jangan panik. Imunisasi dapat dikejar kapan saja. Tidak perlu mengulang dari awal. Segera bawa ke posyandu atau puskesmas." },
  { q:"Apakah anak yang sakit ringan bisa tetap diimunisasi?", a:"Jika hanya pilek ringan tanpa demam tinggi, imunisasi masih bisa dilanjutkan. Konsultasikan dengan petugas kesehatan jika ragu." },
  { q:"Apakah boleh memberikan beberapa vaksin sekaligus?", a:"Ya, sangat boleh dan aman. Sistem imun bayi mampu menangani beberapa vaksin sekaligus, mengurangi jumlah kunjungan." },
  { q:"Apa yang harus dilakukan setelah imunisasi?", a:"Tetap di fasilitas 15-30 menit. Jika demam, berikan parasetamol sesuai dosis. Kompres hangat di bekas suntikan." },
  { q:"Apakah imunisasi bisa menyebabkan penyakit yang dicegahnya?", a:"Tidak. Vaksin menggunakan virus atau bakteri yang sudah dilemahkan sehingga tidak bisa menyebabkan penyakit." },
];

const MITOS_DATA = [
  { mitos:"Imunisasi bisa menyebabkan autisme.", fakta:"Tidak ada bukti ilmiah yang menghubungkan vaksin dengan autisme. Penelitian yang diklaim demikian sudah terbukti palsu dan dicabut." },
  { mitos:"Anak ASI eksklusif tidak perlu imunisasi.", fakta:"ASI memberikan antibodi, tetapi tidak cukup melindungi dari polio, campak, dan difteri. Imunisasi tetap wajib." },
  { mitos:"Campak lebih baik dialami secara alami.", fakta:"Campak bisa menyebabkan radang otak, kebutaan, bahkan kematian. Kekebalan melalui vaksin sama efektifnya tanpa risiko tersebut." },
  { mitos:"Imunisasi tidak diperlukan karena penyakit sudah jarang.", fakta:"Penyakit tersebut jarang justru karena imunisasi berhasil. Jika berhenti, wabah bisa kembali terjadi." },
  { mitos:"Vaksin mengandung bahan berbahaya yang merusak otak.", fakta:"Kadar bahan pengawet dalam vaksin sangat kecil dan aman, sudah terbukti melalui pengujian ketat BPOM dan WHO." },
];

const KIPI_DATA = [
  { key:"ringan", label:"Reaksi Ringan", color:"#4CAF50", bg:"#E8F5E9", advice:"Kompres dingin area suntikan. Berikan parasetamol sesuai dosis jika demam. Pantau 24-48 jam." },
  { key:"sedang", label:"Reaksi Sedang", color:"#FF9800", bg:"#FFF3E0", advice:"Berikan parasetamol sesuai dosis dokter. Pantau ketat. Jika tidak membaik dalam 48 jam, segera ke puskesmas." },
  { key:"berat",  label:"Reaksi Berat",  color:"#F44336", bg:"#FFEBEE", advice:"SEGERA bawa ke Puskesmas atau IGD. Termasuk kejang, sesak napas, pembengkakan seluruh tubuh, atau pingsan." },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function ageWeeks(dob)  { return Math.floor((Date.now() - new Date(dob)) / 604800000); }
function ageMonths(dob) { return Math.floor((Date.now() - new Date(dob)) / 2629800000); }

function normalizeVaccines(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(v => (typeof v === "string" ? { id: v, date: null } : v));
}

function getGivenIds(raw) {
  return normalizeVaccines(raw).map(v => v.id);
}

function calcStatus(child) {
  var w = ageWeeks(child.dob);
  var givenIds = getGivenIds(child.vaccines);
  return {
    w,
    overdue:  VACCINES.filter(v => w > v.maxWeeks  && !givenIds.includes(v.id)),
    due:      VACCINES.filter(v => w >= v.dueWeeks && w <= v.maxWeeks && !givenIds.includes(v.id)),
    upcoming: VACCINES.filter(v => w < v.dueWeeks  && w >= v.dueWeeks - 4 && !givenIds.includes(v.id)),
    done:     VACCINES.filter(v => givenIds.includes(v.id)),
  };
}

function getPriority(child) {
  var s = calcStatus(child);
  if (s.overdue.length  > 0) return { label:"Terlewat",   color:"#C62828", bg:"#FFEBEE" };
  if (s.due.length      > 0) return { label:"Jadwal Ini", color:"#E65100", bg:"#FFF3E0" };
  if (s.upcoming.length > 0) return { label:"Minggu Ini", color:"#0D47A1", bg:"#E3F2FD" };
  return                            { label:"Lengkap",    color:"#2E7D32", bg:"#E8F5E9" };
}

function getClinicalRecs(child) {
  var s = calcStatus(child);
  var m = ageMonths(child.dob);
  var recs = [];
  if (s.overdue.length > 0)
    recs.push({ type:"danger", title:"Catch-up Diperlukan Segera",
      body:"Vaksin berikut sudah melewati jadwal: " + s.overdue.map(v => v.name).join(", ") + ". Masih bisa diberikan sekarang." });
  if (s.due.length > 0)
    recs.push({ type:"warning", title:"Imunisasi Sekarang",
      body:"Berikan segera: " + s.due.map(v => v.name).join(", ") + ". Usia anak (" + m + " bulan) sudah masuk jadwal." });
  if (s.upcoming.length > 0)
    recs.push({ type:"info", title:"Jadwal Dalam 2-4 Minggu",
      body:"Segera akan dijadwalkan: " + s.upcoming.map(v => v.name).join(", ") + ". Ingatkan ibu untuk hadir bulan depan." });
  if (s.overdue.length === 0 && s.due.length === 0)
    recs.push({ type:"success", title:"Status Imunisasi Baik",
      body:"Semua vaksin sesuai usia sudah diberikan. Pantau terus dan hadirkan anak di posyandu sesuai jadwal." });
  if (s.overdue.length > 2)
    recs.push({ type:"danger", title:"Perlu Konsultasi Puskesmas",
      body:"Terdapat " + s.overdue.length + " vaksin terlewat. Disarankan koordinasi langsung dengan petugas puskesmas untuk jadwal catch-up yang aman." });
  return recs;
}

function buildWALink(child, motherName, phone) {
  var s = calcStatus(child);
  var m = ageMonths(child.dob);
  var msg = "";
  if (s.overdue.length > 0) {
    msg = "Assalamualaikum Ibu " + motherName + "\n\nKami dari Posyandu Bougenville ingin mengingatkan bahwa putra/putri Ibu, " + child.name + " (" + m + " bulan), memiliki vaksin yang BELUM diberikan:\n\n" + s.overdue.map(v => "- " + v.full).join("\n") + "\n\nMohon segera bawa si kecil ke Posyandu atau Puskesmas.\nJadwal posyandu: Sabtu minggu ke-1.\n\nTerima kasih Bu";
  } else if (s.due.length > 0) {
    msg = "Assalamualaikum Ibu " + motherName + "\n\nPengingat dari Posyandu Bougenville:\n\nPutra/putri Ibu, " + child.name + " (" + m + " bulan), sudah waktunya mendapatkan:\n\n" + s.due.map(v => "- " + v.full).join("\n") + "\n\nSilakan hadir di posyandu sesuai jadwal. Imunisasi gratis!\n\nTerima kasih";
  }
  var clean = phone.replace(/\D/g, "").replace(/^0/, "62");
  return "https://wa.me/" + clean + "?text=" + encodeURIComponent(msg);
}

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
var P = "#1B5E20", P2 = "#2E7D32", P3 = "#43A047";
var BG = "#F1F8E9", SRF = "#FFFFFF", BRD = "#C8E6C9";
var TXT = "#1A1A1A", TM = "#4A5568", TL = "#9E9E9E";
var FF = "Nunito, sans-serif", FS = "Georgia, serif";

// ─────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────
function TopBar({ title, onBack, rightLabel, onRight }) {
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", background:SRF, borderBottom:"1px solid "+BRD, gap:10, flexShrink:0 }}>
      {onBack && <button onClick={onBack} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:P, padding:"0 6px", lineHeight:1, fontFamily:FF }}>{"<"}</button>}
      <span style={{ flex:1, fontFamily:FF, fontSize:17, fontWeight:800, color:P }}>{title}</span>
      {rightLabel && <button onClick={onRight} style={{ background:P, border:"none", borderRadius:20, padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FF }}>{rightLabel}</button>}
    </div>
  );
}

function Card({ children, style, onClick }) {
  var merged = Object.assign({}, { background:SRF, borderRadius:14, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,0.07)", marginBottom:12 }, style || {});
  return <div style={merged} onClick={onClick}>{children}</div>;
}

function Pill({ children, color, bg }) {
  return <span style={{ background:bg||"#eee", color:color||"#555", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, display:"inline-block", fontFamily:FF }}>{children}</span>;
}

function SL({ children }) {
  return <div style={{ fontFamily:FF, fontSize:11, fontWeight:800, color:P2, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8, marginTop:4 }}>{children}</div>;
}

function TInput({ label, value, onChange, placeholder, type, maxLength }) {
  return (
    <div>
      <div style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:TM, marginBottom:4, marginTop:12 }}>{label}</div>
      <input type={type||"text"} placeholder={placeholder||""} maxLength={maxLength} value={value} onChange={onChange}
        style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:"1.5px solid "+BRD, fontSize:14, fontFamily:FF, outline:"none", boxSizing:"border-box" }} />
    </div>
  );
}

function GBtn({ children, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:13, border:"none", borderRadius:12, background:disabled?"#ccc":"linear-gradient(135deg,#1B5E20,#43A047)", color:"#fff", fontSize:15, fontWeight:800, cursor:disabled?"default":"pointer", fontFamily:FF, boxShadow:disabled?"none":"0 4px 14px rgba(27,94,32,0.3)", marginTop:18 }}>{children}</button>;
}

function Empty({ icon, text }) {
  return <div style={{ textAlign:"center", padding:"40px 20px" }}><div style={{ fontSize:40, marginBottom:10 }}>{icon}</div><div style={{ fontFamily:FF, fontSize:13, color:TL }}>{text}</div></div>;
}

function AccItem({ q, children }) {
  var [open, setOpen] = useState(false);
  return (
    <Card style={{ padding:0, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontFamily:FF, fontSize:13, fontWeight:600, color:TXT, flex:1, lineHeight:1.4 }}>{q}</span>
        <span style={{ fontSize:11, color:TL, flexShrink:0 }}>{open ? "[-]" : "[+]"}</span>
      </button>
      {open && <div style={{ padding:"0 16px 14px", fontFamily:FF, fontSize:13, color:TM, lineHeight:1.6, borderTop:"1px solid "+BRD }}>{children}</div>}
    </Card>
  );
}

// Loading & toast helpers
function Spinner() {
  return <div style={{ display:"inline-block", width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:8 }} />;
}

function Toast({ msg, type }) {
  if (!msg) return null;
  var bg = type === "error" ? "#C62828" : "#2E7D32";
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:bg, color:"#fff", padding:"10px 20px", borderRadius:24, fontFamily:FF, fontSize:13, fontWeight:700, zIndex:999, boxShadow:"0 4px 16px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: LOGIN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  var [selected, setSelected] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  async function go() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const result = await API.getData();
      onLogin(selected, result);
    } catch(e) {
      setError("Gagal terhubung ke server. Periksa koneksi internet.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#E8F5E9 0%,#F9FBE7 60%,#FFFDE7 100%)", display:"flex", flexDirection:"column", paddingBottom:36 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ padding:"52px 28px 28px" }}>
        <div style={{ fontSize:52, marginBottom:14 }}>&#x1F33F;</div>
        <h1 style={{ fontFamily:FS, fontSize:27, fontWeight:700, color:P, lineHeight:1.25, margin:"0 0 10px" }}>Sistem Imunisasi<br />Posyandu Digital</h1>
        <p style={{ fontFamily:FF, fontSize:14, color:TM, margin:0 }}>Platform pencatatan dan monitoring imunisasi balita terintegrasi</p>
      </div>
      <div style={{ padding:"0 20px", flex:1 }}>
        <div style={{ fontFamily:FF, fontSize:11, fontWeight:800, color:P2, textTransform:"uppercase", letterSpacing:0.5, marginBottom:12 }}>Pilih Posyandu Anda</div>
        {POSYANDU_LIST.map(p => {
          var isSel = selected && selected.id === p.id;
          return (
            <button key={p.id} onClick={() => setSelected(p)} style={{ width:"100%", background:isSel?P:SRF, border:isSel?"none":"2px solid "+BRD, borderRadius:16, padding:"18px 20px", marginBottom:10, textAlign:"left", cursor:"pointer", boxShadow:isSel?"0 6px 20px rgba(27,94,32,0.25)":"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:24, background:isSel?"rgba(255,255,255,0.2)":"#E8F5E9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>&#x1F3E5;</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:FS, fontSize:16, fontWeight:700, color:isSel?"#fff":P, marginBottom:2 }}>{p.name}</div>
                  <div style={{ fontFamily:FF, fontSize:12, color:isSel?"rgba(255,255,255,0.8)":TL }}>{p.kelurahan} - {p.kecamatan}</div>
                  <div style={{ fontFamily:FF, fontSize:11, color:isSel?"rgba(255,255,255,0.7)":TL, marginTop:2 }}>Jadwal: {p.jadwal}</div>
                </div>
                {isSel && <div style={{ fontSize:20, color:"#fff" }}>&#x2713;</div>}
              </div>
            </button>
          );
        })}
        <div style={{ border:"2px dashed "+BRD, borderRadius:14, padding:14, textAlign:"center", marginTop:4 }}>
          <div style={{ fontFamily:FF, fontSize:12, color:TL }}>+ Posyandu lain akan segera tersedia</div>
        </div>
      </div>
      <div style={{ padding:"20px 20px 0" }}>
        {error && <div style={{ fontFamily:FF, fontSize:12, color:"#C62828", background:"#FFEBEE", padding:"10px 14px", borderRadius:10, marginBottom:10, textAlign:"center" }}>{error}</div>}
        <button onClick={go} disabled={!selected || loading} style={{ width:"100%", padding:16, border:"none", borderRadius:12, cursor:selected&&!loading?"pointer":"default", background:selected&&!loading?"linear-gradient(135deg,#1B5E20,#43A047)":"#ccc", color:"#fff", fontSize:15, fontWeight:800, fontFamily:FF, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {loading && <Spinner />}
          {loading ? "Memuat data..." : selected ? "Masuk ke " + selected.name : "Pilih posyandu dahulu"}
        </button>
        <p style={{ fontFamily:FF, fontSize:11, color:TL, textAlign:"center", marginTop:12 }}>Data tersimpan di Google Sheets dan bisa diakses dari HP manapun</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: HOME
// ─────────────────────────────────────────────
function HomeScreen({ posyandu, data, onNav, onNavToChild, onLogout }) {
  var allC = (data.mothers || []).flatMap(m => (m.children || []).map(c => Object.assign({}, c, { mother: m })));
  var overdue = allC.filter(c => calcStatus(c).overdue.length > 0);
  var dueNow  = allC.filter(c => { var s = calcStatus(c); return s.overdue.length === 0 && s.due.length > 0; });
  var ok      = allC.filter(c => { var s = calcStatus(c); return s.overdue.length === 0 && s.due.length === 0 && s.upcoming.length === 0; });
  var plist   = [...overdue, ...dueNow].slice(0, 5);
  var today   = new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:BG }}>
      <div style={{ background:"linear-gradient(135deg,#1B5E20,#43A047)", padding:"24px 20px 28px", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:FF, fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:4, fontWeight:600 }}>{today}</div>
            <div style={{ fontFamily:FS, fontSize:19, fontWeight:700, color:"#fff", marginBottom:2 }}>{posyandu.name}</div>
            <div style={{ fontFamily:FF, fontSize:12, color:"rgba(255,255,255,0.75)" }}>{posyandu.kelurahan} - {posyandu.kota}</div>
          </div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:20, padding:"6px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FF }}>Keluar</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:18 }}>
          {[
            { num:allC.length,    label:"Total",    alert:false },
            { num:overdue.length, label:"Terlewat", alert:overdue.length > 0 },
            { num:dueNow.length,  label:"Hari Ini", alert:dueNow.length > 0 },
            { num:ok.length,      label:"Lengkap",  alert:false },
          ].map((s, i) => (
            <div key={i} style={{ background:s.alert?"rgba(255,82,82,0.2)":"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 6px", textAlign:"center", border:s.alert?"1px solid rgba(255,82,82,0.4)":"none" }}>
              <div style={{ fontFamily:FS, fontSize:22, fontWeight:700, color:"#fff", lineHeight:1.1 }}>{s.num}</div>
              <div style={{ fontFamily:FF, fontSize:10, color:"rgba(255,255,255,0.75)", fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {overdue.length > 0 && (
          <Card style={{ background:"#FFEBEE", border:"1px solid #FFCDD2", padding:"14px 16px" }}>
            <div style={{ fontFamily:FF, fontWeight:800, color:"#C62828", fontSize:14, marginBottom:6 }}>{overdue.length} anak perlu catch-up segera!</div>
            {overdue.slice(0, 3).map((c, i) => <div key={i} style={{ fontFamily:FF, fontSize:12, color:"#C62828", marginBottom:2 }}>- {c.name} ({ageMonths(c.dob)} bln): {calcStatus(c).overdue.map(v => v.name).join(", ")}</div>)}
            {overdue.length > 3 && <div style={{ fontFamily:FF, fontSize:12, color:"#C62828" }}>...dan {overdue.length-3} anak lainnya</div>}
            <button onClick={() => onNav("pencatatan")} style={{ marginTop:10, width:"100%", padding:10, border:"none", borderRadius:10, background:"#C62828", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:FF }}>Lihat Semua</button>
          </Card>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <button onClick={() => onNav("pencatatan")} style={{ background:"linear-gradient(135deg,#1B5E20,#43A047)", border:"none", borderRadius:16, padding:"20px 16px", textAlign:"left", cursor:"pointer", boxShadow:"0 6px 20px rgba(27,94,32,0.25)" }}>
            <div style={{ fontSize:26, marginBottom:8 }}>&#x1F4CB;</div>
            <div style={{ fontFamily:FS, fontSize:15, fontWeight:700, color:"#fff" }}>Pencatatan</div>
            <div style={{ fontFamily:FF, fontSize:11, color:"rgba(255,255,255,0.75)", marginTop:2 }}>{allC.length} anak terdaftar</div>
          </button>
          <button onClick={() => onNav("edukasi")} style={{ background:"linear-gradient(135deg,#F9A825,#FFB300)", border:"none", borderRadius:16, padding:"20px 16px", textAlign:"left", cursor:"pointer", boxShadow:"0 6px 20px rgba(249,168,37,0.3)" }}>
            <div style={{ fontSize:26, marginBottom:8 }}>&#x1F4DA;</div>
            <div style={{ fontFamily:FS, fontSize:15, fontWeight:700, color:"#fff" }}>Edukasi</div>
            <div style={{ fontFamily:FF, fontSize:11, color:"rgba(255,255,255,0.8)", marginTop:2 }}>FAQ dan Mitos/Fakta</div>
          </button>
        </div>
        <SL>Prioritas Hari Ini</SL>
        {allC.length === 0 && <Empty icon="&#x1F476;" text="Belum ada data anak. Mulai tambahkan data di menu Pencatatan." />}
        {plist.map((c, i) => {
          var p = getPriority(c);
          var s = calcStatus(c);
          var vn = [...s.overdue, ...s.due].map(v => v.name).join(", ");
          // Cari index anak di dalam data ibu
          var mother = (data.mothers || []).find(m => m.nik === c.mother.nik);
          var childIdx = mother ? (mother.children || []).findIndex(ch => ch.name === c.name && ch.dob === c.dob) : 0;
          return (
            <Card key={i} style={{ padding:"12px 14px", cursor:"pointer" }} onClick={() => onNavToChild(c.mother.nik, childIdx)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:20, background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:p.color, flexShrink:0 }}>
                  {p.label === "Terlewat" ? "!" : p.label === "Jadwal Ini" ? "+" : "~"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:FF, fontSize:14, fontWeight:800, color:TXT, marginBottom:2 }}>{c.name}</div>
                  <div style={{ fontFamily:FF, fontSize:11, color:TL }}>Ibu: {c.mother.name} - {ageMonths(c.dob)} bulan</div>
                  {vn && <div style={{ fontFamily:FF, fontSize:11, color:p.color, fontWeight:700, marginTop:2 }}>{vn}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <Pill color={p.color} bg={p.bg}>{p.label}</Pill>
                  <span style={{ fontFamily:FF, fontSize:11, color:TL }}>Tap untuk detail ›</span>
                </div>
              </div>
            </Card>
          );
        })}
        <Card style={{ background:"linear-gradient(135deg,#E8F5E9,#F9FBE7)", border:"1px solid "+BRD, marginTop:4 }}>
          <SL>Info Posyandu</SL>
          <div style={{ fontFamily:FF, fontSize:13, color:TM }}>Jadwal: <b>{posyandu.jadwal}</b></div>
          <div style={{ fontFamily:FF, fontSize:13, color:TM }}>Kader: <b>{posyandu.kader}</b></div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: EDUKASI
// ─────────────────────────────────────────────
function EdukasiScreen({ onBack }) {
  var [tab, setTab] = useState("faq");
  var [dob, setDob] = useState("");
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG }}>
      <TopBar title="Edukasi Imunisasi" onBack={onBack} />
      <div style={{ display:"flex", background:SRF, borderBottom:"1px solid "+BRD, flexShrink:0 }}>
        {[["faq","FAQ"],["mitos","Mitos/Fakta"],["jadwal","Jadwal Vaksin"]].map(t => (
          <button key={t[0]} onClick={() => setTab(t[0])} style={{ flex:1, padding:"11px 0", border:"none", background:"none", fontSize:12, fontWeight:700, fontFamily:FF, color:tab===t[0]?P:TL, borderBottom:tab===t[0]?"3px solid "+P:"3px solid transparent", cursor:"pointer" }}>{t[1]}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px 32px" }}>
        {tab==="faq"   && <div><SL>Pertanyaan yang Sering Ditanyakan</SL>{FAQ_DATA.map((f,i)=><AccItem key={i} q={f.q}>{f.a}</AccItem>)}</div>}
        {tab==="mitos" && <div><SL>Luruskan Mitos Imunisasi</SL>{MITOS_DATA.map((m,i)=>(
          <AccItem key={i} q={"MITOS: "+m.mitos}>
            <div style={{ background:"#E8F5E9", borderRadius:10, padding:"10px 12px", marginTop:6 }}>
              <div style={{ fontFamily:FF, fontSize:10, fontWeight:800, color:P2, marginBottom:4 }}>FAKTA:</div>
              <div style={{ fontFamily:FF, fontSize:13, color:TM }}>{m.fakta}</div>
            </div>
          </AccItem>
        ))}</div>}
        {tab==="jadwal" && <div>
          <SL>Jadwal Imunisasi Nasional (0-18 Bulan)</SL>
          <Card style={{ background:"#E8F5E9", border:"1px solid "+BRD }}>
            <div style={{ fontFamily:FF, fontSize:13, color:TM }}>Masukkan tanggal lahir anak untuk melihat jadwal personalnya:</div>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ width:"100%", marginTop:8, padding:"10px 12px", borderRadius:10, border:"1.5px solid "+BRD, fontSize:14, fontFamily:FF, outline:"none", boxSizing:"border-box" }} />
          </Card>
          {VACCINES.map(v => {
            var sd = dob ? new Date(new Date(dob).getTime()+v.dueWeeks*7*86400000) : null;
            var passed = sd && sd < new Date();
            return (
              <Card key={v.id} style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:10, height:10, borderRadius:5, background:v.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:FF, fontSize:14, fontWeight:800, color:TXT }}>{v.name}</div>
                    <div style={{ fontFamily:FF, fontSize:12, color:TL }}>{v.full}</div>
                    {sd && <div style={{ fontFamily:FF, fontSize:12, color:passed?TL:P2, fontWeight:700, marginTop:2 }}>{sd.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}{passed?" (sudah lewat)":""}</div>}
                  </div>
                  <Pill color={P2} bg="#E8F5E9">{v.group}</Pill>
                </div>
              </Card>
            );
          })}
          <SL>Panduan Reaksi KIPI</SL>
          {KIPI_DATA.map(k => (
            <Card key={k.key} style={{ border:"1.5px solid "+k.color+"40", padding:"12px 14px" }}>
              <div style={{ fontFamily:FF, fontWeight:800, fontSize:13, color:k.color, marginBottom:6 }}>{k.label}</div>
              <div style={{ fontFamily:FF, fontSize:13, color:TM }}>{k.advice}</div>
            </Card>
          ))}
        </div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: PENCATATAN
// ─────────────────────────────────────────────
function PencatatanScreen({ onBack, data, onDataChange, deepLink, onClearDeepLink }) {
  var [search, setSearch]   = useState("");
  var [filter, setFilter]   = useState("all");
  var [selMother, setSelMother] = useState(null);
  var [addMother, setAddMother] = useState(false);
  var [addChild, setAddChild]   = useState(false);
  var [toast, setToast]     = useState({ msg:"", type:"ok" });

  var mothers = data.mothers || [];

  // Handle deepLink — buka langsung ke ibu + anak tertentu
  useEffect(() => {
    if (deepLink && deepLink.motherNik) {
      var m = mothers.find(m => m.nik === deepLink.motherNik);
      if (m) setSelMother({ ...m, _openChildIdx: deepLink.childIdx });
    }
  }, [deepLink]);

  var mothers = data.mothers || [];

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"ok" }), 2500);
  }

  var filtered = mothers.filter(m => {
    var match = m.name.toLowerCase().includes(search.toLowerCase()) || m.nik.includes(search);
    if (!match) return false;
    if (filter==="all") return true;
    return (m.children||[]).some(c => {
      var s = calcStatus(c);
      if (filter==="overdue") return s.overdue.length > 0;
      if (filter==="due")     return s.overdue.length===0&&s.due.length>0;
      if (filter==="ok")      return s.overdue.length===0&&s.due.length===0;
      return true;
    });
  });

  if (addMother) return (
    <AddMotherForm onBack={() => setAddMother(false)} onSave={async m => {
      try {
        await API.saveIbu(m);
        var nd = Object.assign({}, data, { mothers: [...mothers, m] });
        onDataChange(nd);
        setAddMother(false);
        setSelMother(nd.mothers[nd.mothers.length-1]);
        showToast("Data ibu berhasil disimpan", "ok");
      } catch(e) { showToast("Gagal menyimpan, cek koneksi", "error"); }
    }} />
  );

  if (addChild && selMother) return (
    <AddChildForm mother={selMother} onBack={() => setAddChild(false)} onSave={async c => {
      try {
        await API.saveAnak(Object.assign({}, c, { nikIbu: selMother.nik }));
        var nd = Object.assign({}, data, { mothers: mothers.map(m => m.nik===selMother.nik ? Object.assign({},m,{children:[...(m.children||[]),c]}) : m) });
        onDataChange(nd);
        setAddChild(false);
        setSelMother(nd.mothers.find(m => m.nik===selMother.nik));
        showToast("Data anak berhasil disimpan", "ok");
      } catch(e) { showToast("Gagal menyimpan, cek koneksi", "error"); }
    }} />
  );

  if (selMother) {
    var cm = mothers.find(m => m.nik===selMother.nik) || selMother;
    var openChildIdx = selMother._openChildIdx !== undefined ? selMother._openChildIdx : null;
    return (
      <MotherDetail mother={cm} onBack={() => { setSelMother(null); if (onClearDeepLink) onClearDeepLink(); }} onAddChild={() => setAddChild(true)}
        showToast={showToast}
        initialExpandedChild={openChildIdx}
        onDeleteIbu={async () => {
          if (!window.confirm("Hapus Ibu " + cm.name + " beserta semua data anaknya? Tidak bisa dibatalkan.")) return;
          try {
            await API.deleteIbu(cm.nik);
            var nd = Object.assign({}, data, { mothers: mothers.filter(m => m.nik !== cm.nik) });
            onDataChange(nd);
            setSelMother(null);
            showToast("Data ibu dan anak berhasil dihapus", "ok");
          } catch(e) { showToast("Gagal menghapus, cek koneksi", "error"); }
        }}
        onUpdateChild={async (idx, updated) => {
          // updated = null berarti hapus anak
          if (updated === null) {
            var nd = Object.assign({}, data, { mothers: mothers.map(m => m.nik!==cm.nik?m:Object.assign({},m,{children:m.children.filter((_,i)=>i!==idx)})) });
            onDataChange(nd);
            setSelMother(nd.mothers.find(m => m.nik===cm.nik));
            return;
          }
          try {
            await API.saveAnak(Object.assign({}, updated, { nikIbu: cm.nik }));
            var nd = Object.assign({}, data, { mothers: mothers.map(m => m.nik!==cm.nik?m:Object.assign({},m,{children:m.children.map((c,i)=>i===idx?updated:c)})) });
            onDataChange(nd);
            setSelMother(nd.mothers.find(m => m.nik===cm.nik));
            showToast("Vaksin diperbarui", "ok");
          } catch(e) { showToast("Gagal menyimpan, cek koneksi", "error"); }
        }}
      />
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG }}>
      <TopBar title="Pencatatan" onBack={onBack} rightLabel="+ Ibu" onRight={() => setAddMother(true)} />
      <div style={{ background:SRF, padding:"10px 16px 12px", borderBottom:"1px solid "+BRD, flexShrink:0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama ibu atau NIK..."
          style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:"1.5px solid "+BRD, fontSize:13, outline:"none", fontFamily:FF, boxSizing:"border-box" }} />
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          {[["all","Semua"],["overdue","Terlewat"],["due","Hari Ini"],["ok","Lengkap"]].map(opt => (
            <button key={opt[0]} onClick={() => setFilter(opt[0])} style={{ padding:"5px 12px", borderRadius:20, border:filter===opt[0]?"none":"1.5px solid "+BRD, background:filter===opt[0]?P:"none", color:filter===opt[0]?"#fff":TM, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:FF }}>{opt[1]}</button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 32px" }}>
        {filtered.length===0 && <Empty icon="&#x1F50D;" text={search?"Data tidak ditemukan.":"Belum ada data ibu. Tap + Ibu untuk mulai."} />}
        {filtered.map((m,i) => {
          var cc=(m.children||[]).length;
          var oc=(m.children||[]).filter(c=>calcStatus(c).overdue.length>0).length;
          var dc=(m.children||[]).filter(c=>{var s=calcStatus(c);return s.overdue.length===0&&s.due.length>0;}).length;
          return (
            <Card key={i} style={{ padding:"14px 16px", cursor:"pointer" }} onClick={() => setSelMother(m)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:46, height:46, borderRadius:23, background:"linear-gradient(135deg,#1B5E20,#43A047)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#fff", flexShrink:0 }}>{(m.name[0]||"?").toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:FF, fontSize:15, fontWeight:800, color:TXT }}>{m.name}</div>
                  <div style={{ fontFamily:FF, fontSize:11, color:TL, marginTop:1 }}>NIK: {m.nik}</div>
                  <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
                    <Pill color={P2} bg="#E8F5E9">{cc} anak</Pill>
                    {oc>0&&<Pill color="#C62828" bg="#FFEBEE">{oc} terlewat</Pill>}
                    {dc>0&&<Pill color="#E65100" bg="#FFF3E0">{dc} hari ini</Pill>}
                  </div>
                </div>
                <span style={{ fontSize:18, color:TL }}>{">"}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: MOTHER DETAIL
// ─────────────────────────────────────────────
function MotherDetail({ mother, onBack, onAddChild, onUpdateChild, onDeleteIbu, showToast, initialExpandedChild }) {
  var [expanded, setExpanded] = useState(initialExpandedChild !== null && initialExpandedChild !== undefined ? initialExpandedChild : null);
  var [ctab, setCtab] = useState("status");
  var [saving, setSaving] = useState(false);
  var [editMode, setEditMode] = useState(false);
  var [editName, setEditName] = useState("");
  var [editDob, setEditDob] = useState("");
  var [editIdx, setEditIdx] = useState(null);
  var [pendingVac, setPendingVac] = useState(null);
  var rcols = { danger:["#C62828","#FFEBEE"], warning:["#E65100","#FFF3E0"], info:["#0D47A1","#E3F2FD"], success:[P2,"#E8F5E9"] };

  async function handleToggleVac(child, idx, vid, confirmedDate) {
    setSaving(true);
    var cur = normalizeVaccines(child.vaccines);
    var isGiven = cur.some(v => v.id === vid);
    var upd;
    if (isGiven) {
      upd = cur.filter(v => v.id !== vid);
    } else {
      upd = [...cur, { id: vid, date: confirmedDate || new Date().toISOString().slice(0, 10) }];
    }
    await onUpdateChild(idx, Object.assign({}, child, { vaccines: upd }));
    setSaving(false);
  }

  async function handleSaveEdit(child, idx) {
    if (!editName.trim()) { showToast("Nama tidak boleh kosong", "error"); return; }
    if (!editDob) { showToast("Tanggal lahir tidak boleh kosong", "error"); return; }
    setSaving(true);
    // Pass originalName supaya n8n bisa cari row lama meski nama berubah
    await onUpdateChild(idx, Object.assign({}, child, { 
      name: editName, 
      dob: editDob,
      originalName: child.name  // nama asli sebelum diedit
    }));
    setSaving(false);
    setEditMode(false);
    setEditIdx(null);
    showToast("Data anak berhasil diupdate", "ok");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG }}>
      <TopBar title="Detail Ibu" onBack={onBack} rightLabel="+ Anak" onRight={onAddChild} />
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ background:"linear-gradient(135deg,#1B5E20,#43A047)", padding:"20px 20px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:56, height:56, borderRadius:28, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:"#fff" }}>{(mother.name[0]||"?").toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:FS, fontSize:18, fontWeight:700, color:"#fff" }}>{mother.name}</div>
              <div style={{ fontFamily:FF, fontSize:12, color:"rgba(255,255,255,0.75)" }}>NIK: {mother.nik}</div>
              {mother.phone  && <div style={{ fontFamily:FF, fontSize:12, color:"rgba(255,255,255,0.75)" }}>WA: {mother.phone}</div>}
              {mother.alamat && <div style={{ fontFamily:FF, fontSize:12, color:"rgba(255,255,255,0.75)" }}>Alamat: {mother.alamat}</div>}
            </div>
            <button onClick={onDeleteIbu} style={{ background:"rgba(255,82,82,0.25)", border:"1px solid rgba(255,82,82,0.5)", borderRadius:20, padding:"6px 12px", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:FF, flexShrink:0 }}>
              Hapus Ibu
            </button>
          </div>
        </div>
        <div style={{ padding:"14px 16px" }}>
          <SL>Daftar Anak ({(mother.children||[]).length})</SL>
          {(mother.children||[]).length===0 && <Empty icon="&#x1F476;" text="Belum ada data anak. Tap + Anak untuk menambahkan." />}
          {(mother.children||[]).map((child,idx) => {
            var s = calcStatus(child);
            var p = getPriority(child);
            var recs = getClinicalRecs(child);
            var exp = expanded===idx;
            return (
              <Card key={idx} style={{ padding:0, overflow:"hidden" }}>
                <button onClick={() => { var closing = exp; setExpanded(exp?null:idx); setCtab("status"); if (closing) setPendingVac(null); }} style={{ width:"100%", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ width:42, height:42, borderRadius:21, background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>&#x1F476;</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:FF, fontSize:15, fontWeight:800, color:TXT }}>{child.name}</div>
                    <div style={{ fontFamily:FF, fontSize:12, color:TL }}>{new Date(child.dob).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})} - {ageMonths(child.dob)} bulan</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <Pill color={p.color} bg={p.bg}>{p.label}</Pill>
                    <span style={{ fontSize:11, color:TL }}>{exp?"^":"v"}</span>
                  </div>
                </button>
                {exp && (
                  <div style={{ borderTop:"1px solid "+BRD }}>
                    <div style={{ display:"flex", borderBottom:"1px solid "+BRD }}>
                      {[["status","Kartu Vaksin"],["rec","Rekomendasi"],["kipi","KIPI"],["edit","Edit"]].map(t => (
                        <button key={t[0]} onClick={() => {
                          setCtab(t[0]);
                          setPendingVac(null);
                          if (t[0]==="edit") { setEditName(child.name); setEditDob(child.dob); setEditIdx(idx); }
                        }} style={{ flex:1, padding:"9px 4px", border:"none", background:"none", fontSize:11, fontWeight:700, fontFamily:FF, color:ctab===t[0]?P:TL, borderBottom:ctab===t[0]?"2.5px solid "+P:"2.5px solid transparent", cursor:"pointer" }}>{t[1]}</button>
                      ))}
                    </div>
                    <div style={{ padding:"14px 16px" }}>
                      {ctab==="status" && (
                        <div>
                          {saving && <div style={{ fontFamily:FF, fontSize:11, color:P2, textAlign:"center", marginBottom:8 }}>Menyimpan ke Google Sheets...</div>}
                          {VACCINES.map(v => {
                            var givenIds = getGivenIds(child.vaccines);
                            var given = givenIds.includes(v.id);
                            var vacRecord = normalizeVaccines(child.vaccines).find(r => r.id === v.id);
                            var vacDate = vacRecord ? vacRecord.date : null;
                            var isOv  = s.overdue.some(x => x.id===v.id);
                            var isDu  = s.due.some(x => x.id===v.id);
                            var dc    = given?v.color:isOv?"#C62828":isDu?"#E65100":"#E0E0E0";
                            var tx    = given
                              ? (vacDate ? new Date(vacDate).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "Sudah")
                              : isOv?"Terlewat":isDu?"Jadwal ini":"Belum";
                            var sc    = new Date(new Date(child.dob).getTime()+v.dueWeeks*7*86400000);
                            var isPending = pendingVac && pendingVac.childIdx === idx && pendingVac.vid === v.id;
                            return (
                              <div key={v.id} style={{ marginBottom: 9 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <button onClick={() => {
                                    if (given) {
                                      handleToggleVac(child, idx, v.id, null);
                                    } else {
                                      setPendingVac({
                                        childIdx: idx,
                                        vid: v.id,
                                        date: new Date().toISOString().slice(0, 10)
                                      });
                                    }
                                  }} disabled={saving} style={{ width:28, height:28, borderRadius:14, background:isPending?"#FF9800":dc, border:"none", cursor:saving?"default":"pointer", flexShrink:0, color:"#fff", fontSize:13, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FF, opacity:saving?0.6:1 }}>
                                    {given ? "v" : isPending ? "..." : ""}
                                  </button>
                                  <div style={{ flex:1 }}>
                                    <div style={{ fontFamily:FF, fontSize:13, fontWeight:700, color:given?TM:isOv?"#C62828":TXT }}>{v.name}</div>
                                    <div style={{ fontFamily:FF, fontSize:10, color:TL }}>
                                      {v.group} - Jadwal: {sc.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}
                                    </div>
                                  </div>
                                  <span style={{ fontFamily:FF, fontSize:10, fontWeight:700, color:given?P2:isOv?"#C62828":isDu?"#E65100":TL }}>{tx}</span>
                                </div>
                                {isPending && (
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, marginLeft:38, background:"#FFF8E1", borderRadius:8, padding:"8px 10px", border:"1px solid #FFD54F" }}>
                                    <input
                                      type="date"
                                      value={pendingVac.date}
                                      max={new Date().toISOString().slice(0, 10)}
                                      onChange={e => setPendingVac(pv => Object.assign({}, pv, { date: e.target.value }))}
                                      style={{ flex:1, padding:"6px 8px", borderRadius:7, border:"1.5px solid "+BRD, fontSize:13, fontFamily:FF, outline:"none" }}
                                    />
                                    <button
                                      onClick={() => {
                                        handleToggleVac(child, idx, v.id, pendingVac.date);
                                        setPendingVac(null);
                                      }}
                                      disabled={saving}
                                      style={{ padding:"6px 12px", borderRadius:7, border:"none", background:P, color:"#fff", fontSize:12, fontWeight:700, fontFamily:FF, cursor:"pointer" }}
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() => setPendingVac(null)}
                                      style={{ padding:"6px 10px", borderRadius:7, border:"1px solid "+BRD, background:"#fff", color:TM, fontSize:12, fontWeight:700, fontFamily:FF, cursor:"pointer" }}
                                    >
                                      Batal
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div style={{ fontFamily:FF, fontSize:10, color:TL, textAlign:"center", marginTop:4 }}>Tap lingkaran untuk update status vaksin - otomatis tersimpan ke Google Sheets</div>
                          {mother.phone && (s.overdue.length>0||s.due.length>0) && (
                            <a href={buildWALink(child,mother.name,mother.phone)} target="_blank" rel="noreferrer" style={{ display:"block", background:"#25D366", color:"#fff", textAlign:"center", padding:12, borderRadius:12, fontSize:14, fontWeight:700, textDecoration:"none", marginTop:12, fontFamily:FF }}>
                              Kirim Pengingat WhatsApp ke Ibu
                            </a>
                          )}
                          {!mother.phone && <div style={{ fontFamily:FF, fontSize:11, color:TL, textAlign:"center", marginTop:8, background:"#F5F5F5", padding:8, borderRadius:8 }}>Tambahkan nomor WA ibu untuk mengaktifkan reminder otomatis</div>}
                        </div>
                      )}
                      {ctab==="rec" && (
                        <div>
                          <div style={{ fontFamily:FF, fontSize:12, color:TM, background:"#E8F5E9", padding:"8px 10px", borderRadius:8, marginBottom:10 }}>Rekomendasi dihasilkan otomatis berdasarkan usia dan riwayat vaksin anak.</div>
                          {recs.map((r,ri) => {
                            var cols = rcols[r.type]||[TM,"#F5F5F5"];
                            return <div key={ri} style={{ background:cols[1], borderRadius:12, padding:"12px 14px", marginBottom:8, borderLeft:"4px solid "+cols[0] }}>
                              <div style={{ fontFamily:FF, fontWeight:800, fontSize:13, color:cols[0], marginBottom:4 }}>{r.title}</div>
                              <div style={{ fontFamily:FF, fontSize:13, color:TM, lineHeight:1.5 }}>{r.body}</div>
                            </div>;
                          })}
                        </div>
                      )}
                      {ctab==="kipi" && (
                        <div>
                          <div style={{ fontFamily:FF, fontSize:12, color:TM, marginBottom:10 }}>Pilih tingkat reaksi yang dialami anak setelah imunisasi:</div>
                          {KIPI_DATA.map(k => (
                            <div key={k.key} style={{ border:"2px solid "+k.color+"40", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                              <div style={{ fontFamily:FF, fontWeight:800, fontSize:13, color:k.color, marginBottom:6 }}>{k.label}</div>
                              <div style={{ fontFamily:FF, fontSize:13, color:TM }}>{k.advice}</div>
                            </div>
                          ))}
                          <div style={{ background:"#E8F5E9", borderRadius:12, padding:"12px 14px" }}>
                            <div style={{ fontFamily:FF, fontWeight:800, fontSize:12, color:P2, marginBottom:4 }}>Kontak Darurat</div>
                            <div style={{ fontFamily:FF, fontSize:12, color:TM }}>Hubungi Puskesmas segera jika anak mengalami reaksi berat.</div>
                          </div>
                        </div>
                      )}
                      {ctab==="edit" && (
                        <div>
                          <div style={{ fontFamily:FF, fontSize:12, color:TM, background:"#E8F5E9", padding:"8px 10px", borderRadius:8, marginBottom:12 }}>
                            Edit data dasar anak. Data vaksin diubah via Kartu Vaksin.
                          </div>
                          <div style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:TM, marginBottom:4 }}>Nama Lengkap Anak</div>
                          <input value={editIdx===idx ? editName : child.name} onChange={e => setEditName(e.target.value)}
                            style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:"1.5px solid "+BRD, fontSize:14, fontFamily:FF, outline:"none", boxSizing:"border-box", marginBottom:12 }} />
                          <div style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:TM, marginBottom:4 }}>Tanggal Lahir</div>
                          <input type="date" value={editIdx===idx ? editDob : child.dob} onChange={e => setEditDob(e.target.value)}
                            style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:"1.5px solid "+BRD, fontSize:14, fontFamily:FF, outline:"none", boxSizing:"border-box", marginBottom:16 }} />
                          <button onClick={() => handleSaveEdit(child, idx)} disabled={saving}
                            style={{ width:"100%", padding:13, border:"none", borderRadius:12, background:saving?"#ccc":"linear-gradient(135deg,#1B5E20,#43A047)", color:"#fff", fontSize:14, fontWeight:800, cursor:saving?"default":"pointer", fontFamily:FF, boxShadow:saving?"none":"0 4px 14px rgba(27,94,32,0.3)", marginBottom:10 }}>
                            {saving ? "Menyimpan..." : "Simpan Perubahan"}
                          </button>
                          <button onClick={async () => {
                            if (!window.confirm("Hapus data " + child.name + "? Tindakan ini tidak bisa dibatalkan.")) return;
                            setSaving(true);
                            await API.deleteAnak(mother.nik, child.name);
                            await onUpdateChild(idx, null); // signal hapus
                            setSaving(false);
                            showToast("Data anak berhasil dihapus", "ok");
                          }} disabled={saving}
                            style={{ width:"100%", padding:13, border:"2px solid #C62828", borderRadius:12, background:"#fff", color:"#C62828", fontSize:14, fontWeight:800, cursor:saving?"default":"pointer", fontFamily:FF }}>
                            Hapus Data Anak Ini
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM: TAMBAH IBU
// ─────────────────────────────────────────────
function AddMotherForm({ onBack, onSave }) {
  var [name, setName]     = useState("");
  var [nik, setNik]       = useState("");
  var [phone, setPhone]   = useState("");
  var [alamat, setAlamat] = useState("");
  var [err, setErr]       = useState("");
  var [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim())    { setErr("Nama ibu wajib diisi."); return; }
    if (nik.length < 16) { setErr("NIK harus 16 digit angka."); return; }
    setSaving(true);
    await onSave({ name, nik, phone, alamat, children:[], createdAt:new Date().toISOString() });
    setSaving(false);
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG }}>
      <TopBar title="Daftarkan Ibu Baru" onBack={onBack} />
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        <Card>
          <div style={{ textAlign:"center", fontSize:44, marginBottom:8 }}>&#x1F469;</div>
          <TInput label="Nama Lengkap Ibu *" value={name} onChange={e=>setName(e.target.value)} placeholder="Contoh: Siti Rahayu" />
          <TInput label="NIK (16 digit) *" value={nik} onChange={e=>setNik(e.target.value.replace(/\D/g,""))} placeholder="3273xxxxxxxxxx" maxLength={16} />
          <TInput label="Nomor WhatsApp" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx" type="tel" />
          <TInput label="Alamat / RT-RW" value={alamat} onChange={e=>setAlamat(e.target.value)} placeholder="Contoh: RT 03/RW 07" />
          {err && <div style={{ fontFamily:FF, color:"#C62828", fontSize:12, marginTop:8 }}>{err}</div>}
          <GBtn onClick={submit} disabled={saving}>{saving ? "Menyimpan ke Sheets..." : "Simpan Data Ibu"}</GBtn>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM: TAMBAH ANAK
// ─────────────────────────────────────────────
function AddChildForm({ mother, onBack, onSave }) {
  var [name, setName]     = useState("");
  var [dob, setDob]       = useState("");
  var [gender, setGender] = useState("P");
  var [vaccines, setVac]  = useState([]);
  var [err, setErr]       = useState("");
  var [saving, setSaving] = useState(false);

  function toggleVac(id) {
    var isGiven = vaccines.some(v => v.id === id);
    if (isGiven) {
      setVac(vs => vs.filter(v => v.id !== id));
    } else {
      setVac(vs => [...vs, { id, date: new Date().toISOString().slice(0, 10) }]);
    }
  }

  function updateVacDate(id, date) {
    setVac(vs => vs.map(v => v.id === id ? { id, date } : v));
  }

  async function submit() {
    if (!name.trim()) { setErr("Nama anak wajib diisi."); return; }
    if (!dob)         { setErr("Tanggal lahir wajib diisi."); return; }
    setSaving(true);
    await onSave({ name, dob, gender, vaccines, createdAt:new Date().toISOString() });
    setSaving(false);
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:BG }}>
      <TopBar title="Tambah Data Anak" onBack={onBack} />
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        <Card>
          <div style={{ textAlign:"center", fontSize:44, marginBottom:4 }}>&#x1F476;</div>
          <div style={{ textAlign:"center", fontFamily:FF, fontSize:12, color:TL, marginBottom:4 }}>Anak dari: <b style={{ color:P }}>{mother.name}</b></div>
          <TInput label="Nama Lengkap Anak *" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama lengkap anak" />
          <TInput label="Tanggal Lahir *" value={dob} onChange={e=>setDob(e.target.value)} type="date" />
          <div style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:TM, marginBottom:6, marginTop:12 }}>Jenis Kelamin</div>
          <div style={{ display:"flex", gap:8 }}>
            {[["L","Laki-laki"],["P","Perempuan"]].map(opt => (
              <button key={opt[0]} onClick={() => setGender(opt[0])} style={{ flex:1, padding:10, borderRadius:10, border:"2px solid "+(gender===opt[0]?P:BRD), background:gender===opt[0]?"#E8F5E9":"none", color:gender===opt[0]?P:TM, fontWeight:700, fontSize:12, fontFamily:FF, cursor:"pointer" }}>{opt[1]}</button>
            ))}
          </div>
          <div style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:TM, marginBottom:4, marginTop:12 }}>Vaksin yang sudah pernah diterima</div>
          <div style={{ fontFamily:FF, fontSize:11, color:TL, marginBottom:8 }}>Centang vaksin yang sudah diberikan (dari buku KIA):</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {VACCINES.map(v => {
              var vacRecord = vaccines.find(r => r.id === v.id);
              var given = !!vacRecord;
              return (
                <div key={v.id} style={{ marginBottom: 4 }}>
                  <button
                    onClick={() => toggleVac(v.id)}
                    style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid "+(given?v.color:BRD), background:given?v.color:"none", color:given?"#fff":TM, fontSize:11, fontWeight:700, fontFamily:FF, cursor:"pointer" }}
                  >
                    {given ? "v " : ""}{v.name}
                  </button>
                  {given && (
                    <input
                      type="date"
                      value={vacRecord.date || ""}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => updateVacDate(v.id, e.target.value)}
                      style={{ display:"block", marginTop:4, width:"100%", padding:"5px 8px", borderRadius:7, border:"1.5px solid "+BRD, fontSize:11, fontFamily:FF, outline:"none" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {err && <div style={{ fontFamily:FF, color:"#C62828", fontSize:12, marginTop:8 }}>{err}</div>}
          <GBtn onClick={submit} disabled={saving}>{saving ? "Menyimpan ke Sheets..." : "Simpan Data Anak"}</GBtn>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  var [posyandu, setPosyandu] = useState(null);
  var [screen, setScreen]     = useState("login");
  var [data, setData]         = useState({ mothers:[] });
  var [ready, setReady]       = useState(false);
  // deepLink: { motherNik, childIdx } — untuk navigasi langsung dari dashboard ke detail anak
  var [deepLink, setDeepLink] = useState(null);

  function handleLogin(p, fetchedData) {
    setPosyandu(p);
    setData(fetchedData || { mothers:[] });
    setScreen("home");
    setReady(true);
  }

  function handleDataChange(nd) {
    setData(nd);
  }

  // Navigasi dari dashboard ke detail anak tertentu
  function handleNavToChild(motherNik, childIdx) {
    setDeepLink({ motherNik, childIdx });
    setScreen("pencatatan");
  }

  if (!ready && screen !== "login") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:BG, flexDirection:"column", gap:12 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:40, height:40, border:"3px solid "+BRD, borderTop:"3px solid "+P, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <div style={{ fontFamily:FF, color:P, fontWeight:700 }}>Memuat data...</div>
    </div>
  );

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:BG }}>
      <style>{`*, *::before, *::after { box-sizing: border-box; } body { margin: 0; background: #A5D6A7; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #C8E6C9; border-radius: 2px; } button:active { opacity: 0.82; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {screen==="login"      && <LoginScreen onLogin={handleLogin} />}
      {screen==="home"       && posyandu && <HomeScreen posyandu={posyandu} data={data} onNav={s => setScreen(s)} onNavToChild={handleNavToChild} onLogout={() => { setPosyandu(null); setScreen("login"); setReady(false); }} />}
      {screen==="edukasi"    && <EdukasiScreen onBack={() => setScreen("home")} />}
      {screen==="pencatatan" && <PencatatanScreen onBack={() => { setDeepLink(null); setScreen("home"); }} data={data} onDataChange={handleDataChange} deepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />}
    </div>
  );
}

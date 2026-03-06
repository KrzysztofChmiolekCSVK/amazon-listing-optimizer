import { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════
   STAŁE
   ═══════════════════════════════════════════ */

const MARKETPLACES = [
  { code: "DE", flags: ["🇩🇪"], name: "Niemcy", langEn: "German", color: "#FFD700" },
  { code: "FR/BE", flags: ["🇫🇷", "🇧🇪"], name: "Francja / Belgia", langEn: "French", color: "#0055A4" },
  { code: "IT", flags: ["🇮🇹"], name: "Włochy", langEn: "Italian", color: "#008C45" },
  { code: "ES", flags: ["🇪🇸"], name: "Hiszpania", langEn: "Spanish", color: "#C60B1E" },
  { code: "NL", flags: ["🇳🇱"], name: "Holandia", langEn: "Dutch", color: "#FF6600" },
  { code: "SE", flags: ["🇸🇪"], name: "Szwecja", langEn: "Swedish", color: "#006AA7" },
  { code: "PL", flags: ["🇵🇱"], name: "Polska", langEn: "Polish", color: "#DC143C" },
  { code: "EN", flags: ["🇬🇧", "🇮🇪"], name: "UK / Irlandia", langEn: "English", color: "#C8102E" },
];

const GROQ_MODELS = [
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", desc: "Zalecany — szybki, 12 języków EU, darmowy" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "Sprawdzony — dobra jakość ogólna" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick", desc: "Najlepszy ale niski darmowy limit" },
];

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Zalecany — szybki, dobra jakość, darmowy" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", desc: "Najszybszy — lekki, darmowy" },
];

const BULLET_THEMES = [
  "Główna funkcja / kluczowa korzyść",
  "Jakość / materiały / trwałość",
  "Łatwość użycia / wygoda",
  "Kompatybilność / wszechstronność",
  "Bezpieczeństwo / certyfikaty / gwarancja",
];

const ATTR_LABELS = {
  color_map: "Kolor", material_type: "Materiał", special_features: "Cechy specjalne",
  item_shape: "Kształt", style_name: "Styl", pattern_name: "Wzór", theme: "Motyw",
  finish_types: "Wykończenie", care_instructions: "Instrukcje pielęgnacji",
  included_components: "W zestawie", occasion_type: "Okazja",
  recommended_uses_for_product: "Zalecane zastosowania", mounting_type: "Typ montażu",
  size_name: "Rozmiar", number_of_items: "Liczba sztuk", number_of_pieces: "Liczba elementów",
  closure_type: "Typ zamknięcia", room_type: "Typ pomieszczenia", capacity: "Pojemność",
  seasons: "Sezon", material_features: "Cechy materiału", item_weight: "Waga",
  surface_recommendation: "Zalecana powierzchnia", installation_type: "Typ instalacji",
  target_audience_keywords: "Grupa docelowa", thesaurus_attribute_keywords: "Tezaurus atrybutów",
  thesaurus_subject_keywords: "Tezaurus tematów", material_type_free: "Materiał (dowolny)",
  furniture_finish: "Wykończenie mebla",
};

function byteCount(s) { return new TextEncoder().encode(s || "").length; }

/* ═══════════════════════════════════════════
   MAŁE KOMPONENTY
   ═══════════════════════════════════════════ */

const S = {
  font: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
  bg: "#0a0b0e", card: "#15161e", input: "#12131a",
  border: "#2a2d35", text: "#e8eaed", muted: "#8a8f98", dim: "#6b7280",
  accent: "#ff9900", accentLight: "#ffad33",
};

function CharBadge({ current, max, label }) {
  const pct = (current / max) * 100;
  const color = pct > 100 ? "#ef4444" : pct > 85 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <span style={{ color: S.muted }}>{label}</span>
      <div style={{ width: 80, height: 6, background: "#1e2028", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ color, fontFamily: S.mono, fontWeight: 600 }}>{current}/{max}</span>
    </div>
  );
}

function ScoreRing({ score, size = 64, label }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2028" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s" }} />
      </svg>
      <div style={{ marginTop: -size/2-10, fontSize: 16, fontWeight: 700, color, fontFamily: S.mono, position: "relative" }}>{score}</div>
      {label && <div style={{ fontSize: 10, color: S.muted, marginTop: 14 }}>{label}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children, icon }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px",
      background: active ? `linear-gradient(135deg, ${S.accent}, ${S.accentLight})` : "transparent",
      color: active ? S.bg : S.muted, border: active ? "none" : `1px solid ${S.border}`,
      borderRadius: 8, cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: 13,
      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", fontFamily: S.font,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, multi, maxChars, maxBytes, helper, type }) {
  const st = {
    width: "100%", padding: "12px 14px", background: S.input, border: `1px solid ${S.border}`,
    borderRadius: 8, color: S.text, fontSize: 14, fontFamily: S.font, outline: "none",
    boxSizing: "border-box", lineHeight: 1.5,
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#c4c8d0", marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: S.font }}>{label}</label>
      {multi
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...st, resize: "vertical" }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type || "text"} style={st} />}
      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
        {maxChars && <CharBadge current={(value||"").length} max={maxChars} label="znaki" />}
        {maxBytes && <CharBadge current={byteCount(value)} max={maxBytes} label="bajty" />}
      </div>
      {helper && <div style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>{helper}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: S.card, borderRadius: 16, padding: 28, border: `1px solid ${S.border}`, ...style }}>{children}</div>;
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{children}</div>;
}

/* ═══════════════════════════════════════════
   MARKETPLACE SELECTOR
   ═══════════════════════════════════════════ */

function MarketplaceSelector({ selected, setSelected }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {MARKETPLACES.map(mp => {
        const on = selected === mp.code;
        return (
          <button key={mp.code} onClick={() => setSelected(mp.code)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: on ? `2px solid ${mp.color}` : `1px solid ${S.border}`,
              background: on ? `${mp.color}15` : S.input, color: on ? mp.color : S.muted,
              cursor: "pointer", fontSize: 13, fontWeight: on ? 700 : 400,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", fontFamily: S.font,
            }}>
            <span style={{ fontSize: 18, letterSpacing: 2 }}>{mp.flags.join("")}</span>
            <span>{mp.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BTG CATEGORY BROWSER
   ═══════════════════════════════════════════ */

function CategoryBrowser({ btg, selectedCategory, setSelectedCategory }) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  const filtered = useMemo(() => {
    if (!btg || !search.trim()) return [];
    const q = search.toLowerCase();
    return btg.categories
      .filter(c => c.path.toLowerCase().includes(q) || c.item_type.toLowerCase().includes(q))
      .slice(0, 30);
  }, [btg, search]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selCat = selectedCategory && btg ? btg.category_attrs[selectedCategory] : null;
  const attrs = selCat ? selCat.attrs : [];

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📂</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.font }}>Kategoria produktu (BTG)</div>
          <div style={{ fontSize: 11, color: S.dim }}>Wyszukaj kategorię z Browse Tree Guide — atrybuty załadują się automatycznie</div>
        </div>
      </div>

      <div ref={ref} style={{ position: "relative", marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Szukaj kategorii np. cutting board, candle, pillow..."
          style={{
            width: "100%", padding: "12px 14px 12px 38px", background: S.input, border: `1px solid ${S.border}`,
            borderRadius: 8, color: S.text, fontSize: 14, fontFamily: S.font, outline: "none", boxSizing: "border-box",
          }}
        />
        <span style={{ position: "absolute", left: 12, top: 13, fontSize: 16, color: S.muted }}>🔍</span>

        {showDropdown && filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4,
            background: "#1a1b24", border: `1px solid ${S.border}`, borderRadius: 10,
            maxHeight: 280, overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}>
            {filtered.map(cat => (
              <button key={cat.id} onClick={() => {
                setSelectedCategory(cat.id);
                setSearch(cat.path);
                setShowDropdown(false);
              }} style={{
                display: "block", width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #1e2028",
                background: selectedCategory === cat.id ? "#ff990015" : "transparent",
                color: S.text, fontSize: 13, fontFamily: S.font, cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ fontWeight: 500 }}>{cat.path}</div>
                <div style={{ fontSize: 11, color: S.dim, marginTop: 2 }}>
                  item_type_keyword: <span style={{ color: S.accent }}>{cat.item_type}</span>
                  {cat.attr_count > 0 && <span> · {cat.attr_count} atrybutów</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selCat && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{
            padding: "10px 14px", background: "#ff990010", border: `1px solid #ff990030`,
            borderRadius: 8, marginBottom: 14, fontSize: 13,
          }}>
            <span style={{ color: S.muted }}>item_type_keyword: </span>
            <span style={{ color: S.accent, fontWeight: 700, fontFamily: S.mono }}>{selCat.item_type}</span>
          </div>

          {attrs.length > 0 && (
            <>
              <SectionLabel>Wymagane / zalecane atrybuty ({attrs.length})</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {attrs.map((a, i) => (
                  <span key={i} style={{
                    padding: "5px 10px", background: "#1e2028", borderRadius: 6,
                    fontSize: 12, color: "#c4c8d0", fontFamily: S.mono, border: "1px solid #2a2d35",
                  }}>
                    {ATTR_LABELS[a] || a}
                    <span style={{ color: S.dim, marginLeft: 4, fontSize: 10 }}>({a})</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!btg && (
        <div style={{ padding: 16, textAlign: "center", color: S.dim, fontSize: 13 }}>
          Ładowanie danych BTG...
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════
   LISTING PREVIEW + SCORE
   ═══════════════════════════════════════════ */

function ListingPreview({ listing }) {
  if (!listing) return null;
  const tLen = listing.title.length;
  const titleScore = Math.min(100, Math.max(0, (tLen > 10 && tLen <= 200) ? 100 - Math.max(0, tLen - 180) * 2 : tLen > 200 ? 20 : 0));
  const bulletScore = listing.bullets.filter(b => b.trim().length > 0).length * 20;
  const bBytes = byteCount(listing.backendKeywords);
  const backendScore = Math.min(100, Math.round((bBytes / 250) * 100));
  const overall = Math.round((titleScore + bulletScore + backendScore) / 3);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: S.accent, fontFamily: S.font }}>Ocena jakości listingu</h3>
        <div style={{ display: "flex", gap: 20 }}>
          <ScoreRing score={titleScore} label="Tytuł" />
          <ScoreRing score={bulletScore} label="Punkty" />
          <ScoreRing score={backendScore} label="Backend" />
          <ScoreRing score={overall} size={72} label="Ogólna" />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Podgląd tytułu</SectionLabel>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0066c0", lineHeight: 1.4, fontFamily: S.font }}>
          {listing.title || <span style={{ color: "#3a3d45", fontStyle: "italic" }}>Wpisz tytuł powyżej...</span>}
        </div>
        <div style={{ marginTop: 4 }}><CharBadge current={tLen} max={200} label="Znaki tytułu" /></div>
        <div style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>
          Obcięcie na mobile (~70 znaków): <span style={{ color: S.accent }}>„{listing.title.slice(0, 70)}"</span>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Punkty kluczowe (Bullet Points)</SectionLabel>
        {listing.bullets.map((b, i) => (
          <div key={i} style={{
            padding: "8px 12px", marginBottom: 6, background: "#0d0e14", borderRadius: 6,
            borderLeft: `3px solid ${b.trim() ? S.accent : S.border}`,
            fontSize: 13, color: b.trim() ? S.text : "#3a3d45", lineHeight: 1.5, fontFamily: S.font,
          }}>{b.trim() || `Punkt ${i + 1} — ${BULLET_THEMES[i]}`}</div>
        ))}
        <div style={{ marginTop: 4 }}><CharBadge current={listing.bullets.join("").length} max={1000} label="Łącznie znaków" /></div>
      </div>

      {listing.description && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Opis produktu</SectionLabel>
          <div style={{ fontSize: 13, color: "#c4c8d0", lineHeight: 1.6, fontFamily: S.font }} dangerouslySetInnerHTML={{ __html: (listing.description || "").replace(/</g, "&lt;").replace(/&lt;br\s*\/?>/gi, "<br>") }} />
        </div>
      )}

      {listing.backendKeywords && (
        <div>
          <SectionLabel>Słowa kluczowe backend (Search Terms)</SectionLabel>
          <div style={{ padding: 12, background: "#0d0e14", borderRadius: 8, fontSize: 12, color: "#a1a5ae", fontFamily: S.mono, wordBreak: "break-all", lineHeight: 1.6 }}>
            {listing.backendKeywords}
          </div>
          <div style={{ marginTop: 4 }}><CharBadge current={bBytes} max={250} label="bajty" /></div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════
   SETTINGS PANEL
   ═══════════════════════════════════════════ */

function SettingsPanel({ provider, setProvider, apiKey, setApiKey, geminiKey, setGeminiKey, model, setModel }) {
  const [showKey, setShowKey] = useState(false);
  const models = provider === "gemini" ? GEMINI_MODELS : GROQ_MODELS;

  function switchProvider(p) {
    setProvider(p);
    if (p === "gemini" && !GEMINI_MODELS.find(m => m.id === model)) {
      setModel("gemini-2.5-flash");
    } else if (p === "groq" && !GROQ_MODELS.find(m => m.id === model)) {
      setModel("meta-llama/llama-4-scout-17b-16e-instruct");
    }
  }

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>⚙️</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.text }}>Ustawienia AI</div>
          <div style={{ fontSize: 11, color: S.dim }}>Wybierz providera i model</div>
        </div>
      </div>

      {/* Provider toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#c4c8d0", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Provider
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "groq", name: "Groq", desc: "Llama 4, Qwen, GPT-OSS", icon: "⚡" },
            { id: "gemini", name: "Google Gemini", desc: "Gemini 2.5 Flash/Pro", icon: "💎" },
          ].map(p => (
            <button key={p.id} onClick={() => switchProvider(p.id)} style={{
              padding: "10px 16px", borderRadius: 8, flex: 1,
              border: provider === p.id ? `2px solid ${S.accent}` : `1px solid ${S.border}`,
              background: provider === p.id ? "#ff990015" : S.input,
              color: provider === p.id ? S.accent : S.muted,
              cursor: "pointer", fontSize: 13, fontFamily: S.font, textAlign: "left",
            }}>
              <div style={{ fontWeight: 700 }}>{p.icon} {p.name}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: S.dim }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#c4c8d0", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {provider === "gemini" ? "Klucz API Google Gemini" : "Klucz API Groq"}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={provider === "gemini" ? geminiKey : apiKey}
            onChange={e => provider === "gemini" ? setGeminiKey(e.target.value) : setApiKey(e.target.value)}
            type={showKey ? "text" : "password"}
            placeholder={provider === "gemini" ? "AIza..." : "gsk_..."}
            style={{
              flex: 1, padding: "12px 14px", background: S.input, border: `1px solid ${S.border}`,
              borderRadius: 8, color: S.text, fontSize: 14, fontFamily: S.mono, outline: "none", boxSizing: "border-box",
            }} />
          <button onClick={() => setShowKey(!showKey)} style={{
            padding: "0 14px", background: S.input, border: `1px solid ${S.border}`, borderRadius: 8,
            color: S.muted, cursor: "pointer", fontSize: 16,
          }}>{showKey ? "🙈" : "👁"}</button>
        </div>
        <div style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>
          {provider === "gemini"
            ? <>Darmowy klucz z <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener" style={{ color: S.accent, textDecoration: "none" }}>aistudio.google.com/api-keys</a></>
            : <>Darmowy klucz z <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style={{ color: S.accent, textDecoration: "none" }}>console.groq.com/keys</a></>
          }
        </div>
      </div>

      {/* Model selection */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#c4c8d0", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Model
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {models.map(m => (
            <button key={m.id} onClick={() => setModel(m.id)} style={{
              padding: "8px 14px", borderRadius: 8,
              border: model === m.id ? `2px solid ${S.accent}` : `1px solid ${S.border}`,
              background: model === m.id ? "#ff990015" : S.input,
              color: model === m.id ? S.accent : S.muted,
              cursor: "pointer", fontSize: 12, fontFamily: S.font, textAlign: "left",
            }}>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: S.dim }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   AI GENERATE PANEL
   ═══════════════════════════════════════════ */

function AIGeneratePanel({ listing, setListing, marketplace, provider, apiKey, geminiKey, model, btg, selectedCategory }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [mainKeyword, setMainKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [error, setError] = useState("");
  const [csvKeywords, setCsvKeywords] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imageData, setImageData] = useState([]);

  // CSV parser for Helium 10
  function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const lines = text.split("\n").map(l => l.split(/[,;\t]/));
        const header = lines[0].map(h => h.replace(/"/g, "").trim().toLowerCase());
        const kwIdx = header.findIndex(h => h.includes("keyword") || h.includes("phrase") || h.includes("search term"));
        const volIdx = header.findIndex(h => h.includes("volume") || h.includes("search vol") || h.includes("sv"));
        if (kwIdx === -1) { setError("Nie znaleziono kolumny ze słowami kluczowymi w pliku CSV."); return; }

        const keywords = lines.slice(1)
          .filter(row => row[kwIdx]?.trim())
          .map(row => ({
            keyword: row[kwIdx].replace(/"/g, "").trim(),
            volume: volIdx >= 0 ? parseInt(row[volIdx]?.replace(/"/g, "").trim()) || 0 : 0,
          }))
          .filter(k => k.keyword.length > 0)
          .sort((a, b) => b.volume - a.volume);

        setCsvKeywords(keywords);
        // Auto-fill main keyword and secondary
        if (keywords.length > 0 && !mainKeyword) setMainKeyword(keywords[0].keyword);
        if (keywords.length > 1 && !secondaryKeywords) {
          setSecondaryKeywords(keywords.slice(1, 10).map(k => k.keyword).join(", "));
        }
      } catch { setError("Błąd parsowania pliku CSV."); }
    };
    reader.readAsText(file);
  }

  // Text file reader
  function handleTextUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      if (file.type.startsWith("image/")) {
        reader.onload = (ev) => {
          const base64 = ev.target.result.split(",")[1];
          const mimeType = file.type;
          setImageData(prev => [...prev, { base64, mimeType, name: file.name }]);
          setUploadedFiles(prev => [...prev, { name: file.name, type: "image" }]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          const text = ev.target.result;
          setUploadedFiles(prev => [...prev, { name: file.name, type: "text", content: text }]);
        };
        reader.readAsText(file);
      }
    });
  }

  function removeFile(idx) {
    const file = uploadedFiles[idx];
    if (file.type === "image") {
      setImageData(prev => prev.filter(img => img.name !== file.name));
    }
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function callAI(messages) {
    let url, headers, body;

    if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
      headers = { "Content-Type": "application/json", "Authorization": `Bearer ${geminiKey}` };
      body = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 8192,
      };
    } else {
      url = "https://api.groq.com/openai/v1/chat/completions";
      headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
      body = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      };
    }

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || errData?.error?.status || `Błąd HTTP ${res.status}`;
      throw new Error(errMsg);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(clean);
    } catch (parseErr) {
      // Try to fix truncated JSON by closing open strings and braces
      let fixed = clean;
      // If ends mid-string, close the string
      const lastQuote = fixed.lastIndexOf('"');
      const openBraces = (fixed.match(/{/g) || []).length;
      const closeBraces = (fixed.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        // Close any open string
        if (fixed.slice(lastQuote + 1).includes(':') && !fixed.trimEnd().endsWith('"')) {
          fixed += '"';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
      }
      try {
        return JSON.parse(fixed);
      } catch {
        throw new Error("Model zwrócił nieprawidłowy JSON. Spróbuj ponownie lub zmień model w ⚙️ Ustawienia.");
      }
    }
  }

  function buildPrompt(mp, catInfo) {
    return `You are a world-class Amazon listing optimizer specializing in European marketplaces. You have deep expertise in Amazon's A9/A10 algorithm, Rufus, and Cosmo AI systems.

TARGET MARKETPLACE: ${mp.code} (${mp.langEn})
CRITICAL: Write NATIVELY in ${mp.langEn}. Do NOT translate from English or any other language. Use natural, fluent phrasing that a native ${mp.langEn} speaker would use when shopping online.

PRODUCT INFORMATION:
${productInfo}
${mainKeyword ? `PRIMARY KEYWORD (MUST appear in the first 70 characters of the title, ideally as the first descriptive words after the brand): ${mainKeyword}` : "No primary keyword provided — determine the best primary keyword yourself based on the product."}
${secondaryKeywords ? `SECONDARY KEYWORDS (weave these into the title after char 70, into bullet points, and description naturally): ${secondaryKeywords}` : "No secondary keywords provided — determine the best secondary keywords yourself."}
${catInfo ? `CATEGORY: ${catInfo.path}\nitem_type_keyword: ${catInfo.item_type}\nCategory attributes: ${catInfo.attrs.join(", ")}` : ""}
${csvKeywords ? `\nHELIUM 10 KEYWORD DATA (sorted by search volume):\n${csvKeywords.slice(0, 30).map((k, i) => `${i + 1}. "${k.keyword}" (vol: ${k.volume})`).join("\n")}\nUse the top keywords strategically: #1-3 in title, #4-15 in bullets, rest in backend/description.` : ""}
${uploadedFiles.filter(f => f.type === "text").length > 0 ? `\nADDITIONAL PRODUCT INFORMATION FROM UPLOADED FILES:\n${uploadedFiles.filter(f => f.type === "text").map(f => `--- ${f.name} ---\n${f.content.slice(0, 3000)}`).join("\n\n")}` : ""}
${imageData.length > 0 ? `\nIMAGES ATTACHED: ${imageData.length} image(s) showing the product. Analyze them carefully to extract product details, features, text, specifications, and any visible information that should be included in the listing.` : ""}

YOUR TASK: Generate a FULLY optimized Amazon listing. Even if the product description is brief, use your knowledge to infer logical product features and create a comprehensive listing. Think like an experienced Amazon seller.

═══════════════════════════════════════
TITLE RULES (CRITICAL — follow exactly)
═══════════════════════════════════════
- HARD LIMIT: Max 200 characters. AIM FOR 160-200 characters. A short title wastes keyword opportunities.
- The first 66-70 characters are the MOST VALUABLE — this is what shows on mobile (~70% of Amazon traffic). The customer MUST understand what the product is within these first characters.
- STRUCTURE: [Brand] [Primary Keyword = What It Is] – [Key Material/Feature] [Size] – [Secondary Feature/Keyword] – [Tertiary Keyword/Use Case] – [Model/Pack]
- SINGLE IDENTITY FIRST: The first 66 chars must clearly state ONE product function. Never open with multiple functions (e.g. "heater and sterilizer") — this confuses the A9 algorithm about what the product IS.
- NO unknown model names at the start. Customers don't search for proprietary model names. Push them to the END.
- Include 2-3 keyword phrases naturally in the title. Use dashes (–) to separate logical sections.
- PROHIBITED: No ! $ ? _ { } ^ ¬ ¦ characters. No ALL CAPS. No promotional phrases ("best seller", "free shipping"). No word repeated more than 2 times. No emojis.
- Use numerals ("2" not "two"). Capitalize first letter of each word except prepositions/conjunctions/articles.

═══════════════════════════════════════
BULLET POINTS RULES (5 bullets)
═══════════════════════════════════════
- Total combined length: 700-1000 characters. Each bullet: 120-200 characters. Don't write tiny bullets.
- FORMAT: [Benefit Headline] – Expanded explanation with feature details and a secondary keyword woven in naturally.
- CAPITALIZATION RULE: ONLY the short headline part (before the dash) starts with a capital letter. The rest of the bullet is a normal sentence — do NOT capitalize every word. This is NOT a title, it's a sentence. Example correct format: "Schont die Waage – Die hochwertige Acryl-Unterlage schützt die empfindliche Waage Ihres Thermomix TM7 vor Kratzern und Beschädigungen."
- Example WRONG format (do NOT do this): "Schont Die Waage – Die Hochwertige Acryl-Unterlage Schützt Die Empfindliche Waage" — this is Title Case applied to the whole bullet, which is WRONG.
- Bullet #1 MUST reinforce the title's primary function. If the title says "Gleitbrett", bullet #1 must be about the sliding/gliding function.
- Each bullet focuses on ONE benefit/feature area. Suggested themes:
  1. Primary function / main benefit
  2. Quality / materials / durability
  3. Ease of use / convenience
  4. Compatibility / versatility
  5. Safety / certifications / warranty / what's included
- Include SPECIFIC details: measurements, materials, certifications, compatible products, weight, dimensions.
- Speak to the customer's needs: what problem does this solve? What do they gain?
- Weave in secondary keywords naturally — never keyword-stuff.
- NO ALL CAPS anywhere. No emojis.

═══════════════════════════════════════
PRODUCT DESCRIPTION RULES
═══════════════════════════════════════
- 1-2 paragraphs, aim for 800-1500 characters.
- Expand on the most important features and use cases.
- Paint a picture of the product in use — help the customer imagine owning it.
- Include long-tail keywords naturally.
- End with a confidence builder (warranty mention, brand quality, satisfaction).
- Use <br> tags to separate paragraphs for better readability. Example: "First paragraph text.<br><br>Second paragraph text."
- No other HTML tags allowed — only <br> for line breaks.

═══════════════════════════════════════
BACKEND KEYWORDS RULES (CRITICAL)
═══════════════════════════════════════
- HARD LIMIT: Max 250 bytes. Special chars (ö, ü, ä, ß, é, ñ, ą, ę, etc.) = 2 bytes each.
- TARGET: 240-250 bytes. This is CRITICAL. You MUST reach at least 240 bytes. Every unused byte is a MISSED indexing opportunity.
- All lowercase, separated by spaces only. No commas, no punctuation.
- ABSOLUTELY NO DUPLICATE WORDS. Every single word must appear EXACTLY ONCE. Before finalizing, scan your backend keywords and remove any word that appears more than once.
- MUST NOT repeat ANY word already in the title, bullet points, or description. These are COMPLEMENTARY terms only.
- MUST NOT include: brand names, ASINs, promotional words, subjective words ("best", "amazing"), stop words ("and", "for", "the", "mit", "für", "und", "do", "na", "i", "z", "w", etc.)
- Use singular OR plural, not both (e.g., use "wąż" OR "węże", not both).
- WHAT TO INCLUDE: Think of 30-40 unique words covering: synonyms, alternate product names, related product categories, compatible accessories, related use cases, materials, tools, places where product is used, actions the product enables, related seasonal terms.
- Example thought process: For a garden hose reel → think about: irrigation, watering, lawn, patio, sprinkler, nozzle, connector, storage, outdoor, terrace, balcony, greenhouse, gardening tools, landscape, yard...

═══════════════════════════════════════
LANGUAGE-SPECIFIC NOTES
═══════════════════════════════════════
- DE: German compound nouns are valuable keywords (e.g., "Küchenmesser", "Schneidebrett"). Use them. Formal tone.
- FR (FR/BE): Natural French with proper accents. Accented chars cost 2 bytes in backend. This listing serves both France and Belgium (French-speaking).
- IT: Italian descriptions can be more expressive. Use appropriate articles.
- ES: Use neutral Spanish for Spain (not Latin American).
- NL: Keep straightforward, practical Dutch.
- SE: Concise Swedish, compound words common.
- PL: Nominative case in titles, natural cases in bullets. CRITICAL: Pay extra attention to Polish grammar — correct noun-adjective agreement (gender, case). Example: "Optymalne Urządzenie" (neuter) NOT "Optymalny Urządzenie". Double-check every adjective matches the gender of its noun.
- EN (UK/IE): British English spelling (colour, aluminium, organisation). Practical, benefit-focused tone. This listing serves both UK and Ireland.

═══════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════
Respond ONLY with valid JSON. No backticks, no preamble, no explanation:
{"title":"...","bullet1":"...","bullet2":"...","bullet3":"...","bullet4":"...","bullet5":"...","description":"...","backendKeywords":"..."}

FINAL CHECK before responding:
- Is the title 160-200 characters? If under 140, ADD more keywords/features.
- Does the first 70 chars clearly identify the product?
- Are ALL 5 bullets substantive (120-200 chars each)? If any is under 100, EXPAND it.
- Are backend keywords 240-250 bytes? If under 235, you MUST add more words. Think harder about synonyms, related categories, use cases.
- Does bullet #1 match the title's primary product identity?
- Are backend keywords truly COMPLEMENTARY (no words from title/bullets)?
- Do backend keywords contain ANY duplicate words? If yes, REMOVE duplicates and replace with new unique words.
- For Polish: is every adjective-noun pair grammatically correct in gender and case?`;
  }

  async function generate() {
    if (!productInfo.trim()) return setError("Najpierw opisz swój produkt.");
    const activeKey = provider === "gemini" ? geminiKey : apiKey;
    if (!activeKey.trim()) return setError(`Wpisz klucz API ${provider === "gemini" ? "Gemini" : "Groq"} w zakładce ⚙️ Ustawienia.`);
    if (!marketplace) return setError("Wybierz marketplace.");
    setError("");
    setLoading(true);
    setStatus("Generowanie listingu...");

    try {
      const mp = MARKETPLACES.find(m => m.code === marketplace);
      const catInfo = selectedCategory && btg?.category_attrs[selectedCategory];
      const prompt = buildPrompt(mp, catInfo);

      // Build message with optional images
      let userContent;
      if (imageData.length > 0) {
        userContent = [
          { type: "text", text: prompt },
          ...imageData.map(img => ({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
          }))
        ];
      } else {
        userContent = prompt;
      }

      let parsed = await callAI([{ role: "user", content: userContent }]);

      // Auto-validation: check if listing needs improvement
      const titleLen = (parsed.title || "").length;
      const bulletsTotal = [parsed.bullet1, parsed.bullet2, parsed.bullet3, parsed.bullet4, parsed.bullet5]
        .map(b => (b || "").length).reduce((a, b) => a + b, 0);
      const backendBytes = byteCount(parsed.backendKeywords || "");

      const issues = [];
      if (titleLen < 130) issues.push(`Title is only ${titleLen} chars — expand to 160-200 chars by adding more keywords and features.`);
      if (bulletsTotal < 500) issues.push(`Bullets total only ${bulletsTotal} chars — expand each bullet to 140-200 chars with more details and keywords.`);
      if (backendBytes < 235) issues.push(`Backend keywords only ${backendBytes}/250 bytes — you MUST add more words to reach 240-250 bytes. Brainstorm: synonyms, related categories, compatible products, use cases, materials, locations, actions. NO duplicates, NO words from title/bullets.`);

      if (issues.length > 0) {
        setStatus("Optymalizacja — rozbudowywanie listingu...");
        const refinementPrompt = `The listing you generated has these issues:
${issues.map((iss, i) => `${i + 1}. ${iss}`).join("\n")}

Here is the current listing:
${JSON.stringify(parsed, null, 2)}

Fix ALL issues above. Keep everything in ${mp.langEn}. Make the listing BIGGER and BETTER.
For the title: add secondary keywords, features, or use cases to reach 160-200 chars.
For bullets: add specific details (dimensions, materials, compatibility, certifications) to reach 140-200 chars each.
For backend keywords: brainstorm ALL possible synonyms, alternate names, related categories, compatible products, use cases — pack it to 240-250 bytes. Remember: no words already in title or bullets, no brand names, no stop words, NO DUPLICATE WORDS.

Respond ONLY with the improved JSON, same format:
{"title":"...","bullet1":"...","bullet2":"...","bullet3":"...","bullet4":"...","bullet5":"...","description":"...","backendKeywords":"..."}`;

        parsed = await callAI([
          { role: "user", content: prompt },
          { role: "assistant", content: JSON.stringify(parsed) },
          { role: "user", content: refinementPrompt },
        ]);
      }

      // Post-processing: clean backend keywords thoroughly
      if (parsed.backendKeywords) {
        // Collect all words from title, bullets, description (lowercased)
        const listingText = [
          parsed.title || "",
          parsed.bullet1 || "", parsed.bullet2 || "", parsed.bullet3 || "",
          parsed.bullet4 || "", parsed.bullet5 || "",
          (parsed.description || "").replace(/<br\s*\/?>/gi, " "),
        ].join(" ").toLowerCase();
        
        // Extract individual words from listing (strip punctuation)
        const listingWords = new Set(
          listingText.replace(/[–—\-,.:;()]/g, " ").split(/\s+/).filter(w => w.length > 1)
        );
        
        // Process backend keywords
        let bkWords = parsed.backendKeywords.toLowerCase()
          .replace(/[,;.:]/g, " ")  // remove punctuation
          .split(/\s+/)
          .filter(Boolean);
        
        // 1. Remove duplicates
        bkWords = [...new Set(bkWords)];
        
        // 2. Remove words that appear in listing text
        bkWords = bkWords.filter(w => !listingWords.has(w) && w.length > 1);
        
        // 3. Remove common stop words
        const stopWords = new Set(["und","oder","für","mit","von","den","dem","des","die","der","das","ein","eine","einen","einem","einer","zu","zur","zum","im","in","am","an","auf","aus","bei","bis","nach","über","unter","vor","entre","les","des","pour","avec","dans","une","sur","the","and","for","with","from","that","this","are","was","not","but","have","has","been","will","can","all","its","our","your","also","than","into","only","del","los","las","por","con","una","como","más","los","est","plus","que","qui","son","ses","ont","par","aux","ces","het","van","een","zijn","bij","nog","och","att","som","har","den","det","på","med","av","do","na","ze","od","po","za","się","jest","jak","lub","czy","nie","co","to","we","te","ma","tak","tu","tam","ten","ta","ich","ale","i","a","o","w","z","u","e","y","il","di","la","le","lo","da","al","no","si","se","en","el","de"]);
        bkWords = bkWords.filter(w => !stopWords.has(w));
        
        // 4. Trim to 250 bytes
        let result = [];
        let currentBytes = 0;
        for (const word of bkWords) {
          const wordBytes = new TextEncoder().encode(word + " ").length;
          if (currentBytes + wordBytes - 1 <= 250) {  // -1 because last word has no trailing space
            result.push(word);
            currentBytes += wordBytes;
          }
        }
        
        parsed.backendKeywords = result.join(" ");
      }

      setListing({
        title: parsed.title || "",
        bullets: [parsed.bullet1||"", parsed.bullet2||"", parsed.bullet3||"", parsed.bullet4||"", parsed.bullet5||""],
        description: parsed.description || "",
        backendKeywords: parsed.backendKeywords || "",
      });
      setStatus("");
    } catch (e) {
      const msg = e.message || "";
      if (msg.toLowerCase().includes("rate limit") || msg.includes("429") || msg.includes("TPM")) {
        setError("Przekroczono limit tokenów dla tego modelu. Przełącz się na inny model w zakładce ⚙️ Ustawienia (np. Llama 3.3 70B lub Qwen 3 32B) i spróbuj ponownie.");
      } else if (msg.toLowerCase().includes("decommissioned") || msg.toLowerCase().includes("not supported")) {
        setError("Ten model został wycofany. Przełącz się na inny w zakładce ⚙️ Ustawienia.");
      } else {
        setError("Generowanie nie powiodło się: " + msg);
      }
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ background: "linear-gradient(135deg, #1a1320 0%, #15161e 50%, #131820 100%)", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${S.accent}, ${S.accentLight})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>✨</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.text }}>Generator listingów AI</div>
          <div style={{ fontSize: 11, color: S.muted }}>Opisz produkt i otrzymaj zoptymalizowany listing</div>
        </div>
      </div>

      <Field label="Opis produktu" value={productInfo} onChange={setProductInfo} multi
        placeholder="np. Bambusowa deska do krojenia premium, 40x30 cm, z rowkiem na sok i antypoślizgowymi nóżkami, marka: CookNature..." />
      <Field label="Główne słowo kluczowe (Main Keyword)" value={mainKeyword} onChange={setMainKeyword}
        placeholder="np. Gleitbrett, Wasserfilterkartusche, Schneidebrett..."
        helper="To słowo pojawi się na początku tytułu (w pierwszych 70 znakach). Jedno słowo/fraza opisująca czym jest produkt." />
      <Field label="Dodatkowe słowa kluczowe (Secondary Keywords)" value={secondaryKeywords} onChange={setSecondaryKeywords}
        placeholder="np. Thermomix Zubehör, Rutschfest, Acryl Unterlage..."
        helper="Oddzielone przecinkami. Zostaną wplecione w dalszą część tytułu, bullety i opis." />

      {/* File Uploads */}
      <div style={{ marginBottom: 16, padding: 16, background: "#0d0e14", borderRadius: 12, border: `1px dashed ${S.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#c4c8d0", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Załączniki (opcjonalnie)
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {/* CSV Upload */}
          <label style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${csvKeywords ? "#22c55e" : S.border}`,
            background: csvKeywords ? "#22c55e15" : S.input, color: csvKeywords ? "#22c55e" : S.muted,
            cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>📊</span>
            {csvKeywords ? `Helium 10 (${csvKeywords.length} keywords)` : "Wgraj CSV z Helium 10"}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCsvUpload} style={{ display: "none" }} />
          </label>

          {/* Image/Text Upload */}
          <label style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${S.border}`,
            background: S.input, color: S.muted, cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>📎</span>
            Wgraj zdjęcia / pliki tekstowe
            <input type="file" accept="image/*,.txt,.pdf,.doc,.docx" multiple onChange={handleTextUpload} style={{ display: "none" }} />
          </label>
        </div>

        {/* Uploaded files list */}
        {(uploadedFiles.length > 0 || csvKeywords) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {csvKeywords && (
              <span style={{
                padding: "4px 10px", borderRadius: 6, background: "#22c55e15", border: "1px solid #22c55e30",
                fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 4,
              }}>
                📊 Helium 10 — {csvKeywords.length} keywords
                <button onClick={() => { setCsvKeywords(null); }} style={{
                  background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: 14, padding: "0 2px",
                }}>×</button>
              </span>
            )}
            {uploadedFiles.map((f, i) => (
              <span key={i} style={{
                padding: "4px 10px", borderRadius: 6, background: "#1e2028", border: "1px solid #2a2d35",
                fontSize: 11, color: "#c4c8d0", display: "flex", alignItems: "center", gap: 4,
              }}>
                {f.type === "image" ? "🖼️" : "📄"} {f.name.length > 25 ? f.name.slice(0, 22) + "..." : f.name}
                <button onClick={() => removeFile(i)} style={{
                  background: "none", border: "none", color: S.muted, cursor: "pointer", fontSize: 14, padding: "0 2px",
                }}>×</button>
              </span>
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, color: S.dim, marginTop: 6 }}>
          CSV: eksport z Helium 10 (Cerebro/Magnet). Zdjęcia: pudełko, listing, produkt. Tekst: opis copywritera, instrukcja.
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#2d1215", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button onClick={generate} disabled={loading} style={{
        width: "100%", padding: "14px 24px",
        background: loading ? S.border : `linear-gradient(135deg, ${S.accent}, #e88800)`,
        color: loading ? S.muted : S.bg, border: "none", borderRadius: 10,
        cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15, fontFamily: S.font,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
      }}>
        {loading ? (
          <><span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${S.muted}`,
            borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            {status || "Generowanie..."}</>
        ) : (<>⚡ Wygeneruj listing</>)}
      </button>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MANUAL EDITOR
   ═══════════════════════════════════════════ */

function ManualEditor({ listing, setListing }) {
  return (
    <Card>
      <Field label="Tytuł produktu" value={listing.title}
        onChange={v => setListing({ ...listing, title: v })}
        placeholder="[Marka] [Główne słowo kluczowe] – [Kluczowa cecha] [Rozmiar] – [Dodatkowa cecha]"
        maxChars={200} helper="Pierwsze 70 znaków wyświetla się na mobile. Jedna jasna tożsamość produktu." />

      {listing.bullets.map((b, i) => (
        <Field key={i} label={`Punkt ${i + 1} — ${BULLET_THEMES[i]}`} value={b}
          onChange={v => { const nb = [...listing.bullets]; nb[i] = v; setListing({ ...listing, bullets: nb }); }}
          placeholder="[Nagłówek Korzyści] – Wyjaśnienie cechy ze słowami kluczowymi..." />
      ))}

      <Field label="Opis produktu" value={listing.description}
        onChange={v => setListing({ ...listing, description: v })}
        placeholder="Napisz 1-2 akapity opisujące cechy, zastosowania i korzyści..."
        multi maxChars={2000} />

      <Field label="Słowa kluczowe backend (Search Terms)" value={listing.backendKeywords}
        onChange={v => setListing({ ...listing, backendKeywords: v })}
        placeholder="małe litery oddzielone spacjami synonimy skróty alternatywne nazwy..."
        multi maxBytes={250} helper="Małe litery, bez przecinków, bez słów z tytułu/punktów, bez nazw marek." />
    </Card>
  );
}

/* ═══════════════════════════════════════════
   GŁÓWNA APLIKACJA
   ═══════════════════════════════════════════ */

export default function App() {
  const [tab, setTab] = useState("generate");
  const [marketplace, setMarketplace] = useState("DE");
  const [provider, setProvider] = useState("groq");
  const [apiKey, setApiKey] = useState("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");
  const [geminiKey, setGeminiKey] = useState("AIzaSyAWwYa32pHDbxn3aAJc_UBXSP3tblwtpSM");
  const [model, setModel] = useState("meta-llama/llama-4-scout-17b-16e-instruct");
  const [btg, setBtg] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [listing, setListing] = useState({
    title: "", bullets: ["", "", "", "", ""], description: "", backendKeywords: "",
  });

  // Load BTG data
  useEffect(() => {
    fetch("/btg-data.json")
      .then(r => r.json())
      .then(d => setBtg(d))
      .catch(() => console.warn("Nie udało się załadować danych BTG"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: S.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${S.bg}; }
        ::-webkit-scrollbar-thumb { background: ${S.border}; border-radius: 3px; }
        input:focus, textarea:focus { border-color: ${S.accent} !important; box-shadow: 0 0 0 2px #ff990020; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "20px 28px", borderBottom: `1px solid #1e2028`, background: "linear-gradient(180deg, #12131a 0%, #0a0b0e 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `linear-gradient(135deg, ${S.accent}, #ffcc80)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: S.bg, boxShadow: `0 4px 20px ${S.accent}40`,
          }}>A</div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 700,
              background: `linear-gradient(90deg, ${S.accent}, #ffcc80)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Optymalizator Listingów Amazon</h1>
            <div style={{ fontSize: 12, color: S.dim, marginTop: 2 }}>
              Optymalizacja rynków EU — Groq AI · A9/A10 · Rufus & Cosmo · Browse Tree Guide
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px", maxWidth: 960, margin: "0 auto" }}>
        {/* MARKETPLACE */}
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel>Docelowy marketplace</SectionLabel>
          <MarketplaceSelector selected={marketplace} setSelected={setMarketplace} />
        </Card>

        {/* CATEGORY BROWSER */}
        <CategoryBrowser btg={btg} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <TabBtn active={tab === "generate"} onClick={() => setTab("generate")} icon="⚡">Generuj z AI</TabBtn>
          <TabBtn active={tab === "manual"} onClick={() => setTab("manual")} icon="✏️">Edytor ręczny</TabBtn>
          <TabBtn active={tab === "preview"} onClick={() => setTab("preview")} icon="👁">Podgląd i ocena</TabBtn>
          <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} icon="⚙️">Ustawienia</TabBtn>
        </div>

        {/* TAB CONTENT */}
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {tab === "generate" && (
            <>
              <AIGeneratePanel listing={listing} setListing={setListing} marketplace={marketplace}
                provider={provider} apiKey={apiKey} geminiKey={geminiKey} model={model} btg={btg} selectedCategory={selectedCategory} />
              {listing.title && <ListingPreview listing={listing} />}
            </>
          )}
          {tab === "manual" && <ManualEditor listing={listing} setListing={setListing} />}
          {tab === "preview" && <ListingPreview listing={listing} />}
          {tab === "settings" && <SettingsPanel provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} geminiKey={geminiKey} setGeminiKey={setGeminiKey} model={model} setModel={setModel} />}
        </div>

        {/* TIPS */}
        <div style={{
          marginTop: 24, padding: 20, background: "#12131a", borderRadius: 12, border: "1px solid #1e2028",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ fontSize: 12, color: S.dim, lineHeight: 1.6 }}>
            <strong style={{ color: S.muted }}>Wskazówki optymalizacyjne:</strong> Główne słowo kluczowe musi pojawić się w pierwszych 70 znakach (obcięcie na mobile). Punkt #1 musi wzmacniać główną tożsamość produktu z tytułu. Słowa kluczowe backend powinny zawierać TYLKO słowa, których NIE ma już w tytule ani punktach — każdy niewykorzystany bajt poniżej 250 to stracona szansa na indeksowanie. Unikaj „podzielonej tożsamości" w tytułach — prowadź z JEDNĄ funkcją. Wybierz kategorię z BTG, żeby AI uwzględnił odpowiednie atrybuty.
          </div>
        </div>
      </div>
    </div>
  );
}

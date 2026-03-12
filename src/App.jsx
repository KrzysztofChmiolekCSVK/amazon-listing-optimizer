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

const FORBIDDEN_WORDS = {
  // Universal forbidden words (checked across all marketplaces)
  universal: [
    "100% natural", "100% quality guaranteed", "AIDS", "ADD", "added value", "ADHD", "Alzheimers", "antibacterial", "antifungal", "anti-bacterial", "anti-fungal", "anti-microbial", "anxiety", "approved", "arrive faster", "attention deficit disorder", "authentic", "award winning",
    "bacteria", "best deal", "best price", "best seller", "best selling", "big sale", "biodegradable", "biological contaminants", "bpa free", "brand new", "buy now", "buy with confidence",
    "cancer", "cataract", "certified", "closeout", "close-out", "compostable", "concussion", "coronavirus", "covid", "COVID-19", "cure",
    "decomposable", "degradable", "depression", "detoxification", "detoxify", "disease", "don't miss out",
    "eco friendly", "ecofriendly", "eco-friendly", "environmentally friendly", "etc.",
    "fall sale", "fda approval", "fed ex", "filter", "flawless", "free gift", "free shipping", "fungal", "fungicide", "fungus",
    "gift idea", "great as", "great for", "green", "guarantee", "guaranteed",
    "hassle free", "heal", "hepatitis", "herpes", "highest rated", "hiv", "hot item", "huge sale",
    "imported from", "inflammation", "influenza",
    "lasting quality", "limited time offer",
    "made in", "mail rebate", "make excellent", "makes awesome", "makes great", "makes perfect", "makes spectacular", "makes wonderful", "massive sale", "money back guarantee",
    "natural", "newest version", "now together",
    "on sale", "overstock", "over-stock",
    "patented", "perfect for", "perfect gift", "pesticide", "platinum", "plus free", "professional quality", "proven",
    "quality", "ready to ship", "recommended by", "remedies", "remedy", "retail box",
    "sanitize", "sanitizes", "satisfaction", "save $", "save cash", "save money", "seasonal affective disorder", "seen on tv", "ships faster", "shop with confidence", "special offer", "special promo", "spring sale", "supplies won't last", "super sale",
    "tested", "the clap", "top notch", "top quality", "top rated", "top selling", "toxic", "toxin", "toxins", "treat", "treatment",
    "unbeatable price", "ups", "used",
    "weight loss", "wholesale price", "winter sale", "within hours", "worlds best"
  ],
  // Language-specific variants
  DE: ["beste", "bestpreis", "qualität garantiert", "heilung", "heilen", "heilmittel", "zugelassen", "bewährt", "versandkosten frei", "kostenlos"],
  FR: ["meilleur", "meilleur prix", "qualité garantie", "guérison", "guérir", "remède", "approuvé", "gratuit", "port gratuit"],
  IT: ["migliore", "miglior prezzo", "qualità garantita", "guarigione", "guarire", "rimedio", "approvato", "gratuito", "spedizione gratuita"],
  ES: ["mejor", "mejor precio", "calidad garantizada", "curación", "curar", "remedio", "aprobado", "gratis", "envío gratis"],
  NL: ["beste", "beste prijs", "kwaliteit gegarandeerd", "genezing", "genezen", "geneesmiddel", "goedgekeurd", "gratis", "gratis verzending"],
  SE: ["bästa", "bästa pris", "kvalitet garanterad", "läkning", "läka", "läkemedel", "godkänd", "gratis", "fri frakt"],
  PL: ["najlepszy", "najlepsza cena", "gwarancja jakości", "uzdrowienie", "uzdrawiać", "lek", "zatwierdzony", "darmowy", "darmowa wysyłka"],
  EN: ["best", "best price", "quality guaranteed", "cure", "healing", "remedy", "approved", "free", "free shipping"],
};

function checkForbiddenWords(text, forbiddenList) {
  const issues = [];
  if (!text || !forbiddenList) return issues;

  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ""); // Normalize punctuation
  const textWords = lower.split(/\s+/).filter(w => w.length > 0);

  for (const phrase of forbiddenList) {
    const phraseNorm = phrase.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const phraseWords = phraseNorm.split(/\s+/).filter(w => w.length > 0);

    if (phraseWords.length === 1) {
      // Single word check
      if (textWords.includes(phraseWords[0])) {
        issues.push(`Zakazane słowo Amazon: "${phrase}"`);
      }
    } else {
      // Multi-word phrase check
      for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
        const match = textWords.slice(i, i + phraseWords.length).join(" ");
        if (match === phraseWords.join(" ")) {
          issues.push(`Zakazane zwrot Amazon: "${phrase}"`);
          break;
        }
      }
    }
  }

  return issues;
}

function byteCount(s) { return new TextEncoder().encode(s || "").length; }

// German stemmer for inflected form detection
function stemGerman(word) {
  if (!word || word.length < 3) return word;

  let w = word.toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");

  // Remove common German suffixes (plural, case, diminutive, etc.)
  const suffixes = [
    // Plural/case endings
    { suf: "en", minLen: 4 }, { suf: "e", minLen: 4 }, { suf: "n", minLen: 4 },
    { suf: "s", minLen: 4 }, { suf: "er", minLen: 4 },
    // Common noun endings
    { suf: "heit", minLen: 5 }, { suf: "keit", minLen: 5 }, { suf: "schaft", minLen: 6 },
    { suf: "lich", minLen: 5 }, { suf: "ung", minLen: 4 }
  ];

  for (const {suf, minLen} of suffixes) {
    if (w.endsWith(suf) && w.length >= minLen) {
      w = w.slice(0, -suf.length);
      break; // Only remove one suffix
    }
  }
  return w;
}

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

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title={`Kopiuj ${label || ""}`} style={{
      background: copied ? "#22c55e20" : "#1e2028", border: `1px solid ${copied ? "#22c55e50" : "#2a2d35"}`,
      borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12,
      color: copied ? "#22c55e" : S.muted, display: "inline-flex", alignItems: "center", gap: 4,
      transition: "all 0.2s", whiteSpace: "nowrap",
    }}>
      {copied ? "✓ Skopiowano" : "📋 Kopiuj"}
    </button>
  );
}

function SectionHead({ children, copyText, copyLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <SectionLabel>{children}</SectionLabel>
      {copyText && <CopyBtn text={copyText} label={copyLabel} />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LISTING PREVIEW + SCORE + EXCEL INJECTOR
   ═══════════════════════════════════════════ */


function ListingPreview({ listing }) {
  if (!listing) return null;
  const tLen = listing.title.length;
  const titleScore = tLen > 200 ? 20 : tLen >= 160 ? 100 : tLen > 10 ? Math.round((tLen / 160) * 85) : 0;
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
        <SectionHead copyText={listing.title} copyLabel="tytuł">Podgląd tytułu</SectionHead>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0066c0", lineHeight: 1.4, fontFamily: S.font }}>
          {listing.title || <span style={{ color: "#3a3d45", fontStyle: "italic" }}>Wpisz tytuł powyżej...</span>}
        </div>
        <div style={{ marginTop: 4 }}><CharBadge current={tLen} max={200} label="Znaki tytułu" /></div>
        <div style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>
          Obcięcie na mobile (~70 znaków): <span style={{ color: S.accent }}>„{listing.title.slice(0, 70)}"</span>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionHead>Punkty kluczowe (Bullet Points)</SectionHead>
        {listing.bullets.map((b, i) => (
          <div key={i} style={{
            padding: "8px 12px", marginBottom: 6, background: "#0d0e14", borderRadius: 6,
            borderLeft: `3px solid ${b.trim() ? S.accent : S.border}`,
            fontSize: 13, color: b.trim() ? S.text : "#3a3d45", lineHeight: 1.5, fontFamily: S.font,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ flex: 1 }}>{b.trim() || `Punkt ${i + 1} — ${BULLET_THEMES[i]}`}</span>
            {b.trim() && <CopyBtn text={b} />}
          </div>
        ))}
        <div style={{ marginTop: 4 }}><CharBadge current={listing.bullets.join("").length} max={1000} label="Łącznie znaków" /></div>
      </div>

      {listing.description && (
        <div style={{ marginBottom: 20 }}>
          <SectionHead copyText={listing.description} copyLabel="opis">Opis produktu</SectionHead>
          <div style={{ fontSize: 13, color: "#c4c8d0", lineHeight: 1.6, fontFamily: S.font }} dangerouslySetInnerHTML={{ __html: (listing.description || "").replace(/</g, "&lt;").replace(/&lt;br\s*\/?>/gi, "<br>") }} />
        </div>
      )}

      {listing.backendKeywords && (
        <div>
          <SectionHead copyText={listing.backendKeywords} copyLabel="backend keywords">Słowa kluczowe backend (Search Terms)</SectionHead>
          <div style={{ padding: 12, background: "#0d0e14", borderRadius: 8, fontSize: 12, color: "#a1a5ae", fontFamily: S.mono, wordBreak: "break-all", lineHeight: 1.6 }}>
            {listing.backendKeywords}
          </div>
          <div style={{ marginTop: 4 }}><CharBadge current={bBytes} max={250} label="bajty" /></div>
        </div>
      )}

      {listing.benefits?.length > 0 && listing.benefits.some(b => b.trim()) && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${S.border}` }}>
          <SectionHead>
            🎯 Benefity (4 główne zalety)
          </SectionHead>
          <div style={{ display: "grid", gap: 8 }}>
            {listing.benefits.map((b, i) => (
              b.trim() && (
                <div key={i} style={{
                  padding: "8px 12px",
                  background: "#0d0e14",
                  borderRadius: 6,
                  borderLeft: `3px solid ${S.accent}`,
                  fontSize: 13,
                  color: S.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12
                }}>
                  <span>{b}</span>
                  {b.trim() && <CopyBtn text={b} />}
                </div>
              )
            ))}
          </div>
        </div>
      )}

    </Card>
  );
}

/* ═══════════════════════════════════════════
   KEYWORD USAGE TABLE
   ═══════════════════════════════════════════ */

function KeywordUsageTable({ keywords, listing, secondaryKeywords, setSecondaryKeywords }) {
  if (!keywords?.length || !listing?.title) return null;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("volume");
  const [sortOrder, setSortOrder] = useState("desc");

  const itemsPerPage = 20;
  const check = (text, kw) => (text || "").toLowerCase().includes(kw.toLowerCase());

  // Parse secondary keywords into a Set
  const selectedKeywordsSet = useMemo(() => {
    if (!secondaryKeywords) return new Set();
    return new Set(
      secondaryKeywords
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0)
    );
  }, [secondaryKeywords]);

  // Auto-check keywords already in listing
  const getIsUsedOrSelected = (kw) => {
    const inTitle = check(listing.title, kw.keyword);
    const inBullets = listing.bullets.some(b => check(b, kw.keyword));
    const inBackend = check(listing.backendKeywords, kw.keyword);
    const isManuallySelected = selectedKeywordsSet.has(kw.keyword.toLowerCase());
    return inTitle || inBullets || inBackend || isManuallySelected;
  };

  // Sort keywords
  let sortedKeywords = [...keywords];
  sortedKeywords.sort((a, b) => {
    let aVal = a[sortBy] || 0;
    let bVal = b[sortBy] || 0;
    if (sortBy === "keyword") {
      aVal = a.keyword.toLowerCase();
      bVal = b.keyword.toLowerCase();
    }
    return sortOrder === "desc" ? (aVal > bVal ? -1 : 1) : (aVal < bVal ? -1 : 1);
  });

  // Paginate
  const totalPages = Math.ceil(sortedKeywords.length / itemsPerPage);
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageEnd = pageStart + itemsPerPage;
  const pageKeywords = sortedKeywords.slice(pageStart, pageEnd);

  const handleToggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  const toggleKeyword = (kw) => {
    const keywordLower = kw.toLowerCase();
    if (selectedKeywordsSet.has(keywordLower)) {
      // Remove from secondary keywords
      const newKeywords = secondaryKeywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.toLowerCase() !== keywordLower)
        .join(", ");
      setSecondaryKeywords(newKeywords);
    } else {
      // Add to secondary keywords
      const newKeywords = secondaryKeywords
        ? `${secondaryKeywords}, ${kw}`
        : kw;
      setSecondaryKeywords(newKeywords);
    }
  };

  // Build stem set from listing to detect inflected form duplicates
  const listingTextForStems = [
    listing.title || "",
    listing.bullets?.join(" ") || "",
    (listing.backendKeywords || "").replace(/\s+/g, " ")
  ].join(" ").toLowerCase();

  const listingStems = useMemo(() => {
    const words = listingTextForStems.replace(/[–—\-,.:;()]/g, " ").split(/\s+/).filter(w => w.length > 1);
    return new Set(words.map(w => stemGerman(w)));
  }, [listingTextForStems]);

  const SortableHeader = ({ col, label, align = "left" }) => (
    <th
      onClick={() => handleToggleSort(col)}
      style={{
        padding: "8px 10px",
        textAlign: align,
        color: sortBy === col ? S.accent : S.muted,
        fontWeight: 600,
        borderBottom: `1px solid ${S.border}`,
        whiteSpace: "nowrap",
        cursor: "pointer",
        background: sortBy === col ? "#1a1b2430" : "transparent",
        transition: "all 0.2s",
      }}
      title="Kliknij aby sortować"
    >
      {label} {sortBy === col && (sortOrder === "desc" ? "↓" : "↑")}
    </th>
  );

  return (
    <Card style={{ marginTop: 40, paddingTop: 32, borderTop: `2px solid ${S.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.font }}>Tabela użycia słów kluczowych</div>
            <div style={{ fontSize: 11, color: S.dim }}>{sortedKeywords.length} słów kluczowych z Helium 10 — gdzie zostały użyte w listingu</div>
          </div>
        </div>
        {selectedKeywordsSet.size > 0 && (
          <div style={{ fontSize: 12, color: S.accent, fontFamily: S.mono }}>
            Wybrano do Secondary: {selectedKeywordsSet.size}
          </div>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: S.mono }}>
          <thead>
            <tr style={{ background: "#0d0e14" }}>
              <th style={{ padding: "8px 10px", textAlign: "center", color: S.muted, fontWeight: 600, borderBottom: `1px solid ${S.border}`, whiteSpace: "nowrap", width: 30 }}>🔑</th>
              <th style={{ padding: "8px 12px", textAlign: "left", color: S.muted, fontWeight: 600, borderBottom: `1px solid ${S.border}` }}>Słowo kluczowe</th>
              <SortableHeader col="volume" label="Wolumen" align="right" />
              {keywords[0]?.cerebroScore !== undefined && <SortableHeader col="cerebroScore" label="Cerebro IQ" align="right" />}
              {keywords[0]?.organicRank !== undefined && <SortableHeader col="organicRank" label="Org. Rank" align="right" />}
              <th style={{ padding: "8px 10px", textAlign: "center", color: S.muted, fontWeight: 600, borderBottom: `1px solid ${S.border}` }}>Tytuł</th>
              {[1, 2, 3, 4, 5].map(n => (
                <th key={n} style={{ padding: "8px 8px", textAlign: "center", color: S.muted, fontWeight: 600, borderBottom: `1px solid ${S.border}`, whiteSpace: "nowrap" }}>BP{n}</th>
              ))}
              <th style={{ padding: "8px 10px", textAlign: "center", color: S.muted, fontWeight: 600, borderBottom: `1px solid ${S.border}` }}>Backend</th>
            </tr>
          </thead>
          <tbody>
            {pageKeywords.map((kw, idx) => {
              const inTitle = check(listing.title, kw.keyword);
              const inBullets = listing.bullets.map(b => check(b, kw.keyword));
              const inBackend = check(listing.backendKeywords, kw.keyword);
              const used = inTitle || inBullets.some(Boolean) || inBackend;
              const isStemDuplicate = !used && listingStems.has(stemGerman(kw.keyword.toLowerCase()));
              const isSelected = selectedKeywordsSet.has(kw.keyword.toLowerCase());
              const isChecked = used || isSelected;

              return (
                <tr key={kw.keyword} style={{ borderBottom: `1px solid #1a1b24`, background: isChecked ? "#22c55e15" : isStemDuplicate ? "#8b5a0015" : "#1a0e0e", opacity: isStemDuplicate ? 0.7 : 1 }}>
                  <td style={{ padding: "7px 10px", textAlign: "center", cursor: isStemDuplicate ? "not-allowed" : "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => !isStemDuplicate && toggleKeyword(kw.keyword)}
                      disabled={isStemDuplicate}
                      title={used ? "Keyword w listingu – kliknij aby usunąć z Secondary" : isStemDuplicate ? "Stem-duplikat: inflected form już w listingu" : "Kliknij aby dodać do Secondary Keywords"}
                      style={{ cursor: isStemDuplicate ? "not-allowed" : "pointer", opacity: isStemDuplicate ? 0.5 : 1 }}
                    />
                  </td>
                  <td style={{ padding: "7px 12px", color: isChecked ? S.text : isStemDuplicate ? "#ff9a5680" : "#ef4444", fontWeight: isChecked ? 400 : 600 }}>
                    {kw.keyword}
                    {used && <span style={{ marginLeft: 6, fontSize: 10, color: "#22c55e", opacity: 0.8 }}>w listingu</span>}
                    {isStemDuplicate && <span style={{ marginLeft: 6, fontSize: 10, color: "#ff9a56", opacity: 0.8 }}>stem-duplikat</span>}
                    {!used && !isStemDuplicate && !isSelected && <span style={{ marginLeft: 6, fontSize: 10, color: "#ef4444", opacity: 0.7 }}>nie użyte</span>}
                    {!used && !isStemDuplicate && isSelected && <span style={{ marginLeft: 6, fontSize: 10, color: "#22c55e", opacity: 0.8 }}>zaznaczone</span>}
                  </td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: S.muted }}>{kw.volume > 0 ? kw.volume.toLocaleString() : "—"}</td>
                  {keywords[0]?.cerebroScore !== undefined && <td style={{ padding: "7px 10px", textAlign: "right", color: S.muted }}>{kw.cerebroScore > 0 ? kw.cerebroScore.toFixed(1) : "—"}</td>}
                  {keywords[0]?.organicRank !== undefined && <td style={{ padding: "7px 10px", textAlign: "right", color: S.muted }}>{kw.organicRank > 0 ? kw.organicRank : "—"}</td>}
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>
                    {inTitle ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> : <span style={{ color: "#2a2d35" }}>·</span>}
                  </td>
                  {inBullets.map((v, i) => (
                    <td key={i} style={{ padding: "7px 8px", textAlign: "center" }}>
                      {v ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> : <span style={{ color: "#2a2d35" }}>·</span>}
                    </td>
                  ))}
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>
                    {inBackend ? <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> : <span style={{ color: "#2a2d35" }}>·</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "6px 12px",
              background: currentPage === 1 ? "#1e2028" : S.input,
              border: `1px solid ${S.border}`,
              borderRadius: 6,
              color: currentPage === 1 ? "#6b7280" : S.text,
              cursor: currentPage === 1 ? "default" : "pointer",
              fontSize: 11,
            }}
          >
            ← Poprzednia
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                padding: "6px 10px",
                background: page === currentPage ? S.accent : S.input,
                border: `1px solid ${page === currentPage ? S.accent : S.border}`,
                borderRadius: 6,
                color: page === currentPage ? S.bg : S.text,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: page === currentPage ? 700 : 500,
              }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 12px",
              background: currentPage === totalPages ? "#1e2028" : S.input,
              border: `1px solid ${S.border}`,
              borderRadius: 6,
              color: currentPage === totalPages ? "#6b7280" : S.text,
              cursor: currentPage === totalPages ? "default" : "pointer",
              fontSize: 11,
            }}
          >
            Następna →
          </button>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════
   HISTORY PANEL
   ═══════════════════════════════════════════ */

function HistoryPanel({ entries, onLoad, onDelete }) {
  if (!entries.length) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 20px", color: S.dim }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, color: S.muted, fontFamily: S.font }}>Brak zapisanych listingów</div>
          <div style={{ fontSize: 12, marginTop: 6, fontFamily: S.font }}>Wygenerowane listingi pojawią się tutaj automatycznie.</div>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📋</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: S.font }}>Historia listingów</div>
          <div style={{ fontSize: 11, color: S.dim }}>{entries.length}/15 zapisanych · kliknij „Załaduj" aby przywrócić</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(entry => {
          const mp = MARKETPLACES.find(m => m.code === entry.marketplace);
          const date = new Date(entry.timestamp);
          const dateStr = date.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
          return (
            <div key={entry.id} style={{
              padding: "12px 14px", background: "#0d0e14", borderRadius: 10,
              border: `1px solid ${S.border}`, display: "flex", gap: 12, alignItems: "center",
            }}>
              <div style={{ fontSize: 20, minWidth: 30 }}>{mp?.flags.join("") || "🌐"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: S.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: S.font }}>
                  {entry.title || entry.productHint || "Bez tytułu"}
                </div>
                <div style={{ fontSize: 11, color: S.dim, marginTop: 3, fontFamily: S.font }}>
                  {mp?.name || entry.marketplace} · {dateStr}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => onLoad(entry)} style={{
                  padding: "6px 12px", background: "#ff990015", border: `1px solid #ff990030`,
                  borderRadius: 6, color: S.accent, fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: S.font,
                }}>
                  Załaduj
                </button>
                <button onClick={() => onDelete(entry.id)} style={{
                  padding: "6px 10px", background: "#1e2028", border: `1px solid ${S.border}`,
                  borderRadius: 6, color: S.dim, fontSize: 12, cursor: "pointer", fontFamily: S.font,
                }}>
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
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

function AIGeneratePanel({ listing, setListing, marketplace, provider, apiKey, geminiKey, model, btg, selectedCategory, setSelectedCategory, categoryAttrs, setCategoryAttrs, secondaryKeywords, setSecondaryKeywords, csvKeywords, setCsvKeywords, onSaveListing }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [referenceBullets, setReferenceBullets] = useState(null);
  const [referenceDescription, setReferenceDescription] = useState(null);
  const [brand, setBrand] = useState("");
  const [compatibilityTitle, setCompatibilityTitle] = useState("");
  const [compatibilityBulletExt, setCompatibilityBulletExt] = useState("");

  const [mainKeyword, setMainKeyword] = useState("");
  const [error, setError] = useState("");
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
        const cerebroScoreIdx = header.findIndex(h => h.includes("cerebro") && h.includes("score") || h.includes("ciq"));
        const organicRankIdx = header.findIndex(h => h.includes("organic") && h.includes("rank") || h.includes("ranking"));

        if (kwIdx === -1) { setError("Nie znaleziono kolumny ze słowami kluczowymi w pliku CSV."); return; }

        const keywords = lines.slice(1)
          .filter(row => row[kwIdx]?.trim())
          .map(row => ({
            keyword: row[kwIdx].replace(/"/g, "").trim(),
            volume: volIdx >= 0 ? parseInt(row[volIdx]?.replace(/"/g, "").trim()) || 0 : 0,
            cerebroScore: cerebroScoreIdx >= 0 ? parseFloat(row[cerebroScoreIdx]?.replace(/"/g, "").trim()) || 0 : 0,
            organicRank: organicRankIdx >= 0 ? parseInt(row[organicRankIdx]?.replace(/"/g, "").trim()) || 0 : 0,
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

  // Text/DOCX/image file reader
  async function handleTextUpload(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result.split(",")[1];
          const mimeType = file.type;
          setImageData(prev => [...prev, { base64, mimeType, name: file.name }]);
          setUploadedFiles(prev => [...prev, { name: file.name, type: "image" }]);
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith(".docx")) {
        // Parse DOCX using mammoth
        try {
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value || "";
          if (text.trim()) {
            setUploadedFiles(prev => [...prev, { name: file.name, type: "text", content: text }]);
          } else {
            setError("Plik DOCX jest pusty lub nie udało się go odczytać.");
          }
        } catch (err) {
          setError("Błąd odczytu pliku DOCX: " + err.message);
        }
      } else {
        // Plain text files (.txt, .csv etc)
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target.result;
          setUploadedFiles(prev => [...prev, { name: file.name, type: "text", content: text }]);
        };
        reader.readAsText(file);
      }
    }
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

  function buildPrompt(mp, catInfo, brandValue, compatTitle, compatBulletExt, categoryAttrs) {
    return `You are a world-class Amazon listing optimizer specializing in European marketplaces. You have deep expertise in Amazon's A9/A10 algorithm, Rufus, and Cosmo AI systems.

TARGET MARKETPLACE: ${mp.code} (${mp.langEn})
CRITICAL: Write the ENTIRE listing NATIVELY in ${mp.langEn}. Do NOT translate from English or any other language. Use natural, fluent phrasing that a native ${mp.langEn} speaker would use when shopping online.
IMPORTANT: The product information, uploaded files, and descriptions below may be written in a DIFFERENT language (e.g., Polish, German, English). This is ONLY source material — extract the product details, features, and specifications from it, but you MUST write the ENTIRE output (title, bullets, description, backend keywords) in ${mp.langEn}. NEVER copy text from the source material as-is if it is not in ${mp.langEn}.

PRODUCT INFORMATION:
${productInfo}
${brandValue ? `BRAND: ${brandValue}` : ""}
${mainKeyword ? `PRIMARY KEYWORD (MUST appear in the first 70 characters of the title, ideally as the first descriptive words after the brand): ${mainKeyword}` : "No primary keyword provided — determine the best primary keyword yourself based on the product."}
${secondaryKeywords ? `SECONDARY KEYWORDS (weave these into the title after char 70, into bullet points, and description naturally): ${secondaryKeywords}` : "No secondary keywords provided — determine the best secondary keywords yourself."}
${compatTitle || compatBulletExt ? `COMPATIBILITY INFORMATION (for marketplace ${mp.code}):
- User provided: ${[compatTitle, compatBulletExt].filter(Boolean).join(" + ")}
- Language rules:
  - EN: "Compatible with"
  - DE: "Kompatibel mit"
  - FR: "Compatible avec"
  - IT: "Compatibile con"
  - ES: "Compatible con"
  - NL: "Compatibel met"
  - SE: "Kompatibel med"
  - PL: "Kompatybilny z"
- CRITICAL: Bullet #5 MUST focus ONLY on compatibility. Use format: "Kompatibel mit [devices] – Diese Filter sind speziell entwickelt und getestet für [type]. Perfekte Ergänzung für [use cases]."
- Include compatibility info in title ONLY if space available AFTER all other required info (after character 70).` : ""}
${catInfo ? `CATEGORY: ${catInfo.path}\nitem_type_keyword: ${catInfo.item_type}\nCategory attributes: ${catInfo.attrs.join(", ")}` : ""}
${csvKeywords ? `\nHELIUM 10 KEYWORD DATA (sorted by search volume):\n${csvKeywords.slice(0, 30).map((k, i) => `${i + 1}. "${k.keyword}" (vol: ${k.volume})`).join("\n")}\nUse the top keywords strategically: #1-3 in title, #4-15 in bullets, rest in backend/description.` : ""}
${uploadedFiles.filter(f => f.type === "text").length > 0 ? `\nADDITIONAL PRODUCT INFORMATION FROM UPLOADED FILES (NOTE: these files may be in a different language than the target marketplace — use them ONLY as an information source, extract product details from them, but ALWAYS write the listing in ${mp.langEn}):\n${uploadedFiles.filter(f => f.type === "text").map(f => `--- ${f.name} ---\n${f.content.slice(0, 3000)}`).join("\n\n")}` : ""}
${imageData.length > 0 ? `\nIMAGES ATTACHED: ${imageData.length} image(s) showing the product. Analyze them carefully to extract product details, features, text, specifications, and any visible information that should be included in the listing.` : ""}

YOUR TASK: Generate a FULLY optimized Amazon listing. Even if the product description is brief, use your knowledge to infer logical product features and create a comprehensive listing. Think like an experienced Amazon seller.

${referenceBullets ? `
═══════════════════════════════════════
REFERENCE BULLET POINTS (CRITICAL TEMPLATE)
═══════════════════════════════════════
The user previously generated this listing for another marketplace. To maintain perfect cross-marketplace consistency, you MUST use the following 5 bullets as your exact template/foundation for the new bullets.
Translate, adapt, and rewrite these into natural ${mp.langEn}, but keep the EXACT SAME meaning, features, order, and logical progression as these reference bullets:

${referenceBullets.map((b, i) => `Bullet ${i + 1}: ${b}`).join("\n\n")}

Do not invent new features that aren't in these reference bullets. Keep the same length and structure. You must still adhere to the general BULLET POINTS RULES below.
` : ""}
═══════════════════════════════════════
TITLE RULES (CRITICAL — follow exactly)
═══════════════════════════════════════
- HARD LIMIT: Max 200 characters. AIM FOR 160-200 characters. A short title wastes keyword opportunities.
- The first 66-70 characters are the MOST VALUABLE — this is what shows on mobile (~70% of Amazon traffic). The customer MUST understand what the product is within these first characters.
- STRUCTURE: ${brandValue ? `[${brandValue}] ` : "[Brand] "}[Primary Keyword = What It Is] – [Key Material/Feature] [Size] – [Secondary Feature/Keyword] – [Tertiary Keyword/Use Case] – [Model/Pack]
- SINGLE IDENTITY FIRST: The first 66 chars must clearly state ONE product function. Never open with multiple functions (e.g. "heater and sterilizer") — this confuses the A9 algorithm about what the product IS.
- NO unknown model names at the start. Customers don't search for proprietary model names. Push them to the END.
${brandValue ? `- BRAND PLACEMENT: You MUST start the title exactly with the brand name "${brandValue}". Do not put anything before it.\n` : ""}
- Include 2-3 keyword phrases naturally in the title. Use dashes (–) to separate logical sections.
- PROHIBITED: No ! $ ? _ { } ^ ¬ ¦ characters. No ALL CAPS. No promotional phrases ("best seller", "free shipping"). No word repeated more than 2 times. No emojis.
- Use numerals ("2" not "two"). Capitalize first letter of each word except prepositions/conjunctions/articles.
${compatTitle || compatBulletExt ? `- COMPATIBILITY IN TITLE: If you have space AFTER character 70 (after all primary/secondary keywords), consider adding top 1-2 compatible brands/models. Example structure: "[Primary Keyword] – [Feature] – Kompatibel mit [Top Model]" (only if it fits within 200 chars).` : ""}

═══════════════════════════════════════
BULLET POINTS RULES (5 bullets)
═══════════════════════════════════════
- HARD LIMIT: Total combined length of ALL 5 bullets MUST be between 950-1000 characters. NEVER exceed 1000 characters total. Aim for exactly 950-1000.
- Each bullet: 180-200 characters. All 5 bullets should be similar in length to reach the 950-1000 total without exceeding it.
- If the total exceeds 1000, shorten the longest bullets. If under 950, expand the shortest ones.
- FORMAT: [Benefit Headline] – Expanded explanation with feature details and a secondary keyword woven in naturally.
- CAPITALIZATION RULE: ONLY the short headline part (before the dash) starts with a capital letter. The rest of the bullet is a normal sentence — do NOT capitalize every word. This is NOT a title, it's a sentence. Example correct format: "Schont die Waage – Die hochwertige Acryl-Unterlage schützt die empfindliche Waage Ihres Thermomix TM7 vor Kratzern und Beschädigungen."
- Example WRONG format (do NOT do this): "Schont Die Waage – Die Hochwertige Acryl-Unterlage Schützt Die Empfindliche Waage" — this is Title Case applied to the whole bullet, which is WRONG.
- Bullet #1 MUST reinforce the title's primary function. If the title says "Gleitbrett", bullet #1 must be about the sliding/gliding function.
- CROSS-MARKETPLACE CONSISTENCY: The logical structure and meaning of the 5 bullets MUST be exactly the same regardless of what language you are writing in. Do not invent random benefits.
- You MUST strictly follow these 5 themes in this EXACT order:
  Bullet 1. Primary function / main benefit (What it does perfectly)
  Bullet 2. Quality / materials / durability (What it's made of and why it lasts)
  Bullet 3. Ease of use / convenience / installation (How simple it is to use)
  Bullet 4. Compatibility / versatility / dimensions (Where it fits and exact sizes)
${compatTitle || compatBulletExt ? `  Bullet 5. COMPATIBILITY FOCUS: This product is compatible with [list from compatibility field]. Emphasize quality, fit, durability with those devices.` : `  Bullet 5. Safety / certifications / warranty / what's included (Why it's a safe purchase)`}
- Under each theme, include SPECIFIC details from the product info: measurements, materials, certifications, compatible products. Do not use generic fluff.
- Speak to the customer's needs: what problem does this solve? What do they gain?
- Weave in secondary keywords naturally — never keyword-stuff.
- NO ALL CAPS anywhere. No emojis.

═══════════════════════════════════════
PRODUCT DESCRIPTION RULES
═══════════════════════════════════════
${referenceDescription ? `
CRITICAL TEMPLATE: The user previously generated this description. To maintain perfect cross-marketplace consistency, you MUST translate and rewrite this EXACT description into natural ${mp.langEn}:

${referenceDescription}

Do NOT invent new paragraphs, change the logical progression, or remove details. Match the original meaning exactly.
` : `
- 1-2 paragraphs, aim for 800-1500 characters.
- Expand on the most important features and use cases.
- Paint a picture of the product in use — help the customer imagine owning it.
- Include long-tail keywords naturally.
- End with a confidence builder (warranty mention, brand quality, satisfaction).`}
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
BENEFITS (4 SHORT SELLING POINTS)
═══════════════════════════════════════
- Generate EXACTLY 4 benefits
- Each benefit: maximum 6 words
- Format: Short, punchy phrases that highlight product advantages
- Focus on what makes this product special/attractive to customers
- Examples:
  * "Potrwałe, niezawodne, długoletnie użytkowanie"
  * "Kompatybilny z wieloma urządzeniami"
  * "Szybka instalacja, zero nakładu pracy"
  * "Najwyższa jakość materiałów"
- NO complete sentences, NO marketing fluff, NO ALL CAPS
- Make them benefit-focused, not feature-focused
- These are selling points for marketing materials/category pages

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
{"title":"...","bullet1":"...","bullet2":"...","bullet3":"...","bullet4":"...","bullet5":"...","description":"...","backendKeywords":"...","benefits":["benefit1","benefit2","benefit3","benefit4"]}

FINAL CHECK before responding:
- Is the title 160-200 characters? If under 160, ADD more keywords/features.
- Does the first 70 chars clearly identify the product?
- Is the TOTAL of all 5 bullets between 950-1000 characters? HARD LIMIT: 1000 chars max. If over 1000, SHORTEN bullets. If under 950, EXPAND them. Count carefully.
- Are backend keywords 240-250 bytes? If under 235, you MUST add more words. Think harder about synonyms, related categories, use cases.
- Does bullet #1 match the title's primary product identity?
- Are backend keywords truly COMPLEMENTARY (no words from title/bullets)?
- Do backend keywords contain ANY duplicate words? If yes, REMOVE duplicates and replace with new unique words.
- For Polish: is every adjective-noun pair grammatically correct in gender and case?

═══════════════════════════════════════
LANGUAGE REMINDER (MOST IMPORTANT)
═══════════════════════════════════════
You MUST write the ENTIRE listing (title, all 5 bullets, description, backend keywords) in ${mp.langEn}.
The source material above may be in Polish, German, English, or any other language — that does NOT matter.
Your output language is ONLY ${mp.langEn}. If even a single sentence is not in ${mp.langEn}, you have FAILED.
Double-check: Is every word in your JSON response written in ${mp.langEn}? If not, rewrite it now.`;
  }

  async function detectCategoryFromListing(listing, btgData, mp) {
    if (!btgData || !btgData.categories) return null;

    try {
      // Extract meaningful words from title + backend keywords (min 3 chars, no stop words)
      const stopWords = new Set(["the","and","for","with","from","that","this","are","not","but","all","its","also","into","only","sehr","und","für","mit","von","eine","einen","einer","einem","ist","das","die","der","des","des","dem","ein","auch","oraz","dla","do","ze","się","jest","jak","lub","czy","nie"]);
      const allText = [listing.title || "", listing.backendKeywords || ""].join(" ");
      const words = allText
        .toLowerCase()
        .replace(/[^a-ząćęłńóśźżäöüßéèêëàâçîïôùûñáíóú\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length >= 3 && !stopWords.has(w));
      const uniqueWords = [...new Set(words)].slice(0, 30);

      // Score each category by how many words from listing match its path/item_type
      // item_type_keyword match counts 3x more (it's the most specific identifier)
      const scored = btgData.categories.map(cat => {
        const itemTypeLower = cat.item_type.toLowerCase();
        const pathLower = cat.path.toLowerCase();
        let score = 0;
        for (const w of uniqueWords) {
          if (itemTypeLower.includes(w)) score += w.length * 3; // item_type match = 3x weight
          else if (pathLower.includes(w)) score += w.length;    // path match = 1x weight
        }
        return { ...cat, score };
      });

      // Sort by score descending, take top 40 (with at least score > 0 first, then fallback)
      scored.sort((a, b) => b.score - a.score);
      const matched = scored.filter(c => c.score > 0).slice(0, 40);
      const candidates = matched.length >= 5 ? matched : scored.slice(0, 40);

      const categoryList = candidates
        .map((cat, idx) => `${idx + 1}. [${cat.id}] ${cat.path} (item_type_keyword: ${cat.item_type})`)
        .join("\n");

      const detectPrompt = `You are an expert Amazon category matcher. I will give you a product listing and a list of possible Amazon Browse Tree Guide (BTG) categories. Your job is to determine which category this product BEST matches.

PRODUCT LISTING TO CLASSIFY:
Title: ${listing.title}
Bullets: ${(listing.bullets || []).slice(0, 2).join(" | ")}
Backend Keywords: ${listing.backendKeywords}

AVAILABLE CATEGORIES (best matches):
${categoryList}

IMPORTANT RULES:
- Choose the MOST SPECIFIC and PRECISE category for this exact product type.
- If this is an accessory, replacement part, filter, or consumable — choose the accessory/parts/filter category, NOT the main device category.
- Example: "water filter for coffee machine" → pick "coffee-machine-water-filters", NOT "coffee-makers".
- Example: "replacement blade for blender" → pick "blender-accessories", NOT "blenders".
- The item_type_keyword is the most important identifier — match it as precisely as possible.

Which category from the list BEST matches this product? Respond ONLY with JSON: {"categoryId": "CATEGORY_ID_HERE"}`;

      const response = await callAI([
        { role: "system", content: `You are a category matching expert. Respond with ONLY valid JSON. No explanations, no markdown, just JSON.` },
        { role: "user", content: detectPrompt }
      ]);

      if (response && response.categoryId && typeof response.categoryId === "string") {
        // Verify the category exists in btgData
        const categoryExists = btgData.categories.some(cat => cat.id === response.categoryId);
        if (categoryExists) {
          return response.categoryId;
        }
      }
      return null;
    } catch (e) {
      console.warn("Category detection failed:", e);
      return null;
    }
  }

  async function generate() {
    if (!productInfo.trim() && uploadedFiles.length === 0 && imageData.length === 0) {
      return setError("Opisz swój produkt lub wgraj załączniki z danymi (instrukcje, zdjęcia).");
    }
    const activeKey = provider === "gemini" ? geminiKey : apiKey;
    if (!activeKey.trim()) return setError(`Wpisz klucz API ${provider === "gemini" ? "Gemini" : "Groq"} w zakładce ⚙️ Ustawienia.`);
    if (!marketplace) return setError("Wybierz marketplace.");
    setError("");
    setLoading(true);
    setStatus("Generowanie listingu...");

    try {
      const mp = MARKETPLACES.find(m => m.code === marketplace);
      const catInfo = selectedCategory && btg?.category_attrs[selectedCategory];
      const prompt = buildPrompt(mp, catInfo, brand, compatibilityTitle, compatibilityBulletExt, categoryAttrs);

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

      const systemMessage = { role: "system", content: `You are an Amazon listing generator. You MUST write ALL output EXCLUSIVELY in ${mp.langEn}. The user may provide product information in any language (Polish, German, English, etc.) — treat it ONLY as source data. Your ENTIRE response (title, bullets, description, backend keywords) MUST be in ${mp.langEn}. Never output text in any other language. Respond with valid JSON only.` };

      let parsed = await callAI([systemMessage, { role: "user", content: userContent }]);

      // Auto-validation: check if listing needs improvement
      const titleLen = (parsed.title || "").length;
      const bulletsTotal = [parsed.bullet1, parsed.bullet2, parsed.bullet3, parsed.bullet4, parsed.bullet5]
        .map(b => (b || "").length).reduce((a, b) => a + b, 0);
      const backendBytes = byteCount(parsed.backendKeywords || "");

      const issues = [];
      if (titleLen > 200) issues.push(`Title is ${titleLen} chars — this EXCEEDS the HARD LIMIT of 200 characters. You MUST shorten the title to fit within 160-200 characters. Remove less important descriptors or use more concise phrasing.`);
      if (titleLen < 160) issues.push(`Title is only ${titleLen} chars — this is too short. Expand to 160-200 chars by adding more keywords, features, or use cases.`);
      if (bulletsTotal > 1000) issues.push(`Bullets total is ${bulletsTotal} chars — this EXCEEDS the HARD LIMIT of 1000 characters. You MUST shorten the bullets to fit within 950-1000 characters total. Trim the longest bullets first while keeping key information.`);
      else if (bulletsTotal < 950) issues.push(`Bullets total only ${bulletsTotal} chars — this is TOO SHORT. Each bullet MUST be 190-200 characters. EXPAND every bullet with more specific details: exact dimensions, weight, materials, compatible models, certifications, use cases. Target: 950-1000 chars total.`);
      if (backendBytes < 235) issues.push(`Backend keywords only ${backendBytes}/250 bytes — you MUST add more words to reach 240-250 bytes. Brainstorm: synonyms, related categories, compatible products, use cases, materials, locations, actions. NO duplicates, NO words from title/bullets.`);

      // Validate benefits
      const benefitCount = (parsed.benefits && Array.isArray(parsed.benefits)) ? parsed.benefits.length : 0;
      if (benefitCount < 4) issues.push(`Benefits: Muszą być dokładnie 4 elementy. Otrzymano ${benefitCount}. Wygeneruj dokładnie cztery krótkie benefity (max 6 słów każdy).`);
      if (parsed.benefits && Array.isArray(parsed.benefits)) {
        const longBenefits = parsed.benefits.filter(b => (b || "").split(" ").length > 6);
        if (longBenefits.length > 0) issues.push(`Benefits: ${longBenefits.length} benefit(ów) przekracza 6 słów. Zkrócić wszystkie benefity do maksymalnie 6 słów każdy.`);
      }

      // Check for forbidden Amazon words
      const allText = [parsed.title, parsed.bullet1, parsed.bullet2, parsed.bullet3, parsed.bullet4, parsed.bullet5, parsed.description, parsed.backendKeywords].join(" ");
      const forbiddenList = FORBIDDEN_WORDS.universal.concat(FORBIDDEN_WORDS[mp.code] || []);
      const forbiddenIssues = checkForbiddenWords(allText, forbiddenList);
      if (forbiddenIssues.length > 0) {
        issues.push(`Zakazane słowa Amazon: ${forbiddenIssues.slice(0, 3).join(", ")}${forbiddenIssues.length > 3 ? ` (+ ${forbiddenIssues.length - 3} więcej)` : ""}`);
      }

      if (issues.length > 0) {
        setStatus("Optymalizacja — rozbudowywanie listingu...");
        const refinementPrompt = `The listing you generated has these issues:
${issues.map((iss, i) => `${i + 1}. ${iss}`).join("\n")}

Here is the current listing:
${JSON.stringify(parsed, null, 2)}

Fix ALL issues above. Keep everything in ${mp.langEn}. Make the listing BIGGER and BETTER.
For the title: add secondary keywords, features, or use cases to reach 160-200 chars.
For bullets: the TOTAL of all 5 bullets MUST be between 950-1000 characters. HARD LIMIT: 1000 max. Each bullet should be 180-200 chars. If over 1000, shorten the longest bullets. If under 950, add details.
For backend keywords: brainstorm ALL possible synonyms, alternate names, related categories, compatible products, use cases — pack it to 240-250 bytes. Remember: no words already in title or bullets, no brand names, no stop words, NO DUPLICATE WORDS.
For benefits: EXACTLY 4 benefits, each maximum 6 words. They must be short, punchy selling points highlighting product advantages. Make them benefit-focused, not feature-focused.
CRITICAL - Forbidden Words: REMOVE any Amazon-forbidden words like: best seller, best price, approved, guaranteed, top rated, limited time, sale, cure, heal, sanitize, etc. Replace with alternative phrasing that conveys the same benefit WITHOUT using forbidden words. Examples: instead of "best seller" use "bestselling" or "customer favorite"; instead of "guaranteed" use "backed by warranty" or "reliable".

Respond ONLY with the improved JSON, same format:
{"title":"...","bullet1":"...","bullet2":"...","bullet3":"...","bullet4":"...","bullet5":"...","description":"...","backendKeywords":"...","benefits":["benefit1","benefit2","benefit3","benefit4"]}`;

        parsed = await callAI([
          systemMessage,
          { role: "user", content: prompt },
          { role: "assistant", content: JSON.stringify(parsed) },
          { role: "user", content: refinementPrompt },
        ]);
      }

      // Post-processing: language validation
      // Check if the listing might be in the wrong language by detecting Polish-specific patterns when target is not Polish
      if (mp.code !== "PL") {
        const listingTextCheck = [
          parsed.title || "",
          parsed.bullet1 || "", parsed.bullet2 || "", parsed.bullet3 || "",
          parsed.bullet4 || "", parsed.bullet5 || "",
          parsed.description || "",
        ].join(" ").toLowerCase();
        
        // Common Polish words that wouldn't appear in other languages
        const polishMarkers = ["jest", "oraz", "które", "który", "która", "dzięki", "czemu", "również", "można", "bardzo", "przez", "jego", "jej", "tego", "zapewnia", "umożliwia", "posiada", "wykonany", "wykonana", "produktu", "użycia"];
        const polishHits = polishMarkers.filter(w => {
          const regex = new RegExp(`\\b${w}\\b`, 'gi');
          return regex.test(listingTextCheck);
        });
        
        if (polishHits.length >= 3) {
          setStatus(`Wykryto polski tekst zamiast ${mp.langEn} — ponowne generowanie...`);
          const langFixPrompt = `CRITICAL ERROR: Your previous response was written in Polish, but the target language is ${mp.langEn}.

Here is the WRONG listing (in Polish):
${JSON.stringify(parsed, null, 2)}

You MUST rewrite this ENTIRE listing in ${mp.langEn}. Every single word must be in ${mp.langEn}.
Do NOT translate word-by-word from Polish. Write it NATIVELY in ${mp.langEn} as a native speaker would.
Keep the same product information, features, and structure, but the language MUST be ${mp.langEn}.

Respond ONLY with valid JSON in ${mp.langEn}:
{"title":"...","bullet1":"...","bullet2":"...","bullet3":"...","bullet4":"...","bullet5":"...","description":"...","backendKeywords":"..."}`;
          
          parsed = await callAI([
            systemMessage,
            { role: "user", content: langFixPrompt },
          ]);
        }
      }

      // Post-processing: enforce title HARD LIMIT of 200 characters
      if (parsed.title && parsed.title.length > 200) {
        parsed.title = parsed.title.slice(0, 200).trimEnd();
      }

      // Post-processing: enforce bullet points HARD LIMIT of 1000 chars
      {
        const bulletKeys = ["bullet1", "bullet2", "bullet3", "bullet4", "bullet5"];
        let bullets = bulletKeys.map(k => parsed[k] || "");
        let total = bullets.reduce((sum, b) => sum + b.length, 0);

        if (total > 1000) {
          // Calculate how much we need to trim
          const excess = total - 1000;
          // Target length per bullet (proportional trimming)
          const targetTotal = 1000;

          // Sort bullets by length (longest first) to trim longest ones more
          const indexed = bullets.map((b, i) => ({ text: b, idx: i, len: b.length }));
          indexed.sort((a, b) => b.len - a.len);

          let remaining = targetTotal;
          const maxPerBullet = [];
          
          // Distribute chars: give each bullet proportional share of 1000
          for (let i = 0; i < indexed.length; i++) {
            const share = Math.floor(remaining / (indexed.length - i));
            const actual = Math.min(indexed[i].len, share);
            maxPerBullet[indexed[i].idx] = actual;
            remaining -= actual;
          }

          // Trim each bullet intelligently at sentence/phrase boundaries
          bullets = bullets.map((b, i) => {
            const max = maxPerBullet[i];
            if (b.length <= max) return b;
            
            // Try to cut at the last sentence ending (. or –) before the limit
            let trimmed = b.slice(0, max);
            const lastPeriod = trimmed.lastIndexOf(".");
            const lastDash = trimmed.lastIndexOf(" – ");
            const lastComma = trimmed.lastIndexOf(", ");
            
            // Find the best cut point
            const cutPoint = Math.max(
              lastPeriod > max * 0.6 ? lastPeriod + 1 : -1,
              lastComma > max * 0.7 ? lastComma : -1,
            );
            
            if (cutPoint > max * 0.6) {
              trimmed = b.slice(0, cutPoint).trimEnd();
              // Add period if doesn't end with one
              if (!trimmed.endsWith(".")) trimmed += ".";
            } else {
              // Just hard cut at word boundary
              const lastSpace = trimmed.lastIndexOf(" ");
              if (lastSpace > max * 0.5) {
                trimmed = b.slice(0, lastSpace).trimEnd();
              }
              if (!trimmed.endsWith(".")) trimmed += ".";
            }
            
            return trimmed;
          });

          // Apply trimmed bullets back
          bulletKeys.forEach((k, i) => { parsed[k] = bullets[i]; });
        }
        
        // Post-processing: enforce bullet points MINIMUM LIMIT of 950 chars
        total = bullets.reduce((sum, b) => sum + b.length, 0);
        if (total < 950) {
          setStatus("Dobijanie długości punktów (bullet points)...");
          const deficit = 975 - total; // AIM for 975
          
          // Ask AI to generate generic benefit-driven padding sentences natively in the target language
          const padPrompt = `I need MORE text for some Amazon listing bullet points in ${mp.langEn}.
          
Product: ${parsed.title}

Current bullets:
${bullets.map((b, i) => `[${i}] ${b}`).join("\n")}

The total length is too short. I need you to generate exactly 3 distinct, natural, benefit-driven sentences in perfectly native ${mp.langEn} that can be appended to the ends of the bullets to make them longer.
- DO NOT repeat existing info. Focus on: durability, customer satisfaction, ease of use, premium quality, or versatile applications.
- Each sentence should be about 60-80 characters long.
- Write them as standalone sentences ending with a period.

Respond ONLY with a JSON array of 3 strings: ["sentence 1.", "sentence 2.", "sentence 3."]`;

          try {
            const padRes = await callAI([
              { role: "system", content: `You only output valid JSON arrays of strings in ${mp.langEn}.` },
              { role: "user", content: padPrompt }
            ]);
            
            if (Array.isArray(padRes) && padRes.length > 0) {
              // Sort bullets by length (shortest first)
              const indexed = bullets.map((b, i) => ({ text: b, idx: i, len: b.length }));
              indexed.sort((a, b) => a.len - b.len);
              
              // Append generated sentences to the shortest bullets
              for (let i = 0; i < Math.min(padRes.length, 5); i++) {
                if (padRes[i] && typeof padRes[i] === 'string') {
                  const targetIdx = indexed[i % indexed.length].idx;
                  let bullet = bullets[targetIdx];
                  if (!bullet.endsWith(".")) bullet += ".";
                  bullet += " " + padRes[i].trim();
                  bullets[targetIdx] = bullet;
                }
              }
              
              // Update total
              total = bullets.reduce((sum, b) => sum + b.length, 0);
              
              // If we accidentally exceeded 1000 due to padding, apply the exact same truncation logic as above
              if (total > 1000) {
                const excess = total - 1000;
                // Just trim the exact amount we exceeded from the longest bullet
                let longestIdx = 0;
                for (let i = 1; i < 5; i++) {
                  if (bullets[i].length > bullets[longestIdx].length) longestIdx = i;
                }
                let trimmed = bullets[longestIdx].slice(0, bullets[longestIdx].length - excess).trimEnd();
                const cutPoint = Math.max(trimmed.lastIndexOf("."), trimmed.lastIndexOf(" "));
                if (cutPoint > 0) trimmed = trimmed.slice(0, cutPoint);
                if (!trimmed.endsWith(".")) trimmed += ".";
                bullets[longestIdx] = trimmed;
              }
              
              // Apply padded bullets back
              bulletKeys.forEach((k, i) => { parsed[k] = bullets[i]; });
            }
          } catch (e) {
            console.error("Bullet padding failed:", e);
          }
        }
      }

      // Post-processing: clean backend keywords thoroughly
      if (parsed.backendKeywords) {
        // Collect all words from title, bullets, description, brand (lowercased)
        const listingText = [
          parsed.title || "",
          parsed.brand || brand || "",
          parsed.bullet1 || "", parsed.bullet2 || "", parsed.bullet3 || "",
          parsed.bullet4 || "", parsed.bullet5 || "",
          (parsed.description || "").replace(/<br\s*\/?>/gi, " "),
        ].join(" ").toLowerCase();

        // Extract individual words from listing (strip punctuation)
        const listingWords = new Set(
          listingText.replace(/[–—\-,.:;()]/g, " ").split(/\s+/).filter(w => w.length > 1)
        );

        // Create stem set from listing words for inflection detection
        const listingStems = new Set(
          Array.from(listingWords).map(w => stemGerman(w))
        );

        // Process backend keywords
        let bkWords = parsed.backendKeywords.toLowerCase()
          .replace(/[,;.:]/g, " ")  // remove punctuation
          .split(/\s+/)
          .filter(Boolean);

        // 1. Remove duplicates
        bkWords = [...new Set(bkWords)];

        // 2. Remove words that appear in listing text (exact match OR stem match)
        bkWords = bkWords.filter(w => {
          const exactMatch = listingWords.has(w);
          const stemMatch = listingStems.has(stemGerman(w));
          return !exactMatch && !stemMatch && w.length > 1;
        });
        
        // 3. Remove common stop words
        const stopWords = new Set(["und","oder","für","mit","von","den","dem","des","die","der","das","ein","eine","einen","einem","einer","zu","zur","zum","im","in","am","an","auf","aus","bei","bis","nach","über","unter","vor","entre","les","des","pour","avec","dans","une","sur","the","and","for","with","from","that","this","are","was","not","but","have","has","been","will","can","all","its","our","your","also","than","into","only","del","los","las","por","con","una","como","más","los","est","plus","que","qui","son","ses","ont","par","aux","ces","het","van","een","zijn","bij","nog","och","att","som","har","den","det","på","med","av","do","na","ze","od","po","za","się","jest","jak","lub","czy","nie","co","to","we","te","ma","tak","tu","tam","ten","ta","ich","ale","i","a","o","w","z","u","e","y","il","di","la","le","lo","da","al","no","si","se","en","el","de"]);
        bkWords = bkWords.filter(w => !stopWords.has(w));
        
        // 4. Trim to exactly 250 bytes max
        let result = [];
        for (const word of bkWords) {
          result.push(word);
          const joined = result.join(" ");
          if (byteCount(joined) > 250) {
            result.pop(); // remove the word that caused overflow
            break;
          }
        }
        
        parsed.backendKeywords = result.join(" ");

        // 5. If under 235 bytes after cleanup, ask AI for more complementary keywords
        const finalBytes = byteCount(parsed.backendKeywords);
        if (finalBytes < 235) {
          setStatus("Dobijanie backend keywords...");
          const remainingBytes = 248 - finalBytes;
          const padPrompt = `I need MORE backend search terms for an Amazon ${mp.langEn} listing. 

Product: ${parsed.title}

Words already used (DO NOT repeat any of these): ${[...listingWords, ...result].join(" ")}

Generate ONLY a space-separated list of unique lowercase ${mp.langEn} words. These must be:
- Synonyms, related product categories, compatible accessories, use cases, materials, locations, actions
- NOT in the forbidden list above
- No stop words, no brand names, no punctuation
- Total must fit in approximately ${remainingBytes} bytes (special chars like ö,ü,ä,ą,ę = 2 bytes each)

Respond with ONLY the words, nothing else. No JSON, no explanation. Just space-separated lowercase words.`;

          try {
            const padRes = await fetch(
              provider === "gemini"
                ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
                : "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: provider === "gemini"
                  ? { "Content-Type": "application/json", "Authorization": `Bearer ${geminiKey}` }
                  : { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: model,
                  messages: [{ role: "user", content: padPrompt }],
                  temperature: 0.9,
                  max_tokens: 500,
                }),
              }
            );
            if (padRes.ok) {
              const padData = await padRes.json();
              const padText = (padData.choices?.[0]?.message?.content || "").toLowerCase().replace(/[^a-ząćęłńóśźżäöüßéèêëàâçîïôùûñáíóúě\s]/g, " ");
              const padWords = padText.split(/\s+/).filter(Boolean);
              const usedWords = new Set([...listingWords, ...result, ...stopWords]);
              const uniquePad = [...new Set(padWords)].filter(w => !usedWords.has(w) && w.length > 2);
              
              // Add words until we hit 250 bytes
              const padResult = [...result];
              for (const word of uniquePad) {
                padResult.push(word);
                if (byteCount(padResult.join(" ")) > 250) {
                  padResult.pop();
                  break;
                }
              }
              parsed.backendKeywords = padResult.join(" ");
            }
          } catch { /* silently continue with what we have */ }
        }
      }

      const newListing = {
        title: parsed.title || "",
        bullets: [parsed.bullet1||"", parsed.bullet2||"", parsed.bullet3||"", parsed.bullet4||"", parsed.bullet5||""],
        description: parsed.description || "",
        backendKeywords: parsed.backendKeywords || "",
        benefits: (parsed.benefits && Array.isArray(parsed.benefits))
          ? parsed.benefits.map(b => (b || "").trim()).slice(0, 4)
          : ["", "", "", ""],
        brand: parsed.brand || brand || "",
      };
      setListing(newListing);
      onSaveListing?.(newListing, marketplace, productInfo);
      setReferenceBullets([parsed.bullet1||"", parsed.bullet2||"", parsed.bullet3||"", parsed.bullet4||"", parsed.bullet5||""]);
      setReferenceDescription(parsed.description || "");

      // Auto-detect category from listing
      if (btg) {
        setStatus("Wykrywanie kategorii produktu...");
        const detectedCategoryId = await detectCategoryFromListing(newListing, btg, mp);
        if (detectedCategoryId) {
          setSelectedCategory(detectedCategoryId);
          setCategoryAttrs({});
        }
      }

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
    <>
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
        placeholder="np. Bambusowa deska do krojenia premium, 40x30 cm, z rowkiem na sok i antypoślizgowymi nóżkami..." />
      <Field label="Marka produktu (Brand)" value={brand} onChange={setBrand}
        placeholder="np. CookNature, Sillar..."
        helper="Opcjonalne. Zostanie użyte na samym początku tytułu oraz wkomponowane w treść listingu." />
      <Field label="Główne słowo kluczowe (Main Keyword)" value={mainKeyword} onChange={setMainKeyword}
        placeholder="np. Gleitbrett, Wasserfilterkartusche, Schneidebrett..."
        helper="To słowo pojawi się na początku tytułu (w pierwszych 70 znakach). Jedno słowo/fraza opisująca czym jest produkt." />
      <Field label="Dodatkowe słowa kluczowe (Secondary Keywords)" value={secondaryKeywords} onChange={setSecondaryKeywords}
        placeholder="np. Thermomix Zubehör, Rutschfest, Acryl Unterlage..."
        helper="Oddzielone przecinkami. Zostaną wplecione w dalszą część tytułu, bullety i opis." />

      {/* Compatibility Section */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.accent, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          🔗 KOMPATYBILNOŚĆ (OPCJONALNIE)
        </div>
        <Field label="Kompatybilność w tytule i Bullet #5" value={compatibilityTitle} onChange={setCompatibilityTitle}
          multiline
          placeholder="np. DeLonghi DLS C002, Philips XL1000, uniwersalny entkalker..."
          helper="Modele/urządzenia kompatybilne z produktem. Zostaną wplecione w tytuł (jeśli miejsce) i Bullet #5." />
        <Field label="Kompatybilność w Bullet #5 (poszerzenie)" value={compatibilityBulletExt} onChange={setCompatibilityBulletExt}
          multiline
          placeholder="np. DeLonghi Magnifica, Siemens, Bosch..."
          helper="Dodatkowe urządzenia, jeśli miejsce w tytule za małe. Wszystko ląduje w Bullet #5 razem z powyższymi." />
      </div>

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
            <input type="file" accept="image/*,.txt,.docx,.doc,.pdf" multiple onChange={handleTextUpload} style={{ display: "none" }} />
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

      {referenceBullets && (
        <div style={{ 
          marginBottom: 16, padding: "12px 16px", background: "rgba(34, 197, 94, 0.1)", 
          borderRadius: 12, border: "1px solid rgba(34, 197, 94, 0.3)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#22c55e", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔗</span> Zablokowana struktura (punkty + opis)
            </div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
              Kolejne generowane języki zachowają stałą konstrukcję i znaczenie punktów oraz opisu.
            </div>
          </div>
          <button 
            onClick={() => { setReferenceBullets(null); setReferenceDescription(null); }} 
            style={{
              background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "none", 
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(34, 197, 94, 0.25)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(34, 197, 94, 0.15)"}
          >
            🔄 Resetuj wzorzec
          </button>
        </div>
      )}


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
    </>
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

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.accent, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          🎯 BENEFITY (4 główne zalety — max 6 słów każdy)
        </div>
        {[0, 1, 2, 3].map(i => (
          <Field
            key={i}
            label={`Benefit ${i + 1}`}
            value={listing.benefits?.[i] || ""}
            onChange={v => {
              const newBenefits = [...(listing.benefits || ["", "", "", ""])];
              newBenefits[i] = v;
              setListing({ ...listing, benefits: newBenefits });
            }}
            placeholder={`np. Maksymalna wydajność, Uniwersalna kompatybilność, ...`}
            helper={i === 0 ? "Krótkie zwroty sprzedające główne zalety produktu (poniżej 7 słów każdy)." : ""}
          />
        ))}
      </div>
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
  const [categoryAttrs, setCategoryAttrs] = useState({});
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [csvKeywords, setCsvKeywords] = useState(null);
  const [listing, setListing] = useState({
    title: "", bullets: ["", "", "", "", ""], description: "", backendKeywords: "", benefits: ["", "", "", ""], brand: "",
  });
  const [savedListings, setSavedListings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("amz-listing-history") || "[]"); } catch { return []; }
  });

  function saveToHistory(newListing, mp, hint) {
    const entry = {
      id: Date.now(),
      marketplace: mp,
      timestamp: new Date().toISOString(),
      title: newListing.title.slice(0, 120),
      productHint: (hint || "").slice(0, 60),
      listing: newListing,
    };
    setSavedListings(prev => {
      const updated = [entry, ...prev].slice(0, 15);
      try { localStorage.setItem("amz-listing-history", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function deleteFromHistory(id) {
    setSavedListings(prev => {
      const updated = prev.filter(e => e.id !== id);
      try { localStorage.setItem("amz-listing-history", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function loadFromHistory(entry) {
    setListing(entry.listing);
    setMarketplace(entry.marketplace);
    setTab("generate");
  }

  // Load BTG data
  useEffect(() => {
    fetch("/btg-data.json")
      .then(r => r.json())
      .then(d => setBtg(d))
      .catch(() => console.warn("Nie udało się załadować danych BTG"));
  }, []);

  // Clear category attrs when selectedCategory changes
  useEffect(() => {
    setCategoryAttrs({});
  }, [selectedCategory]);

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
          <TabBtn active={tab === "history"} onClick={() => setTab("history")} icon="📋">
            Historia {savedListings.length > 0 && <span style={{ background: S.accent, color: S.bg, borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{savedListings.length}</span>}
          </TabBtn>
          <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} icon="⚙️">Ustawienia</TabBtn>
        </div>

        {/* TAB CONTENT */}
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {tab === "generate" && (
            <>
              <AIGeneratePanel listing={listing} setListing={setListing} marketplace={marketplace}
                provider={provider} apiKey={apiKey} geminiKey={geminiKey} model={model} btg={btg} selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory} categoryAttrs={categoryAttrs} setCategoryAttrs={setCategoryAttrs}
                secondaryKeywords={secondaryKeywords} setSecondaryKeywords={setSecondaryKeywords}
                csvKeywords={csvKeywords} setCsvKeywords={setCsvKeywords}
                onSaveListing={saveToHistory} />
              {listing.title && <ListingPreview listing={listing} />}
              {csvKeywords && listing.title && <KeywordUsageTable keywords={csvKeywords} listing={listing} secondaryKeywords={secondaryKeywords} setSecondaryKeywords={setSecondaryKeywords} />}
            </>
          )}
          {tab === "manual" && <ManualEditor listing={listing} setListing={setListing} />}
          {tab === "preview" && <ListingPreview listing={listing} />}
          {tab === "history" && <HistoryPanel entries={savedListings} onLoad={loadFromHistory} onDelete={deleteFromHistory} />}
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

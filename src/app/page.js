"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { RefreshCcw, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

// ═══════ COLOR CONFIG ═══════
const UP = [
  { at: 0.3, r: 80, g: 38, b: 38 },
  { at: 1, r: 145, g: 28, b: 25 },
  { at: 3, r: 205, g: 22, b: 18 },
  { at: 5, r: 245, g: 42, b: 32 },
  { at: 10, r: 255, g: 65, b: 55 },
  { at: 15, r: 255, g: 90, b: 105 },
  { at: 29, r: 255, g: 115, b: 185 },
];
const DN = [
  { at: 0.3, r: 38, g: 40, b: 80 },
  { at: 1, r: 28, g: 42, b: 140 },
  { at: 3, r: 22, g: 58, b: 195 },
  { at: 5, r: 32, g: 85, b: 240 },
  { at: 10, r: 55, g: 125, b: 255 },
  { at: 15, r: 75, g: 175, b: 255 },
  { at: 29, r: 85, g: 225, b: 255 },
];
const NE = { r: 38, g: 38, b: 44 };

const lrp = (a, b, t) => {
  const T = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * T),
    g: Math.round(a.g + (b.g - a.g) * T),
    b: Math.round(a.b + (b.b - a.b) * T),
  };
};

const cfs = (abs, st) => {
  if (abs <= st[0].at) return lrp(NE, st[0], abs / st[0].at);
  for (let i = 1; i < st.length; i++)
    if (abs <= st[i].at)
      return lrp(st[i - 1], st[i], (abs - st[i - 1].at) / (st[i].at - st[i - 1].at));
  return st[st.length - 1];
};

const gc = (ch) => {
  const a = Math.abs(ch);
  if (a < 0.15) return `rgb(${NE.r},${NE.g},${NE.b})`;
  const c = cfs(a, ch > 0 ? UP : DN);
  return `rgb(${c.r},${c.g},${c.b})`;
};

const gcD = (ch, d) => {
  const a = Math.abs(ch);
  if (a < 0.15) {
    const v = Math.round(NE.r * d);
    return `rgb(${v},${v},${Math.round(NE.b * d)})`;
  }
  const c = cfs(a, ch > 0 ? UP : DN);
  return `rgb(${Math.round(c.r * d)},${Math.round(c.g * d)},${Math.round(c.b * d)})`;
};

const glw = (ch) => {
  const a = Math.abs(ch);
  if (a < 3) return "none";
  const i = Math.min(10, (a - 3) / 2.5);
  return `drop-shadow(0 0 ${i}px ${
    ch > 0 ? `rgba(255,80,100,${(0.06 * i).toFixed(2)})` : `rgba(80,180,255,${(0.06 * i).toFixed(2)})`
  })`;
};

const txt = (ch, m = 1) => {
  const a = Math.abs(ch);
  return `rgba(255,255,255,${(a < 0.5 ? 0.5 : a < 3 ? 0.78 : a < 10 ? 0.9 : 1) * m})`;
};

function avg(n) {
  const l = n.leaves ? n.leaves() : [];
  if (!l.length) return 0;
  const t = l.reduce((s, x) => s + (x.data.cap || 0), 0);
  return t ? l.reduce((s, x) => s + (x.data.change || 0) * (x.data.cap || 0), 0) / t : 0;
}

const SH = 15, MH = 12;

// ═══════ COMPONENTS ═══════
const DD = ({ node, x, y, cR }) => {
  if (!node) return null;
  const isMobile = cR.w < 600;
  const lvs = (node.leaves ? node.leaves() : [])
    .sort((a, b) => b.data.cap - a.data.cap)
    .slice(0, isMobile ? 5 : 8);
  const av = avg(node);
  const w = isMobile ? 200 : 260;
  const h = 30 + lvs.length * 22 + 4;
  
  let l = x, t = y + 2;
  if (cR) {
    if (l + w > cR.w) l = cR.w - w - 4;
    if (t + h > cR.h) t = y - h - 2;
    if (l < 2) l = 2;
    if (t < 2) t = 2;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: l,
        top: t,
        width: w,
        background: "rgba(12,12,18,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        pointerEvents: "none",
        zIndex: 2000,
        boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "5px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          background: gcD(av, 0.35),
        }}
      >
        <span style={{ color: "#fff", fontSize: isMobile ? 9 : 11, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.data.name}</span>
        <span
          style={{
            color: av > 0 ? "#ff6b6b" : av < 0 ? "#70aaff" : "#888",
            fontSize: isMobile ? 9 : 11,
            fontWeight: 800,
            fontFamily: "monospace",
          }}
        >
          {av > 0 ? "▲" : av < 0 ? "▼" : "−"} {Math.abs(av).toFixed(2)}%
        </span>
      </div>
      {lvs.map((l, i) => {
        const ch = l.data.change;
        return (
          <div
            key={i}
            style={{
              padding: "2px 10px",
              display: "flex",
              alignItems: "center",
              borderBottom: i < lvs.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: isMobile ? 8 : 10,
                fontWeight: 600,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {l.data.name}
            </span>
            <span
              style={{
                color: ch > 0 ? "#ff6b6b" : ch < 0 ? "#70aaff" : "#888",
                fontSize: isMobile ? 8 : 10,
                fontWeight: 700,
                fontFamily: "monospace",
                width: isMobile ? 40 : 52,
                textAlign: "right",
              }}
            >
              {ch > 0 ? "+" : ""}
              {ch.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Tip = ({ d, x, y, cR }) => {
  if (!d) return null;
  const isMobile = cR.w < 600;
  const w = isMobile ? 180 : 240;
  const h = isMobile ? 120 : 150;
  
  let l = x + 14, t = y + 14;
  if (cR) {
    if (l + w > cR.w) l = x - w - 10;
    if (t + h > cR.h) t = y - h - 10;
    if (l < 4) l = 4;
    if (t < 4) t = 4;
  }
  const ch = d.data.change, a = Math.abs(ch);
  const cap = d.data.cap >= 1e6 ? `${(d.data.cap / 1e6).toFixed(1)}조` : `${(d.data.cap / 1e3).toFixed(0)}억`;
  const mid = d.parent?.data?.name || "", sec = d.parent?.parent?.data?.name || "", ind = d.data.industry || "";

  return (
    <div
      style={{
        position: "absolute",
        left: l,
        top: t,
        background: "rgba(6,6,12,0.97)",
        border: `1px solid ${ch > 0 ? "rgba(255,70,70,0.25)" : ch < 0 ? "rgba(70,130,255,0.25)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 8,
        padding: isMobile ? "8px 10px" : "10px 14px",
        pointerEvents: "none",
        zIndex: 3000,
        minWidth: w,
        backdropFilter: "blur(14px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: isMobile ? 12 : 14 }}>{d.data.name}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 2, fontFamily: "monospace" }}>{d.data.ticker}</div>
        </div>
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 5,
            background: ch > 0 ? "rgba(255,40,60,0.15)" : ch < 0 ? "rgba(40,80,255,0.15)" : "rgba(255,255,255,0.06)",
            color: ch > 0 ? (a > 10 ? "#ff6eaa" : "#ff5555") : a > 10 ? "#60ddff" : "#5090ff",
            fontSize: isMobile ? 11 : 14,
            fontWeight: 900,
            fontFamily: "monospace",
          }}
        >
          {ch > 0 ? "▲" : ch < 0 ? "▼" : "−"} {a.toFixed(2)}%
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 7, display: "flex", flexDirection: "column", gap: 3, fontSize: isMobile ? 9 : 10.5 }}>
        {[["시가총액", cap, true], ["대분류", sec], ["중분류", mid], ["소분류", ind]].map(([k, v, mono]) => (
          <div key={k} style={{ display: "flex", width: "100%" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", flex: 1 }}>{k}</span>
            <span style={{ color: mono ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: mono ? 700 : 600, fontFamily: mono ? "monospace" : "inherit", textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Legend = () => {
  const v = [-29, -15, -10, -5, -3, -1, 0, 1, 3, 5, 10, 15, 29];
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0, overflowX: "auto", maxWidth: "100%" }}>
      <span style={{ fontSize: 8, color: "#60ddff", marginRight: 5, fontWeight: 800 }}>하락</span>
      {v.map((val, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 18,
              height: 10,
              background: gc(val),
              borderRadius: i === 0 ? "4px 0 0 4px" : i === v.length - 1 ? "0 4px 4px 0" : 0,
              borderRight: i < v.length - 1 ? "1px solid rgba(0,0,0,0.5)" : "none",
            }}
          />
        </div>
      ))}
      <span style={{ fontSize: 8, color: "#ff6eaa", marginLeft: 5, fontWeight: 800 }}>상승</span>
    </div>
  );
};

// ═══════ MAIN PAGE ═══════
export default function KRXHeatmap() {
  const ref = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [dims, setDims] = useState({ w: 1000, h: 600 });
  const [tip, setTip] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(null);
  const [sec, setSec] = useState(null);
  const [dd, setDd] = useState(null);
  const [ddP, setDdP] = useState({ x: 0, y: 0 });

  const fetchData = useCallback(async () => {
    try {
      // Cloudflare Worker API 엔드포인트로 변경
      const res = await fetch("https://krx-api.kennies-seoul.workers.dev/api/heatmap");
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
      setLastUpdated(json.updated || new Date().toLocaleString());
      setLoading(false);
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 180000);
    return () => clearInterval(timer);
  }, [fetchData]);

  useEffect(() => {
    const fn = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        setDims({ w: r.width, h: Math.max(window.innerHeight * 0.7, 400) });
      }
    };
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const { leaves, secN, midN } = useMemo(() => {
    if (!data) return { leaves: [], secN: [], midN: [] };
    const filteredData = sec ? { ...data, children: data.children.filter((s) => s.name === sec) } : data;
    const h = d3.hierarchy(filteredData).sum((d) => d.cap || 0).sort((a, b) => b.value - a.value);
    
    d3.treemap().size([dims.w, dims.h]).paddingOuter(1).paddingTop(SH).paddingInner(1).round(true).tile(d3.treemapSquarify.ratio(1.2))(h);

    const secN = [], midN = [];
    h.children?.forEach((s) => {
      secN.push(s);
      s.children?.forEach((m) => {
        midN.push(m);
        if (!m.children) return;
        const stockTop = m.y0 + SH, stockBot = m.y1, oldH = stockBot - stockTop, newTop = m.y0 + MH, newH = stockBot - newTop;
        if (oldH <= 0 || newH <= 0) return;
        const scale = newH / oldH;
        m.children.forEach((stock) => {
          const rY0 = stock.y0 - stockTop, rY1 = stock.y1 - stockTop;
          stock.y0 = newTop + rY0 * scale; stock.y1 = newTop + rY1 * scale;
        });
      });
    });
    return { leaves: h.leaves(), secN, midN };
  }, [data, dims, sec]);

  const onM = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    setMouse({ x, y });
  }, []);

  if (loading) return (
    <div style={{ width: "100%", height: "100vh", background: "#0a0a0e", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
      <RefreshCcw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div style={{ width: "100%", height: "100vh", background: "#0a0a0e", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif", overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>KRX</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.18)", letterSpacing: "1px" }}>WICS MAP</span>
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {[null, ...data.children.map(c => c.name)].map(s => (
              <button key={s || "a"} onClick={() => setSec(sec === s ? null : s)} style={{ padding: "3px 8px", fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: "pointer", background: (s === null ? !sec : sec === s) ? "rgba(255,255,255,0.12)" : "transparent", color: (s === null ? !sec : sec === s) ? "#fff" : "rgba(255,255,255,0.25)", border: (s === null ? !sec : sec === s) ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent" }}>{s || "전체"}</button>
            ))}
          </div>
        </div>
        <Legend />
      </div>

      <div ref={ref} onMouseMove={onM} onMouseLeave={() => { setTip(null); setHov(null); setDd(null); }} onTouchMove={(e) => { const t = e.touches[0]; const r = ref.current.getBoundingClientRect(); setMouse({ x: t.clientX - r.left, y: t.clientY - r.top }); }} style={{ flex: 1, position: "relative", margin: "2px", overflow: "hidden" }}>
        <svg width={dims.w} height={dims.h} style={{ display: "block" }}>
          {secN.map((s, i) => {
            const av = avg(s), w = s.x1 - s.x0, h = s.y1 - s.y0;
            if (w < 40) return null;
            return (
              <g key={`s${i}`} onMouseEnter={() => { setDd(s); setDdP({ x: s.x0, y: s.y0 + SH }); }} onMouseLeave={() => setDd(null)}>
                <rect x={s.x0} y={s.y0} width={w} height={h} fill={gcD(av, 0.12)} stroke={gcD(av, 0.3)} strokeWidth={1} rx={2} />
                <rect x={s.x0} y={s.y0} width={w} height={SH} fill={gcD(av, 0.4)} rx={2} />
                <text x={s.x0 + 5} y={s.y0 + SH - 3.5} fill="#fff" fontSize={10} fontWeight={800}>{s.data.name.substring(0, Math.floor(w/6))}</text>
              </g>
            );
          })}
          {midN.map((m, i) => {
            const w = m.x1 - m.x0, h = m.y1 - m.y0;
            if (w < 20 || h < MH + 4) return null;
            return (
              <g key={`m${i}`} onMouseEnter={() => { setDd(m); setDdP({ x: m.x0, y: m.y0 + MH }); }} onMouseLeave={() => setDd(null)}>
                <rect x={m.x0} y={m.y0} width={w} height={h} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} rx={1} />
              </g>
            );
          })}
          {leaves.map((leaf, i) => {
            const w = leaf.x1 - leaf.x0, h = leaf.y1 - leaf.y0;
            if (w < 1 || h < 1) return null;
            const ch = leaf.data.change, isH = hov === i;
            const fontSize = Math.max(7, Math.min(13, Math.sqrt(w * h) / 7));
            const showName = w > 20 && h > 12;
            const showChange = w > 35 && h > 25;
            return (
              <g key={`t${i}`} onMouseEnter={() => { setHov(i); setTip(leaf); setDd(null); }} onMouseLeave={() => { setHov(null); setTip(null); }} onClick={() => setTip(leaf)} style={{ cursor: "pointer" }}>
                <rect x={leaf.x0} y={leaf.y0} width={w} height={h} fill={gc(ch)} stroke={isH ? "#fff" : "rgba(0,0,0,0.2)"} strokeWidth={isH ? 1.5 : 0.3} rx={1} style={{ filter: glw(ch) }} />
                {showName && (
                  <text x={leaf.x0 + w/2} y={leaf.y0 + h/2 + (showChange ? -2 : 4)} textAnchor="middle" fill={txt(ch)} fontSize={fontSize} fontWeight={800} style={{ pointerEvents: "none" }}>
                    {w < 40 ? leaf.data.name.substring(0, 2) : leaf.data.name.substring(0, Math.floor(w/8))}
                  </text>
                )}
                {showChange && (
                  <text x={leaf.x0 + w/2} y={leaf.y0 + h/2 + fontSize + 2} textAnchor="middle" fill={txt(ch, 0.7)} fontSize={fontSize * 0.8} fontWeight={600} fontFamily="monospace" style={{ pointerEvents: "none" }}>
                    {(ch > 0 ? "+" : "") + ch.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {dd && !tip && <DD node={dd} x={ddP.x} y={ddP.y} cR={dims} />}
        <Tip d={tip} x={mouse.x} y={mouse.y} cR={dims} />
      </div>

      <div style={{ padding: "6px 12px", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(() => {
            const up = leaves.filter(l => l.data.change > 0.3).length, dn = leaves.filter(l => l.data.change < -0.3).length, fl = leaves.length - up - dn;
            return (
              <>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}><TrendingUp size={12} color="#ff5050" /><span style={{ fontSize: 10, color: "#ff6b6b", fontWeight: 700 }}>{up}</span></div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}><TrendingDown size={12} color="#4488ff" /><span style={{ fontSize: 10, color: "#70aaff", fontWeight: 700 }}>{dn}</span></div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}><Minus size={12} color="#888" /><span style={{ fontSize: 10, color: "#aaa", fontWeight: 700 }}>{fl}</span></div>
              </>
            );
          })()}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{lastUpdated.split(" ")[1]} 갱신</span>
          <button onClick={fetchData} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}><RefreshCcw size={12} /></button>
        </div>
      </div>
    </div>
  );
}

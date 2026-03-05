"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { RefreshCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

const SH = 15,
  MH = 12;

// ═══════ COMPONENTS ═══════
const DD = ({ node, x, y, cR }) => {
  if (!node) return null;
  const lvs = (node.leaves ? node.leaves() : [])
    .sort((a, b) => b.data.cap - a.data.cap)
    .slice(0, 8);
  const av = avg(node);
  let l = x,
    t = y + 2;
  const w = 260,
    h = 30 + lvs.length * 22 + 4;
  if (cR) {
    if (l + w > cR.w) l = cR.w - w - 4;
    if (t + h > cR.h) t = y - h - 2;
    if (l < 2) l = 2;
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
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{node.data.name}</span>
        <span
          style={{
            color: av > 0 ? "#ff6b6b" : av < 0 ? "#70aaff" : "#888",
            fontSize: 11,
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
                fontSize: 10,
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
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontFamily: "monospace",
                marginRight: 8,
              }}
            >
              {l.data.cap >= 1e6
                ? `${(l.data.cap / 1e6).toFixed(1)}조`
                : `${(l.data.cap / 1e3).toFixed(0)}억`}
            </span>
            <span
              style={{
                color: ch > 0 ? "#ff6b6b" : ch < 0 ? "#70aaff" : "#888",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "monospace",
                width: 52,
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
  let l = x + 14,
    t = y + 14;
  if (cR) {
    if (l + 240 > cR.w) l = x - 250;
    if (t + 150 > cR.h) t = y - 155;
    if (l < 2) l = 2;
    if (t < 2) t = 2;
  }
  const ch = d.data.change,
    a = Math.abs(ch);
  const cap =
    d.data.cap >= 1e6 ? `${(d.data.cap / 1e6).toFixed(1)}조` : `${(d.data.cap / 1e3).toFixed(0)}억`;
  const mid = d.parent?.data?.name || "",
    sec = d.parent?.parent?.data?.name || "",
    ind = d.data.industry || "";
  return (
    <div
      style={{
        position: "absolute",
        left: l,
        top: t,
        background: "rgba(6,6,12,0.97)",
        border: `1px solid ${
          ch > 0 ? "rgba(255,70,70,0.25)" : ch < 0 ? "rgba(70,130,255,0.25)" : "rgba(255,255,255,0.06)"
        }`,
        borderRadius: 8,
        padding: "10px 14px",
        pointerEvents: "none",
        zIndex: 3000,
        minWidth: 220,
        backdropFilter: "blur(14px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{d.data.name}</div>
          <div
            style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2, fontFamily: "monospace" }}
          >
            {d.data.ticker}
          </div>
        </div>
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 5,
            background:
              ch > 0 ? "rgba(255,40,60,0.15)" : ch < 0 ? "rgba(40,80,255,0.15)" : "rgba(255,255,255,0.06)",
            color: ch > 0 ? (a > 10 ? "#ff6eaa" : "#ff5555") : a > 10 ? "#60ddff" : "#5090ff",
            fontSize: 14,
            fontWeight: 900,
            fontFamily: "monospace",
          }}
        >
          {ch > 0 ? "▲" : ch < 0 ? "▼" : "−"} {a.toFixed(2)}%
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 7,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          fontSize: 10.5,
        }}
      >
        {[
          ["시가총액", cap, true],
          ["대분류", sec],
          ["중분류", mid],
          ["소분류", ind],
        ].map(([k, v, mono]) => (
          <div key={k} style={{ display: "flex", justifySelf: "space-between", width: "100%" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", flex: 1 }}>{k}</span>
            <span
              style={{
                color: mono ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: mono ? 700 : 600,
                fontFamily: mono ? "monospace" : "inherit",
                textAlign: "right",
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Legend = () => {
  const v = [-29, -15, -10, -5, -3, -1, 0, 1, 3, 5, 10, 15, 29];
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 8, color: "#60ddff", marginRight: 5, fontWeight: 800 }}>하락</span>
      {v.map((val, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 22,
              height: 11,
              background: gc(val),
              borderRadius: i === 0 ? "4px 0 0 4px" : i === v.length - 1 ? "0 4px 4px 0" : 0,
              borderRight: i < v.length - 1 ? "1px solid rgba(0,0,0,0.5)" : "none",
              boxShadow:
                Math.abs(val) >= 10
                  ? `inset 0 0 6px ${val > 0 ? "rgba(255,110,170,0.3)" : "rgba(80,200,255,0.3)"}`
                  : "none",
            }}
          />
          <span
            style={{
              fontSize: 6.5,
              color: "rgba(255,255,255,0.25)",
              marginTop: 2,
              fontFamily: "monospace",
            }}
          >
            {val > 0 ? "+" : ""}
            {val}%
          </span>
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
  const [dims, setDims] = useState({ w: 1100, h: 650 });
  const [tip, setTip] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(null);
  const [sec, setSec] = useState(null);
  const [dd, setDd] = useState(null);
  const [ddP, setDdP] = useState({ x: 0, y: 0 });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/krx_heatmap_data.json?t=" + Date.now());
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
    const timer = setInterval(fetchData, 180000); // 3 minutes
    return () => clearInterval(timer);
  }, [fetchData]);

  useEffect(() => {
    const fn = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        setDims({ w: r.width, h: Math.max(380, r.height) });
      }
    };
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const { leaves, secN, midN } = useMemo(() => {
    if (!data) return { leaves: [], secN: [], midN: [] };

    const filteredData = sec
      ? { ...data, children: data.children.filter((s) => s.name === sec) }
      : data;

    const h = d3
      .hierarchy(filteredData)
      .sum((d) => d.cap || 0)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([dims.w, dims.h])
      .paddingOuter(1)
      .paddingTop(SH)
      .paddingInner(1)
      .round(true)
      .tile(d3.treemapSquarify.ratio(1.1))(h);

    const secN = [],
      midN = [];
    h.children?.forEach((s) => {
      secN.push(s);
      s.children?.forEach((m) => {
        midN.push(m);
        const diff = SH - MH;
        if (diff <= 0 || !m.children) return;
        const stockTop = m.y0 + SH;
        const stockBot = m.y1;
        const oldH = stockBot - stockTop;
        const newTop = m.y0 + MH;
        const newH = stockBot - newTop;
        if (oldH <= 0 || newH <= 0) return;
        const scale = newH / oldH;
        m.children.forEach((stock) => {
          const relY0 = stock.y0 - stockTop;
          const relY1 = stock.y1 - stockTop;
          stock.y0 = newTop + relY0 * scale;
          stock.y1 = newTop + relY1 * scale;
        });
      });
    });
    return { leaves: h.leaves(), secN, midN };
  }, [data, dims, sec]);

  const onM = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "#0a0a0e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.2)",
        }}
      >
        <RefreshCcw className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0a0a0e",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>KRX</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(255,255,255,0.18)",
                letterSpacing: "1.5px",
              }}
            >
              WICS MAP
            </span>
          </div>
          <div style={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[null, ...data.children.map((c) => c.name)].map((s) => (
              <button
                key={s || "a"}
                onClick={() => setSec(sec === s ? null : s)}
                style={{
                  padding: "2px 7px",
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 3,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: (s === null ? !sec : sec === s) ? "rgba(255,255,255,0.1)" : "transparent",
                  color: (s === null ? !sec : sec === s) ? "#fff" : "rgba(255,255,255,0.25)",
                  border:
                    (s === null ? !sec : sec === s)
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid transparent",
                }}
              >
                {s || "전체"}
              </button>
            ))}
          </div>
        </div>
        <Legend />
      </div>

      <div
        ref={ref}
        onMouseMove={onM}
        onMouseLeave={() => {
          setTip(null);
          setHov(null);
          setDd(null);
        }}
        style={{ flex: 1, position: "relative", margin: 2, overflow: "hidden" }}
      >
        <svg width={dims.w} height={dims.h} style={{ display: "block" }}>
          {/* Sectors (대분류) */}
          {secN.map((s, i) => {
            const av = avg(s),
              w = s.x1 - s.x0,
              h = s.y1 - s.y0,
              sp = w > 80;
            const mc = Math.floor((w - (sp ? 55 : 6)) / 5.5);
            const lb = s.data.name.length > mc && mc > 2 ? s.data.name.substring(0, mc) + "…" : s.data.name;
            return (
              <g
                key={`s${i}`}
                onMouseEnter={() => {
                  setDd(s);
                  setDdP({ x: s.x0, y: s.y0 + SH });
                }}
                onMouseLeave={() => setDd(null)}
              >
                <rect x={s.x0} y={s.y0} width={w} height={h} fill={gcD(av, 0.15)} stroke={gcD(av, 0.4)} strokeWidth={1} rx={2} />
                <rect x={s.x0} y={s.y0} width={w} height={SH} fill={gcD(av, 0.45)} rx={2} />
                <text
                  x={s.x0 + 5}
                  y={s.y0 + SH - 3.5}
                  fill="rgba(255,255,255,0.92)"
                  fontSize={10}
                  fontWeight={800}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {lb}
                </text>
                {sp && (
                  <text
                    x={s.x1 - 5}
                    y={s.y0 + SH - 3.5}
                    fill={
                      av > 0
                        ? "rgba(255,140,140,0.95)"
                        : av < 0
                        ? "rgba(140,175,255,0.95)"
                        : "rgba(255,255,255,0.4)"
                    }
                    fontSize={9}
                    fontWeight={700}
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {av > 0 ? "+" : ""}
                    {av.toFixed(2)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Mid groups (중분류) */}
          {midN.map((m, i) => {
            const w = m.x1 - m.x0,
              h = m.y1 - m.y0;
            if (w < 20 || h < MH + 4) return null;
            const av = avg(m),
              sp = w > 60;
            const mc = Math.floor((w - (sp ? 45 : 6)) / 4.8);
            const lb = m.data.name.length > mc && mc > 2 ? m.data.name.substring(0, mc) + "…" : m.data.name;
            return (
              <g
                key={`m${i}`}
                onMouseEnter={() => {
                  setDd(m);
                  setDdP({ x: m.x0, y: m.y0 + MH });
                }}
                onMouseLeave={() => setDd(null)}
              >
                <rect
                  x={m.x0}
                  y={m.y0}
                  width={w}
                  height={h}
                  fill="transparent"
                  stroke={gcD(av, 0.3)}
                  strokeWidth={0.5}
                  rx={1}
                />
                <rect x={m.x0} y={m.y0} width={w} height={MH} fill={gcD(av, 0.3)} rx={1} />
                <text x={m.x0 + 3} y={m.y0 + MH - 2.5} fill="rgba(255,255,255,0.52)" fontSize={8} fontWeight={700}>
                  {lb}
                </text>
                {sp && (
                  <text
                    x={m.x1 - 3}
                    y={m.y0 + MH - 2.5}
                    fill={
                      av > 0
                        ? "rgba(255,140,140,0.5)"
                        : av < 0
                        ? "rgba(140,175,255,0.5)"
                        : "rgba(255,255,255,0.2)"
                    }
                    fontSize={7.5}
                    fontWeight={600}
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {av > 0 ? "+" : ""}
                    {av.toFixed(2)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Stocks */}
          {leaves.map((leaf, i) => {
            const w = leaf.x1 - leaf.x0,
              h = leaf.y1 - leaf.y0;
            if (w < 1 || h < 1) return null;
            const ch = leaf.data.change,
              isH = hov === i,
              show = w > 24 && h > 14,
              showC = w > 32 && h > 26;
            const fs = Math.max(6.5, Math.min(14, Math.sqrt(w * h) / 6.5));
            const nFs = Math.min(fs, w / (leaf.data.name.length * 0.68));
            const cFs = Math.max(6, fs - 1.5);
            return (
              <g
                key={`t${i}`}
                onMouseEnter={() => {
                  setHov(i);
                  setTip(leaf);
                  setDd(null);
                }}
                onMouseLeave={() => {
                  setHov(null);
                  setTip(null);
                }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={leaf.x0}
                  y={leaf.y0}
                  width={w}
                  height={h}
                  fill={gc(ch)}
                  stroke={isH ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.25)"}
                  strokeWidth={isH ? 1.5 : 0.3}
                  rx={1}
                  style={{
                    transition: "stroke 0.05s",
                    filter: isH ? `brightness(1.35) saturate(1.3) ${glw(ch)}` : glw(ch),
                  }}
                />
                {show && (
                  <text
                    x={leaf.x0 + w / 2}
                    y={leaf.y0 + h / 2 + (showC ? -0.5 : 2)}
                    textAnchor="middle"
                    fill={txt(ch)}
                    fontSize={nFs}
                    fontWeight={800}
                    style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                  >
                    {leaf.data.name.length > (w / nFs) * 1.5
                      ? leaf.data.name.substring(0, Math.floor((w / nFs) * 1.3)) + "…"
                      : leaf.data.name}
                  </text>
                )}
                {showC && (
                  <text
                    x={leaf.x0 + w / 2}
                    y={leaf.y0 + h / 2 + cFs + 1}
                    textAnchor="middle"
                    fill={txt(ch, 0.6)}
                    fontSize={cFs}
                    fontWeight={600}
                    fontFamily="monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {ch > 0 ? "+" : ""}
                    {ch.toFixed(2)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {dd && !tip && <DD node={dd} x={ddP.x} y={ddP.y} cR={dims} />}
        <Tip d={tip} x={mouse.x} y={mouse.y} cR={dims} />
      </div>

      <div
        style={{
          padding: "4px 12px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {(() => {
            const up = leaves.filter((l) => l.data.change > 0.3).length,
              dn = leaves.filter((l) => l.data.change < -0.3).length,
              fl = leaves.length - up - dn,
              totalCap = leaves.reduce((s, l) => s + (l.data.cap || 0), 0),
              av = totalCap
                ? leaves.reduce((s, l) => s + l.data.change * (l.data.cap || 0), 0) / totalCap
                : 0;
            return (
              <>
                {[
                  ["상승", up, "#ff5050", "#ff6b6b", TrendingUp],
                  ["하락", dn, "#4488ff", "#70aaff", TrendingDown],
                  ["보합", fl, "#555", "#888", Minus],
                ].map(([lb, n, dot, col, Icon]) => (
                  <div key={lb} style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    <Icon size={12} color={dot} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      {lb} <span style={{ color: col, fontWeight: 700 }}>{n}</span>
                    </span>
                  </div>
                ))}
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.12)",
                    borderLeft: "1px solid rgba(255,255,255,0.05)",
                    paddingLeft: 8,
                    fontFamily: "monospace",
                  }}
                >
                  지수평균{" "}
                  <span style={{ color: av >= 0 ? "#ff6b6b" : "#70aaff", fontWeight: 700 }}>
                    {av >= 0 ? "+" : ""}
                    {av.toFixed(2)}%
                  </span>
                </span>
              </>
            );
          })()}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.13)", fontFamily: "monospace" }}>
            {leaves.length}종목
          </span>
          <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.1)" }}>WICS 3단계 • 시가총액 비례</span>
          <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.1)", fontFamily: "monospace" }}>
            {lastUpdated}
          </span>
          <button
            onClick={fetchData}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.2)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
            title="새로고침"
          >
            <RefreshCcw size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

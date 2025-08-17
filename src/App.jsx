// 10회독 스티커 트래커 (애플 감성 · 핑크+라벤더 · 안정화 v17)
// - 목표 회독 수 조절(±/입력) 확실히 동작
// - 좌측 보드 탭, 슬롯 클릭 스티커, 클릭 지점 물리 컨페티(108개)
// - 로컬 저장 v17, 간단 테스트(?test=1)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== Constants =====
const STICKERS = [
  "🐥","🍓","🐰","🌸","🐻","🍑","🌈","🦄","⭐","🍀",
  "🐶","🐱","🍭","💖","🧸","🧁","🍒","🫧","🦋","✨"
];
const PRAISES = [
  "최고야!","대박!","완전 멋져!","집중력 만렙!","꾸준함 장인!",
  "한 칸 더 채웠다!","오늘도 승리!","성장 중✨","너무 잘했어!","브라보!"
];
const STORAGE_KEY = "stickerStudy@v2";
const CARD_CLASS =
  "rounded-3xl shadow-xl backdrop-blur-md bg-white/80 border border-pink-100 ring-1 ring-violet-100";

// ===== Utils =====
function cryptoRandomId() {
  try {
    const g = globalThis.crypto || window.crypto;
    if (g?.getRandomValues) {
      const buf = new Uint32Array(3);
      g.getRandomValues(buf);
      return (
        buf[0].toString(36) +
        buf[1].toString(36) +
        buf[2].toString(36) +
        (Date.now() >>> 0).toString(36)
      );
    }
  } catch {}
  return Math.random().toString(36).slice(2) + (Date.now() >>> 0).toString(36);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function calcProgress(done, total) { return !total ? 0 : clamp(Math.round((Math.max(0, done) / total) * 100), 0, 100); }
function applyUndo(seq) { return Array.isArray(seq) && seq.length ? seq.slice(0, -1) : Array.isArray(seq) ? seq : []; }
function makeDefaultBoard() { return { id: cryptoRandomId(), title: "나의 10회독 챌린지", total: 10, sequence: [] }; }

// 물리 컨페티 초기화
function makeConfettiBurst(count, baseX, baseY) {
  const SPEED_MIN = 280; // px/s
  const SPEED_MAX = 620; // px/s
  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2; // 전방위
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    return {
      id: `${Date.now()}-${i}`,
      emoji: STICKERS[Math.floor(Math.random() * STICKERS.length)],
      x: baseX, y: baseY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: 0,
      vr: Math.random() * 720 - 360, // deg/s
      scale: 0.6 + Math.random() * 0.9,
      life: 2.4, // sec
      opacity: 1,
    };
  });
}

// ===== Dev tests =====
function runDevTests() {
  try {
    console.log("[StickerTracker] tests start");
    console.assert(calcProgress(0, 10) === 0, "0% ok");
    console.assert(calcProgress(3, 10) === 30, "30% ok");
    console.assert(calcProgress(12, 10) === 100, ">100 clamp ok");
    const ids = new Set(Array.from({ length: 100 }).map(cryptoRandomId));
    console.assert(ids.size > 95, "id uniqueness ok");
    console.assert(JSON.stringify(applyUndo([1,2,3])) === JSON.stringify([1,2]), "undo ok");
    const c = makeConfettiBurst(108, 100, 100);
    console.assert(c.length === 108 && c[0].x === 100, "confetti gen ok");
    console.log("[StickerTracker] tests OK ✅");
  } catch (e) {
    console.error("[StickerTracker] tests FAILED ❌", e);
  }
}

// ===== Main Component =====
export default function StickerStudyTracker() {
  const [boards, setBoards] = useState([makeDefaultBoard()]);
  const [activeId, setActiveId] = useState(() => boards[0].id);
  const [praise, setPraise] = useState("");
  const [burst, setBurst] = useState([]);
  const addBtnRef = useRef(null);

  // 복원
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.v17?.boards?.length) {
        setBoards(saved.v17.boards);
        setActiveId(saved.v17.activeId ?? saved.v17.boards[0].id);
      } else if (saved?.v16?.boards?.length) {
        setBoards(saved.v16.boards);
        setActiveId(saved.v16.activeId ?? saved.v16.boards[0].id);
      }
    } catch {}
    if (typeof window !== "undefined" && window.location.search.includes("test=1")) runDevTests();
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ v17: { boards, activeId } })); } catch {}
  }, [boards, activeId]);

  const board = boards.find((b) => b.id === activeId) ?? boards[0];
  const completed = board?.sequence.length || 0;
  const total = board?.total || 10;
  const progress = calcProgress(completed, total);
  const canAdd = completed < total;

  // 총 회독 수 안전 변경(1~50, 줄이면 초과 스티커 잘라내기)
  const setTotalSafe = (t) => {
    const next = clamp(parseInt(t, 10) || 1, 1, 100);
    setBoards((prev) => prev.map((b) => (
      b.id === board.id ? { ...b, total: next, sequence: (b.sequence || []).slice(0, next) } : b
    )));
  };

  // 액션들
  const updateBoard = (patch) => setBoards((prev) => prev.map((b) => (b.id === board.id ? { ...b, ...patch } : b)));
  const addBoard = () => { const nb = makeDefaultBoard(); setBoards((prev) => [nb, ...prev]); setActiveId(nb.id); };
  const deleteBoard = () => {
    if (!board) return;
    if (confirm("현재 보드를 삭제할까요? 기록도 함께 지워져요.")) {
      setBoards((prev) => {
        const next = prev.filter((b) => b.id !== board.id);
        if (next.length === 0) { const nb = makeDefaultBoard(); setActiveId(nb.id); return [nb]; }
        setActiveId(next[0].id);
        return next;
      });
    }
  };

  const addSticker = (x = null, y = null) => {
    if (!canAdd || !board) return;
    const next = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    setBoards((prev) => prev.map((b) => (b.id === board.id ? { ...b, sequence: [...b.sequence, next] } : b)));
    setPraise(PRAISES[Math.floor(Math.random() * PRAISES.length)]);

    if (x == null || y == null) {
      const btn = addBtnRef.current;
      if (btn) { const r = btn.getBoundingClientRect(); x = r.left + r.width/2; y = r.top + r.height/2; }
      else { x = window.innerWidth/2; y = window.innerHeight/3; }
    }
    setBurst(makeConfettiBurst(108, x, y));
    setTimeout(() => setBurst([]), 2600);
  };
  const addStickerAtSlot = (slotEl) => { if (!slotEl || !canAdd || !board) return; const r = slotEl.getBoundingClientRect(); addSticker(r.left + r.width/2, r.top + r.height/2); };
  const undo = () => updateBoard({ sequence: applyUndo(board.sequence) });
  const reset = () => updateBoard({ sequence: [] });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-fuchsia-50 to-violet-50 text-slate-800">
      <BackgroundDeco />
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
        {/* 헤더 */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500">10회독 스티커 트래커</h1>
          <p className="text-sm md:text-base text-slate-500">한 번 완료할 때마다 스티커를 ‘딱!’ 붙여요. 꾸준함이 곧 실력!</p>
        </motion.header>

        <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-3">
          {/* 좌측 보드 탭 */}
          <aside className="w-full md:w-[240px] flex flex-col gap-3 md:items-stretch items-center">
            <div className={`${CARD_CLASS} p-3 w-full`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold">내 보드</h3>
                <button onClick={addBoard} className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-sm text-pink-600 hover:bg-pink-100">+ 새 보드</button>
              </div>
              <div className="flex flex-col gap-1">
                {boards.map((b) => (
                  <button key={b.id} onClick={() => setActiveId(b.id)} className={`flex items-center justify-between rounded-2xl px-3 py-2 text-left transition ${b.id === activeId ? "bg-white shadow border border-pink-200" : "hover:bg-white/70 border border-transparent"}`}>
                    <span className="truncate">{b.title}</span>
                    <span className="text-xs text-slate-500">{b.sequence.length}/{b.total}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 우측: 메인 카드 */}
          <main className="flex-1 flex flex-col items-center md:items-start max-w-3xl w-full">
            <motion.section className={`${CARD_CLASS} w-full p-4 md:p-6 mb-6`}>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm text-slate-600">책 제목</label>
                  <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:ring-4 focus:ring-pink-100" value={board.title} onChange={(e) => updateBoard({ title: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">목표 회독</label>
                  <div className="mt-1 flex items-center gap-2">
                    <button onClick={() => setTotalSafe(total-1)} className="h-12 w-12 rounded-2xl border border-slate-200 bg-white text-xl" aria-label="감소">−</button>
                    <input type="number" min={1} max={100} value={total} onChange={(e)=>setTotalSafe(e.target.value)} className="h-12 w-20 rounded-2xl border border-slate-200 bg-white text-center text-xl font-bold" />
                    <button onClick={() => setTotalSafe(total+1)} className="h-12 w-12 rounded-2xl border border-slate-200 bg-white text-xl" aria-label="증가">＋</button>
                  </div>
                </div>
              </div>
              {/* 진행 바 */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600"><span>진도: <b>{completed}</b> / {total}</span><span>{progress}%</span></div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className="h-full bg-gradient-to-r from-pink-400 to-violet-400" /></div>
              </div>
              {/* 액션 */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <motion.button ref={addBtnRef} whileTap={{ scale: 0.98 }} onClick={() => addSticker()} disabled={!canAdd} className={`rounded-full px-6 py-3 text-base font-semibold shadow-sm ${canAdd ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white" : "bg-slate-200 text-slate-500"}`}>{canAdd ? "이번 회독 완료! 스티커 붙이기" : "모두 채웠어요 🎉"}</motion.button>
                <button onClick={undo} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-base">되돌리기</button>
                <button onClick={reset} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-base">리셋</button>
                <button onClick={deleteBoard} className="ml-auto rounded-full border border-pink-200 bg-pink-50 px-5 py-3 text-base text-pink-600">보드 삭제</button>
              </div>
              <AnimatePresence>
                {praise && (
                  <motion.div key={praise} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                    <span>💬</span><span>{praise}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* 스티커 보드 */}
            <motion.section className={`${CARD_CLASS} w-full p-4 md:p-6`}>
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg md:text-xl font-bold">{board.title}</h2><span className="text-sm text-slate-500">스티커 보드</span></div>
              <div className="grid grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: total }).map((_, idx) => (
                  <StickerSlot key={idx} index={idx} filled={idx < completed} emoji={board.sequence[idx]} clickable={canAdd && idx === completed} onAddAt={(el)=>addStickerAtSlot(el)} />
                ))}
              </div>
            </motion.section>
          </main>
        </div>
      </div>
      <ConfettiPhysicsLayer particles={burst} />
    </div>
  );
}

// ===== Sub Components =====
function StickerSlot({ index, filled, emoji, clickable, onAddAt }) {
  const ref = useRef(null);
  const handle = () => { if (!clickable || !ref.current) return; onAddAt(ref.current); };
  return (
    <motion.div ref={ref} onClick={handle} className={`relative aspect-square select-none ${clickable?"cursor-pointer":""}`}>
      <div className={`flex h-full w-full items-center justify-center rounded-3xl border ${filled?"border-pink-200 bg-white shadow-inner":clickable?"border-pink-300 bg-white":"border-dashed border-violet-200 bg-white/70"}`}>
        {filled ? (
          <motion.span initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}} className="text-3xl md:text-4xl">{emoji}</motion.span>
        ) : (
          <span className={clickable?"text-pink-400":"text-violet-300"}>＋</span>
        )}
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">{index+1}</span>
    </motion.div>
  );
}

function BackgroundDeco() {
  const dots = useMemo(()=>Array.from({length:18}).map((_,i)=>({id:i,size:6+Math.random()*10,top:Math.random()*100,left:Math.random()*100})),[]);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {dots.map(d => (
        <motion.span key={d.id} animate={{y:[0,-6,0]}} transition={{duration:6,repeat:Infinity}} className="absolute rounded-full bg-white/60" style={{top:`${d.top}%`,left:`${d.left}%`,width:d.size,height:d.size}} />
      ))}
    </div>
  );
}

function ConfettiPhysicsLayer({ particles }) {
  const [ps,setPs]=useState([]);
  const rafRef=useRef(null);

  useEffect(()=>{ 
    if(!particles||particles.length===0){
      setPs([]); 
      if(rafRef.current) cancelAnimationFrame(rafRef.current); 
      return;
    } 
    setPs(particles.map(p=>({...p})));
  },[particles]);

  useEffect(()=>{
    if(ps.length===0) return;
    const G=900; // gravity px/s^2
    const DRAG=0.985; // velocity damping
    let last = performance.now ? performance.now() : Date.now();

    const step=(now)=>{
      const dt=Math.min(0.033,(now-last)/1000); last=now;
      setPs(prev=>{
        const next = prev.map(p=>{
          const vx = p.vx * DRAG;
          const vy = p.vy * DRAG + G*dt;
          const x = p.x + vx*dt;
          const y = p.y + vy*dt;
          const rot = p.rot + p.vr*dt;
          const lifeLeft = Math.max(0, p.life - dt);
          const opacity = lifeLeft / p.life;
          return { ...p, x, y, vx, vy, rot, life: lifeLeft, opacity };
        }).filter(p=>p.opacity>0);
        if(next.length===0 && rafRef.current) cancelAnimationFrame(rafRef.current);
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[ps.length]);

  if(ps.length===0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {ps.map(b => (
        <div key={b.id} className="absolute will-change-transform" style={{transform:`translate(${b.x}px, ${b.y}px) rotate(${b.rot}deg)`,opacity:b.opacity}}>
          <span className="text-2xl md:text-3xl" style={{display:'inline-block',transform:`scale(${b.scale})`}}>{b.emoji}</span>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Bookmark, HelpCircle, Menu, MoreHorizontal, Pause, PenLine, Search, Shield, Trash2, Undo2, Redo2, StickyNote, Plus, Grid3X3 } from 'lucide-react';
import { steps } from './data/steps';
import { handleWords } from './data/handleWords';
import { palettes } from './data/palettes';
import { createSession, getSessions, saveSession } from './db/sessionRepo';
import type { Session } from './db/schema';

type Tool = 'pen'|'marker'|'pencil'|'pastel'|'crayon'|'crepas'|'watercolor'|'oil'|'spray'|'smudge'|'kneaded'|'eraser';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [session,setSession] = useState<Session|null>(null);
  const [stepIndex,setStepIndex] = useState(0);
  const [tool,setTool] = useState<Tool>('pen');
  const [color,setColor] = useState(palettes[0].colors[0]);
  const [size,setSize] = useState(8);
  const [phraseOpen,setPhraseOpen] = useState(true);
  const [wordOpen,setWordOpen] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [journalOpen,setJournalOpen] = useState(false);
  const [helpOpen,setHelpOpen] = useState(false);
  const [confirmOpen,setConfirmOpen] = useState(false);
  const [onboarding,setOnboarding] = useState(() => localStorage.getItem('onboardingDone') !== 'true');
  const [sessions,setSessions] = useState<Session[]>([]);
  const [bg,setBg] = useState('plain');
  const drawing = useRef(false);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  useEffect(() => { createSession().then(setSession); navigator.storage?.persist?.(); }, []);
  useEffect(() => { if (session) saveSession({ ...session, currentStepId: steps[stepIndex].id, bgType:bg }); }, [session,stepIndex,bg]);

  const pushHistory = () => {
    const canvas=canvasRef.current; if(!canvas)return;
    undoStack.current.push(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height));
  };
  const resizeCanvas = () => {
    const canvas=canvasRef.current; if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const snapshot=canvas.width ? canvas.toDataURL() : null;
    canvas.width=rect.width*devicePixelRatio; canvas.height=rect.height*devicePixelRatio;
    const ctx=canvas.getContext('2d')!;
    ctx.scale(devicePixelRatio,devicePixelRatio);
    ctx.fillStyle='#FAF6EC'; ctx.fillRect(0,0,rect.width,rect.height);
    if(snapshot){ const img=new Image(); img.onload=()=>ctx.drawImage(img,0,0,rect.width,rect.height); img.src=snapshot; }
  };
  useEffect(()=>{ resizeCanvas(); window.addEventListener('resize',resizeCanvas); return()=>window.removeEventListener('resize',resizeCanvas); },[]);
  useEffect(()=>{ resizeCanvas(); },[stepIndex]);

  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if(e.pointerType==='touch') return;
    const canvas=canvasRef.current; const ctx=canvas?.getContext('2d'); if(!canvas||!ctx)return;
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-(rect as DOMRect).left, y=e.clientY-(rect as DOMRect).top;
    if(e.type==='pointerdown'){ pushHistory(); drawing.current=true; canvas.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(x,y); }
    if(e.type==='pointermove'&&drawing.current){
      ctx.globalCompositeOperation=tool==='eraser'||tool==='kneaded'?'destination-out':'source-over';
      ctx.globalAlpha=tool==='marker'||tool==='watercolor'||tool==='pastel'?0.22:tool==='eraser'?1:0.82;
      ctx.strokeStyle=tool==='eraser'||tool==='kneaded'?'rgba(0,0,0,1)':color;
      ctx.lineWidth=size*(tool==='pencil'?0.65:tool==='crayon'?1.5:e.pressure ? 0.7+e.pressure*0.8:1);
      ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.lineTo(x,y); ctx.stroke();
    }
    if(e.type==='pointerup'||e.type==='pointercancel'){drawing.current=false; redoStack.current=[];}
  };

  const undo=()=>{const canvas=canvasRef.current;const ctx=canvas?.getContext('2d');const data=undoStack.current.pop();if(canvas&&ctx&&data){redoStack.current.push(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(data,0,0);} };
  const redo=()=>{const canvas=canvasRef.current;const ctx=canvas?.getContext('2d');const data=redoStack.current.pop();if(canvas&&ctx&&data){undoStack.current.push(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(data,0,0);} };
  const clear=()=>{const canvas=canvasRef.current;const ctx=canvas?.getContext('2d');if(canvas&&ctx){pushHistory();ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#FAF6EC';ctx.fillRect(0,0,canvas.width,canvas.height);}setConfirmOpen(false)};
  const openJournal=async()=>{setSessions(await getSessions());setJournalOpen(true);setMenuOpen(false)};
  const goStep=(i:number)=>setStepIndex(Math.max(0,Math.min(steps.length-1,i)));

  const tools: [Tool,string][]=[['pen','ペン'],['marker','蛍光ペン'],['pencil','色鉛筆'],['pastel','パステル'],['crayon','クレヨン'],['crepas','クレパス'],['watercolor','水彩'],['oil','油彩'],['spray','スプレー'],['smudge','ぼかし'],['kneaded','練り消し'],['eraser','消しゴム']];

  return (
    <main className="app">
      {onboarding && <section className="modal onboarding" role="dialog" aria-modal="true">
        <button className="skip" onClick={()=>{localStorage.setItem('onboardingDone','true');setOnboarding(false)}}>スキップ</button>
        <div className="onboard-card"><div className="breath">◉</div><h1>座っているところに気づく</h1><p>椅子や床との接触面に、やさく注意を向けます。今の感じを、好きな色で置いてみましょう。</p><button onClick={()=>{localStorage.setItem('onboardingDone','true');setOnboarding(false)}}>はじめる</button></div>
      </section>}
      <header>
        <button className="icon" aria-label="メニュー" title="メニュー" onClick={()=>setMenuOpen(!menuOpen)}><Menu/></button>
        <button className="brand" onClick={()=>goStep(0)}>まもるノート</button>
        <div className="header-actions">
          <button className="icon" title="ブックマーク" aria-label="ブックマーク" onClick={()=>session&&setSession({...session,bookmarked:!session.bookmarked})}><Bookmark fill={session?.bookmarked?'#8C5A2B':'none'}/></button>
          <button className="icon" title="検索" aria-label="検索" onClick={()=>setJournalOpen(true)}><Search/></button>
          <button className="icon desktop" title="ヘルプ" aria-label="ヘルプ" onClick={()=>setHelpOpen(true)}><HelpCircle/></button>
        </div>
      </header>
      {menuOpen && <nav className="menu" aria-label="メインメニュー">
        <button onClick={()=>createSession().then(s=>{setSession(s);clear();setMenuOpen(false)})}><Plus/> 新規ノート</button>
        <button onClick={openJournal}><Pause/> ジャーナル</button>
        <button onClick={()=>setHelpOpen(true)}><HelpCircle/> ヘルプ</button>
        <button onClick={()=>setConfirmOpen(true)}><Trash2/> すべて消す</button>
      </nav>}
      <nav className="stepper" aria-label="ステップ">
        {steps.map((s,i)=><button key={s.id} className={i===stepIndex?'active':''} onClick={()=>goStep(i)} aria-current={i===stepIndex?'step':undefined}><span>{i+1}</span><b>{s.label}</b></button>)}
      </nav>
      <section className="guide">
        <button aria-label="問いかけを表示" onClick={()=>setPhraseOpen(!phraseOpen)}> {phraseOpen?'問いかけを閉じる':'問いかけを開く'} </button>
        {phraseOpen && <><p>{steps[stepIndex].guide}</p><div className="phrases">{steps[stepIndex].phrases.map(p=><button key={p} onClick={()=>setWordOpen(true)}>{p}</button>)}</div></>}
      </section>
      <section className="canvas-wrap">
        <canvas ref={canvasRef} className={`canvas bg-${bg}`} aria-label="描画キャンバス"
          onPointerDown={pointer} onPointerMove={pointer} onPointerUp={pointer} onPointerCancel={pointer}/>
        <div className="center-mark" aria-hidden="true">＋</div>
        <button className="word-button" onClick={()=>setWordOpen(!wordOpen)}><StickyNote/> 言葉のヒント</button>
      </section>
      {wordOpen && <aside className="word-panel" aria-label="言葉のヒント">
        <button className="close" onClick={()=>setWordOpen(false)}>閉じる</button>
        {Object.entries(handleWords).map(([category,words])=><div key={category}><h3>{category}</h3><div>{words.map(w=><button key={w} onClick={()=>{setWordOpen(false);setWordOpen(false)}}>{w}</button>)}</div></div>)}
      </aside>}
      <aside className="toolbar" aria-label="描画ツール">
        <div className="tool-row"><button title="取り消す" aria-label="取り消す" onClick={undo}><Undo2/></button><button title="やり直す" aria-label="やり直す" onClick={redo}><Redo2/></button><button title="背景" aria-label="背景" onClick={()=>setBg(bg==='plain'?'dots':bg==='dots'?'grid':'plain')}><Grid3X3/></button></div>
        <div className="tool-list">{tools.map(([id,label])=><button key={id} className={tool===id?'active':''} onClick={()=>setTool(id)} title={label}>{label}</button>)}</div>
        <label>太さ <input type="range" min="2" max="40" value={size} onChange={e=>setSize(+e.target.value)} aria-label="線の太さ"/></label>
        <div className="colors">{palettes.flatMap(p=>p.colors).map(c=><button key={c} aria-label={`色 ${c}`} title={`色 ${c}`} className={color===c?'active':''} style={{background:c}} onClick={()=>setColor(c)}/>)}</div>
      </aside>
      <div className="decision">{stepIndex===0&&<><span>気になることはたくさんありますか？</span><button onClick={()=>goStep(2)}>1つに絞れる</button><button onClick={()=>goStep(1)}>たくさんある</button></>}
        {stepIndex===4&&<><button onClick={()=>goStep(3)}>少し違う</button><button onClick={()=>goStep(5)}>ぴったりくる</button></>}
        {stepIndex===5&&<><button onClick={()=>goStep(3)}>さらに深めたい</button><button onClick={()=>goStep(6)}>ひと区切り</button></>}
      </div>
      {confirmOpen&&<div className="modal" role="dialog" aria-modal="true"><div className="confirm"><h2>キャンバスを消しますか？</h2><p>このキャンバスの描画だけを消します。</p><div><button onClick={()=>setConfirmOpen(false)}>やめる</button><button className="danger" onClick={clear}>消す</button></div></div></div>}
      {journalOpen&&<div className="overlay" role="dialog" aria-modal="true"><button className="close" onClick={()=>setJournalOpen(false)}>閉じる</button><h1>ジャーナル</h1>{sessions.length===0?<div className="empty"><p>まだセッションがありません。</p></div>:<div className="cards">{sessions.map(s=><button key={s.id} onClick={()=>{setSession(s);setStepIndex(steps.findIndex(x=>x.id===s.currentStepId));setJournalOpen(false)}}><b>{new Date(s.updatedAt).toLocaleDateString('ja-JP')}</b><span>{s.theme||'テーマはまだありません'}</span></button>)}</div>}</div>}
      {helpOpen&&<div className="overlay" role="dialog" aria-modal="true"><button className="close" onClick={()=>setHelpOpen(false)}>閉じる</button><h1>ヘルプ</h1><p>このアプリは治療やカウンセリングの代わりではありません。つらさが強いときは無理に続けず、信頼できる人や専門の相談窓口に相談してください。</p><h2>読み物</h2><p>「フェルトセンス」は、言葉になる前の、からだ全体の曖昧な感じを表す日常的な表現です。</p></div>}
    </main>
  );
}

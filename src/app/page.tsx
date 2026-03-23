'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
  const s = size === 'sm'
  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      <div style={{ width:s?18:22, height:s?18:22, border:'1px solid rgba(148,163,184,0.15)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', marginRight:7, flexShrink:0 }}>
        <svg width={s?10:12} height={s?10:12} fill="none" viewBox="0 0 48 48">
          <path d="M31 14H20C16.686 14 14 16.686 14 20V28C14 31.314 16.686 34 20 34H31" stroke="rgba(200,255,0,0.85)" strokeWidth="2.8" strokeLinecap="square"/>
          <path d="M31 19H22C20.343 19 19 20.343 19 22V26C19 27.657 20.343 29 22 29H31" stroke="rgba(200,255,0,0.35)" strokeWidth="2.2" strokeLinecap="square"/>
          <rect x="31" y="22.5" width="3" height="3" fill="#c8ff00" opacity="0.9"/>
        </svg>
      </div>
      <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:s?13:17, fontStyle:'italic', color:'rgba(148,163,184,0.9)', lineHeight:1 }}>C</span>
      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:s?12:16, fontWeight:700, color:'#fff', letterSpacing:'-0.7px', lineHeight:1 }}>oyva</span>
      <span style={{ fontSize:s?15:20, fontWeight:200, color:'#c8ff00', marginLeft:1, position:'relative', top:1 }}>.</span>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    let frame = 0
    const cols = 14, rows = 20
    const barData = Array.from({length:9}, (_,i) => ({ x:0.1+i*0.09, target:0.15+Math.random()*0.5, current:0, delay:i*15, col:i%2===0?'rgba(200,255,0,':'rgba(148,163,184,' }))
    const particles: {x:number;y:number;vx:number;vy:number;life:number;max:number;val:string;op:number}[] = []
    const nums = ['$84','$312','+$3,200','$287','$198','98%','$4,200','−$22','+$6,400','$143','28.7%','$67','−$50','$1,842']
    const spawnP = () => particles.push({x:Math.random(),y:0.6+Math.random()*0.4,vx:(Math.random()-0.5)*0.0003,vy:-0.0005-Math.random()*0.0003,life:0,max:160+Math.random()*100,val:nums[Math.floor(Math.random()*nums.length)],op:0})

    let animId: number
    const draw = () => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0,0,w,h)

      // Grid
      ctx.strokeStyle='rgba(200,255,0,0.022)'; ctx.lineWidth=1
      for(let c=0;c<=cols;c++){ctx.beginPath();ctx.moveTo(c*w/cols,0);ctx.lineTo(c*w/cols,h);ctx.stroke()}
      for(let r=0;r<=rows;r++){ctx.beginPath();ctx.moveTo(0,r*h/rows);ctx.lineTo(w,r*h/rows);ctx.stroke()}

      // Scan line
      const sy=(Math.sin(frame*0.007)*0.5+0.5)*rows*h/rows
      const sg=ctx.createLinearGradient(0,sy-6,0,sy+6)
      sg.addColorStop(0,'transparent');sg.addColorStop(0.5,'rgba(200,255,0,0.05)');sg.addColorStop(1,'transparent')
      ctx.fillStyle=sg;ctx.fillRect(0,sy-6,w,12)

      // Bars
      const bMaxH=h*0.32, bW=w*0.05
      barData.forEach(b=>{
        if(frame>b.delay) b.current=Math.min(b.current+b.target*0.013,b.target)
        const bh=b.current*bMaxH, bx=b.x*w, by=h*0.88
        const bg=ctx.createLinearGradient(bx,by-bh,bx,by)
        bg.addColorStop(0,`${b.col}0.12)`);bg.addColorStop(1,`${b.col}0.03)`)
        ctx.fillStyle=bg;ctx.fillRect(bx-bW/2,by-bh,bW,bh)
        ctx.strokeStyle=`${b.col}0.35)`;ctx.lineWidth=1
        ctx.beginPath();ctx.moveTo(bx-bW/2,by-bh);ctx.lineTo(bx+bW/2,by-bh);ctx.stroke()
      })

      // Trend line
      const ph=frame*0.01
      ctx.strokeStyle='rgba(200,255,0,0.1)';ctx.lineWidth=1.5;ctx.setLineDash([4,8])
      ctx.beginPath()
      for(let i=0;i<=24;i++){
        const px=i/24*w, py=h*0.62-(i/24)*h*0.2+Math.sin(i*0.7+ph)*h*0.035
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py)
      }
      ctx.stroke();ctx.setLineDash([])

      // Particles
      if(frame%55===0&&particles.length<14) spawnP()
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life++
        p.op=p.life<25?p.life/25:p.life>p.max-25?(p.max-p.life)/25:0.15
        ctx.fillStyle=`rgba(200,255,0,${p.op*0.55})`;ctx.font=`300 9px 'Geist Mono',monospace`;ctx.fillText(p.val,p.x*w,p.y*h)
        if(p.life>=p.max) particles.splice(i,1)
      }

      // Vignette
      const v=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*0.65)
      v.addColorStop(0,'transparent');v.addColorStop(1,'rgba(8,8,9,0.88)')
      ctx.fillStyle=v;ctx.fillRect(0,0,w,h)

      frame++;animId=requestAnimationFrame(draw)
    }
    draw()

    // Intersection observer
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return
        const el=entry.target as HTMLElement
        el.style.opacity='1';el.style.transform='translateY(0)'
        el.querySelectorAll('[data-stagger]').forEach((c,i)=>setTimeout(()=>{(c as HTMLElement).style.opacity='1';(c as HTMLElement).style.transform='translateY(0)'},i*80))
      })
    },{threshold:0.1,rootMargin:'0px 0px -50px 0px'})
    document.querySelectorAll('[data-reveal]').forEach(el=>observerRef.current?.observe(el))

    // Hero words on load
    const hw=document.querySelector('[data-word-hero]')
    if(hw) hw.querySelectorAll('.word').forEach((w,i)=>setTimeout(()=>{(w as HTMLElement).style.opacity='1';(w as HTMLElement).style.transform='translateY(0)'},280+i*55))

    // CTA words on scroll
    const wo=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return
        entry.target.querySelectorAll('.word').forEach((w,i)=>setTimeout(()=>{(w as HTMLElement).style.opacity='1';(w as HTMLElement).style.transform='translateY(0)'},i*65))
      })
    },{threshold:0.3})
    document.querySelectorAll('[data-word]').forEach(el=>wo.observe(el))

    const onScroll=()=>document.querySelectorAll('[data-parallax]').forEach(el=>{const speed=parseFloat((el as HTMLElement).dataset.parallax||'0.1');(el as HTMLElement).style.transform=`translateY(${window.scrollY*speed}px)`})
    window.addEventListener('scroll',onScroll,{passive:true})
    return()=>{cancelAnimationFrame(animId);observerRef.current?.disconnect();wo.disconnect();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',resize)}
  },[])

  const R={opacity:0,transform:'translateY(24px)',transition:'opacity 0.7s ease, transform 0.7s ease'} as React.CSSProperties
  const S={opacity:0,transform:'translateY(16px)',transition:'opacity 0.5s ease, transform 0.5s ease'} as React.CSSProperties
  const W={display:'inline-block',opacity:0,transform:'translateY(20px)',transition:'opacity 0.5s ease, transform 0.5s ease',marginRight:'0.22em'} as React.CSSProperties
  const mw=(text:string,extra?:React.CSSProperties)=>text.split(' ').map((w,i)=><span key={i} className="word" style={{...W,...extra}}>{w}</span>)

  const features=[
    {n:'/ 01',h:'Auto-categorisation',sub:'Instant, accurate, automatic',p:'Every transaction sorted the moment it lands. Groceries, dining, transport — labelled without lifting a finger. Powered by machine learning trained on millions of Australian transactions. No rules to set up, no categories to configure, ever.'},
    {n:'/ 02',h:'Budget alerts',sub:"Know before it's too late",p:"Set monthly spending limits per category. The second you're close to breaching one, Coyva tells you — not at the end of the month when the damage is done. Right now, in real time, while you can still do something about it."},
    {n:'/ 03',h:'Open Banking CDR',sub:'Bank-grade security, read-only',p:"Connect via Australia's Consumer Data Right framework — the same government-regulated system used by major institutions. Read-only access means we can see your transactions but can never touch your money. Disconnect from the app at any time, instantly."},
    {n:'/ 04',h:'Complete financial picture',sub:'Everything in one place',p:'Income, expenses, savings rate, remaining budget, 6-month cashflow trends — all of it in one clean dashboard, updated automatically as transactions arrive. No spreadsheets. No manual entry. No end-of-month surprises.'},
  ]

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@700;800&family=Geist:wght@200;300;400;500;600&family=Geist+Mono:wght@200;300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#080809;color:#fff;font-family:'Geist',sans-serif;overflow-x:hidden}
        @keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .nl{font-size:10px;color:rgba(255,255,255,0.27);background:none;border:none;cursor:pointer;font-family:'Geist',sans-serif;padding:4px 10px;transition:color 0.2s}
        .nl:hover{color:rgba(255,255,255,0.65)}
        .bp{font-size:11px;font-weight:500;color:#080809;background:#c8ff00;border:none;border-radius:5px;padding:7px 14px;cursor:pointer;font-family:'Geist',sans-serif;transition:opacity 0.15s}
        .bp:hover{opacity:0.85}
        .bplg{font-size:13px;font-weight:500;color:#080809;background:#c8ff00;border:none;border-radius:6px;padding:13px 24px;cursor:pointer;font-family:'Geist',sans-serif;transition:opacity 0.15s}
        .bplg:hover{opacity:0.85}
        .bglg{font-size:13px;color:rgba(255,255,255,0.35);background:none;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:13px 24px;cursor:pointer;font-family:'Geist',sans-serif;transition:all 0.2s}
        .bglg:hover{border-color:rgba(255,255,255,0.25);color:rgba(255,255,255,0.65)}
        .ticker-track{display:inline-flex;animation:tick 26s linear infinite}
        .fcard{background:rgba(11,12,16,0.94);border:1px solid rgba(255,255,255,0.09);border-radius:14px;animation:floatY 6s ease-in-out infinite;backdrop-filter:blur(12px)}
        .feat-item{border-top:1px solid rgba(255,255,255,0.06);padding:32px 0;transition:all 0.3s;position:relative}
        .feat-item::after{content:'';position:absolute;bottom:0;left:0;width:0;height:1px;background:#c8ff00;transition:width 0.5s ease}
        .feat-item:hover::after{width:100%}
        .feat-item:hover{border-color:rgba(255,255,255,0.1)}
        .feat-item-n{font-family:'Geist Mono',monospace;font-size:9px;color:rgba(200,255,0,0.3);margin-bottom:5px;transition:color 0.3s;letter-spacing:1px}
        .feat-item:hover .feat-item-n{color:rgba(200,255,0,0.7)}
        .feat-item-sub{font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:7px;font-weight:300;letter-spacing:0.2px;transition:color 0.3s}
        .feat-item:hover .feat-item-sub{color:rgba(255,255,255,0.4)}
        .feat-item-h{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.7px;color:rgba(255,255,255,0.7);margin-bottom:10px;transition:color 0.3s}
        .feat-item:hover .feat-item-h{color:#fff}
        .feat-item-p{font-size:12px;font-weight:300;color:rgba(255,255,255,0.22);line-height:1.85;max-width:580px;transition:color 0.3s}
        .feat-item:hover .feat-item-p{color:rgba(255,255,255,0.42)}
        .stat-cell{padding:22px 28px;border-right:1px solid rgba(255,255,255,0.05)}
        .stat-cell:last-child{border-right:none}
        .bank-pill{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:6px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);transition:border-color 0.2s}
        .bank-pill:hover{border-color:rgba(255,255,255,0.14)}
        .test-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:22px;transition:all 0.25s}
        .test-card:hover{border-color:rgba(255,255,255,0.1);transform:translateY(-3px)}
        .how-cell{padding:28px;border-right:1px solid rgba(255,255,255,0.05)}
        .how-cell:last-child{border-right:none}
        .price-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px;transition:all 0.25s}
        .price-card:hover{border-color:rgba(255,255,255,0.12)}
        .price-card-featured{background:rgba(200,255,0,0.04);border-color:rgba(200,255,0,0.2)}
        .fl{font-size:9px;color:rgba(255,255,255,0.13);background:none;border:none;cursor:pointer;font-family:'Geist',sans-serif;margin-left:16px;transition:color 0.15s}
        .fl:hover{color:rgba(255,255,255,0.4)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px}
      `}} />

      <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:0, pointerEvents:'none' }} />

      <nav style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(8,8,9,0.88)', backdropFilter:'blur(20px)', position:'fixed', top:0, left:0, right:0, zIndex:200 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'14px 40px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Logo />
          <div style={{ display:'flex', alignItems:'center' }}>
            <button className="nl">Product</button><span style={{ color:'rgba(255,255,255,0.07)', fontSize:10 }}>/</span>
            <button className="nl">Pricing</button><span style={{ color:'rgba(255,255,255,0.07)', fontSize:10 }}>/</span>
            <button className="nl">Security</button>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button className="nl" style={{ color:'rgba(255,255,255,0.4)' }} onClick={()=>router.push('/login')}>Sign in</button>
            <button className="bp" onClick={()=>router.push('/register')}>Get started free</button>
          </div>
        </div>
      </nav>

      <div style={{ position:'relative', zIndex:1 }}>

        {/* HERO */}
        <section style={{ minHeight:'100vh', paddingTop:62, display:'flex', alignItems:'stretch', justifyContent:'center' }}>
          <div style={{ width:'100%', maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'minmax(0,190px) 1fr minmax(0,190px)' }}>

            <div data-parallax="0.06" style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:12, padding:'40px 0 40px 28px' }}>
              <div className="fcard" style={{ padding:'15px 17px' }}>
                <div style={{ fontSize:7, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,0.18)', fontFamily:"'Geist Mono',monospace", marginBottom:4 }}>Remaining budget</div>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:30, letterSpacing:'-2px', color:'#fff', lineHeight:1 }}>$1,<em style={{ color:'#c8ff00', fontStyle:'italic' }}>842</em></div>
                <div style={{ fontSize:7, color:'rgba(255,255,255,0.15)', fontFamily:"'Geist Mono',monospace", marginTop:3 }}>of $4,200 · Mar 2026</div>
                <div style={{ height:1.5, background:'rgba(255,255,255,0.05)', borderRadius:99, marginTop:10 }}><div style={{ height:'100%', width:'44%', background:'#c8ff00', borderRadius:99 }} /></div>
              </div>
              <div className="fcard" style={{ padding:'13px 15px', animationDelay:'-4s' }}>
                <div style={{ fontSize:7, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.16)', fontFamily:"'Geist Mono',monospace", marginBottom:8 }}>This month</div>
                {[{d:'#f97316',n:'Dining',v:'$312',o:true},{d:'#22c55e',n:'Groceries',v:'$287',o:false},{d:'#3b82f6',n:'Transport',v:'$198',o:false},{d:'#a855f7',n:'Health',v:'$143',o:false}].map((c,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:4, height:4, borderRadius:'50%', background:c.d }} /><span style={{ fontSize:9, color:c.o?'rgba(248,113,113,0.7)':'rgba(255,255,255,0.3)', fontWeight:300 }}>{c.n}</span></div>
                    <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:11, color:c.o?'rgba(248,113,113,0.6)':'rgba(255,255,255,0.38)', letterSpacing:'-0.3px' }}>{c.v}{c.o&&<span style={{fontSize:8,marginLeft:2}}>↑</span>}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', padding:'60px 20px 40px' }}>
              <div style={{ fontSize:8, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.15)', fontFamily:"'Geist Mono',monospace", marginBottom:18, animation:'fadeUp 0.8s 0.2s ease both', opacity:0 }}>Personal finance for Australians</div>
              <h1 data-word-hero style={{ marginBottom:20, lineHeight:0.92 }}>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:'clamp(22px,2.8vw,38px)', fontStyle:'italic', fontWeight:400, color:'rgba(255,255,255,0.14)', letterSpacing:'-1px', marginBottom:4, display:'block' }}>{mw('stop wondering')}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(32px,4vw,58px)', fontWeight:800, letterSpacing:'-2.5px', color:'#fff', display:'block' }}>{mw('where it went.')}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(32px,4vw,58px)', fontWeight:800, letterSpacing:'-2.5px', color:'#c8ff00', display:'block' }}>{mw('now you know.')}</div>
              </h1>
              <p style={{ fontSize:11, fontWeight:300, color:'rgba(255,255,255,0.22)', lineHeight:1.85, maxWidth:270, marginBottom:26, animation:'fadeUp 0.8s 0.6s ease both', opacity:0 }}>Connect your bank or import a CSV — Coyva categorises every dollar automatically and shows you exactly what's left. Real time, every time.</p>
              <div style={{ display:'flex', gap:8, animation:'fadeUp 0.8s 0.8s ease both', opacity:0 }}>
                <button className="bplg" onClick={()=>router.push('/register')}>Start for free →</button>
                <button className="bglg" onClick={()=>router.push('/login')}>Sign in</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:20, animation:'fadeUp 0.8s 1s ease both', opacity:0 }}>
                {['No credit card','Free to start','CDR regulated'].map((t,i)=>[
                  <span key={t} style={{ fontSize:9, color:'rgba(255,255,255,0.18)', fontWeight:300 }}>{t}</span>,
                  i<2&&<span key={`d${i}`} style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'inline-block' }} />
                ])}
              </div>
              <div style={{ fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.1)', fontFamily:"'Geist Mono',monospace", marginTop:20, animation:'fadeUp 0.8s 1.1s ease both', opacity:0 }}>↓ Scroll to explore</div>
            </div>

            <div data-parallax="-0.04" style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:12, padding:'40px 28px 40px 0' }}>
              <div className="fcard" style={{ padding:'12px 14px', animationDelay:'-2.5s' }}>
                <div style={{ fontSize:7, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.16)', fontFamily:"'Geist Mono',monospace", marginBottom:8 }}>Recent transactions</div>
                {[{n:'Woolworths',d:'Today',a:'−$84',cr:false},{n:'Salary',d:'22 Mar',a:'+$3,200',cr:true},{n:"Grill'd",d:'21 Mar',a:'−$22',cr:false}].map((t,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 0', borderBottom:i<2?'1px solid rgba(255,255,255,0.04)':'none' }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:t.cr?'rgba(200,255,0,0.07)':'rgba(148,163,184,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="9" height="9" fill="none" viewBox="0 0 20 20"><path d={t.cr?'M10 3v14M5 8l5-5 5 5':'M10 17V3M5 12l5 5 5-5'} stroke={t.cr?'#c8ff00':'rgba(148,163,184,0.5)'} strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ flex:1 }}><div style={{ fontSize:9, color:'rgba(255,255,255,0.45)', fontWeight:300 }}>{t.n}</div><div style={{ fontSize:7, color:'rgba(255,255,255,0.15)', fontFamily:"'Geist Mono',monospace" }}>{t.d}</div></div>
                    <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:12, color:t.cr?'#c8ff00':'rgba(255,255,255,0.38)', letterSpacing:'-0.3px' }}>{t.a}</div>
                  </div>
                ))}
              </div>
              <div className="fcard" style={{ padding:'12px 14px', animationDelay:'-1s', background:'rgba(14,7,7,0.94)', borderColor:'rgba(248,113,113,0.18)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}><div style={{ width:5, height:5, borderRadius:'50%', background:'#f87171' }} /><div style={{ fontSize:9, color:'#f87171', fontWeight:500 }}>Budget alert</div></div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.22)', lineHeight:1.6, fontWeight:300 }}>You've exceeded your limit for</div>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:13, color:'#f87171', marginTop:5, letterSpacing:'-0.3px' }}>Health · $43 over</div>
              </div>
              <div className="fcard" style={{ padding:'11px 13px', animationDelay:'-3s' }}>
                <div style={{ fontSize:7, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.16)', fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>Savings rate</div>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:26, letterSpacing:'-1.5px', color:'rgba(200,255,0,0.85)', lineHeight:1 }}>28.7<em style={{ fontStyle:'normal', fontSize:14, color:'rgba(200,255,0,0.5)' }}>%</em></div>
                <div style={{ fontSize:8, color:'rgba(255,255,255,0.18)', marginTop:3, fontFamily:"'Geist Mono',monospace" }}>↑ 3.1% vs last month</div>
              </div>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div style={{ overflow:'hidden', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'9px 0', whiteSpace:'nowrap', background:'rgba(8,8,9,0.75)', backdropFilter:'blur(10px)' }}>
          <div className="ticker-track">
            {['Auto-categorisation','Open Banking CDR','NAB · CBA · ANZ · Westpac','Real-time sync','Budget alerts','98% accuracy','CSV import','No credit card required',
              'Auto-categorisation','Open Banking CDR','NAB · CBA · ANZ · Westpac','Real-time sync','Budget alerts','98% accuracy','CSV import','No credit card required'].map((t,i)=>(
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:12, padding:'0 20px', fontSize:8, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.12)', fontFamily:"'Geist Mono',monospace" }}>
                {t}<span style={{ width:3, height:3, borderRadius:'50%', background:'#c8ff00', opacity:0.4, display:'inline-block', flexShrink:0 }}/>
              </span>
            ))}
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          {/* STATS */}
          <div data-reveal style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid rgba(255,255,255,0.05)', ...R }}>
            {[
              {sl:'/ 01',num:'$2.4',sfx:'B',lbl:'Tracked across users',sub:'Across all connected accounts'},
              {sl:'/ 02',num:'98',sfx:'%',lbl:'Categorisation accuracy',sub:'Trained on AU transactions'},
              {sl:'/ 03',num:'70',sfx:'+',lbl:'Australian institutions',sub:'Including all Big 4 banks'},
              {sl:'/ 04',num:'<60',sfx:'s',lbl:'To connect your bank',sub:'Via CDR open banking'},
            ].map((s,i)=>(
              <div key={i} data-stagger className="stat-cell" style={{ ...S, transitionDelay:`${i*80}ms` }}>
                <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:7, color:'rgba(200,255,0,0.2)', marginBottom:4 }}>{s.sl}</div>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:32, letterSpacing:'-2px', color:'#fff', lineHeight:1 }}>{s.num}<em style={{ fontStyle:'italic', color:'rgba(148,163,184,0.38)' }}>{s.sfx}</em></div>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.5px', color:'rgba(255,255,255,0.5)', marginTop:5, fontWeight:400 }}>{s.lbl}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.18)', marginTop:2, fontWeight:300 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* BANKS */}
          <div data-reveal style={{ padding:'18px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', ...R }}>
            <div style={{ fontSize:7, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,0.12)', fontFamily:"'Geist Mono',monospace", whiteSpace:'nowrap' }}>Works with</div>
            {[{ic:'N',bg:'#d32f2f',fg:'#fff',nm:'NAB'},{ic:'C',bg:'#ffcc00',fg:'#000',nm:'CommBank'},{ic:'A',bg:'#007dba',fg:'#fff',nm:'ANZ'},{ic:'W',bg:'#d5002b',fg:'#fff',nm:'Westpac'},{ic:'B',bg:'#ee3524',fg:'#fff',nm:'Bankwest'},{ic:'S',bg:'#00a651',fg:'#fff',nm:'St.George'},{ic:'U',bg:'#ff4e00',fg:'#fff',nm:'Up Bank'},{ic:'M',bg:'#c00',fg:'#fff',nm:'Macquarie'}].map((b,i)=>(
              <div key={i} className="bank-pill">
                <div style={{ width:18, height:18, borderRadius:3, background:b.bg, color:b.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{b.ic}</div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.32)' }}>{b.nm}</span>
              </div>
            ))}
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.13)', fontWeight:300 }}>+ 62 more</span>
          </div>

          {/* FEATURES */}
          <div style={{ position:'relative' }}>
            <div style={{ position:'sticky', top:0, zIndex:10, padding:'24px 28px 14px', background:'rgba(8,8,9,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize:7, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>/ What Coyva does</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(18px,2vw,28px)', fontWeight:800, letterSpacing:'-1px', color:'#fff' }}>
                Everything you need to <em style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontWeight:400, color:'rgba(148,163,184,0.5)', fontSize:'1.1em', letterSpacing:'-1.5px' }}>know your money.</em>
              </div>
            </div>
            <div style={{ padding:'0 28px' }}>
              {features.map((f,i)=>(
                <div key={i} data-reveal className="feat-item" style={{ ...R, transitionDelay:`${i*100}ms` }}>
                  <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 28px', alignItems:'start', gap:20 }}>
                    <div className="feat-item-n">{f.n}</div>
                    <div>
                      <div className="feat-item-sub">{f.sub}</div>
                      <div className="feat-item-h">{f.h}</div>
                      <div className="feat-item-p">{f.p}</div>
                    </div>
                    <div style={{ fontSize:16, color:'rgba(255,255,255,0.08)', paddingTop:20 }}>→</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div data-reveal style={{ borderTop:'1px solid rgba(255,255,255,0.05)', ...R }}>
            <div style={{ padding:'28px 28px 18px' }}>
              <div style={{ fontSize:7, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>/ Getting started</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(18px,2vw,28px)', fontWeight:800, letterSpacing:'-1px', color:'#fff' }}>
                Up and running in <em style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontWeight:400, color:'rgba(148,163,184,0.5)', fontSize:'1.1em' }}>60 seconds.</em>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {[
                {n:'/ 01',h:'Create your account',em:'free',p:"Sign up with your email. No credit card required. Coyva is free to start — connect one bank account and see everything clearly before you decide to upgrade.",detail:'~30 seconds'},
                {n:'/ 02',h:'Connect your bank',em:'securely',p:"Authorise via Australia's Consumer Data Right framework. The same regulated system the big banks use. Read-only — we can see transactions but can never touch your money.",detail:'60 second authorisation'},
                {n:'/ 03',h:'See everything',em:'clearly',p:'Every transaction lands labelled and counted against your budget. Groceries go to groceries. Dining goes to dining. No manual sorting, no spreadsheets, no surprises.',detail:'Instant, automatic, accurate'},
              ].map((s,i)=>(
                <div key={i} data-stagger className="how-cell" style={{ ...S, transitionDelay:`${i*100}ms` }}>
                  <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:8, letterSpacing:'1.5px', color:'rgba(200,255,0,0.25)', marginBottom:12 }}>{s.n}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, letterSpacing:'-0.5px', color:'#fff', marginBottom:6 }}>{s.h} <em style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontWeight:400, color:'rgba(148,163,184,0.4)', fontSize:'1.1em', letterSpacing:'-1px' }}>{s.em}</em></div>
                  <div style={{ fontSize:11, fontWeight:300, color:'rgba(255,255,255,0.22)', lineHeight:1.85, marginBottom:14 }}>{s.p}</div>
                  <div style={{ fontSize:9, color:'rgba(200,255,0,0.35)', fontFamily:"'Geist Mono',monospace" }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICING */}
          <div data-reveal style={{ padding:'44px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)', ...R }}>
            <div style={{ marginBottom:26 }}>
              <div style={{ fontSize:7, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>/ Pricing</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(18px,2vw,28px)', fontWeight:800, letterSpacing:'-1px', color:'#fff' }}>Simple, <em style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontWeight:400, color:'rgba(148,163,184,0.5)', fontSize:'1.1em' }}>honest</em> pricing.</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              {[
                {name:'Free',price:'$0',period:'forever',desc:'Get started and see what Coyva can do for free.',features:['1 bank account','CSV import','3 months history','Auto-categorisation','Basic budgets'],cta:'Get started',featured:false},
                {name:'Pro',price:'$9',period:'/ month',desc:'Everything you need to truly know your finances.',features:['Unlimited accounts','Unlimited history','Real-time sync','Budget alerts','Savings insights','Priority support'],cta:'Start free trial',featured:true},
                {name:'Family',price:'$15',period:'/ month',desc:'Up to 5 members. One shared view, separate logins.',features:['Everything in Pro','Up to 5 members','Shared dashboards','Family budget tracking','Dedicated support'],cta:'Coming soon',featured:false},
              ].map((p,i)=>(
                <div key={i} data-stagger className={`price-card${p.featured?' price-card-featured':''}`} style={{ ...S, transitionDelay:`${i*80}ms` }}>
                  {p.featured&&<div style={{ fontSize:8, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(200,255,0,0.6)', fontFamily:"'Geist Mono',monospace", marginBottom:10 }}>Most popular</div>}
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.65)', marginBottom:5 }}>{p.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                    <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:36, letterSpacing:'-2px', color:p.featured?'#c8ff00':'#fff' }}>{p.price}</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:300 }}>{p.period}</span>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:300, lineHeight:1.7, marginBottom:16 }}>{p.desc}</div>
                  <div style={{ marginBottom:18 }}>
                    {p.features.map((f,fi)=>(
                      <div key={fi} style={{ display:'flex', alignItems:'flex-start', gap:7, marginBottom:8 }}>
                        <div style={{ width:12, height:12, borderRadius:'50%', background:p.featured?'rgba(200,255,0,0.08)':'rgba(255,255,255,0.04)', border:`1px solid ${p.featured?'rgba(200,255,0,0.2)':'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                          <div style={{ width:3, height:3, borderRadius:'50%', background:p.featured?'#c8ff00':'rgba(255,255,255,0.3)' }} />
                        </div>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:300 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>p.cta!=='Coming soon'&&router.push('/register')} style={{ width:'100%', padding:'10px', background:p.featured?'#c8ff00':'rgba(255,255,255,0.04)', color:p.featured?'#080809':'rgba(255,255,255,0.4)', border:p.featured?'none':'1px solid rgba(255,255,255,0.08)', borderRadius:8, fontSize:12, fontWeight:p.featured?500:400, cursor:p.cta==='Coming soon'?'default':'pointer', fontFamily:"'Geist',sans-serif", opacity:p.cta==='Coming soon'?0.4:1 }}>{p.cta}</button>
                </div>
              ))}
            </div>
          </div>

          {/* TESTIMONIALS */}
          <div data-reveal style={{ padding:'44px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)', ...R }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
              <div>
                <div style={{ fontSize:7, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>/ What users say</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(18px,2vw,28px)', fontWeight:800, letterSpacing:'-1px', color:'#fff' }}>Real people, <em style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontWeight:400, color:'rgba(148,163,184,0.5)' }}>real results.</em></div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:22, letterSpacing:'-1px', color:'rgba(200,255,0,0.7)' }}>4.9<em style={{ fontSize:14, color:'rgba(200,255,0,0.35)', fontStyle:'normal' }}>/5</em></div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.15)', fontWeight:300 }}>200+ reviews</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                {q:'"I had no idea I was spending $400 a month on Uber Eats until Coyva showed me. Cancelled that same day."',name:'Sarah M.',loc:'Brisbane, QLD',role:'Nurse',save:'Saved $280/mo'},
                {q:'"Budget alerts changed my behaviour. I\'d get a ping mid-month and cook at home instead. It genuinely works."',name:'James K.',loc:'Sydney, NSW',role:'Software engineer',save:'Saves ~$150/mo'},
                {q:'"Two minutes to set up. Connected NAB and instantly had 8 months of categorised transactions. Nothing else is this frictionless."',name:'Priya T.',loc:'Melbourne, VIC',role:'Marketing manager',save:'4 hrs saved/month'},
              ].map((t,i)=>(
                <div key={i} data-stagger className="test-card" style={{ ...S, transitionDelay:`${i*80}ms` }}>
                  <div style={{ color:'#c8ff00', fontSize:9, letterSpacing:2, marginBottom:10 }}>★★★★★</div>
                  <div style={{ fontFamily:"'Instrument Serif',serif", fontSize:13, fontStyle:'italic', color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:14, letterSpacing:'-0.2px' }}>{t.q}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{t.name}</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>{t.role} · {t.loc}</div></div>
                    <div style={{ fontSize:9, color:'rgba(200,255,0,0.4)', fontFamily:"'Geist Mono',monospace" }}>{t.save}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div data-reveal style={{ textAlign:'center', padding:'72px 28px', ...R }}>
            <div style={{ fontSize:7, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace", marginBottom:14 }}>/ Get started today</div>
            <div data-word style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(32px,3.5vw,52px)', fontWeight:800, letterSpacing:'-2.5px', lineHeight:1 }}>{mw('Finally know')}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(32px,3.5vw,52px)', fontWeight:800, letterSpacing:'-2.5px', lineHeight:1, color:'#c8ff00' }}>{mw('your numbers.')}</div>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginBottom:28, fontWeight:300, maxWidth:360, margin:'0 auto 28px' }}>Join thousands of Australians who finally understand where their money goes. Free to start, no credit card required.</p>
            <button className="bplg" onClick={()=>router.push('/register')}>Get started — it's free</button>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.1)', marginTop:14 }}>No credit card · Australian CDR regulated · Cancel anytime</div>
          </div>

        </div>

        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(8,8,9,0.95)' }}>
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'18px 28px', display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:16 }}>
            <Logo size="sm" />
            <div>{['Privacy','Terms','CDR Policy','Security','About'].map(l=><button key={l} className="fl">{l}</button>)}</div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.07)', fontFamily:"'Geist Mono',monospace", textAlign:'right' }}>© 2026 Coyva · Encrypted · Never sold · Australian CDR accredited</div>
          </div>
        </footer>

      </div>
    </>
  )
}

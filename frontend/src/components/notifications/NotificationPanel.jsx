import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, X, CheckCheck, Trash2, RefreshCw,
  Briefcase, ShieldCheck, Star, MessageCircle,
  AlertCircle, BookOpen, Sparkles, Zap,
  Check, XCircle, Reply, Eye, ChevronDown,
  BellOff, Loader2,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth }           from '@/context/AuthContext';

/* Dummy notifications removed — using real notifications only */

/* ─── Category config ──────────────────────────────────────────────────────── */
const CAT = {
  job:          {Icon:Briefcase,     bg:'#eff6ff',ic:'#3b82f6',border:'#bfdbfe',label:'Job'          },
  scheme:       {Icon:BookOpen,      bg:'#f0fdf4',ic:'#16a34a',border:'#bbf7d0',label:'Scheme'       },
  verification: {Icon:ShieldCheck,   bg:'#eef2ff',ic:'#6366f1',border:'#c7d2fe',label:'Verification' },
  message:      {Icon:MessageCircle, bg:'#faf5ff',ic:'#9333ea',border:'#e9d5ff',label:'Message'      },
  rating:       {Icon:Star,          bg:'#fffbeb',ic:'#d97706',border:'#fde68a',label:'Rating'       },
  alert:        {Icon:AlertCircle,   bg:'#fef2f2',ic:'#ef4444',border:'#fecaca',label:'Alert'        },
  system:       {Icon:Sparkles,      bg:'#fff7ed',ic:'#f97316',border:'#fed7aa',label:'System'       },
};

const ACT = {
  accept:  {bg:'#22c55e',color:'#fff',   Icon:Check,    shadow:'0 2px 8px rgba(34,197,94,.35)' },
  decline: {bg:'#fef2f2',color:'#dc2626',Icon:XCircle,  shadow:'none' },
  reply:   {bg:'#eff6ff',color:'#2563eb',Icon:Reply,    shadow:'none' },
  view:    {bg:'#fff7ed',color:'#ea580c',Icon:Eye,      shadow:'none' },
  dismiss: {bg:'#f1f5f9',color:'#64748b',Icon:X,        shadow:'none' },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const fmtTime = (ts) => {
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d/60000), h = Math.floor(d/3600000), dy = Math.floor(d/86400000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy===1) return `Yesterday ${new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`;
  return new Date(ts).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
};

/* ─── Action button ────────────────────────────────────────────────────────── */
const ActBtn = memo(({ action, nid, onAction }) => {
  const [busy,setBusy] = useState(false);
  const c = ACT[action.type] || ACT.view;
  const BtnIcon = c.Icon;
  if (action.done) return (
    <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'4px 10px',borderRadius:8,background:'#f1f5f9',color:'#94a3b8',fontSize:11,fontWeight:600}}>
      <Check style={{width:10,height:10}}/> Done
    </span>
  );
  return (
    <button disabled={busy} onClick={async(e)=>{
      e.stopPropagation(); setBusy(true);
      if(action.type==='reply'){onAction(nid,'reply_open');setBusy(false);return;}
      await onAction(nid,action.type); setBusy(false);
    }} style={{
      display:'inline-flex',alignItems:'center',gap:4,padding:'5px 11px',
      borderRadius:8,border:'none',cursor:busy?'wait':'pointer',
      background:c.bg,color:c.color,fontSize:11,fontWeight:700,
      boxShadow:c.shadow,opacity:busy?.6:1,transition:'transform .1s ease',
    }} onMouseDown={e=>e.currentTarget.style.transform='scale(.95)'}
       onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
      {busy?<Loader2 style={{width:10,height:10,animation:'spin 1s linear infinite'}}/>:<BtnIcon style={{width:10,height:10}}/>}
      {action.label}
    </button>
  );
});

/* ─── Single card ──────────────────────────────────────────────────────────── */
const NCard = memo(({ n, idx, onRead, onHide, onAction }) => {
  const [gone,    setGone]    = useState(false);
  const [reply,   setReply]   = useState('');
  const [replying,setReplying]= useState(false);

  const meta = CAT[n.category] || CAT.system;
  const { Icon } = meta;

  const dismiss = e => { e.stopPropagation(); setGone(true); setTimeout(()=>onHide(n._id),240); };

  const handleAction = (id, type) => {
    if (type==='reply_open') { setReplying(true); return; }
    return onAction(id, type);
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    onAction(n._id,'reply',reply.trim());
    setReply(''); setReplying(false);
  };

  const leftBorder = n.priority==='urgent' ? '#ef4444' : n.priority==='high' ? '#f97316' : n.isRead ? '#e2e8f0' : '#fdba74';

  return (
    <div style={{
      transition:'all .22s ease', marginBottom:10,
      transform: gone ? 'translateX(110%)' : 'translateX(0)',
      opacity: gone ? 0 : 1,
      animation: `npFadeUp .26s ease ${Math.min(idx*.06,.4)}s both`,
    }} onClick={() => !n.isRead && onRead(n._id)}>
      <div style={{
        background: n.isRead ? '#fff' : 'linear-gradient(135deg,#fff7ed,#fff)',
        border:`1.5px solid ${n.isRead ? '#f1f5f9' : '#fed7aa'}`,
        borderLeft:`3.5px solid ${leftBorder}`,
        borderRadius:14,padding:'13px 14px',
        cursor:'pointer',position:'relative',overflow:'hidden',
      }}>
        <div style={{display:'flex',gap:11,alignItems:'flex-start'}}>

          {/* Icon / Avatar */}
          <div style={{position:'relative',flexShrink:0}}>
            {n.senderProfileUrl
              ? <img src={n.senderProfileUrl} alt="" style={{width:40,height:40,borderRadius:12,objectFit:'cover',border:`2px solid ${meta.border}`}}/>
              : <div style={{width:40,height:40,borderRadius:12,background:meta.bg,border:`2px solid ${meta.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon style={{width:19,height:19,color:meta.ic}}/>
                </div>
            }
            {!n.isRead && (
              <span style={{position:'absolute',top:-3,right:-3,width:10,height:10,borderRadius:'50%',background:'#f97316',border:'2px solid #fff',animation:'npPulse 1.8s ease-in-out infinite'}}/>
            )}
          </div>

          {/* Body */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:6}}>
              <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:5,flex:1,minWidth:0}}>
                <span style={{fontWeight:700,fontSize:12.5,color:'#0f172a'}}>{n.senderName}</span>
                <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:meta.bg,color:meta.ic}}>{meta.label}</span>
                {n.priority==='urgent' && <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'#fef2f2',color:'#ef4444',display:'inline-flex',alignItems:'center',gap:3}}><Zap style={{width:9,height:9}}/>Urgent</span>}
                {n.actionRequired && !n.actions?.every(a=>a.done) && <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:20,background:'#eff6ff',color:'#2563eb'}}>Action</span>}
              </div>
              <button onClick={dismiss} style={{width:20,height:20,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#cbd5e1',flexShrink:0,padding:0,marginTop:1}}
                onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#ef4444';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#cbd5e1';}}>
                <X style={{width:12,height:12}}/>
              </button>
            </div>

            <p style={{fontWeight:600,fontSize:12.5,color:'#1e293b',margin:'4px 0 3px',lineHeight:1.3}}>{n.title}</p>
            <p style={{fontSize:12,color:'#64748b',lineHeight:1.55,margin:0}}>{n.description}</p>
            <p style={{fontSize:11,color:'#94a3b8',marginTop:5,fontWeight:500}}>{fmtTime(n.createdAt)}</p>

            {n.actionRequired && n.actions?.length>0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:9}} onClick={e=>e.stopPropagation()}>
                {n.actions.map((a,i)=><ActBtn key={i} action={a} nid={n._id} onAction={handleAction}/>)}
              </div>
            )}

            {replying && (
              <div style={{marginTop:9}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:6}}>
                  <input autoFocus value={reply} onChange={e=>setReply(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')sendReply();if(e.key==='Escape')setReplying(false);}}
                    placeholder="Type reply…"
                    style={{flex:1,fontSize:12,padding:'7px 11px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'#f8fafc',outline:'none',fontFamily:'inherit',transition:'border-color .2s'}}
                    onFocus={e=>e.target.style.borderColor='#f97316'}
                    onBlur={e=>e.target.style.borderColor='#e2e8f0'}
                  />
                  <button onClick={sendReply} style={{padding:'7px 13px',borderRadius:10,background:'#f97316',color:'#fff',border:'none',fontSize:12,fontWeight:700,cursor:'pointer'}}>Send</button>
                  <button onClick={()=>setReplying(false)} style={{padding:'7px 10px',borderRadius:10,background:'#f1f5f9',border:'none',cursor:'pointer',color:'#64748b'}}><X style={{width:12,height:12}}/></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─── MAIN ─────────────────────────────────────────────────────────────────── */
const NotificationPanel = () => {
  const {
    notifications:real, unreadCount:realUnread, loading, hasMore,
    filter, changeFilter, markRead, markAllRead,
    hide, clearAll, handleAction, loadMore, refresh,
    panelOpen, setPanelOpen,
  } = useNotifications();

  const { user } = useAuth();
  const role  = user?.role || 'labour';

  const notifs   = real;
  const unread   = realUnread;

  const [closing,  setClosing]  = useState(false);
  const [bellAnim, setBellAnim] = useState(false);
  const [cat,      setCat]      = useState('all');
  const prevUnread = useRef(unread);
  const scrollRef  = useRef(null);

  /* Bell shake on new notification */
  useEffect(()=>{
    if(unread > prevUnread.current){ setBellAnim(true); setTimeout(()=>setBellAnim(false),600); }
    prevUnread.current = unread;
  },[unread]);

  const close = useCallback(()=>{
    setClosing(true);
    setTimeout(()=>{ setClosing(false); setPanelOpen(false); },250);
  },[setPanelOpen]);

  /* Infinite scroll */
  const onScroll = () => {
    const el = scrollRef.current;
    if(!el || loading || !hasMore) return;
    if(el.scrollTop + el.clientHeight >= el.scrollHeight - 80) loadMore();
  };

  const catCounts = notifs.reduce((a,n)=>({...a,[n.category]:(a[n.category]||0)+1}),{});
  const filtered  = cat==='all' ? notifs : notifs.filter(n=>n.category===cat);
  const shown     = filter==='unread' ? filtered.filter(n=>!n.isRead) : filtered;

  const doRead   = real.length>0 ? markRead   : ()=>{};
  const doHide   = real.length>0 ? hide       : ()=>{};
  const doAction = real.length>0 ? handleAction : ()=>Promise.resolve();

  /* Injected global CSS */
  const css = `
    @keyframes npFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes npPulse  { 0%,100%{opacity:1} 50%{opacity:.2} }
    @keyframes npShake  { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-14deg)} 40%{transform:rotate(14deg)} 60%{transform:rotate(-7deg)} 80%{transform:rotate(7deg)} }
    @keyframes npSlide  { from{transform:translateX(110%)} to{transform:translateX(0)} }
    @keyframes npClose  { from{transform:translateX(0)}    to{transform:translateX(110%)} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    .np-scroll { scrollbar-width:thin; scrollbar-color:#e2e8f0 transparent; overflow-y:auto }
    .np-scroll::-webkit-scrollbar { width:3px }
    .np-scroll::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:3px }
  `;

  /* The panel JSX — rendered via portal */
  const panelJSX = (
    <>
      {/* Inline keyframes */}
      <style dangerouslySetInnerHTML={{__html: css}} />

      {/* ── Backdrop ── */}
      <div onClick={close} style={{
        position:'fixed',top:0,left:0,right:0,bottom:0,
        zIndex:99998,
        background:'rgba(15,23,42,0.55)',
        backdropFilter:'blur(7px)',
        WebkitBackdropFilter:'blur(7px)',
      }}/>

      {/* ── Panel ── */}
      <div style={{
        position:'fixed',top:0,right:0,bottom:0,
        width:'min(100vw, 420px)',
        zIndex:99999,
        backgroundColor:'#ffffff',
        display:'flex',
        flexDirection:'column',
        boxShadow:'-12px 0 60px rgba(0,0,0,0.22)',
        borderRadius:'20px 0 0 20px',
        overflow:'hidden',
        animation: `${closing ? 'npClose' : 'npSlide'} .34s cubic-bezier(.22,1,.36,1) both`,
      }} onClick={e=>e.stopPropagation()}>

        {/* HEADER */}
        <div style={{
          flexShrink:0,
          backgroundColor:'#ffffff',
          padding:'20px 20px 0',
          borderBottom:'1.5px solid #f1f5f9',
        }}>
          {/* Row 1: title + buttons */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{position:'relative'}}>
                <div style={{
                  width:44,height:44,borderRadius:14,flexShrink:0,
                  background:'linear-gradient(135deg,#f97316,#ea580c)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 4px 14px rgba(249,115,22,.4)',
                }}>
                  <Bell style={{width:22,height:22,color:'#ffffff'}}/>
                </div>
                {unread>0 && (
                  <span style={{
                    position:'absolute',top:-5,right:-5,
                    minWidth:20,height:20,borderRadius:10,
                    background:'#ef4444',color:'#ffffff',
                    fontSize:10,fontWeight:800,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    padding:'0 4px',border:'2.5px solid #ffffff',
                  }}>{unread>99?'99+':unread}</span>
                )}
              </div>
              <div>
                <h2 style={{margin:0,fontWeight:800,fontSize:18,color:'#0f172a',lineHeight:1.2}}>Notifications</h2>
                <p style={{margin:'3px 0 0',fontSize:12,fontWeight:600,color:unread>0?'#f97316':'#94a3b8'}}>
                  {unread>0 ? `${unread} unread` : 'All caught up ✓'}
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              {[
                {icon:<RefreshCw style={{width:14,height:14}}/>,  action:refresh,     title:'Refresh',   hoverBorder:'#f97316', hoverColor:'#f97316'},
                {icon:<Trash2 style={{width:14,height:14}}/>,     action:clearAll,    title:'Clear all', hoverBorder:'#ef4444', hoverColor:'#ef4444'},
                {icon:<X style={{width:15,height:15}}/>,          action:close,       title:'Close',     hoverBorder:'#334155', hoverColor:'#334155'},
              ].map((btn,i)=>(
                <button key={i} onClick={btn.action} title={btn.title} style={{
                  width:34,height:34,borderRadius:10,
                  border:'1.5px solid #e2e8f0',
                  background:'#ffffff',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'#94a3b8',transition:'all .2s',padding:0,
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=btn.hoverBorder;e.currentTarget.style.color=btn.hoverColor;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#94a3b8';}}>
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: All | Unread + Mark all */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',background:'#f1f5f9',borderRadius:12,padding:4,gap:2}}>
              {[['all','All'],['unread','Unread']].map(([val,lbl])=>(
                <button key={val} onClick={()=>changeFilter(val)} style={{
                  padding:'6px 16px',borderRadius:9,border:'none',cursor:'pointer',
                  fontSize:12,fontWeight:700,transition:'all .18s',
                  background: filter===val ? '#ffffff' : 'transparent',
                  color:      filter===val ? '#f97316' : '#64748b',
                  boxShadow:  filter===val ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                }}>
                  {val==='unread' && unread>0 ? `Unread (${unread})` : lbl}
                </button>
              ))}
            </div>
            {unread>0 && (
              <button onClick={markAllRead} style={{
                display:'flex',alignItems:'center',gap:5,
                background:'none',border:'none',cursor:'pointer',
                fontSize:12,color:'#f97316',fontWeight:700,
                padding:'4px 8px',borderRadius:8,
              }}
              onMouseEnter={e=>e.currentTarget.style.background='#fff7ed'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <CheckCheck style={{width:14,height:14}}/>Mark all read
              </button>
            )}
          </div>

          {/* Row 3: Category pills */}
          <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:14,scrollbarWidth:'none'}}>
            {/* All pill */}
            <button onClick={()=>setCat('all')} style={{
              display:'inline-flex',alignItems:'center',gap:5,flexShrink:0,
              padding:'5px 12px',borderRadius:20,border:'none',cursor:'pointer',
              fontSize:11,fontWeight:700,transition:'all .18s',
              background: cat==='all' ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#f1f5f9',
              color:      cat==='all' ? '#ffffff' : '#64748b',
              boxShadow:  cat==='all' ? '0 2px 8px rgba(249,115,22,.35)' : 'none',
            }}>
              <Bell style={{width:11,height:11}}/>
              All
              {unread>0 && <span style={{padding:'1px 5px',borderRadius:10,fontSize:10,fontWeight:800,background:cat==='all'?'rgba(255,255,255,.25)':'#ffffff',color:cat==='all'?'#ffffff':'#94a3b8'}}>{unread}</span>}
            </button>
            {Object.entries(CAT).map(([key,m])=>{
              if(!catCounts[key]) return null;
              const PillIcon = m.Icon;
              return (
                <button key={key} onClick={()=>setCat(cat===key?'all':key)} style={{
                  display:'inline-flex',alignItems:'center',gap:5,flexShrink:0,
                  padding:'5px 12px',borderRadius:20,border:'none',cursor:'pointer',
                  fontSize:11,fontWeight:700,transition:'all .18s',
                  background: cat===key ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#f1f5f9',
                  color:      cat===key ? '#ffffff' : '#64748b',
                  boxShadow:  cat===key ? '0 2px 8px rgba(249,115,22,.35)' : 'none',
                }}>
                  <PillIcon style={{width:11,height:11}}/>
                  {m.label}
                  <span style={{padding:'1px 5px',borderRadius:10,fontSize:10,fontWeight:800,background:cat===key?'rgba(255,255,255,.25)':'#ffffff',color:cat===key?'#ffffff':'#94a3b8'}}>{catCounts[key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LIST */}
        <div ref={scrollRef} onScroll={onScroll} className="np-scroll" style={{
          flex:1,
          padding:'12px 14px',
          backgroundColor:'#f8fafc',
          overflowY:'auto',
        }}>
          {loading && shown.length===0 && (
            <>{[1,2,3].map(i=>(
              <div key={i} style={{display:'flex',gap:11,padding:'13px 14px',marginBottom:10,borderRadius:14,background:'#ffffff',border:'1.5px solid #f1f5f9',animation:'npPulse 1.4s ease-in-out infinite'}}>
                <div style={{width:40,height:40,borderRadius:12,background:'#f1f5f9',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{height:11,background:'#f1f5f9',borderRadius:6,width:'65%',marginBottom:8}}/>
                  <div style={{height:10,background:'#f1f5f9',borderRadius:6,width:'100%',marginBottom:6}}/>
                  <div style={{height:10,background:'#f1f5f9',borderRadius:6,width:'50%'}}/>
                </div>
              </div>
            ))}</>
          )}

          {!loading && shown.length===0 && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:68,height:68,borderRadius:20,background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
                <BellOff style={{width:30,height:30,color:'#fed7aa'}}/>
              </div>
              <p style={{fontWeight:700,fontSize:15,color:'#374151',margin:0}}>
                {filter==='unread' ? 'All caught up! 🎉' : 'No notifications yet'}
              </p>
              <p style={{fontSize:13,color:'#9ca3af',marginTop:6,lineHeight:1.5,maxWidth:200}}>
                {filter==='unread' ? 'You have read all notifications.' : 'Activity on your jobs and profile will appear here.'}
              </p>
            </div>
          )}

          {shown.map((n,i)=>(
            <NCard key={n._id} n={n} idx={i} onRead={doRead} onHide={doHide} onAction={doAction}/>
          ))}

          {real.length>0 && hasMore && (
            <div style={{display:'flex',justifyContent:'center',padding:'10px 0'}}>
              {loading
                ? <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:'#94a3b8'}}><Loader2 style={{width:15,height:15,animation:'spin 1s linear infinite',color:'#f97316'}}/>Loading…</div>
                : <button onClick={loadMore} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:11,border:'1.5px solid #e2e8f0',background:'#ffffff',fontSize:12,color:'#64748b',cursor:'pointer',fontWeight:600,transition:'all .18s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#f97316';e.currentTarget.style.color='#f97316';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';}}>
                    <ChevronDown style={{width:14,height:14}}/>Load more
                  </button>
              }
            </div>
          )}

          {shown.length>4 && (
            <p style={{textAlign:'center',fontSize:11,color:'#cbd5e1',padding:'10px 0',fontWeight:500}}>
              ── End of notifications ──
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          flexShrink:0,
          backgroundColor:'#ffffff',
          borderTop:'1.5px solid #f1f5f9',
          padding:'11px 20px',
          textAlign:'center',
        }}>
          <p style={{margin:0,fontSize:11,color:'#94a3b8'}}>
            For <span style={{fontWeight:700,color:'#f97316'}}>{user?.name?.split(' ')[0]}</span>
            {' '}· <span style={{textTransform:'capitalize'}}>{role}</span> account
          </p>
        </div>

      </div>
    </>
  );

  return (
    <>
      {/* Bell button — always rendered in Navbar */}
      <button
        onClick={() => panelOpen ? close() : setPanelOpen(true)}
        style={{
          position:'relative',padding:'8px',
          borderRadius:12,border:'none',
          background: panelOpen ? '#fff7ed' : 'transparent',
          cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          color: panelOpen ? '#f97316' : '#64748b',
          transition:'background .2s, color .2s',
        }}
        onMouseEnter={e=>{if(!panelOpen){e.currentTarget.style.background='#f8fafc';}}}
        onMouseLeave={e=>{if(!panelOpen){e.currentTarget.style.background='transparent';}}}
      >
        <Bell style={{width:20,height:20,animation: bellAnim ? 'npShake .5s ease' : 'none'}}/>
        {unread>0 && (
          <span style={{
            position:'absolute',top:-2,right:-2,
            minWidth:18,height:18,borderRadius:9,
            background:'linear-gradient(135deg,#f97316,#ef4444)',
            color:'#ffffff',fontSize:10,fontWeight:800,
            display:'flex',alignItems:'center',justifyContent:'center',
            padding:'0 4px',border:'2px solid #ffffff',
            boxShadow:'0 2px 6px rgba(239,68,68,.4)',
          }}>{unread>99?'99+':unread}</span>
        )}
      </button>

      {/* Panel — rendered via portal directly into document.body */}
      {panelOpen && typeof document !== 'undefined' &&
        createPortal(panelJSX, document.body)
      }

      {/* Keyframes for bell (injected once) */}
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes npShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-14deg)}40%{transform:rotate(14deg)}60%{transform:rotate(-7deg)}80%{transform:rotate(7deg)}}
        @keyframes npSlide{from{transform:translateX(110%)}to{transform:translateX(0)}}
        @keyframes npClose{from{transform:translateX(0)}to{transform:translateX(110%)}}
      `}}/>
    </>
  );
};

export default NotificationPanel;
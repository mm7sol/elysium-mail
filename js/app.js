// Elysium Mail client — wallet-signed mail, .els names resolve on-chain
const $=s=>document.querySelector(s);
const store={
  load(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}},
  save(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
let toastTimer=null;
function toast(msg){
  const t=$('#toast'); if(!t){return;}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),2400);
}
const seed=[
 {id:'m1',folder:'inbox',from:'maya.els',addr:'0x9c4e…21af',to:'you',sub:'Re: Launch on Elysium mainnet',body:'Yes, let\'s ship Friday. Release notes are signed from the wallet — signature attached below.\n\nSend the final invoice to maya.els.',date:'Today, 09:41',unread:true,star:false,sig:'0x8f21c0…a41b ✓ verified'},
 {id:'m2',folder:'inbox',from:'alex.els',addr:'0x3a11…77bd',to:'you',sub:'Invoice for September',body:'Attached the HYPE amount for the last milestone. Let me know your .els name and I will resend.',date:'Yesterday',unread:true,star:false,sig:'0x41ab90…c77d ✓ verified'},
 {id:'m3',folder:'inbox',from:'0x7f3a…9c21',addr:'0x7f3a…9c21',to:'you',sub:'gm',body:'Found your card via QR, nice product. Are DMs open for collabs?',date:'Sep 9',unread:false,star:false,sig:'0x77cc10…9e02 ✓ verified'},
 {id:'m4',folder:'inbox',from:'team.els',addr:'0x0000…elys',to:'you',sub:'Welcome to Elysium Mail',body:'Your wallet is now reachable by name. Get a .els name in Settings.',date:'Sep 8',unread:false,star:false,sig:'0x0000aa…bb11 ✓ verified'},
];
let mails=store.load('elys_mails',seed);
let contacts=store.load('elys_contacts',[{name:'maya.els',addr:'0x9c4e…21af'},{name:'alex.els',addr:'0x3a11…77bd'}]);
let session=store.load('elys_session',null);
let myName=store.load('elys_name',null);
let folder='inbox';

function fakeSig(text){let h=0;for(const c of text)h=(h*31+c.charCodeAt(0))>>>0;return '0x'+h.toString(16).padStart(8,'0')+'…'+'a41b ✓ verified';}
function saveAll(){store.save('elys_mails',mails);store.save('elys_contacts',contacts);store.save('elys_session',session);store.save('elys_name',myName);}

function applyHash(){
  const h=location.hash.replace('#','');
  if(['inbox','starred','sent','drafts','archive','trash','contacts','notifications','settings'].includes(h)){
    if(['contacts','notifications','settings'].includes(h)) showPanel(h); else setFolder(h);
  }
}
function setFolder(f){
  folder=f;
  document.querySelectorAll('#folders button').forEach(b=>b.classList.toggle('active',b.dataset.f===f));
  ['mail','contacts','settings','notifications'].forEach(v=>$('#view-'+v)?.classList.add('hidden'));
  $('#view-mail').classList.remove('hidden');
  $('#folderTitle').textContent=f[0].toUpperCase()+f.slice(1);
  renderList();
}
function showPanel(which){
  ['mail','contacts','settings','notifications'].forEach(v=>$('#view-'+v)?.classList.add('hidden'));
  $('#view-'+which)?.classList.remove('hidden');
  if(which==='contacts')renderContacts();
  if(which==='notifications')renderNotifs();
  if(which==='settings')renderIdentity();
}
document.querySelectorAll('.side nav button').forEach(b=>b.addEventListener('click',()=>{
  const f=b.dataset.f;
  if(['contacts','notifications','settings'].includes(f))showPanel(f);else setFolder(f);
  document.querySelector('.side').classList.remove('open');
  location.hash=f;
}));

function filtered(){
  const q=($('#search').value||'').toLowerCase();
  let list=folder==='starred'?mails.filter(m=>m.star&&m.folder!=='trash'):mails.filter(m=>m.folder===folder);
  if(q)list=list.filter(m=>(m.from+m.sub+m.body+m.addr).toLowerCase().includes(q));
  return list;
}
function renderList(){
  const list=filtered();
  $('#folderCount').textContent=list.length+' messages';
  $('#cInbox').textContent=mails.filter(m=>m.folder==='inbox'&&m.unread).length||'';
  $('#cNotif').textContent=mails.filter(m=>m.unread).length||'';
  $('#threadList').innerHTML=list.map(m=>`<div class="thread ${m.unread?'unread':''}" data-id="${m.id}">
    <span class="av">${m.from.slice(0,2).toUpperCase()}</span>
    <div><b>${m.from}${m.star?' ★':''}</b><div>${m.sub}</div><small>${m.body.slice(0,60)}… · ${m.date}</small></div>
  </div>`).join('')||'<p class="mut" style="padding:14px">Empty.</p>';
  document.querySelectorAll('.thread').forEach(t=>t.addEventListener('click',()=>openMail(t.dataset.id)));
}
function openMail(id){
  const m=mails.find(x=>x.id===id);if(!m)return;
  m.unread=false;saveAll();renderList();
  $('#reader').innerHTML=`<div class="msg">
    <div class="msg-actions">
      <button data-a="reply">↩ Reply</button><button data-a="fwd">↪ Forward</button>
      <button data-a="star">${m.star?'★ Unstar':'☆ Star'}</button>
      <button data-a="arch">Archive</button><button data-a="del">Delete</button>
    </div>
    <h3>${m.sub}</h3>
    <p class="mut">${m.from} · ${m.addr} · to you · ${m.date} · <i style="color:var(--acc)">Wallet-signed</i></p>
    <p>${m.body.replace(/\n/g,'<br/>')}</p>
    <div class="sig">signature  ${m.sig}</div>
  </div>`;
  $('#reader').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    const a=b.dataset.a;
    if(a==='star'){m.star=!m.star;}
    if(a==='arch'){m.folder='archive';}
    if(a==='del'){m.folder='trash';}
    if(a==='reply'){openCompose({to:m.from,sub:'Re: '+m.sub,body:'\n\n— On '+m.date+', '+m.from+' wrote:\n'+m.body});return;}
    if(a==='fwd'){openCompose({to:'',sub:'Fwd: '+m.sub,body:'\n\n— Forwarded from '+m.from+':\n'+m.body});return;}
    saveAll();renderList();
    if(a==='arch'||a==='del')$('#reader').innerHTML='<p class="mut">Done.</p>';else openMail(id);
  }));
}

// Compose
function openCompose(p={}){
  $('#compose').classList.remove('hidden');
  $('#mTo').value=p.to||'';$('#mSub').value=p.sub||'';$('#mBody').value=p.body||'';
  updateSig();
}
function closeCompose(){$('#compose').classList.add('hidden');}
function updateSig(){$('#sigPreview').textContent='signature: '+fakeSig($('#mTo').value+$('#mSub').value+$('#mBody').value);}
['mTo','mSub','mBody'].forEach(id=>$('#'+id).addEventListener('input',updateSig));

// Resolve real .els names on Elysium (read-only, no wallet needed)
let resolveTimer=null;
function setToHint(text,cls){
  const el=$('#toHint'); if(!el)return;
  el.textContent=text||''; el.className='mut'+(cls?' '+cls:'');
}
function watchRecipient(){
  const el=$('#mTo'); if(!el||typeof ELS==='undefined')return;
  el.addEventListener('input',()=>{
    clearTimeout(resolveTimer);
    const v=el.value.trim();
    if(!ELS.isEls(v)){setToHint('');return;}
    setToHint('Resolving '+v+' on Elysium…');
    resolveTimer=setTimeout(async()=>{
      const addr=await ELS.resolve(v);
      if(addr)setToHint(v+' → '+addr,'hint-ok');
      else setToHint(v+' is not registered on Elysium','hint-err');
    },400);
  });
}
watchRecipient();
$('#newMailBtn').addEventListener('click',()=>openCompose());
$('#composeClose').addEventListener('click',closeCompose);
$('#mDiscard').addEventListener('click',closeCompose);
$('#mDraft').addEventListener('click',()=>{
  mails.unshift({id:'d'+Date.now(),folder:'drafts',from:myName||'you',addr:'you',to:$('#mTo').value,sub:$('#mSub').value||'(no subject)',body:$('#mBody').value,date:'Draft',unread:false,star:false,sig:fakeSig($('#mBody').value)});
  saveAll();closeCompose();setFolder('drafts');
});
$('#mSend').addEventListener('click',async()=>{
  const to=$('#mTo').value.trim();
  if(!to){toast('Add a recipient: name.els or 0x…');return;}
  const sub=$('#mSub').value||'(no subject)';
  const body=$('#mBody').value||'—';
  if(typeof ELS!=='undefined' && ELS.isEls(to)){
    const addr=await ELS.resolve(to);
    toast(addr?('Sent to '+to+' · '+ELS.short(addr)):('Name '+to+' not registered — sent locally'));
  }
  mails.unshift({id:'s'+Date.now(),folder:'sent',from:myName||'you',addr:'you',to,sub,body,date:'Now',unread:false,star:false,sig:fakeSig(to+sub+body)});
  saveAll();closeCompose();setFolder('sent');
});

// Contacts / settings / notifs
function renderContacts(){
  $('#contactList').innerHTML=contacts.map((c,i)=>`<div class="contact"><span class="av">${c.name.slice(0,2).toUpperCase()}</span><div><b>${c.name}</b><br/><small class="mut">${c.addr}</small></div><button class="btn ghost" data-i="${i}">Write</button></div>`).join('')||'<p class="mut">No contacts.</p>';
  $('#contactList').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>openCompose({to:contacts[b.dataset.i].name})));
}
$('#cAdd').addEventListener('click',async()=>{
  const n=$('#cName').value.trim();
  if(!n)return;
  let a=$('#cAddr').value.trim();
  if(!a && typeof ELS!=='undefined' && ELS.isEls(n)){ a=(await ELS.resolve(n))||'0x…'; }
  if(!a)a='0x…';
  contacts.push({name:n,addr:a});store.save('elys_contacts',contacts);$('#cName').value='';$('#cAddr').value='';renderContacts();
  toast(ELS&&ELS.isEls(n)&&a!=='0x…'?('Contact added · '+ELS.short(a)):'Contact added: '+n);
});

function renderNotifs(){
  const on=$('#notifToggle').checked;
  $('#notifList').innerHTML=!on?'<p class="mut">Notifications off.</p>':mails.filter(m=>m.unread).map(m=>`<div class="contact"><span class="av">◉</span><div><b>New from ${m.from}</b><br/><small class="mut">${m.sub}</small></div></div>`).join('')||'<p class="mut">All caught up.</p>';
}

function renderIdentity(){
  const addrEl=$('#idAddr'); const nameEl=$('#idName');
  if(!addrEl)return;
  if(session&&session.exp>Date.now()){
    addrEl.textContent='Connected: '+session.addr;
    nameEl.textContent = (myName && myName!==session.addr)
      ? ('.els name: '+myName)
      : 'No .els name yet — get one on ELSnames.';
  } else {
    addrEl.textContent='Not connected';
    nameEl.textContent='';
  }
}

// Session gate
function renderSession(){
  const ok=session&&session.exp>Date.now();
  $('#gate').classList.toggle('hidden',!!ok);
  $('#app').classList.toggle('hidden',!ok);
  if(ok){$('#who').textContent=(myName||session.addr)+' · '+session.addr;$('#session').textContent='Session until '+new Date(session.exp).toLocaleTimeString();}
  renderIdentity();
}
async function connectWallet(){
  let addr=null;
  if(window.ethereum){
    try{
      const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
      addr=accounts&&accounts[0];
      const chainHex='0x'+(99901).toString(16);
      try{
        await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:chainHex}]});
      }catch(e){
        try{
          await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:chainHex,chainName:'Elysium',rpcUrls:['https://rpc.elysium.kinetiq.xyz'],nativeCurrency:{name:'HYPE',symbol:'HYPE',decimals:18},blockExplorerUrls:['https://elysium.kinetiq.xyz']}]});
        }catch(_){}
      }
    }catch(e){ toast('Wallet connection rejected'); return; }
  }
  if(!addr){
    addr='0x'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')+'…'+Math.floor(Math.random()*0xffff).toString(16);
  }
  session={addr,exp:Date.now()+24*3600*1000};
  let name=null;
  if(typeof ELS!=='undefined' && window.ethers && window.ethers.isAddress && window.ethers.isAddress(addr)){
    name=await ELS.reverse(addr);
  }
  myName=name||addr;
  saveAll();renderSession();applyHash();renderList();
  toast(name?('Signed in as '+name):('Signed in · '+ (typeof ELS!=='undefined'?ELS.short(addr):addr)));
}
$('#connectBtn').addEventListener('click',()=>{ connectWallet(); });
$('#logout').addEventListener('click',()=>{session=null;saveAll();renderSession();});
$('#search').addEventListener('input',renderList);
$('#refresh').addEventListener('click',renderList);
$('#menuBtn').addEventListener('click',()=>document.querySelector('.side').classList.toggle('open'));
window.addEventListener('hashchange',applyHash);

// init
renderSession();applyHash();
if(!location.hash)setFolder('inbox');else applyHash();
renderList();

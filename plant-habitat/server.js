// Plant Habitat server: static site + orders API + admin. No npm packages needed. Run: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const PORT=process.env.PORT||3000,PASS=process.env.ADMIN_PASSWORD||'root';
/* DATA_DIR: where orders, inquiries and product edits are saved. On a host, point it at a persistent disk (e.g. /data). */
const DATA=process.env.DATA_DIR||path.join(__dirname,'data'),DB=path.join(DATA,'orders.json');
if(process.env.NODE_ENV==='production'&&(PASS==='root'||PASS.length<8)){console.error('Refusing to start: set ADMIN_PASSWORD to something of 8+ characters (not "root") before going live.');process.exit(1)}
const TRUST=process.env.TRUST_PROXY==='1';
/* SITE_PRIVATE=1: test mode. Tells Google and other search engines not to list the site. Remove it when you officially launch. */
const PRIVATE=process.env.SITE_PRIVATE==='1';
const clientIp=req=>TRUST&&req.headers['x-forwarded-for']?String(req.headers['x-forwarded-for']).split(',')[0].trim():req.socket.remoteAddress;
/* write to a temp file then rename, so a crash can never leave a half-written file */
const writeSafe=(f,d)=>{fs.mkdirSync(path.dirname(f),{recursive:true});const t=f+'.tmp';fs.writeFileSync(t,JSON.stringify(d,null,1));fs.renameSync(t,f)};
const ROOT=__dirname,MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain','.xml':'application/xml'};
const W={};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/products.js'),'utf8'),{window:W});
const P=W.PRODUCTS,PAYC=W.PAYMENT||{};
/* which payment methods buyers may use right now (GCash/bank only once their details are filled in) */
const payOK=m=>m==='cod'||(m==='gcash'&&!!(PAYC.gcash&&PAYC.gcash.number))||(m==='bank'&&!!(PAYC.bank&&PAYC.bank.number));
/* Admin edits (price, stock, out-of-stock) are saved in data/products.json and laid over the defaults in js/products.js */
const PRF=path.join(DATA,'products.json');
let ov={};try{ov=JSON.parse(fs.readFileSync(PRF,'utf8'))}catch(e){}
const savePr=()=>writeSafe(PRF,ov);
const KEYS=['price','stock','available'];
function live(){return P.map(b=>{const o=ov[b.id]||{},p=JSON.parse(JSON.stringify(b));
  KEYS.forEach(k=>{if(k in o)p[k]=o[k]});
  if(p.variants)p.variants.forEach(v=>{const w=(o.variants||{})[v.name]||{};KEYS.forEach(k=>{if(k in w)v[k]=w[k]})});
  return p})}
const avail=x=>x.available!==false&&(x.stock==null||x.stock>0);
const num=x=>x===null||x===undefined||x===''?null:(isFinite(+x)?+x:NaN);
/* take (-1) or give back (+1) stock for the lines of an order */
function adjust(list,sign){const L=live();
  (list||[]).forEach(l=>{const cur=L.find(x=>x.id===l.id);if(!cur)return;
    const tg=l.v!=null?(cur.variants||[]).find(v=>v.name===l.v):cur;if(!tg||tg.stock==null)return;
    let t=ov[l.id]=ov[l.id]||{};if(l.v!=null){t.variants=t.variants||{};t=t.variants[l.v]=t.variants[l.v]||{}}
    t.stock=Math.max(0,tg.stock+sign*l.q)});savePr()}
function cancel(o,by,why){if(o.status==='Cancelled')return;o.status='Cancelled';o.cancelReason=why||'';o.history.push({s:'Cancelled',t:Date.now(),by:by});adjust(o.stk,1);save()}
const FLOW={ship:['Received','Confirmed','Preparing','Shipped','Out for delivery','Delivered'],pick:['Received','Confirmed','Preparing','Ready for pick-up','Completed']};
fs.mkdirSync(DATA,{recursive:true});
let orders=[];try{orders=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){}
const save=()=>writeSafe(DB,orders);
const INQ=path.join(DATA,'inquiries.json');
let inquiries=[];try{inquiries=JSON.parse(fs.readFileSync(INQ,'utf8'))}catch(e){}
const saveInq=()=>writeSafe(INQ,inquiries);
const tokens=new Map(),hits={},TTL=12*36e5;
const digits=s=>String(s||'').replace(/\D/g,'').slice(-10);
const pub=o=>({code:o.code,status:o.status,flow:FLOW[o.ship?'ship':'pick'],ship:o.ship,items:o.items,subtotal:o.subtotal,fee:o.fee,zone:o.zone||'',pay:o.pay||'cod',paid:!!o.paid,total:o.total,address:o.address,created:o.created,history:o.history,name:o.name,review:o.review||null,cancelReason:o.cancelReason||''});
function json(res,c,d){res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(d))}
function body(req){return new Promise((ok,no)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e5){req.destroy();no()}});req.on('end',()=>{try{ok(JSON.parse(b||'{}'))}catch(e){no(e)}})})}
const admin=req=>{const k=(req.headers.authorization||'').replace('Bearer ',''),e=tokens.get(k);if(!e)return false;if(e<Date.now()){tokens.delete(k);return false}return true};
function build(d){
  if(!d.name||!digits(d.phone)||!Array.isArray(d.cart)||!d.cart.length)return{err:'Please fill in your name, phone and at least one item.'};
  let sub=0,items=[],need={};const LP=live();
  for(const l of d.cart){const p=LP.find(x=>x.id===l.id),v=p&&p.variants?p.variants[l.v]:null,q=Math.min(99,Math.max(1,+l.q|0));
    if(!p||!avail(p)||(p.variants&&(!v||!avail(v))))return{err:'Sorry, an item in your order is out of stock. Please remove it and try again.'};
    const pr=v&&v.price!=null?v.price:p.price;if(pr==null)return{err:'An item has no price yet. Please call us.'};
    const tg=v||p,k=p.id+'|'+(v?v.name:''),nm=p.name+(v?' ('+v.name+')':'');
    const n=need[k]=need[k]||{id:p.id,v:v?v.name:null,q:0};n.q+=q;
    if(tg.stock!=null&&n.q>tg.stock)return{err:'Sorry, only '+tg.stock+' left of '+nm+'. Please lower the quantity.'};
    sub+=pr*q;items.push({name:nm,q,price:pr})}
  let fee=0,a=null,zone='';
  if(d.ship){a=d.address||{};if(!a.street||!a.city||!a.barangay)return{err:'Please complete your delivery address.'};
    if(a.country&&a.country!=='Philippines')return{err:'Sorry, we only deliver within the Philippines.'};
    const z=W.shipFee({city:String(a.city),barangay:String(a.barangay),province:String(a.province||''),region:String(a.region||'')});fee=z.fee;zone=z.zone}
  const pay=String(d.pay||'cod');if(!payOK(pay))return{err:'That payment method is not available yet. Please choose another.'};
  return{o:{code:'PH-'+crypto.randomBytes(3).toString('hex').toUpperCase(),status:'Received',ship:!!d.ship,name:String(d.name).slice(0,80),phone:String(d.phone).slice(0,30),email:String(d.email||'').slice(0,80),notes:String(d.notes||'').slice(0,300),pay,paid:false,zone,items,stk:Object.values(need),subtotal:sub,fee,total:sub+fee,address:a,created:Date.now(),history:[{s:'Received',t:Date.now()}]}}}
http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://x'),p=u.pathname;
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(PRIVATE)res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(p==='/admin'||p==='/admin.html'||p.startsWith('/api/')){res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Frame-Options','DENY')}
  try{
    if(p==='/robots.txt'&&PRIVATE){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('User-agent: *\nDisallow: /\n')}
    if(p==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok')}
    if(p==='/api/orders'&&req.method==='POST'){const ip=clientIp(req);hits[ip]=(hits[ip]||0)+1;setTimeout(()=>hits[ip]--,6e4);if(hits[ip]>10)return json(res,429,{error:'Too many orders. Try again later.'});
      const r=build(await body(req));if(r.err)return json(res,400,{error:r.err});orders.push(r.o);adjust(r.o.stk,-1);save();return json(res,201,pub(r.o))}
    if(p==='/api/payment'&&req.method==='GET'){return json(res,200,{cod:true,gcash:payOK('gcash'),bank:payOK('bank')})}
    if(p==='/api/products'&&req.method==='GET'){res.setHeader('Cache-Control','no-store');return json(res,200,live())}
    if(p==='/api/cancel'&&req.method==='POST'){const d=await body(req),o=orders.find(x=>x.code===String(d.code||'').toUpperCase().trim()&&digits(x.phone)===digits(d.phone));
      if(!o)return json(res,404,{error:'Order not found.'});
      if(o.status==='Cancelled')return json(res,200,pub(o));
      if(o.status!=='Received')return json(res,400,{error:'This order was already confirmed, so it can no longer be cancelled here. Please contact us.'});
      const why=String(d.reason||'').trim().slice(0,300);if(!why)return json(res,400,{error:'Please tell us why you are cancelling.'});
      cancel(o,'customer',why);return json(res,200,pub(o))}
    if(p==='/api/inquiries'&&req.method==='POST'){const ip='i'+clientIp(req);hits[ip]=(hits[ip]||0)+1;setTimeout(()=>hits[ip]--,6e4);if(hits[ip]>5)return json(res,429,{error:'Too many messages. Please try again in a minute.'});
      const d=await body(req),c=(x,n)=>String(x==null?'':x).trim().slice(0,n);
      const q={id:Date.now().toString()+Math.floor(Math.random()*10),name:c(d.name,80),contact:c(d.contact,120),interest:c(d.interest,120),message:c(d.message,1500),created:Date.now(),read:false};
      if(!q.name||!q.contact)return json(res,400,{error:'Please enter your name and your phone or email.'});
      inquiries.push(q);saveInq();return json(res,201,{ok:true})}
    if(p==='/api/mine'&&req.method==='POST'){const d=await body(req),out=[];for(const k of(d.list||[]).slice(0,20)){const o=orders.find(x=>x.code===String(k.code).toUpperCase().trim()&&digits(x.phone)===digits(k.phone));if(o&&!out.includes(o))out.push(o)}return json(res,200,out.sort((a,b)=>b.created-a.created).map(pub))}
    if(p==='/api/review'&&req.method==='POST'){const d=await body(req),o=orders.find(x=>x.code===String(d.code).toUpperCase()&&digits(x.phone)===digits(d.phone));
      if(!o||!['Delivered','Completed'].includes(o.status)||o.review)return json(res,400,{error:'Cannot review this order.'});
      o.review={rating:Math.min(5,Math.max(1,+d.rating|0)),text:String(d.text||'').slice(0,500),t:Date.now()};save();return json(res,200,pub(o))}
    if(p==='/api/track'&&req.method==='GET'){const o=orders.find(x=>x.code===(u.searchParams.get('code')||'').toUpperCase().trim());
      if(!o||digits(o.phone)!==digits(u.searchParams.get('phone')))return json(res,404,{error:'No order found. Check your order number and phone.'});return json(res,200,pub(o))}
    if(p==='/api/admin/login'&&req.method==='POST'){const ip='l'+clientIp(req);hits[ip]=(hits[ip]||0)+1;setTimeout(()=>hits[ip]--,6e4);if(hits[ip]>8)return json(res,429,{error:'Too many attempts. Wait a minute.'});const d=await body(req);if(d.password!==PASS)return json(res,401,{error:'Wrong password'});const t=crypto.randomBytes(20).toString('hex');tokens.set(t,Date.now()+TTL);return json(res,200,{token:t})}
    if(p.startsWith('/api/admin/')){if(!admin(req))return json(res,401,{error:'Login required'});
      if(p==='/api/admin/orders')return json(res,200,orders.slice().reverse().map(o=>Object.assign(pub(o),{phone:o.phone,email:o.email,notes:o.notes})));
      if(p==='/api/admin/products'&&req.method==='GET')return json(res,200,live());
      const pm=p.match(/^\/api\/admin\/products\/([\w-]+)$/);if(pm&&req.method==='PATCH'){const d=await body(req),cur=live().find(x=>x.id===pm[1]);
        if(!cur)return json(res,404,{error:'Product not found'});
        let tg=cur;if(d.variant!=null){tg=(cur.variants||[]).find(v=>v.name===d.variant);if(!tg)return json(res,404,{error:'Option not found'})}
        let pr,st;
        if('price' in d){pr=num(d.price);if(pr!==null&&(isNaN(pr)||pr<0||pr>1e7))return json(res,400,{error:'Enter a valid price.'})}
        if('stock' in d){st=num(d.stock);if(st!==null&&(isNaN(st)||st<0||st>1e6||st%1))return json(res,400,{error:'Stock must be a whole number (0 or more), or empty for no limit.'})}
        let t=ov[cur.id]=ov[cur.id]||{};if(d.variant!=null){t.variants=t.variants||{};t=t.variants[d.variant]=t.variants[d.variant]||{}}
        if('price' in d)t.price=pr;
        if('stock' in d){if(st>0&&tg.stock===0)t.available=true;t.stock=st}
        if('available' in d)t.available=!!d.available;
        savePr();return json(res,200,live().find(x=>x.id===cur.id))}
      if(p==='/api/admin/inquiries'&&req.method==='GET')return json(res,200,inquiries.slice().reverse());
      const qm=p.match(/^\/api\/admin\/inquiries\/(\d+)$/);if(qm&&req.method==='PATCH'){const q=inquiries.find(x=>x.id===qm[1]),d=await body(req);
        if(!q)return json(res,404,{error:'Not found'});q.read=!!d.read;saveInq();return json(res,200,q)}
      const m=p.match(/^\/api\/admin\/orders\/([\w-]+)$/);if(m&&req.method==='PATCH'){const o=orders.find(x=>x.code===m[1]),d=await body(req);
        if(!o)return json(res,404,{error:'Not found'});
        if('paid' in d&&!d.status){o.paid=!!d.paid;save();return json(res,200,pub(o))}if(![...FLOW.ship,...FLOW.pick,'Cancelled'].includes(d.status))return json(res,400,{error:'Bad status'});
        if(o.status==='Cancelled')return json(res,400,{error:'A cancelled order cannot be reopened.'});
        if(d.status==='Cancelled')cancel(o,'admin');else{o.status=d.status;o.history.push({s:d.status,t:Date.now()});save()}
        return json(res,200,pub(o))}}
    let f=path.normalize(path.join(ROOT,p==='/'?'index.html':p));
    if(p==='/admin')f=path.join(ROOT,'admin.html');
    else if(!path.extname(f)&&fs.existsSync(f+'.html'))f+='.html';
    const rel=path.relative(ROOT,f);if(rel.startsWith('..')||!MIME[path.extname(f)]||/^(data|server\.js)/.test(rel)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found')}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)],'Cache-Control':/\.(jpg|png|webp|svg|ico)$/.test(f)?'public, max-age=86400':'no-cache'});fs.createReadStream(f).pipe(res);
  }catch(e){json(res,500,{error:'Server error'})}
}).listen(PORT,'0.0.0.0',()=>console.log('Plant Habitat running on http://localhost:'+PORT+(PASS==='root'?'  (WARNING: set ADMIN_PASSWORD)':'')+'  Admin: /admin'));

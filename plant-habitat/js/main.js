var m=document.getElementById('menu'),l=document.getElementById('links');
m.onclick=function(){var o=l.classList.toggle('open');m.setAttribute('aria-expanded',o)};
l.onclick=function(){l.classList.remove('open');m.setAttribute('aria-expanded','false')};
var _f=document.getElementById('f');
if(_f)_f.onsubmit=function(e){
  e.preventDefault();
  var f=e.target,ok=document.getElementById('ok'),b=f.querySelector('button[type=submit]'),label=b.textContent;
  function val(n){var el=f.elements[n];return el?el.value:''}
  function say(t,bad){
    ok.textContent=t;ok.style.display='block';ok.style.borderLeftColor=bad?'#b00020':'#2e7d32';ok.style.fontWeight='600';
    if(ok.scrollIntoView)ok.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  b.disabled=true;b.textContent='Sending…';ok.style.display='none';
  fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:val('name'),contact:val('contact'),interest:val('interest'),message:val('message')})})
    .then(function(r){
      return r.text().then(function(t){var d={};try{d=JSON.parse(t)}catch(x){}return{ok:r.ok&&d.ok===true,status:r.status,d:d}});
    })
    .then(function(x){
      b.disabled=false;b.textContent=label;
      if(x.ok){f.reset();say('✅ Sent successfully! Thank you, we will get back to you soon.')}
      else if(x.d&&x.d.error)say(x.d.error,true);
      else say('Sorry, your inquiry was not sent (error '+x.status+'). Please try again in a moment.',true);
    })
    .catch(function(err){
      if(window.console)console.error('Inquiry failed',err);
      b.disabled=false;b.textContent=label;
      say('Sorry, your inquiry was not sent. Please check your internet connection and try again.',true);
    });
};


// Gallery lightbox: click a photo to see it large; arrows / swipe / keys move between photos.
(function(){
  var lb=document.getElementById('lb'),im=document.getElementById('lb-i'),cp=document.getElementById('lb-c'),g=document.querySelector('.gal'),list=[],i=0,x0=0;
  if(!lb||!g)return;
  function show(n){i=(n+list.length)%list.length;var f=list[i],s=f.querySelector('img');im.src=s.currentSrc||s.src;im.alt=s.alt;cp.textContent=f.querySelector('figcaption').textContent}
  function open(f){list=[].slice.call(g.querySelectorAll('figure:not(.no-photo)'));i=list.indexOf(f);if(i<0)return;lb.hidden=false;document.body.classList.add('lock');show(i);lb.querySelector('.lb-x').focus()}
  function close(){lb.hidden=true;document.body.classList.remove('lock')}
  [].forEach.call(g.querySelectorAll('figure'),function(f){f.tabIndex=0;f.setAttribute('role','button')});
  g.addEventListener('click',function(e){var f=e.target.closest('figure');if(f&&!f.classList.contains('no-photo'))open(f)});
  g.addEventListener('keydown',function(e){var f=e.target.closest('figure');if(f&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(!f.classList.contains('no-photo'))open(f)}});
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-x'))close();else if(e.target.classList.contains('lb-p'))show(i-1);else if(e.target.classList.contains('lb-n'))show(i+1)});
  lb.addEventListener('touchstart',function(e){x0=e.changedTouches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>50)show(i+(d<0?1:-1))});
  document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(i-1);else if(e.key==='ArrowRight')show(i+1)});
})();

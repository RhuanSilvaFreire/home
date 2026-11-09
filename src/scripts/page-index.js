// Scrollspy nav
(function(){
  var sections=document.querySelectorAll('section[id],footer[id]');
  var links=document.querySelectorAll('.nav-link');
  if(!sections.length)return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var id=e.target.id;
        links.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+id)});
      }
    });
  },{threshold:0,rootMargin:'-40% 0px -55% 0px'});
  sections.forEach(function(s){io.observe(s)});
})();

// Rastreia cliques nos trabalhos e CTAs via dataLayer (compativel com GTM lazy)
(function(){
  function track(event, params){
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:event},params));
  }
  document.querySelectorAll('.work-row').forEach(function(el){
    el.addEventListener('click',function(){
      track('click_trabalho',{project_name:el.querySelector('.work-name').textContent,project_url:el.getAttribute('href')});
    });
  });
  document.querySelectorAll('.btn,.btn-white,.footer-social-link,.about-link').forEach(function(el){
    el.addEventListener('click',function(){
      track('click_cta',{label:(el.getAttribute('aria-label')||el.textContent).trim(),href:el.getAttribute('href')});
    });
  });
})();

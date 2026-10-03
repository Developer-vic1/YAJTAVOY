(function(L){
  const A=L.core.Access;
  const R=L.core.Router={
    current:'home',
    navigate(view,history=true){view=A.resolve(view);const modal=document.getElementById('modal');if(modal?.open)modal.close();this.current=view;if(history)window.location.hash=view;else if(location.hash!=='#'+view)window.history?.replaceState(null,'','#'+view);L.app.render(true);window.scrollTo({top:0,behavior:'instant'});},
    init(){const requested=location.hash.slice(1) || 'home';this.current=A.resolve(requested);if(requested!==this.current)window.history?.replaceState(null,'','#'+this.current);window.addEventListener('hashchange',()=>{const next=location.hash.slice(1) || 'home';if(next!==this.current)this.navigate(next,false);});}
  };
})(window.LlajtaVoy);

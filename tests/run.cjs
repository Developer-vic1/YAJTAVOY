/* Evaluador de scripts clásicos con APIs instrumentadas. Sin navegador ni servidor. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),sources={};
function collect(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())collect(p);else if(p.endsWith('.js'))sources[p]=fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');}}
collect('js');collect('tests');
let syntax=0;for(const [name,source]of Object.entries(sources)){new vm.Script(source,{filename:name});syntax++;}
new vm.Script(fs.readFileSync(path.join(root,'assets/vendor/leaflet/leaflet.js'),'utf8'));syntax++;
const storage=new Map(),errors=[];let tick=0;
const context=vm.createContext({window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>tick},setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(()=>{tick+=1000;fn(tick);},20),cancelAnimationFrame:clearTimeout,console:{error:(...args)=>errors.push(args.map(String).join(' '))}});
context.window.location={protocol:'file:'};
const load=p=>vm.runInContext(sources[p],context,{filename:p});
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of index.matchAll(/<script src="(js\/[^\"]+)"/g))if(!['js/app.js','js/core/router.js','js/core/access.js'].includes(match[1]))load(match[1]);
for(const name of ['core','tracking','routing','maps','navigation','roles','communication','render'])load('tests/'+name+'.spec.js');
const L=context.window.LlajtaVoy;
(async()=>{const groups={};try{
  groups.core=await L.verifyCore();groups.tracking=await L.verifyTracking();groups.routing=L.verifyRouting(sources['js/maps/street-network.js']);
  groups.maps=context.window.verifyLlajtaMaps(sources,sources['js/maps/street-data.js'],sources['js/maps/landmark-data.js']);
  groups.navigation=await context.window.verifyLlajtaNavigation(sources['js/app.js'],sources['js/core/router.js'],sources['js/core/access.js']);
  groups.roles=await L.verifyRoles();groups.communication=await L.verifyCommunication();load('js/core/access.js');groups.render=L.verifyRoleViews();
  if(errors.length)throw Error('Errores EventBus: '+errors.join('\n'));
  const report={date:new Date().toISOString(),environment:'Node.js con almacenamiento, reloj, DOM y Leaflet instrumentados; sin navegador',syntaxSources:syntax,passed:Object.values(groups).reduce((n,g)=>n+g.length,0),groups};
  fs.writeFileSync(path.join(__dirname,'resultados-accesos.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,syntaxSources:syntax,groups:Object.fromEntries(Object.entries(groups).map(([k,g])=>[k,g.length]))},null,2));
}finally{L.services.TrackingService.stopAll();L.core.EventBroker.stop();L.maps.MapManager.destroy();}})().catch(error=>{console.error(error);process.exitCode=1;});

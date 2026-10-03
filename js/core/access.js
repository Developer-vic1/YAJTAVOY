(function(L){
  'use strict';const DB=L.core.DatabaseService;
  const roles={
    client:{title:'Cliente',view:'cliente',icon:'shopping_cart',description:'Encuentra tu comida favorita y sigue tu pedido.',tasks:['Explorar restaurantes','Pedir y pagar','Seguir entregas y consultar comprobantes']},
    restaurant:{title:'Restaurante',view:'restaurante',icon:'restaurant',description:'Organiza tu cocina y los pedidos de tu establecimiento.',tasks:['Aceptar y preparar pedidos','Administrar el menú','Coordinar la recogida']},
    driver:{title:'Repartidor',view:'repartidor',icon:'two_wheeler',description:'Recibe ofertas y lleva cada pedido a su destino.',tasks:['Indicar disponibilidad','Recoger y entregar','Contactar a cocina, cliente y operaciones']},
    admin:{title:'Administración',view:'operaciones',icon:'monitoring',description:'Supervisa el servicio y coordina la operación.',tasks:['Gestionar restaurantes y repartidores','Supervisar pedidos y pagos','Atender incidentes y mensajes']},
    'payment-provider':{title:'Gestión de pagos',view:'pagos',icon:'payments',description:'Consulta los cobros y reembolsos del servicio de pagos.',tasks:['Revisar transacciones','Consultar estados','Ver referencias de comprobantes']}
  };
  const A=L.core.Access={
    roles,current:null,isPublic:view=>['home','roles'].includes(view),
    select(role,id){if(!roles[role])L.fail('Elige un rol disponible',422);id=role==='client'?'c1':role==='admin'?'admin':role==='payment-provider'?'local-payment-provider':id;if(role==='restaurant')L.services.CatalogService.restaurant(id);if(role==='driver')L.services.DriverService.get(id);this.current={role,id};if(role==='restaurant')L.views.restaurante.id=id;if(role==='driver')L.views.repartidor.id=id;DB.change(s=>{s.activeSpace={role,id};});return roles[role].view;},
    init(){const saved=DB.state.activeSpace;this.current=null;if(saved)try{this.select(saved.role,saved.id);}catch(_){DB.change(s=>{s.activeSpace=null;});}},
    resolve(view){if(this.isPublic(view))return view;if(this.current && roles[this.current.role]?.view===view && L.views[view])return view;return 'roles';},
    profile(){const c=this.current;if(!c)return 'Elige tu espacio';return c.role==='restaurant'?L.services.CatalogService.restaurant(c.id).name:c.role==='driver'?L.services.DriverService.get(c.id).name:c.role==='client'?DB.state.customer.name:roles[c.role].title;},
    menu(view){const item=(action,label,data,icon,active=false)=>[action,label,data,icon,active],change=item('navigate','Roles',{view:'roles'},'person',view==='roles');
      if(this.isPublic(view))return [item('navigate','Inicio',{view:'home'},'home',view==='home'),change];
      const role=this.current?.role,rows=[];
      if(role==='client')for(const [tab,label,icon]of [['Inicio','Restaurantes','restaurant'],['Carrito','Mi carrito','shopping_cart'],['Pedido','Seguir pedido','route'],['Historial','Mis pedidos','receipt_long'],['Notificaciones','Avisos','notifications']])rows.push(item('client-tab',label,{tab},icon,L.views.cliente.tab===tab));
      if(role==='restaurant')for(const [tab,icon]of [['Pedidos','receipt_long'],['Menú','restaurant'],['Historial','schedule'],['Estadísticas','monitoring']])rows.push(item('restaurant-tab',tab,{tab},icon,L.views.restaurante.tab===tab));
      if(role==='driver')rows.push(item('navigate','Mis entregas',{view:'repartidor'},'two_wheeler',true));
      if(role==='admin')for(const [tab,icon]of [['Resumen','monitoring'],['Pedidos','receipt_long'],['Restaurantes','restaurant'],['Repartidores','two_wheeler'],['Incidentes','warning'],['Pagos','payments']])rows.push(item('admin-tab',tab,{tab},icon,L.views.operaciones.tab===tab));
      if(role==='payment-provider')rows.push(item('navigate','Transacciones',{view:'pagos'},'payments',true));
      if(role!=='payment-provider')rows.push(item('show-inbox','Mensajes',{},'notifications'));
      rows.push(item('switch-profile','Cambiar espacio',{},'person'),change);return rows;
    }
  };
  L.EventBus.on('system:reset',()=>{A.current=null;DB.state.activeSpace=null;if(L.core.Router?.navigate && !A.isPublic(L.core.Router.current))L.core.Router.navigate('roles');});
})(window.LlajtaVoy);

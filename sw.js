self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(clients.claim());});
self.addEventListener('push',function(e){
  var data={title:'FinanzIA',body:'',icon:'/icon-192.png',page:''};
  try{if(e.data)data=e.data.json();}catch(ex){}
  e.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body||'',
      icon:data.icon||'/icon-192.png',
      badge:'/icon-192.png',
      vibrate:[200,100,200],
      data:{page:data.page||''},
      tag:data.tag||(data.title+'-'+Date.now())
    })
  );
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var page=e.notification.data&&e.notification.data.page?e.notification.data.page:'';
  var url=page?'/?notif_page='+page:'/';
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
      for(var i=0;i<list.length;i++){
        if(list[i].url&&list[i].focus){
          list[i].postMessage({type:'notif_page',page:page});
          list[i].focus();
          return;
        }
      }
      if(clients.openWindow){return clients.openWindow(url);}
    })
  );
});

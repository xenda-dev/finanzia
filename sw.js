self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(clients.claim());});
self.addEventListener('push',function(e){
  var data={title:'FinanzIA',body:'',icon:'/icon-192.png'};
  try{if(e.data)data=e.data.json();}catch(ex){}
  e.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body||'',
      icon:data.icon||'/icon-192.png',
      badge:'/icon-192.png',
      vibrate:[200,100,200]
    })
  );
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){if(list[i].url&&list[i].focus){list[i].focus();return;}}
    if(clients.openWindow){return clients.openWindow('/');}
  }));
});

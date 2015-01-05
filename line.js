(function(z,m){
  try{document.cookie=z+'='+m;}
  catch(e){}

  try{sessionStorage.setItem(z,m);}
  catch(e){}

  try{localStroage.setItem(z,m);}
  catch(e){}
}('{zipline:name}','{zipline:major}'));

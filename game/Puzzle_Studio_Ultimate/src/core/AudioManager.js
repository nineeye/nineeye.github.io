export default class AudioManager {



constructor(){


this.enabled=true;


this.volume=0.5;



}



play(type){


if(!this.enabled)
return;



const audio =
new Audio();



switch(type){


case "move":


audio.src =
"assets/move.wav";

break;



case "win":


audio.src =
"assets/win.wav";

break;



default:

return;



}



audio.volume =
this.volume;



audio.play()
.catch(()=>{});



}



toggle(){


this.enabled =
!this.enabled;



}



}

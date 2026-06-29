export default class AudioManager {



constructor(){


this.enabled=true;


this.volume=0.5;



}



play(type){


if(!this.enabled)
return;



let src="";



if(type==="move")

src="assets/move.wav";



if(type==="win")

src="assets/win.wav";



if(!src)
return;



const audio =
new Audio(src);



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

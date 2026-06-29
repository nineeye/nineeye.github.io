export default class Audio {


constructor(){


this.enabled=true;



}



play(src){



if(!this.enabled)
return;



const sound =
new window.Audio(src);



sound.play()
.catch(()=>{});



}



}

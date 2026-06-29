export default class AudioManager{

    constructor(){

        this.sounds=new Map();

    }

    load(name,src){

        const audio=new Audio(src);

        this.sounds.set(name,audio);

    }

    play(name){

        const audio=this.sounds.get(name);

        if(!audio) return;

        audio.currentTime=0;

        audio.play();

    }

}
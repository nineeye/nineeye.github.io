export default class GameLoop{

    constructor(update,render){

        this.update=update;
        this.render=render;

        this.last=0;

    }

    start(){

        requestAnimationFrame(this.loop.bind(this));

    }

    loop(time){

        const delta=(time-this.last)/1000;

        this.last=time;

        this.update(delta);

        this.render();

        requestAnimationFrame(this.loop.bind(this));

    }

}
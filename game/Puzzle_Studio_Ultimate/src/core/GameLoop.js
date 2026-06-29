export default class GameLoop {


constructor(engine,sceneManager){

    this.engine = engine;

    this.sceneManager =
        sceneManager;


    this.running=false;


}



start(){

    this.running=true;

    this.frame();


}



frame(){


if(!this.running)
return;



this.engine.clear();



const scene =
this.sceneManager.current;



if(scene){


    if(scene.update)
        scene.update();


    if(scene.draw)
        scene.draw(
            this.engine.ctx
        );


}



requestAnimationFrame(
()=>this.frame()
);



}



}

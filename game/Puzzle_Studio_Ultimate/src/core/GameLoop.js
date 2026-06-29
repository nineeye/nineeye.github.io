export default class GameLoop {



constructor(engine,sceneManager){



this.engine=engine;


this.sceneManager=sceneManager;


this.running=false;



}



start(){



this.running=true;



this.frame();



}



frame(){



if(!this.running)
return;



this.sceneManager.update();



this.engine.clear();



this.sceneManager.draw(

this.engine.ctx

);



requestAnimationFrame(

()=>this.frame()

);



}



stop(){



this.running=false;



}



}

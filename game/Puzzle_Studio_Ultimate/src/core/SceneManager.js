export default class SceneManager {



constructor(){


this.current=null;



}



change(scene){



if(this.current){

if(this.current.exit)

this.current.exit();



}



this.current=scene;



if(this.current.enter)

this.current.enter();



}



update(){



if(

this.current &&

this.current.update

){


this.current.update();



}



}



draw(ctx){



if(

this.current &&

this.current.draw

){


this.current.draw(ctx);



}



}



}

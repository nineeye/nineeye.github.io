export default class SceneManager {


constructor(){

    this.current=null;

}



change(scene){


    if(this.current &&
       this.current.exit){

        this.current.exit();

    }


    this.current=scene;



    if(scene.enter){

        scene.enter();

    }



}



}

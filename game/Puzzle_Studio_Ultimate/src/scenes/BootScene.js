import SlidingPuzzleScene
from "./SlidingPuzzleScene.js";



export default class BootScene{


constructor(manager){

    this.manager=manager;

}



enter(){


console.log(
"Boot Scene"
);



setTimeout(()=>{


this.manager.change(

new SlidingPuzzleScene()

);



},500);



}



}

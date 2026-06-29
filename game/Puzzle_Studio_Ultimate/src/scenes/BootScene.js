import SlidingPuzzleScene
from "./SlidingPuzzleScene.js";



export default class BootScene {


constructor(manager,input){


this.manager=manager;


this.input=input;



}



enter(){



console.log(

"BOOT"

);



setTimeout(()=>{


this.manager.change(

new SlidingPuzzleScene(

this.input

)

);



},300);



}



}

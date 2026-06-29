import MenuScene
from "./MenuScene.js";


export default class BootScene {


constructor(manager,input){


this.manager=manager;

this.input=input;



}



enter(){



console.log(
"Puzzle Studio Boot"
);



setTimeout(()=>{


this.manager.change(

new MenuScene(

this.manager,

this.input

)

);



},300);



}



}

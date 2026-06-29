import SlidingPuzzleScene
from "./SlidingPuzzleScene.js";


import Button
from "../../ui/button.js";


import MenuUI
from "../../ui/menu.js";



export default class MenuScene {



constructor(manager,input){


this.manager=manager;


this.input=input;



this.ui =
new MenuUI();



}



enter(){



const title =
document.createElement("h1");


title.innerText =
"Puzzle Studio Ultimate";



this.ui.add(title);



[3,4,5].forEach(size=>{


const btn =
new Button(

size+" x "+size

);



btn.onClick(()=>{


this.ui.hide();



this.manager.change(

new SlidingPuzzleScene(

this.input,

size

)

);



});



this.ui.add(

btn.element

);



});



this.ui.show();



}



update(){}



draw(){}



}

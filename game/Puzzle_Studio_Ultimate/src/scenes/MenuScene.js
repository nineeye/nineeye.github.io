import SlidingPuzzleScene
from "./SlidingPuzzleScene.js";



export default class MenuScene {



constructor(manager,input){


this.manager=manager;


this.input=input;


this.create();



}



create(){


this.container =
document.createElement("div");



this.container.style.position =
"absolute";


this.container.style.top =
"50%";


this.container.style.left =
"50%";


this.container.style.transform =
"translate(-50%,-50%)";


this.container.style.textAlign =
"center";



document.body.appendChild(
this.container
);



this.title =
document.createElement("h1");


this.title.innerText =
"Puzzle Studio Ultimate";


this.container.appendChild(
this.title
);



[3,4,5].forEach(size=>{


const btn =
document.createElement("button");


btn.innerText =
size+" x "+size;


btn.style.fontSize =
"25px";


btn.style.margin =
"10px";



btn.onclick=()=>{


this.remove();


this.manager.change(

new SlidingPuzzleScene(

this.input,

size

)

);



};



this.container.appendChild(btn);



});



}



remove(){


this.container.remove();



}



enter(){



}



update(){}



draw(){}



}

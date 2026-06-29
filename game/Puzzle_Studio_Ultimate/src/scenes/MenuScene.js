export default class MenuScene {



constructor(

manager,

input,

plugins,

audio

){


this.manager=manager;


this.input=input;


this.plugins=plugins;


this.audio=audio;



this.create();



}



create(){



const box =
document.createElement("div");



box.style.position="absolute";


box.style.top="50%";


box.style.left="50%";


box.style.transform=
"translate(-50%,-50%)";



const title =
document.createElement("h1");


title.innerText=

"Puzzle Studio Ultimate";



box.appendChild(title);



this.plugins.list()

.forEach(name=>{


const btn =
document.createElement("button");


btn.innerText=name;



btn.onclick=()=>{


const plugin =
this.plugins.get(name);



const scene =

plugin.createScene(

this.manager,

this.input,

{

id:1,

size:3

},

this.audio

);



box.remove();



this.manager.change(scene);



};



box.appendChild(btn);



});



document.body.appendChild(box);



}



enter(){}



update(){}



draw(){}



}

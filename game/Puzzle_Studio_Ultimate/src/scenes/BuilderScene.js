import Builder
from "../core/Builder.js";



export default class BuilderScene {



constructor(){


this.builder =
new Builder();



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
"Puzzle Builder";



box.appendChild(title);



const size =
document.createElement("input");


size.value=3;


size.type="number";



size.onchange=()=>{


this.builder.set(

"size",

Number(size.value)

);



};



box.appendChild(size);



const save =
document.createElement("button");


save.innerText="SAVE";


save.onclick=()=>{


this.builder.save();



alert(

"Project Saved"

);



};



box.appendChild(save);



document.body.appendChild(box);



}



enter(){}



update(){}



draw(){}



}

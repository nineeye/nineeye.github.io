import Builder
from "../core/Builder.js";


export default class BuilderScene {



constructor(
manager,
input,
plugins,
audio
){


this.manager=manager;


this.builder=
new Builder();



}



enter(){


this.create();



}



create(){



this.box=document.createElement("div");


this.box.style.position="absolute";


this.box.style.top="50%";


this.box.style.left="50%";


this.box.style.transform=
"translate(-50%,-50%)";


this.box.style.background="#111";


this.box.style.color="white";


this.box.style.padding="40px";


this.box.style.textAlign="center";


this.box.style.borderRadius="20px";



const title =
document.createElement("h1");


title.innerText=
"Puzzle Builder";


this.box.appendChild(title);





const text =
document.createElement("p");


text.innerText=
"퍼즐 크기 설정";


this.box.appendChild(text);





const size =
document.createElement("input");


size.type="number";


size.value=3;


size.style.fontSize="25px";


size.onchange=()=>{


this.builder.set(

"size",

Number(size.value)

);



};



this.box.appendChild(size);





const save =
document.createElement("button");


save.innerText=
"SAVE";


save.style.display="block";


save.style.margin="20px auto";


save.style.fontSize="22px";



save.onclick=()=>{


this.builder.save();


alert(

"PROJECT SAVED"

);



};



this.box.appendChild(save);





const home =
document.createElement("button");


home.innerText=
"HOME";



home.style.fontSize="22px";



home.onclick=()=>{


location.reload();



};



this.box.appendChild(home);



document.body.appendChild(this.box);



}



update(){}



draw(){}



}

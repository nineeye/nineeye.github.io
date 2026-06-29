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

}



enter(){


this.box=document.createElement("div");


this.box.style.position="absolute";

this.box.style.top="50%";

this.box.style.left="50%";

this.box.style.transform=
"translate(-50%,-50%)";


this.box.style.background="#111";

this.box.style.padding="40px";

this.box.style.borderRadius="20px";


this.box.style.textAlign="center";


this.box.style.minWidth="320px";


const title=document.createElement("h1");

title.innerText=
"Puzzle Studio Ultimate";


title.style.color="white";


this.box.appendChild(title);



this.plugins.list().forEach(name=>{


const btn=document.createElement("button");


btn.innerText=name;


btn.style.display="block";

btn.style.width="250px";

btn.style.margin="15px auto";

btn.style.padding="15px";


btn.style.fontSize="22px";



btn.onclick=()=>{


const plugin=
this.plugins.get(name);



this.box.remove();



this.manager.change(

plugin.createScene(

this.manager,

this.input,

{
id:1,
size:3
},

this.audio

)

);



};



this.box.appendChild(btn);



});




const builder=
document.createElement("button");


builder.innerText="BUILDER";


builder.style.width="250px";

builder.style.padding="15px";


builder.style.fontSize="22px";



builder.onclick=()=>{


this.box.remove();


};



this.box.appendChild(builder);



document.body.appendChild(this.box);



}



update(){}



draw(){}



}

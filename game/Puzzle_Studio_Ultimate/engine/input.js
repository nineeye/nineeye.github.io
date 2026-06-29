export default class Input {


constructor(canvas){


this.canvas=canvas;


this.listeners=[];


this.startX=0;

this.startY=0;



this.bind();



}



bind(){


this.canvas.addEventListener(

"click",

e=>{


const pos =
this.position(e);



this.emit(

{

type:"click",

x:pos.x,

y:pos.y

}

);



}

);



this.canvas.addEventListener(

"touchstart",

e=>{


const t =
e.touches[0];


this.startX=t.clientX;

this.startY=t.clientY;



}

);



this.canvas.addEventListener(

"touchend",

e=>{


const t =
e.changedTouches[0];


const dx =
t.clientX-this.startX;


const dy =
t.clientY-this.startY;



if(Math.abs(dx)>30 ||
Math.abs(dy)>30){


this.emit(

{

type:"swipe",

direction:

Math.abs(dx)>Math.abs(dy)

?

(dx>0?"right":"left")

:

(dy>0?"down":"up")

}

);



}



}

);



window.addEventListener(

"keydown",

e=>{


let dir=null;


if(e.key==="ArrowUp")
dir="up";


if(e.key==="ArrowDown")
dir="down";


if(e.key==="ArrowLeft")
dir="left";


if(e.key==="ArrowRight")
dir="right";



if(dir){


this.emit(

{

type:"key",

direction:dir

}

);



}



}

);



}



position(e){


const rect =
this.canvas.getBoundingClientRect();



return {


x:e.clientX-rect.left,

y:e.clientY-rect.top


};



}



on(callback){


this.listeners.push(callback);



}



emit(data){


this.listeners.forEach(

fn=>fn(data)

);



}



}

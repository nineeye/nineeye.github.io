export default class Input {


constructor(canvas){


this.canvas = canvas;


this.listeners = [];



canvas.addEventListener(

"click",

(e)=>{


const rect =
canvas.getBoundingClientRect();



const x =
e.clientX - rect.left;


const y =
e.clientY - rect.top;



this.emit(
x,
y
);



}

);



canvas.addEventListener(

"touchstart",

(e)=>{


const touch =
e.touches[0];


const rect =
canvas.getBoundingClientRect();



const x =
touch.clientX - rect.left;


const y =
touch.clientY - rect.top;



this.emit(
x,
y
);



}

);



}



on(callback){


this.listeners.push(
callback
);



}



emit(x,y){


this.listeners.forEach(

fn=>fn(x,y)

);



}



}

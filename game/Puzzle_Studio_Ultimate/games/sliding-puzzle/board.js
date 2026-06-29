import Tile from "./tile.js";


export default class Board {



constructor(size=3){


this.size=size;


this.tiles=[];


this.empty=size*size;


this.create();


}



create(){


let num=1;


for(let y=0;y<this.size;y++){


for(let x=0;x<this.size;x++){



if(num === this.size*this.size){

this.tiles.push(

new Tile(

0,

x*100,

y*100,

100

)

);



}else{


this.tiles.push(

new Tile(

num,

x*100,

y*100,

100

)

);


}



num++;



}



}



}



shuffle(){


for(
let i=this.tiles.length-1;
i>0;
i--
){


let j =
Math.floor(
Math.random()*(i+1)
);



[
this.tiles[i],
this.tiles[j]

]
=
[
this.tiles[j],
this.tiles[i]

];


}



this.updatePosition();


}



updatePosition(){


this.tiles.forEach(
(tile,index)=>{


let x =
index % this.size;


let y =
Math.floor(
index/this.size
);



tile.x=x*100;

tile.y=y*100;



});



}



click(x,y){


const index =
this.tiles.findIndex(

t=>t.contains(x,y)

);



if(index <0)
return;



const empty =
this.tiles.findIndex(

t=>t.value===0

);



const dx =
Math.abs(
(index%this.size)
-
(empty%this.size)
);



const dy =
Math.abs(

Math.floor(index/this.size)
-
Math.floor(empty/this.size)

);



if(dx+dy===1){



[
this.tiles[index],
this.tiles[empty]

]
=
[
this.tiles[empty],
this.tiles[index]

];


this.updatePosition();



}



}



draw(ctx){


this.tiles.forEach(

tile=>tile.draw(ctx)

);



}



isComplete(){


return this.tiles.every(

(tile,index)=>

tile.value===0 ||
tile.value===index+1

);



}



}

import Tile from "./tile.js";


export default class Board {



constructor(size=3){


this.size=size;


this.tiles=[];


this.create();



}



create(){


let number=1;



for(let y=0;y<this.size;y++){


for(let x=0;x<this.size;x++){


if(number <
this.size*this.size){


this.tiles.push(

new Tile(

number,

x*100,

y*100,

100

)

);


}


number++;


}



}



}



draw(ctx){


this.tiles.forEach(

tile=>tile.draw(ctx)

);



}



}

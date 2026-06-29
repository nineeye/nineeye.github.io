export default class Builder {



constructor(){


this.project = {


name:"Untitled Puzzle",


type:"sliding-puzzle",


size:3,


level:1



};



}



set(key,value){


this.project[key]=value;



}



get(){


return this.project;



}



export(){


return JSON.stringify(

this.project,

null,

2

);



}



save(){


localStorage.setItem(

"PuzzleBuilderProject",

this.export()

);



}



load(){


const data =

localStorage.getItem(

"PuzzleBuilderProject"

);



if(data){


this.project =
JSON.parse(data);


}



}



}

export default class Builder {


constructor(){


this.key =
"PuzzleBuilderProject";


this.project={


name:"Untitled Puzzle",

type:"sliding-puzzle",

size:3,

level:1


};



this.load();



}



set(key,value){


this.project[key]=value;



}



get(){


return this.project;



}



save(){


localStorage.setItem(

this.key,

JSON.stringify(

this.project

)

);



}



load(){


const data =
localStorage.getItem(

this.key

);



if(data){


this.project =
JSON.parse(data);



}



}



}

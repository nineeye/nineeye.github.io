export default class SaveManager {


constructor(){


this.key =
"PuzzleStudioSave";



}



load(){


const data =
localStorage.getItem(
this.key
);



if(!data){

return {

best:{}

};

}



return JSON.parse(data);



}



save(data){



localStorage.setItem(

this.key,

JSON.stringify(data)

);



}



getBest(size){



const data =
this.load();



return (

data.best[size]

|| null

);



}



setBest(size,moves){


const data =
this.load();



const current =
data.best[size];



if(
!current ||
moves < current
){


data.best[size]=moves;


this.save(data);


return true;



}



return false;



}



}

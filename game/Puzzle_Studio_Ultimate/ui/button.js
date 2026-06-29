export default class Button {


constructor(text){


this.element =
document.createElement("button");



this.element.innerText =
text;



this.element.style.fontSize =
"22px";


this.element.style.padding =
"10px";


this.element.style.margin =
"10px";



}



onClick(callback){


this.element.onclick =
callback;



}



show(parent=document.body){


parent.appendChild(

this.element

);



}



remove(){


this.element.remove();



}



}

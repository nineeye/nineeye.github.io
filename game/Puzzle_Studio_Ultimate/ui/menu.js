export default class MenuUI {


constructor(){


this.el =
document.createElement("div");



this.el.style.position =
"absolute";


this.el.style.top =
"50%";


this.el.style.left =
"50%";


this.el.style.transform =
"translate(-50%,-50%)";



}



add(element){


this.el.appendChild(

element

);



}



show(){


document.body.appendChild(

this.el

);



}



hide(){


this.el.remove();



}



}

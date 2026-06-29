export default class ResultUI {


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



this.el.style.color =
"white";


this.el.style.fontSize =
"45px";



}



show(text){


this.el.innerText=text;


document.body.appendChild(

this.el

);



}



hide(){


this.el.remove();



}



}

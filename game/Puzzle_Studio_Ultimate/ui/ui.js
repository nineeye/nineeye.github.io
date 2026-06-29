import Button
from "./button.js";



export default class UIManager {



constructor(){


this.items=[];



}



button(text,callback){



const btn =
new Button(text);



btn.onClick(
callback
);



btn.show();



this.items.push(btn);



return btn;



}



clear(){



this.items.forEach(

i=>i.remove()

);



this.items=[];



}



}

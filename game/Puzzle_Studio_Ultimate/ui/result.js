export default class ResultUI {



constructor(){


this.el =
document.createElement("div");



this.el.style.position=
"absolute";


this.el.style.top=
"50%";


this.el.style.left=
"50%";


this.el.style.transform=
"translate(-50%,-50%)";



this.el.style.color=
"white";


this.el.style.textAlign=
"center";


this.el.style.fontSize=
"40px";



}



show(moves){



this.el.innerHTML=

`
<div>
COMPLETE!
<br>
Moves : ${moves}

<br><br>

<button id="again">
AGAIN
</button>

</div>
`;



document.body.appendChild(

this.el

);



}



onAgain(callback){



const btn =
this.el.querySelector(

"#again"

);



if(btn)

btn.onclick=callback;



}



hide(){


if(this.el)

this.el.remove();



}



}

export default class InputManager{

    constructor(canvas){

        this.mouse={x:0,y:0,clicked:false};

        canvas.addEventListener("mousemove",(e)=>{

            const rect=canvas.getBoundingClientRect();

            this.mouse.x=e.clientX-rect.left;
            this.mouse.y=e.clientY-rect.top;

        });

        canvas.addEventListener("click",()=>{

            this.mouse.clicked=true;

        });

    }

    reset(){

        this.mouse.clicked=false;

    }

}
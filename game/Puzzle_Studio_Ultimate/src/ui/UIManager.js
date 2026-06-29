export default class UIManager{

    constructor(ctx){

        this.ctx=ctx;

    }

    text(text,x,y,size=32,color="#fff"){

        this.ctx.fillStyle=color;

        this.ctx.font=`${size}px Arial`;

        this.ctx.fillText(text,x,y);

    }

}
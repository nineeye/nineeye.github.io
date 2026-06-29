export default class Button{

    constructor(x,y,w,h,text,callback){

        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h;
        this.text=text;
        this.callback=callback;

    }

    draw(ctx){

        ctx.fillStyle="#3a6df0";
        ctx.fillRect(this.x,this.y,this.w,this.h);

        ctx.strokeStyle="#ffffff";
        ctx.strokeRect(this.x,this.y,this.w,this.h);

        ctx.fillStyle="#ffffff";
        ctx.font="26px Arial";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(this.text,this.x+this.w/2,this.y+this.h/2);

    }

    contains(mx,my){

        return(
            mx>=this.x &&
            mx<=this.x+this.w &&
            my>=this.y &&
            my<=this.y+this.h
        );

    }

}
export default class AssetManager{

    constructor(){

        this.images=new Map();

    }

    loadImage(name,src){

        return new Promise((resolve,reject)=>{

            const img=new Image();

            img.src=src;

            img.onload=()=>{

                this.images.set(name,img);

                resolve(img);

            };

            img.onerror=reject;

        });

    }

    getImage(name){

        return this.images.get(name);

    }

}
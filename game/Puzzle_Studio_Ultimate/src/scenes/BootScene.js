import MenuScene
from "./MenuScene.js";



export default class BootScene {



constructor(

manager,

input,

plugins,

audio

){


this.manager=manager;


this.input=input;


this.plugins=plugins;


this.audio=audio;



}



enter(){



this.manager.change(

new MenuScene(

this.manager,

this.input,

this.plugins,

this.audio

)

);



}



}

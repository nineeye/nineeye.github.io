import CanvasEngine from "./core/CanvasEngine.js";
import MenuScene from "./scenes/MenuScene.js";

window.addEventListener("DOMContentLoaded",()=>{

    const engine=new CanvasEngine("canvas");

    engine.start(new MenuScene());

});
import CanvasEngine from "./core/CanvasEngine.js";
import GameLoop from "./core/GameLoop.js";
import SceneManager from "./core/SceneManager.js";

import BootScene from "./scenes/BootScene.js";


const canvas = document.getElementById("game");


const engine = new CanvasEngine(canvas);


const sceneManager =
    new SceneManager();



sceneManager.change(
    new BootScene(
        sceneManager
    )
);



const loop =
    new GameLoop(
        engine,
        sceneManager
    );



loop.start();



window.PuzzleStudio = {

    engine,

    sceneManager,

    loop

};


console.log(
    "Puzzle Studio Ultimate Started"
);

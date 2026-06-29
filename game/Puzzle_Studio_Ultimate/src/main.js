import CanvasEngine
from "./core/CanvasEngine.js";


import GameLoop
from "./core/GameLoop.js";


import SceneManager
from "./core/SceneManager.js";


import Input
from "../engine/input.js";


import AudioManager
from "./core/AudioManager.js";


import PluginManager
from "./core/PluginManager.js";


import BootScene
from "./scenes/BootScene.js";


import BuilderScene
from "./scenes/BuilderScene.js";


import SlidingPuzzlePlugin
from "../plugins/sliding-puzzle.js";




// ========================
// Canvas
// ========================

const canvas =
document.getElementById("game");



if(!canvas){

    throw new Error(
        "Canvas #game not found"
    );

}



// ========================
// Core
// ========================


const engine =
new CanvasEngine(
    canvas
);



const input =
new Input(
    canvas
);



const audio =
new AudioManager();



const plugins =
new PluginManager();




// ========================
// Plugin Register
// ========================


plugins.register(

    "sliding-puzzle",

    SlidingPuzzlePlugin

);




// ========================
// Scene
// ========================


const sceneManager =
new SceneManager();




// ========================
// Start
// ========================


sceneManager.change(

    new BootScene(

        sceneManager,

        input,

        plugins,

        audio

    )

);




// ========================
// Loop
// ========================


const loop =
new GameLoop(

    engine,

    sceneManager

);



loop.start();




// ========================
// Global API
// ========================


window.PuzzleStudio = {


    engine,


    input,


    audio,


    plugins,


    sceneManager,


    loop,


    BuilderScene



};




console.log(

    "Puzzle Studio Ultimate Started"

);

import CanvasEngine
from "./core/CanvasEngine.js";


import GameLoop
from "./core/GameLoop.js";


import SceneManager
from "./core/SceneManager.js";


import BootScene
from "./scenes/BootScene.js";


import Input
from "../engine/input.js";



const canvas =
document.getElementById("game");



const engine =
new CanvasEngine(canvas);



const input =
new Input(canvas);



const sceneManager =
new SceneManager();



sceneManager.change(

new BootScene(

sceneManager,

input

)

);



const loop =
new GameLoop(

engine,

sceneManager

);



loop.start();



window.PuzzleStudio={


engine,

input,

sceneManager,

loop


};



console.log(

"Puzzle Studio Boot Complete"

);

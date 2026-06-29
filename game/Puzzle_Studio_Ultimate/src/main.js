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


import AudioManager
from "./core/AudioManager.js";



const canvas =
document.getElementById("game");



const engine =
new CanvasEngine(canvas);



const input =
new Input(canvas);



const audio =
new AudioManager();



const scenes =
new SceneManager();



scenes.change(

new BootScene(

scenes,

input

)

);



const loop =
new GameLoop(

engine,

scenes

);



loop.start();



window.PuzzleStudio={


engine,

input,

audio,

scenes,

loop


};



console.log(

"Puzzle Studio Ultimate Engine Ready"

);

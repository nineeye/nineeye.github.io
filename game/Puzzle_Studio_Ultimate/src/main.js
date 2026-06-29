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


import SlidingPuzzlePlugin
from "../plugins/sliding-puzzle.js";



const canvas =
document.getElementById("game");



const engine =
new CanvasEngine(canvas);



const input =
new Input(canvas);



const audio =
new AudioManager();



const plugins =
new PluginManager();



plugins.register(

"sliding-puzzle",

SlidingPuzzlePlugin

);



const scenes =
new SceneManager();



scenes.change(

new BootScene(

scenes,

input,

plugins,

audio

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

plugins,

scenes,

loop


};



console.log(

"Plugin System Ready"

);

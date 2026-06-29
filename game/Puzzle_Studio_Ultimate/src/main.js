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


import Config
from "./core/Config.js";


import Version
from "./core/Version.js";


import BootScene
from "./scenes/BootScene.js";


import BuilderScene
from "./scenes/BuilderScene.js";


import SlidingPuzzlePlugin
from "../plugins/sliding-puzzle.js";




// Canvas

const canvas =
document.getElementById(

Config.canvas.id

);



if(!canvas){

throw new Error(

"Canvas missing"

);

}




// Core


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




// Plugins


plugins.register(

"sliding-puzzle",

SlidingPuzzlePlugin

);




// Scene


const sceneManager =
new SceneManager();




// Start


sceneManager.change(

new BootScene(

sceneManager,

input,

plugins,

audio

)

);




// Loop


const loop =
new GameLoop(

engine,

sceneManager

);



loop.start();




// Global


window.PuzzleStudio = {


version:

Version,


config:

Config,


engine,


input,


audio,


plugins,


sceneManager,


loop,


BuilderScene



};



console.log(

Version.name +

" v" +

Version.version +

" Started"

);

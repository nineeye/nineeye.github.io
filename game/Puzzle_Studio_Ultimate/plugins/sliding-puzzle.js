import SlidingPuzzleScene
from "../src/scenes/SlidingPuzzleScene.js";



export default {


name:

"sliding-puzzle",



createScene(

manager,

input,

level,

audio

){



return new SlidingPuzzleScene(

input,

level,

audio

);



}



}

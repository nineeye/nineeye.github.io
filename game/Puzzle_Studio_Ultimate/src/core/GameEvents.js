/**
 * 게임 전체에서 사용하는 이벤트 이름.
 * 문자열 하드코딩 금지.
 */

const GameEvents = {

    GAME_START: "game:start",
    GAME_PAUSE: "game:pause",
    GAME_RESUME: "game:resume",

    SCENE_CHANGE: "scene:change",

    PUZZLE_START: "puzzle:start",
    PUZZLE_COMPLETE: "puzzle:complete",

    MOVE: "puzzle:move",

    SAVE: "save",

    LOAD: "load",

    SOUND_PLAY: "sound:play",

    THEME_CHANGED: "theme:changed",

    ACHIEVEMENT_UNLOCK: "achievement:unlock"

};

export default GameEvents;
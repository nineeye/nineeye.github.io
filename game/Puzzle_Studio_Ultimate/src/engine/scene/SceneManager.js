/**
 * Puzzle Studio Ultimate
 * Scene Manager
 */

class SceneManager {

    constructor(){

        this.current = null;

    }

    async change(scene){

        if(this.current){

            await this.current.onExit();

        }

        this.current = scene;

        await this.current.onEnter();

    }

    update(delta){

        if(this.current){

            this.current.update(delta);

        }

    }

    render(renderer){

        if(this.current){

            this.current.render(renderer);

        }

    }

}

export default new SceneManager();
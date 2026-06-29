export default class SceneManager {

    constructor() {

        this.current = null;

    }

    change(scene) {

        this.current = scene;

    }

    update(dt) {

        if (this.current && this.current.update) {
            this.current.update(dt);
        }

    }

    render(ctx) {

        if (this.current && this.current.render) {
            this.current.render(ctx);
        }

    }

}
/**
 * Loading Scene
 */

import ManifestLoader from "../asset/ManifestLoader.js";
import AssetManager from "../asset/AssetManager.js";

export default class LoadingScene {

    constructor(){

        this.progress = 0;

        this.message = "Initializing...";

    }

    async onEnter(){

        this.message = "Loading Manifest";

        await ManifestLoader.load();

        this.message = "Loading Assets";

        await AssetManager.loadAll();

        this.progress = 1;

        this.message = "Complete";

    }

    onExit(){}

    update(){

        this.progress = AssetManager.progress();

    }

    render(renderer){

        renderer.clear("#101418");

        renderer.text(
            "Puzzle Studio Ultimate",
            640,
            180,
            42
        );

        renderer.text(
            this.message,
            640,
            250,
            22
        );

        renderer.bar(

            340,
            330,

            600,
            24,

            this.progress

        );

        renderer.text(

            `${Math.floor(this.progress*100)} %`,

            640,

            390,

            18

        );

    }

}
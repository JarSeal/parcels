import LevelsData from '../data/LevelsData';

class LevelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.sceneState.loadingLevel = false;
        this.loadingData = false;
        this.texturesToLoad = 0;
        this.modelsToLoad = 0;
    }

    load(levelId) {
        this.texturesToLoad = 0;
        this.modelsToLoad = 0;
        this.sceneState.loadingLevel = true;
        this._loadLevelData(levelId);
    }

    _loadLevelData(levelId) {
        // Method for loading the current level data from the server

        // Temp fake loading..
        this.loadingData = true;
        setTimeout(() => {
            const data = new LevelsData(this.sceneState).getLevelsData(levelId);
            // console.log('DATA Loaded', data);
            this.loadingData = false;
            this._loadAssets(data);
        }, 500);
    }

    _loadAssets(data) {
        // Load all assets (modules, textures)


    }
}

export default LevelLoader;
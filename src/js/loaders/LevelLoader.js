import levelsData from '../data/levelsData';

class LevelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.sceneState.loadingLevel = false;
        this.loadingData = false;
        this.texturesToLoad = 0;
        this.modelsToLoad = 0;
    }

    load(levelId) {
        this.sceneState.loadingLevel = true;
        this._loadLevelData(levelId);
    }

    _loadAssets(data) {

    }

    _loadLevelData(levelId) {
        // Method for loading the current level data from the server

        // Temp fake loading..
        this.loadingData = true;
        setTimeout(() => {
            const data = levelsData[levelId];
            console.log('DATA Loaded', data);
            this.loadingData = false;
            this._loadAssets(data);
        }, 2000);
    }
}

export default LevelLoader;
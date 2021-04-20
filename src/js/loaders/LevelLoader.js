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
        this.loadingData = true;
        new LevelsData(this.sceneState).loadLevelsData(levelId, (data) => {
            this.loadingData = false;
            this._loadAssets(data);
        });
    }

    _loadAssets(data) {
        // Load all assets (modules, textures)
        this.sceneState.logger.log('Start loading assets...', data);

    }
}

export default LevelLoader;
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import LevelsData from '../data/LevelsData';

class LevelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.sceneState.loadingLevel = false;
        this.loadingData = false;
        this.loadingModels = false;
        this.loadingTextures = false;
        this.texturesLoaded = 0;
        this.totalTextures = 0;
        this.modelsLoaded = 0;
        this.totalModels = 0;
        this.modelLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
    }

    load(levelId) {
        this.texturesToLoad = 0;
        this.modelsToLoad = 0;
        this.sceneState.loadingLevel = true;
        this.loadingData = true;
        new LevelsData(this.sceneState).loadLevelsData(levelId, (data) => {
            this.loadingData = false;
            this._loadAssets(data);
            this._setSkyBox(data);
        });
    }

    _loadAssets(data) {
        const modules = data.modules;
        let modelKeys,
            textureKeys,
            path,
            tSize;
        // Load all assets (modules, textures)
        this.sceneState.logger.log('Start loading assets...', data);
        for(let m=0; m<modules.length; m++) {
            path = modules[m].path;
            tSize = '512_';
            const textures = modules[m].textures;
            for(let t=0; t<textures.length; t++) {
                textureKeys = Object.keys(textures[t]);
                for(let tk=0; tk<textureKeys.length; tk++) {
                    if(textures[t][textureKeys[tk]]) {
                        this.totalTextures++;
                        let tFile = path + tSize + textures[t][textureKeys[tk]];
                        this.textureLoader.load(tFile, (texture) => {
                            texture.flipY = false; // <-- Important for importing GLTF models!
                            this.texturesLoaded++;
                            this._checkAssetsLoading();
                        });
                    }
                }
            }
            const models = modules[m].models;
            for(let d=0; d<models.length; d++) {
                modelKeys = Object.keys(models[d]);
                for(let tk=0; tk<modelKeys.length; tk++) {
                    if(models[d][modelKeys[tk]]) {
                        this.totalModels++;
                        let mFile = path + models[d][modelKeys[tk]];
                        this.modelLoader.load(mFile, (gltf) => {
                            gltf;
                            this.modelsLoaded++;
                            this._checkAssetsLoading();
                        });
                    }
                }
            }
        }
    }

    _checkAssetsLoading() {
        const totalCount = this.totalTextures + this.totalModels;
        const nowLoadedCount = this.texturesLoaded + this.modelsLoaded;
        console.log('Assets loaded: ' + nowLoadedCount + ' / ' + totalCount);
        if(totalCount === nowLoadedCount) {
            console.log('ALL ASSETS LOADED!');
        }
    }

    _setSkyBox(data) {
        data;
        const urlParams = new URLSearchParams(window.location.search);
        let skyboxSize = urlParams.get('sb');
        if(skyboxSize !== '4096' && skyboxSize !== '2048' && skyboxSize !== '1024' && skyboxSize !== '512') skyboxSize = '2048';
        const cubeLoader = new THREE.CubeTextureLoader();
        const scene = this.sceneState.scenes[this.sceneState.curScene];
        scene.background = cubeLoader
            .setPath(this.sceneState.settings.assetsUrl + '/skyboxes/purpleBlue/')
            .load([
                'posx_'+skyboxSize+'.png', // right
                'negx_'+skyboxSize+'.png', // left
                'posy_'+skyboxSize+'.png', // top
                'negy_'+skyboxSize+'.png', // bottom
                'posz_'+skyboxSize+'.png', // front
                'negz_'+skyboxSize+'.png', // back
            ], (cubeMap) => {
                const blur = new THREE.PMREMGenerator(this.sceneState.renderer);
                const ibl = blur.fromCubemap(cubeMap);
                this.sceneState.curSkybox = ibl;
            });
    }
}

export default LevelLoader;
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import LevelsData from '../data/LevelsData';

class LevelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        sceneState.loadingLevel = false;
        this.loadingData = false;
        this.loadingModels = false;
        this.loadingTextures = false;
        this.modelsToLoad = 0;
        this.modelsLoaded = 0;
        this.texturesToLoad = 0;
        this.texturesLoaded = 0;
        this.modelLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.cubeLoader = new THREE.CubeTextureLoader();
        sceneState.levelAssets = {
            exteriorModules: {},
            interiorModules: {},
            roofModules: {},
            exteriorTextures: {},
            interiorTextures: {},
            roofTextures: {},
        };
        sceneState.curLevelMesh = null;
    }

    load(levelId) {
        this.modelsToLoad = 0;
        this.modelsLoaded = 0;
        this.texturesToLoad = 0;
        this.texturesLoaded = 0;
        this.sceneState.loadingLevel = true;
        this.loadingData = true;
        new LevelsData(this.sceneState).loadLevelsData(levelId, (data) => {
            this.loadingData = false;
            this.loadingModels = true;
            this.loadingTextures = true;
            this._loadModules(data);
            this._setSkyBox(data);
        });
    }

    _loadModules(data) {
        console.log(data);
        for(let modIndex=0; modIndex<data.modules.length; modIndex++) {
            const module = data.modules[modIndex];
            const urlAndPath = this.sceneState.settings.assetsUrl + module.path;
            for(let mIndex=0; mIndex<module.models.length; mIndex++) {
                const m = module.models[mIndex];
                const mKeys = Object.keys(m);
                for(let i=0; i<mKeys.length; i++) {
                    if(m[mKeys[i]]) {
                        this._loadModel(urlAndPath + m[mKeys[i]], mKeys[i]+'Modules', module.pos, modIndex, mIndex);
                    }
                }
            }
            for(let tIndex=0; tIndex<module.textures.length; tIndex++) {
                const t = module.textures[tIndex];
                const tKeys = Object.keys(t);
                for(let i=0; i<tKeys.length; i++) {
                    if(t[tKeys[i]]) {
                        this._loadTexture(urlAndPath + t[tKeys[i]], tKeys[i]+'Textures', module.textureExt, modIndex, tIndex);
                    }
                }
            }
        }
    }

    _loadModel = (url, type, pos, modIndex, partIndex) => {
        this.modelsToLoad++;
        this.modelLoader.load(url, (gltf) => {
            console.log('M loaded', gltf);
            this.modelsLoaded++;
            const mesh = gltf.scene.children[0];
            mesh.material.dispose();
            mesh.material = new THREE.MeshLambertMaterial();
            mesh.position.set(pos[2]-0.5, pos[0], pos[1]-0.5);
            console.log('MESH', mesh, modIndex);
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = mesh;
            this._checkLoadingStatus();
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
        });
    }

    _loadTexture(url, type, ext, modIndex, partIndex) {
        this.texturesToLoad++;
        const size = 512;
        this.textureLoader.load(url+'_'+size+'.'+ext, (texture) => {
            this.texturesLoaded++;
            texture.flipY = false; // <-- Important for importing GLTF models!
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = texture;
            this._checkLoadingStatus();
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
        });
    }

    _checkLoadingStatus() {
        if(this.modelsLoaded === this.modelsToLoad) this.loadingModels = false;
        if(this.texturesLoaded === this.texturesToLoad) this.loadingTextures = false;
        if(!this.loadingModels && !this.loadingTextures) {
            const extMods = this.sceneState.levelAssets.exteriorModules;
            const intMods = this.sceneState.levelAssets.interiorModules;
            const roofMods = this.sceneState.levelAssets.roofModules;
            const extKeys = Object.keys(this.sceneState.levelAssets.exteriorModules);
            for(let i=0; i<extKeys.length; i++) {
                if(extMods[extKeys[i]]) {
                    extMods[extKeys[i]].material.map = this.sceneState.levelAssets.exteriorTextures[extKeys[i]];
                    this.sceneState.scenes[this.sceneState.curScene].add(extMods[extKeys[i]]);
                }
                if(intMods[extKeys[i]]) {
                    intMods[extKeys[i]].material.map = this.sceneState.levelAssets.interiorTextures[extKeys[i]];
                    this.sceneState.scenes[this.sceneState.curScene].add(intMods[extKeys[i]]);
                }
                if(roofMods[extKeys[i]]) {
                    roofMods[extKeys[i]].material.map = this.sceneState.levelAssets.roofTextures[extKeys[i]];
                    this.sceneState.scenes[this.sceneState.curScene].add(roofMods[extKeys[i]]);
                }
            }
        }
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
                        this.totalModules++;
                        let mFile = path + models[d][modelKeys[tk]];
                        this.modelLoader.load(mFile, (gltf) => {
                            gltf;
                            this.modulesLoaded++;
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
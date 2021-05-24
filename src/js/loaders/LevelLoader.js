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
        this.skyboxLoaded = false;
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
        this.loadingScreenId = 'levelLoadingScreen';
    }

    load(levelId, callback) {
        this._updateLoadingScreen(true);
        this.modelsToLoad = 0;
        this.modelsLoaded = 0;
        this.texturesToLoad = 0;
        this.texturesLoaded = 0;
        this.skyboxLoaded = false;
        this.sceneState.loadingLevel = true;
        this.loadingData = true;
        this._createLevelCompoundShape();
        new LevelsData(this.sceneState).loadLevelsData(levelId, (data) => {
            this.loadingData = false;
            this.loadingModels = true;
            this.loadingTextures = true;
            this._loadModules(data, callback);
            this._setSkyBox(callback);
        });
    }

    _loadModules(data, callback) {
        this.sceneState.logger.log('Level data:', data); // Show level data being loaded
        for(let modIndex=0; modIndex<data.modules.length; modIndex++) {
            const module = data.modules[modIndex];
            this._createLevelPhysics(module, modIndex);
            const urlAndPath = this.sceneState.settings.assetsUrl + module.path;
            for(let mIndex=0; mIndex<module.models.length; mIndex++) {
                const m = module.models[mIndex];
                const mKeys = Object.keys(m);
                for(let i=0; i<mKeys.length; i++) {
                    if(m[mKeys[i]]) {
                        this._loadModel(
                            urlAndPath + m[mKeys[i]],
                            mKeys[i]+'Modules',
                            module.pos,
                            module.turn,
                            modIndex,
                            mIndex,
                            module.boundingDims,
                            callback
                        );
                    }
                }
            }
            for(let tIndex=0; tIndex<module.textures.length; tIndex++) {
                const t = module.textures[tIndex];
                const tKeys = Object.keys(t);
                for(let i=0; i<tKeys.length; i++) {
                    if(t[tKeys[i]]) {
                        this._loadTexture(
                            urlAndPath + t[tKeys[i]],
                            tKeys[i]+'Textures',
                            module.textureExt,
                            modIndex,
                            tIndex,
                            callback
                        );
                    }
                }
            }
        }
    }

    _loadModel = (url, type, pos, turn, modIndex, partIndex, dims, callback) => {
        this.modelsToLoad++;
        this.modelLoader.load(url, (gltf) => {
            const mesh = gltf.scene.children[0];
            mesh.material.dispose();
            mesh.material = new THREE.MeshLambertMaterial();
            this._setMeshPosition(mesh, pos, turn, dims);
            mesh.rotation.set(0, turn * (Math.PI / 2), 0);
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = mesh;
            // if(this.sceneState.settings.physics.showPhysicsHelpers) mesh.visible = false;
            this.modelsLoaded++;
            this._checkLoadingStatus(callback);
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
        });
    }

    _setMeshPosition = (mesh, pos, turn, dims) => {
        if(turn === 1) {
            mesh.position.set(pos[2], pos[0], pos[1]+dims[1]);
        } else if(turn === 2) {
            mesh.position.set(pos[2]+dims[2], pos[0], pos[1]+dims[1]);
        } else if(turn === 3) {
            mesh.position.set(pos[2]+dims[2], pos[0], pos[1]);
        } else {
            mesh.position.set(pos[2], pos[0], pos[1]);
        }
    }

    _loadTexture(url, type, ext, modIndex, partIndex, callback) {
        this.texturesToLoad++;
        const size = 512; // Replace with texture size setting
        this.textureLoader.load(url+'_'+size+'.'+ext, (texture) => {
            texture.flipY = false; // <-- Important for importing GLTF models!
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = texture;
            this.texturesLoaded++;
            this._checkLoadingStatus(callback);
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
        });
    }

    _checkLoadingStatus(callback) {
        if(this.modelsLoaded === this.modelsToLoad) this.loadingModels = false;
        if(this.texturesLoaded === this.texturesToLoad) this.loadingTextures = false;
        if(!this.loadingModels && !this.loadingTextures && this.skyboxLoaded) {
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
            this._updateLoadingScreen(false);
            callback();
        } else {
            this._updateLoadingScreen(true);
        }
    }

    _setSkyBox(callback) {
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
                this.skyboxLoaded = true;
                this._checkLoadingStatus(callback);
            });
    }

    _updateLoadingScreen(show) {
        let modelsText = '', texturesText = '', skyboxText = '';
        if(show) {
            document.getElementById(this.loadingScreenId).style.display = 'block';
            if(this.loadingModels) {
                modelsText = 'Loaded ' + this.modelsLoaded + ' of ' + this.modelsToLoad + ' models...';
            } else {
                modelsText = 'All models loaded (' + this.modelsLoaded + ' / ' + this.modelsToLoad + ').';
            }
            if(this.loadingModels) {
                texturesText = 'Loaded ' + this.texturesLoaded + ' of ' + this.texturesToLoad + ' textures...';
            } else {
                texturesText = 'All textures loaded (' + this.texturesLoaded + ' / ' + this.texturesToLoad + ').';
            }
            if(this.skyboxLoaded) {
                skyboxText = 'Background loaded.';
            } else {
                skyboxText = 'Loading background...';
            }
            document.getElementById('loadingModels').textContent = modelsText;
            document.getElementById('loadingTextures').textContent = texturesText;
            document.getElementById('loadingBackground').textContent = skyboxText;
        } else {
            document.getElementById(this.loadingScreenId).style.display = 'none';
        }
    }

    _createLevelCompoundShape() {
        const floorFriction = 0.05;
        const wallFriction = 0.001;
        this.sceneState.physicsClass.addShape({
            id: 'levelCompoundFloors',
            type: 'compound',
            moving: false,
            movingShape: false,
            mass: 0,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            material: { friction: floorFriction },
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
        this.sceneState.physicsClass.addShape({
            id: 'levelCompoundWalls',
            type: 'compound',
            moving: false,
            movingShape: false,
            mass: 0,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            material: { friction: wallFriction },
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
    }

    _createLevelPhysics(data, index) {
        const phys = data.physics;
        const compoundIdExt = data.id + '-' + index;
        const compoundPos = [data.pos[2], this.sceneState.constants.FLOOR_HEIGHT * data.pos[0], data.pos[1]]
        this.sceneState.physicsClass.addShape({
            id: 'floor-' + compoundIdExt,
            type: 'compound',
            moving: false,
            movingShape: false,
            mass: 0,
            position: compoundPos,
            rotation: [0, 0, 0],
            material: { friction: 0.1 },
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
        this.sceneState.physicsClass.addShape({
            id: 'wall-' + compoundIdExt,
            type: 'compound',
            moving: false,
            movingShape: false,
            mass: 0,
            position: compoundPos,
            rotation: [0, 0, 0],
            material: { friction: 0.001 },
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
        for(let i=0; i<phys.length; i++) {
            let compoundId = null;
            const obj = phys[i];
            if(obj.section === 'floor') { compoundId = 'floor-'+compoundIdExt; } else
            if(obj.section === 'wall') { compoundId = 'wall-'+compoundIdExt; }
            if(obj.type === 'box') {
                this.sceneState.physicsClass.addShape({
                    id: 'levelShape_' + obj.id + '_' + index,
                    compoundParentId: compoundId,
                    type: 'box',
                    size: [obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2],
                    position: [
                        obj.position[0],
                        obj.position[1],
                        obj.position[2],
                    ],
                    sleep: {
                        allowSleep: true,
                        sleeSpeedLimit: 0.1,
                        sleepTimeLimit: 1,
                    },
                    helperColor: obj.helperColor,
                });
            }
        }
    }
}

export default LevelLoader;
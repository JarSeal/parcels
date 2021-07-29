import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import LevelsData from '../data/LevelsData';
import ModulePhysics from '../physics/ModulePhysics';
import { TextureMerger } from '../vendor/TextureMerger';

class LevelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        sceneState.loadingLevel = true;
        this.loadingData = false;
        this.loadingModels = false;
        this.loadingTextures = false;
        this.mergingModules = false;
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
            lvlMergesLength: 1,
            lvlTextures: [],
            levelTextures: {},
            lvlMeshes: [],
            mergedMaps: {},
            levelMesh: null,
        };
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
            this.mergingModules = true;
            this._loadModules(data, callback);
            this._setSkyBox(callback);
        });
    }

    _loadModules(data, callback) {
        this.sceneState.logger.log('Level data:', data); // Show level data being loaded
        for(let modIndex=0; modIndex<data.modules.length; modIndex++) {
            const module = data.modules[modIndex];
            this._createLevelPhysics(module, modIndex); // Might be unnecessary, not being used at the moment
            new ModulePhysics(this.sceneState, module, modIndex);
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
                            module.textureSizes,
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
            mesh.material = new THREE.MeshBasicMaterial();
            this._setMeshPosition(mesh, pos, turn, dims);
            mesh.rotation.set(0, turn * (Math.PI / 2), 0);
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = mesh;
            this.modelsLoaded++;
            this._checkLoadingStatus(callback);
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
            throw new Error('**Error stack:**');
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

    _loadTexture(url, type, ext, sizes, modIndex, partIndex, callback) {
        this.texturesToLoad++;
        let size = sizes[0]; // Replace with texture size setting
        this.textureLoader.load(url+'_'+size+'.'+ext, (texture) => {
            texture.flipY = false; // <-- Important for importing GLTF models!
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = texture; // RAR
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = texture;
            this.texturesLoaded++;
            this._checkLoadingStatus(callback);
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
            throw new Error('**Error stack:**');
        });
    }

    _checkLoadingStatus(callback) {
        this._updateLoadingScreen(true);
        if(this.modelsLoaded === this.modelsToLoad) this.loadingModels = false;
        if(this.texturesLoaded === this.texturesToLoad) this.loadingTextures = false;
        if(!this.loadingModels && !this.loadingTextures && this.mergingModules) {
            this._mergeModelsAndTextures(callback);
            return;
        }
        if(!this.loadingModels && !this.loadingTextures && this.skyboxLoaded && !this.mergingModules) {
            this._updateLoadingScreen(false);
            callback();
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
        const floorFriction = 0.1;
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
        let xOffset = 0, zOffset = 0;
        if(data.turn === 1) { zOffset = data.boundingDims[1]; } else
        if(data.turn === 2) {
            zOffset = data.boundingDims[1];
            xOffset = data.boundingDims[2];
        } else
        if(data.turn === 3) { xOffset = data.boundingDims[2]; }
        const compoundPos = [
            data.pos[2] + xOffset,
            this.sceneState.constants.FLOOR_HEIGHT * data.pos[0],
            data.pos[1] + zOffset
        ];
        this.sceneState.physicsClass.addShape({
            id: 'floor-' + compoundIdExt,
            type: 'compound',
            moving: false,
            movingShape: false,
            mass: 0,
            position: compoundPos,
            rotation: [0, data.turnRadians, 0],
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
            rotation: [0, data.turnRadians, 0],
            material: { friction: 0.001 },
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
        for(let i=0; i<phys.length; i++) {
            let compoundId = null, rotation = null;
            const obj = phys[i];
            if(obj.section === 'floor') { compoundId = 'floor-'+compoundIdExt; } else
            if(obj.section === 'wall') { compoundId = 'wall-'+compoundIdExt; }
            if(obj.rotation) rotation = obj.rotation;
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
                    rotation,
                    roof: obj.roof,
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

    _createLevelTextureSet() {
        // const moduleKeys = Object.keys(this.sceneState.levelAssets.exteriorTextures);

    }

    _mergeModelsAndTextures(callback) {
        const moduleKeys = Object.keys(this.sceneState.levelAssets.exteriorTextures);
        const geometries = [];
        for(let i=0; i<moduleKeys.length; i++) {
            const key = moduleKeys[i];
            this.sceneState.levelAssets.levelTextures[key + '_' + 'ext'] = this.sceneState.levelAssets.exteriorTextures[key];
            this.sceneState.levelAssets.levelTextures[key + '_' + 'int'] = this.sceneState.levelAssets.interiorTextures[key];
        }
        this.sceneState.levelAssets.mergedMaps.level = new TextureMerger(
            this.sceneState.levelAssets.levelTextures,
            this.sceneState.logger
        );

        for(let i=0; i<moduleKeys.length; i++) {
            const key = moduleKeys[i];
            const moduleMeshExt = this.sceneState.levelAssets.exteriorModules[key].clone();
            const moduleMeshInt = this.sceneState.levelAssets.interiorModules[key].clone();
            this._modifyObjectUV(moduleMeshExt, this.sceneState.levelAssets.mergedMaps.level.ranges[key + '_' + 'ext']);
            this._modifyObjectUV(moduleMeshInt, this.sceneState.levelAssets.mergedMaps.level.ranges[key + '_' + 'int']);
            moduleMeshExt.material.dispose();
            moduleMeshInt.material.dispose();
            moduleMeshExt.updateMatrix();
            moduleMeshInt.updateMatrix();

            moduleMeshExt.geometry = moduleMeshExt.geometry.toNonIndexed();
            moduleMeshInt.geometry = moduleMeshInt.geometry.toNonIndexed();
            moduleMeshExt.matrix.compose(moduleMeshExt.position, moduleMeshExt.quaternion, moduleMeshExt.scale);
            moduleMeshInt.matrix.compose(moduleMeshInt.position, moduleMeshInt.quaternion, moduleMeshInt.scale);
            moduleMeshExt.geometry.applyMatrix4(moduleMeshExt.matrix);
            moduleMeshInt.geometry.applyMatrix4(moduleMeshInt.matrix);
            geometries.push(moduleMeshExt.geometry);
            geometries.push(moduleMeshInt.geometry);
        }

        this.sceneState.levelAssets.levelMesh = new THREE.Mesh(
            BufferGeometryUtils.mergeBufferGeometries(geometries, true),
            new THREE.ShaderMaterial(this._createShaderMaterial(
                this.sceneState.levelAssets.mergedMaps.level.mergedTexture
            ))
            // new THREE.MeshBasicMaterial({ map: this.sceneState.levelAssets.mergedMaps.level.mergedTexture })
        );
        this.sceneState.levelAssets.levelMesh.name = 'level-mesh';
        this.sceneState.levelAssets.levelMesh.matrixAutoUpdate = false;
        this.sceneState.scenes[this.sceneState.curScene].add(
            this.sceneState.levelAssets.levelMesh
        );

        this.mergingModules = false;
        this._checkLoadingStatus(callback);
    }

    _modifyObjectUV(object, range) {
        let uvAttribute,
            i = 0,
            attrLength = 0;
        if(!object || !object.geometry || !object.geometry.attributes || !object.geometry.attributes.uv) {
            this.sceneState.logger.error('ModifyObjectUV, object attribute not found', object);
            throw new Error('**Error stack:**');
        }
        uvAttribute = object.geometry.attributes.uv;
        attrLength = uvAttribute.count;
        for(i=0; i<attrLength; i++) {

            let u = uvAttribute.getX(i),
                v = uvAttribute.getY(i);

            u = u * (range.endU - range.startU) + range.startU;
            v = v * (range.startV - range.endV) + range.endV;

            uvAttribute.setXY(i, u, v);
            uvAttribute.needsUpdate = true;
        }
    }

    _createShaderMaterial(texture) {
        const uniforms = {
            mapTexture: { type: 't', value: texture },
        };

        const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;

        const fragmentShader = `
        varying vec2 vUv;
        uniform sampler2D mapTexture;
        void main() {
            gl_FragColor = texture2D(mapTexture, vUv);
        }`;

        return {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        };
    }
}

export default LevelLoader;
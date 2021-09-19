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
            detailsIntModules: {},
            roofModules: {},
            exteriorTextures: {},
            interiorTextures: {},
            roofTextures: {},
            lvlMerges: [],
            lvlTextures: [],
            lvlTextureBundles: [{}],
            lvlGeoBundles: [],
            lvlAllModules: {},
            levelTextures: {},
            lvlMeshes: [],
            mergedMaps: {},
            levelMesh: null,
            curTextureSize: 0,
            fxTextures: {},
        };
        this.loadingScreenId = 'levelLoadingScreen';
        this.MAX_ATLAS_SIZE = 4096;
        this.MAX_ATLAS_PIXELS = this.MAX_ATLAS_SIZE * this.MAX_ATLAS_SIZE;
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
        this._createLevelCompoundShapes();
        new LevelsData(this.sceneState).loadLevelsData(levelId, (data) => {
            this.loadingData = false;
            this.loadingModels = true;
            this.loadingTextures = true;
            this.mergingModules = true;
            this._loadFXTextures(callback);
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
                        this._loadModuleTexture(
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
            this.sceneState.levelAssets[type]['module'+modIndex+'_part'+partIndex] = mesh; // RAR
            this.sceneState.levelAssets.lvlAllModules[this._createModelPartKey(modIndex, partIndex, type)] = mesh;
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

    _loadModuleTexture(url, type, ext, sizes, modIndex, partIndex, callback) {
        this.texturesToLoad++;
        let size = sizes[0]; // Replace with texture size setting
        this.textureLoader.load(url+'_'+size+'.'+ext, (texture) => {
            this.sceneState.levelAssets.lvlTextures.push({
                key: this._createModelPartKey(modIndex, partIndex, type),
                type: type,
                texture: texture,
                size: size,
            });
            this.texturesLoaded++;
            this._checkLoadingStatus(callback);
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
            throw new Error('**Error stack:**');
        });
    }

    _loadFXTextures(callback) {
        const keys = Object.keys(this.sceneState.levelAssets.fxTextures);
        for(let i=0; i<keys.length; i++) {
            this.texturesToLoad++;
            ((key) => {
                const list = this.sceneState.levelAssets.fxTextures;
                this.textureLoader.load(list[key].url, (texture) => {
                    list[key].texture = texture;
                    this.texturesLoaded++;
                    this._checkLoadingStatus(callback);
                }, undefined, function(error) {
                    this.sceneState.logger.error(error);
                    throw new Error('**Error stack:**');
                });
            })(keys[i]);
        }
    }

    _createModelPartKey(modIndex, partIndex, type) {
        const keyBeginning = 'm' + modIndex + '_p' + partIndex+'_';
        let t;
        switch(type) {
        case 'interiorTextures': t = 'int'; break;
        case 'exteriorTextures': t = 'ext'; break;
        case 'roofTextures': t = 'roof'; break;
        case 'bottomTextures': t = 'bottom'; break;
        case 'detailsIntTextures': t = 'detailsInt'; break;
        case 'interiorModules': t = 'int'; break;
        case 'exteriorModules': t = 'ext'; break;
        case 'roofModules': t = 'roof'; break;
        case 'bottomModules': t = 'bottom'; break;
        case 'detailsIntModules': t = 'detailsInt'; break;
        default: t = 'unknown'; break;
        }
        return keyBeginning + t;
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

    _createLevelCompoundShapes() {
        const floorFriction = 0.1;
        const wallFriction = 0.01;
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

    _createLevelPhysics(data, index) { // Maybe get rid of, not used at the moment
        const phys = data.physics;
        // const compoundIdExt = data.id + '-' + index;
        // console.log('DATA', data);
        // let xOffset = 0, zOffset = 0;
        // if(data.turn === 1) { zOffset = data.boundingDims[1]; } else
        // if(data.turn === 2) {
        //     zOffset = data.boundingDims[1];
        //     xOffset = data.boundingDims[2];
        // } else
        // if(data.turn === 3) { xOffset = data.boundingDims[2]; }
        // const compoundPos = [
        //     data.pos[2] + xOffset,
        //     this.sceneState.constants.FLOOR_HEIGHT * data.pos[0],
        //     data.pos[1] + zOffset
        // ];
        // this.sceneState.physicsClass.addShape({
        //     id: 'details-' + compoundIdExt,
        //     type: 'compound',
        //     moving: false,
        //     movingShape: false,
        //     mass: 0,
        //     position: compoundPos,
        //     rotation: [0, data.turnRadians, 0],
        //     material: { friction: 0.001 },
        //     sleep: {
        //         allowSleep: true,
        //         sleeSpeedLimit: 0.1,
        //         sleepTimeLimit: 1,
        //     },
        // });
        if(index === 0) {
            // TESTING GROUPING
            const groupGeo = new THREE.BoxBufferGeometry(5, 1, 9);
            const groupMat = new THREE.MeshBasicMaterial({ wireframe: true });
            const group = new THREE.Mesh(groupGeo, groupMat);
            const geo1 = new THREE.BoxBufferGeometry(1, 1, 3);
            const mat1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const mesh1 = new THREE.Mesh(geo1, mat1);
            mesh1.position.set(0, 0, 4);
            group.add(mesh1);
            const geo2 = new THREE.BoxBufferGeometry(3, 1, 1);
            const mat2 = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
            const mesh2 = new THREE.Mesh(geo2, mat2);
            mesh2.position.set(4, 0, 0);
            group.add(mesh2);
            group.rotation.y = Math.PI / 2;
            group.position.set(4, 0, 8);
            // this.sceneState.scenes[this.sceneState.curScene].add(group);
            console.log('GROUP', group.children[1], data);
        }

        // 1. Create the group mesh and define positions and quternions arrays
        const grGeo = new THREE.BoxBufferGeometry(data.boundingDims[2], 1, data.boundingDims[1]);
        const grMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const gr = new THREE.Mesh(grGeo, grMat);
        gr.position.set(
            data.pos[2] + data.boundingDims[2] / 2,
            0,
            data.pos[1] + data.boundingDims[1] / 2
        );

        // 2. Loop through all physics/details elements and add them to their proper positions on the group mesh
        const basicMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        for(let i=0; i<phys.length; i++) {
            const obj = phys[i];
            if(obj.type === 'box') {
                const boxGeo = new THREE.BoxBufferGeometry(obj.size[0][0], obj.size[0][1], obj.size[0][2]); // REFACTOR (remove the first level array)
                const boxMesh = new THREE.Mesh(boxGeo, basicMat);
                boxMesh.position.set(
                    obj.position[0][0] - data.boundingDims[2] / 2, // REFACTOR (remove the first level array)
                    obj.position[0][1], // REFACTOR (remove the first level array)
                    obj.position[0][2] - data.boundingDims[1] / 2 // REFACTOR (remove the first level array)
                );
                if(obj.rotation) {
                    boxMesh.rotation.x = obj.rotation[0][0]; // REFACTOR (remove the first level array)
                    boxMesh.rotation.y = obj.rotation[0][1]; // REFACTOR (remove the first level array)
                    boxMesh.rotation.z = obj.rotation[0][2]; // REFACTOR (remove the first level array)
                }
                gr.add(boxMesh);
            }
        }

        // 3. Turn the group mesh
        gr.rotation.y = (Math.PI / 2) * data.turn;

        // 4. Loop through all elems and add the shapes into the physicsClass with Mesh.getWorldPosition() and Mesh.getWorldQuaternion()
        

        this.sceneState.scenes[this.sceneState.curScene].add(gr);
        console.log('MY GROUP', gr, (Math.PI / 2) * data.turn);

        // for(let i=0; i<phys.length; i++) {
        //     let compoundId = 'levelCompoundWalls', rotation = null;
        //     const obj = phys[i];
        //     if(obj.rotation) rotation = obj.rotation[data.turn];
        //     if(obj.type === 'box') {
        //         this.sceneState.physicsClass.addShape({
        //             id: 'levelShape_' + obj.id + '_' + index,
        //             compoundParentId: compoundId,
        //             type: 'box',
        //             size: [obj.size[data.turn][0] / 2, obj.size[data.turn][1] / 2, obj.size[data.turn][2] / 2],
        //             position: [
        //                 data.pos[2] + obj.position[data.turn][0],
        //                 obj.position[data.turn][1],
        //                 data.pos[1] + obj.position[data.turn][2],
        //             ],
        //             rotation,
        //             roof: obj.roof,
        //             sleep: {
        //                 allowSleep: true,
        //                 sleeSpeedLimit: 0.1,
        //                 sleepTimeLimit: 1,
        //             },
        //             helperColor: obj.helperColor,
        //         });
        //     }
        // }
    }

    _createLevelTextureSet() {
        // const moduleKeys = Object.keys(this.sceneState.levelAssets.exteriorTextures);

    }

    _mergeModelsAndTextures(callback) {
        for(let i=0; i<this.sceneState.levelAssets.lvlTextures.length; i++) {
            const item = this.sceneState.levelAssets.lvlTextures[i];
            const curSize = item.size * item.size;
            if(this.sceneState.levelAssets.curTextureSize + curSize >= this.MAX_ATLAS_PIXELS) {
                this.sceneState.levelAssets.lvlMerges.push(new TextureMerger(
                    this.sceneState.levelAssets.lvlTextureBundles[this.sceneState.levelAssets.lvlTextureBundles.length-1],
                    this.sceneState.logger,
                    this.MAX_ATLAS_SIZE
                ));
                this.sceneState.levelAssets.curTextureSize = 0;
                this.sceneState.levelAssets.lvlTextureBundles.push({});
            }
            this.sceneState.levelAssets.curTextureSize += curSize;
            this.sceneState.levelAssets.lvlTextureBundles[this.sceneState.levelAssets.lvlTextureBundles.length-1][item.key] = item.texture;
        }
        this.sceneState.levelAssets.lvlMerges.push(new TextureMerger(
            this.sceneState.levelAssets.lvlTextureBundles[this.sceneState.levelAssets.lvlTextureBundles.length-1],
            this.sceneState.logger,
            this.MAX_ATLAS_SIZE
        ));

        for(let i=0; i<this.sceneState.levelAssets.lvlTextureBundles.length; i++) {
            const keys = Object.keys(this.sceneState.levelAssets.lvlTextureBundles[i]);
            let geos = [];
            for(let k=0; k<keys.length; k++) {
                const curMesh = this.sceneState.levelAssets.lvlAllModules[keys[k]];
                this._modifyObjectUV(curMesh, this.sceneState.levelAssets.lvlMerges[i].ranges[keys[k]]);
                curMesh.material.dispose();
                curMesh.updateMatrix();
                curMesh.geometry = curMesh.geometry.toNonIndexed();
                curMesh.matrix.compose(curMesh.position, curMesh.quaternion, curMesh.scale);
                curMesh.geometry.applyMatrix4(curMesh.matrix);
                geos.push(curMesh.geometry);
            }

            let newMesh = new THREE.Mesh(
                BufferGeometryUtils.mergeBufferGeometries(geos, true),
                new THREE.ShaderMaterial(this._createShaderMaterial(
                    this.sceneState.levelAssets.lvlMerges[i].mergedTexture
                ))
                // new THREE.MeshBasicMaterial({ map: this.sceneState.levelAssets.mergedMaps.level.mergedTexture })
            );
            newMesh.name = 'level-mesh' + i;
            newMesh.matrixAutoUpdate = false;
            this.sceneState.levelAssets.lvlMeshes.push(newMesh);
            this.sceneState.scenes[this.sceneState.curScene].add(
                newMesh
            );
        }

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
            uMainTexture: { value: texture },
        };

        const vertexShader = `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;

        const fragmentShader = `
        varying vec2 vUv;
        uniform sampler2D uMainTexture;
        
        void main() {
            gl_FragColor = texture2D(uMainTexture, vUv);
        }`;

        return {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        };
    }

    _initShaderPart(part, maxDecals) {
        const returnArray = [];
        if(part === 'position') {
            for(let i=0; i<maxDecals; i++) {
                returnArray.push(new THREE.Vector4(0, 0, 0, 0));
            }
        }
        return returnArray;
    }
}

export default LevelLoader;
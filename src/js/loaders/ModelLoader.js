import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// THIS IS TEMPORARY AND WILL BE REMOVED!

class ModelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.modelLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        sceneState.curLevelMesh = null;
    }

    loadModel(data, copy) {
        this.modelLoader.load(data.path + data.model, (gltf) => {
            const urlParams = new URLSearchParams(window.location.search);
            let textureSize = urlParams.get('ts');
            if(textureSize && (textureSize < 0 || textureSize > 3)) {
                alert('Texture sizes must be in range from 0-3. 0 = 512 and 3 = 4096px.');
            }
            if(!textureSize) textureSize = 2;
            const mesh = gltf.scene.children[0];
            mesh.material.metalness = 0;
            mesh.material.map = this.textureLoader.load(
                data.path +
                data.textureMapName +
                '_' + data.textureSizes[textureSize] +
                '.' + data.ext,
                (texture) => { texture.flipY = false; }
            );
            if(copy) {
                mesh.material.normalMap = this.textureLoader.load(
                    data.path +
                    data.textureNormalMapName +
                    '_' + data.textureSizes[textureSize] +
                    '.' + data.ext,
                    (texture) => {
                        texture.flipY = false;
                        console.log(texture);
                    }
                );
                mesh.rotation.set(0, Math.PI, 0);
            }
            mesh.position.set(data.position[0], data.position[1], data.position[2]);
            if(copy) mesh.position.set(data.position[0], data.position[1], data.position[2] + 5);
            this.sceneState.scenes[this.sceneState.curScene].add(mesh);
            this.sceneState.curLevelMesh = mesh;
            if(!copy)
                this._createLevelPhysics(data);
            if(this.sceneState.settings.physics.showPhysicsHelpers) mesh.visible = false;
            if(copy) {
                console.log('COPY', mesh);
            } else {
                console.log('ORIGINALs', mesh);
            }
        }, undefined, function(error) {
            this.sceneState.logger.error(error);
        });
    }

    _createLevelPhysics(data) {
        const phys = data.physics;
        if(!phys) return;
        for(let i=0; i<phys.length; i++) {
            const obj = phys[i];
            if(obj.type === 'box') {
                this.sceneState.physicsClass.addShape({
                    id: obj.id,
                    type: 'box',
                    moving: false,
                    mass: 0,
                    size: [obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2],
                    position: [obj.position[0], obj.position[1], obj.position[2]],
                    quaternion: null,
                    rotation: [0, 0, 0],
                    material: obj.material,
                    updateFn: null,
                    mesh: null,
                    sleep: {
                        allowSleep: true,
                        sleeSpeedLimit: 0.1,
                        sleepTimeLimit: 1,
                    },
                });
            }
        }
    }
}

export default ModelLoader;
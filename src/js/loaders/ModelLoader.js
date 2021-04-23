import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// THIS IS TEMPORARY AND WILL BE REMOVED!

class ModelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.modelLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        sceneState.curLevelMesh = null;
    }

    loadModel(data) {
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
                data.textureSizes[textureSize] + '_' +
                data.textures[0] +
                '.' + data.ext,
                (texture) => { texture.flipY = false; }
            );
            mesh.position.set(data.position[0], data.position[1], data.position[2]);
            this.sceneState.scenes[this.sceneState.curScene].add(mesh);
            this.sceneState.curLevelMesh = mesh;
            this._createLevelPhysics(data);
            if(this.sceneState.settings.physics.showPhysicsHelpers) mesh.visible = false;
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
                // const boxGeo = new THREE.BoxBufferGeometry(obj.size[0], obj.size[1], obj.size[2]);
                // const boxMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
                // const boxMesh = new THREE.Mesh(boxGeo, boxMat);
                // boxMesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
                // this.sceneState.scenes[this.sceneState.curScene].add(boxMesh);
                const material = new CANNON.Material(obj.material);
                const body = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(obj.position[0], obj.position[1], obj.position[2]),
                    shape: new CANNON.Box(new CANNON.Vec3(obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2)),
                    material: material
                });
                body.quaternion.setFromEuler(0, 0, 0, 'XYZ');
                body.allowSleep = true;
                body.sleepSpeedLimit = 0.1;
                body.sleepTimeLimit = 1;
                this.sceneState.physics.world.addBody(body);
                if(this.sceneState.settings.physics.showPhysicsHelpers) {
                    this.sceneState.physics.helper.addVisual(body, obj.helperColor ? obj.helperColor : 0xFF0000);
                }
            }
        }
    }
}

export default ModelLoader;
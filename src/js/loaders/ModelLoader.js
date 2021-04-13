import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class ModelLoader {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.modelLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
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
        }, undefined, function(error) {
            console.error(error);
        });
    }
}

export default ModelLoader;
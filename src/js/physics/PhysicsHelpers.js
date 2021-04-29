import * as THREE from 'three';

class PhysicsHelpers {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.scene = this.sceneState.scenes[this.sceneState.curScene];
        this.enabled = sceneState.settings.showPhysicsHelpers;
        this.movingShapes = [];
        this.staticShapes = [];
    }

    updatePhysicsHelpers(positions, quaternions, i) {
        if(!this.enabled) return;
        const s = this.movingShapes[i];
        s.helperMesh.position.set(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
        );
        if(!s.fixedRotation) {
            s.helperMesh.quaternion.set(
                quaternions[i * 4],
                quaternions[i * 4 + 1],
                quaternions[i * 4 + 2],
                quaternions[i * 4 + 3]
            );
        }
    }

    removeShape(data) {
        if(!this.enabled) return;
        let index, s;
        for(let i=0; i<this.movingShapes.length; i++) {
            s = this.movingShapes[i];
            if(s.id === data.id) {
                s.helperMesh.geometry.dispose();
                s.helperMesh.material.dispose();
                this.scene.remove(s.helperMesh);
                index = i;
            }
        }
        if(index !== undefined) {
            this.movingShapes.splice(index, 1);
        } else {
            for(let i=0; i<this.staticShapes.length; i++) {
                s = this.movingShapes[i];
                if(s.id === data.id) {
                    s.helperMesh.geometry.dispose();
                    s.helperMesh.material.dispose();
                    this.scene.remove(s.helperMesh);
                    index = i;
                }
            }
            if(index !== undefined) {
                this.staticShapes.splice(index, 1);
            }
        }
    }

    createShape(data) {
        if(!this.enabled) return;
        let mesh;
        switch(data.type) {
        case 'box':
        default:
            mesh = this._createBox(data);
            break;
        }
        this.scene.add(mesh);
        data.helperMesh = mesh;
        if(data.moving) {
            this.movingShapes.push(data);
        } else {
            this.staticShapes.push(data);
        }
    }

    _createBox(data) {
        const geo = new THREE.BoxBufferGeometry(
            data.size[0] * 2,
            data.size[1] * 2,
            data.size[2] * 2
        );
        const mat = new THREE.MeshLambertMaterial();
        if(data.moving) {
            mat.color.set(0xaabb33);
        } else {
            mat.color.set(0xff7711);
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.position[0], data.position[1], data.position[2]);
        return mesh;
    }
}

export default PhysicsHelpers;
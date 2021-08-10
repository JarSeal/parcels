import * as THREE from 'three';

class PhysicsHelpers {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.scene = this.sceneState.scenes[this.sceneState.curScene];
        this.enabled = sceneState.settings.physics.showPhysicsHelpers;
        this.movingShapes = [];
        this.staticShapes = [];
    }

    updatePhysicsHelpers(positions, quaternions, i) {
        const s = this.movingShapes[i];
        if(!s || (!this.enabled && !s.showHelper)) return;
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
        if(!this.enabled && !data.showHelper) return;
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
                s = this.staticShapes[i];
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
        if(!this.enabled && !data.showHelper) return;
        let mesh, compound;
        if(data.compoundParentId) {
            compound = this._getCompoundParentById(data.compoundParentId);
            data.parentData = compound;
        }
        switch(data.type) {
        case 'box':
            mesh = this._createBox(data);
            break;
        case 'sphere':
            mesh = this._createSphere(data);
            break;
        case 'cylinder':
            mesh = this._createCylinder(data);
            break;
        case 'compound':
            mesh = this._createCompound(data);
        }
        this._setMeshColor(mesh, data);
        if(data.compoundParentId) {      
            if(compound) {
                compound.helperMesh.add(mesh);
            } else { this.sceneState.logger.error('PhysicsHelper could not add compound child shape, because parent was not found.'); }
        } else {
            this.scene.add(mesh);
            data.helperMesh = mesh;
            if(data.moving) {
                this.movingShapes.push(data);
            } else {
                this.staticShapes.push(data);
            }
        }
    }

    _createBox(data) {
        let mat;
        const geo = new THREE.BoxBufferGeometry(
            data.size[0] * 2,
            data.size[1] * 2,
            data.size[2] * 2
        );
        if(data.wireframe) {
            mat = new THREE.MeshBasicMaterial();
            mat.wireframe = true;
        } else {
            mat = new THREE.MeshLambertMaterial();
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.position[0], data.position[1], data.position[2]);
        if(data.rotation) {
            mesh.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
        }
        return mesh;
    }

    _createSphere(data) {
        const geo = new THREE.SphereGeometry(data.radius, 32, 32);
        const mat = new THREE.MeshLambertMaterial();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.position[0], data.position[1], data.position[2]);
        return mesh;
    }

    _createCylinder(data) {
        const geo = new THREE.CylinderGeometry(
            data.radiusTop,
            data.radiusBottom,
            data.height,
            data.numSegments
        );
        const mat = new THREE.MeshLambertMaterial();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.position[0], data.position[1], data.position[2]);
        return mesh;
    }

    _createCompound(data) {
        const group = new THREE.Group();
        group.position.set(data.position[0], data.position[1], data.position[2]);
        group.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
        group.name = data.id;
        return group;
    }

    _setMeshColor(mesh, data) {
        if(data.type === 'compound') return;
        const color = data.helperColor;
        if(data.moving || (data.parentData && data.parentData.moving)) {
            mesh.material.color.set(color || 0xaabb33);
        } else {
            mesh.material.color.set(color || 0xff7711);
        }
    }

    _getCompoundParentById(id) {
        let i;
        for(i=0; i<this.movingShapes.length; i++) {
            if(this.movingShapes[i].id === id) {
                return this.movingShapes[i];
            }
        }
        for(i=0; i<this.staticShapes.length; i++) {
            if(this.staticShapes[i].id === id) {
                return this.staticShapes[i];
            }
        }
        return null;
    }
}

export default PhysicsHelpers;
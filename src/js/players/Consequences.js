import * as THREE from 'three';

class Consequences {
    constructor(sceneState, runMainApp) {
        this.sceneState = sceneState;
        this.projectiles = [];
        this.projectilesCount = 0;
        this.projectileIds = [];
        this.requesting = false;
        this.maxEntities = 300;
        this.positions = new Float32Array(this.maxEntities * 3);
        this.quaternions = new Float32Array(this.maxEntities * 4);
        this.entityIds = [];
        this.testMesh = {};
        this.entityIndexes = {};
        this.consWorker = new Worker('./webworkers/consequences.js');
        this._initConsequencesWorker(runMainApp);
    }

    _initConsequencesWorker(runMainApp) {
        this.consWorker.postMessage({ init: true });
        this.consWorker.addEventListener('message', (e) => {
            if(e.data.loop) {
                this.requesting = false;
                this.positions = e.data.positions;
                this.quaternions = e.data.quaternions;
                this._checkHits(e.data.hitList);
            } else if(e.data.initDone) {
                runMainApp();
            } else if(e.data.error) {
                this.sceneState.logger.error('From consequences worker:', e.data.error);
                throw new Error('**Error stack:**');
            }
        });
        this.consWorker.addEventListener('error', (e) => {
            this.sceneState.logger.error('Worker event listener:', e.message);
            throw new Error('**Error stack:**');
        });
    }

    requestConsequences() {
        if(this.requesting || !this.projectilesCount) return;
        this.requesting = true;
        this.consWorker.postMessage({
            phase: 'getHits',
            positions: this.positions,
            quaternions: this.quaternions,
            time: this.sceneState.atomClock.getTime(),
        }, [ this.positions.buffer, this.quaternions.buffer ]);
    }

    updateEntityData(position, quaternion, id) {
        const index = this.entityIndexes[id];
        if(index === undefined) return;
        this.positions[index * 3] = position[0];
        this.positions[index * 3 + 1] = position[1];
        this.positions[index * 3 + 2] = position[2];
        this.quaternions[index * 4] = quaternion[0];
        this.quaternions[index * 4 + 1] = quaternion[1];
        this.quaternions[index * 4 + 2] = quaternion[2];
        this.quaternions[index * 4 + 3] = quaternion[3];
        this.testMesh[id].position.set(
            position[0],
            position[1],
            position[2]
        );
        this.testMesh[id].quaternion.set(
            quaternion[0],
            quaternion[1],
            quaternion[2],
            quaternion[3]
        );
    }

    _checkHits(hitList) {
        let i;
        const keys = Object.keys(hitList),
            keysLength = keys.length,
            time = this.sceneState.atomClock.getTime();
        for(i=0; i<keysLength; i++) {
            const hit = hitList[keys[i]];
            if(this.projectileIds.includes(hit.id) && hit.hitTime > time - 75 && hit.hitTime < time + 75) {
                this.removeProjectile(hit.id);
                this.sceneState.projectiles.setNewProjectileHit(hit);
                this.sceneState.additionalPhysicsData.push({
                    phase: 'applyForce',
                    data: {
                        id: hit.hitEntity,
                        point: hit.point,
                        normal: hit.normal,
                        direction: hit.direction,
                    },
                });
                // Create here the damage for the object/player/box etc.
            }
        }
    }

    addProjectile(data) {
        this.consWorker.postMessage({
            phase: 'addProjectile',
            time: this.sceneState.atomClock.getTime(),
            params: data,
        });
        this.projectiles.push(data);
        this.projectileIds.push(data.id);
        this.projectilesCount++;
    }

    removeProjectile(id) {
        let i, removeIndex = -1;
        for(i=0; i<this.projectilesCount; i++) {
            if(this.projectiles[i].id === id) {
                removeIndex = i;
                break;
            }
        }
        if(removeIndex !== -1) {
            this.projectiles.splice(removeIndex, 1);
            this.projectilesCount--;
            this.projectileIds.splice(removeIndex, 1);
            this.consWorker.postMessage({
                phase: 'removeProjectile',
                time: this.sceneState.atomClock.getTime(),
                id: id,
            });
        }
    }

    addEntity(data) {
        this.consWorker.postMessage({
            phase: 'addEntity',
            time: this.sceneState.atomClock.getTime(),
            params: data,
        });
        this.entityIds.push(data.id);
        this.entityIndexes[data.id] = this.entityIds.length - 1;

        const geo = new THREE.BoxBufferGeometry(data.size[0], data.size[1], data.size[2]);
        const mat = new THREE.MeshBasicMaterial({ wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.position[0], data.position[1], data.position[2]);
        mesh.name = 'test-box' + data.id;
        this.testMesh[data.id] = mesh;
        this.sceneState.scenes[this.sceneState.curScene].add(mesh);
    }

    removeEntity(id) {
        this.consWorker.postMessage({
            phase: 'removeEntity',
            time: this.sceneState.atomClock.getTime(),
            id: id,
        });
        let i, removeIndex = -1;
        const entitiesLength = this.entityIds.length;
        for(i=0; i<entitiesLength; i++) {
            if(this.entityIds[i] === id) {
                removeIndex = i;
                break;
            }
        }
        if(removeIndex !== -1) {
            this.entityIds.splice(removeIndex, 1);
            delete this.entityIndexes[id];
            const keys = Object.keys(this.entityIndexes),
                keysLength = keys.length;
            for(i=0; i<keysLength; i++) {
                if(this.entityIndexes[keys[i]] > removeIndex) this.entityIndexes[keys[i]]--;
            }
        } else {
            this.sceneState.logger.error('Could not find entity to remove (id: ' + id + ')');
            throw new Error('**Error stack:**');
        }
    }
}

export default Consequences;
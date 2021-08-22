class Consequences {
    constructor(sceneState, runMainApp) {
        this.sceneState = sceneState;
        this.projectiles = [];
        this.projectilesCount = 0;
        this.requesting = false;
        this.maxEntities = 300;
        this.positions = new Float32Array(this.maxEntities * 3);
        this.quaternions = new Float32Array(this.maxEntities * 4);
        this.entityIds = [];
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
        if(index === undefined || this.requesting || !this.projectilesCount) return;
        this.positions[index] = position[0];
        this.positions[index+1] = position[1];
        this.positions[index+2] = position[2];
        this.quaternions[index] = quaternion[0];
        this.quaternions[index+1] = quaternion[1];
        this.quaternions[index+2] = quaternion[2];
        this.quaternions[index+3] = quaternion[3];
        this.requestConsequences();
    }

    addProjectile(data) {
        this.consWorker.postMessage({
            phase: 'addProjectile',
            time: this.sceneState.atomClock.getTime(),
            params: data,
        });
        this.projectiles.push(data);
        this.projectilesCount++;
    }

    removeProjectile(id) {
        this.consWorker.postMessage({
            phase: 'removeProjectile',
            time: this.sceneState.atomClock.getTime(),
            id: id,
        });
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
        } else {
            this.sceneState.logger.error('Could not find projectile to remove (id: ' + id + ')');
            throw new Error('**Error stack:**');
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
        console.log();
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
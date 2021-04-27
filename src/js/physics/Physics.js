class Physics {
    constructor(sceneState, runMainApp) {
        this.sceneState = sceneState;
        this.workerSendTime = 0;
        this.worker = new Worker('./webworkers/physics.js');
        this.tempShapes = {};
        sceneState.additionalPhysicsData = [];
        this._initPhysicsWorker(runMainApp);
    }

    _initPhysicsWorker(runMainApp) {
        this.worker.postMessage({
            init: true,
            initParams: {
                allowSleep: true,
                gravity: [0, -9.82, 0],
                iterations: 10,
                solverTolerance: 0.001,
            },
        });
        this.worker.addEventListener('message', (e) => {
            if(e.data.loop) {
                this._updateRenderShapes(e.data);
            } else if(e.data.additionals && e.data.additionals.length) {
                this._handleAdditionalsForMainThread(e.data.additionals);
                this._updateRenderShapes(e.data);
            } else if(e.data.initPhysicsDone) {
                this.sceneState.physics.initiated = true;
                runMainApp();
                this._requestPhysicsFromWorker();
            } else if(e.data.error) {
                this.sceneState.logger.error(e.data.error);
            }
        });
        this.worker.addEventListener('error', (e) => {
            this.sceneState.logger.error(e.message);
        });
    }

    _requestPhysicsFromWorker = () => {
        this.workerSendTime = performance.now();
        const sendObject = {
            timeStep: this.sceneState.physics.timeStep,
            positions: this.sceneState.physics.positions,
            quaternions: this.sceneState.physics.quaternions,
        };
        const additionals = this.sceneState.additionalPhysicsData;
        if(additionals.length) {
            sendObject.additionals = [ ...additionals ];
            this.sceneState.additionalPhysicsData = [];
        }
        this.worker.postMessage(
            sendObject,
            [this.sceneState.physics.positions.buffer, this.sceneState.physics.quaternions.buffer]
        );
    }

    _updateRenderShapes(data) {
        const positions = data.positions;
        const quaternions = data.quaternions;
        this.sceneState.physics.positions = positions;
        this.sceneState.physics.quaternions = quaternions;
        const shapes = this.sceneState.physics.movingShapes;
        const shapesL = this.sceneState.physics.movingShapesLength;
        let i;
        for(i=0; i<shapesL; i++) {
            const s = shapes[i];
            s.mesh.position.set(
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            );
            if(!s.characterData) {
                s.mesh.quaternion.set(
                    quaternions[i * 4],
                    quaternions[i * 4 + 1],
                    quaternions[i * 4 + 2],
                    quaternions[i * 4 + 3]
                );
            }
            if(s.updateFn) s.updateFn(s);
        }
        const delay = this.sceneState.physics.timeStep * 1000 - (performance.now() - this.workerSendTime);
        setTimeout(this._requestPhysicsFromWorker, Math.max(delay, 0));
    }

    _handleAdditionalsForMainThread(additionals) {
        const aLength = additionals.length;
        let i;
        for(i=0; i<aLength; i++) {
            const a = additionals[i];
            if(a.phase === 'addShape') {
                const s = this.tempShapes[a.shape.id];
                if(s.moving) {
                    if(s.characterData) {
                        if(s.characterData.userPlayer) {
                            this.sceneState.userPlayerIndex = this.sceneState.physics.movingShapesLength;
                        }
                        s.characterData.bodyIndex = this.sceneState.physics.movingShapesLength;
                    }
                    this.sceneState.physics.movingShapes.push(s);
                    this.sceneState.physics.movingShapesLength++;
                } else {
                    this.sceneState.physics.staticShapes.push(s);
                    this.sceneState.physics.staticShapesLength++;
                }
            }
        }
        this.tempShapes = {};
    }

    addShape = (shapeData) => {
        if(!shapeData) this.sceneState.logger.error('Trying to add new shape, but shapeData is missing (Root.js).');
        let id = shapeData.id;
        if(!id) {
            id = 'phyShape-' + performance.now();
            shapeData.id = id;
        }
        this.tempShapes[id] = shapeData;
        this.sceneState.additionalPhysicsData.push({
            phase: 'addShape',
            shape: {
                type: shapeData.type,
                id: shapeData.id,
                moving: shapeData.moving,
                mass: shapeData.mass,
                size: shapeData.size,
                position: shapeData.position,
                quaternion: shapeData.quaternion,
                rotation: shapeData.rotation,
                material: shapeData.material,
                sleep: shapeData.sleep,
                characterData: shapeData.characterData
                    ? {
                        speed: shapeData.characterData.speed,
                        direction: shapeData.characterData.direction,
                        userPlayer: shapeData.characterData.userPlayer,
                    } : null
            },
        });
    }

    removeShape = (id) => {
        id; // TODO
    }
}

export default Physics;
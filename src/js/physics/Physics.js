import PhysicsHelpers from './PhysicsHelpers';

class Physics {
    constructor(sceneState, runMainApp) {
        this.sceneState = sceneState;
        this.workerSendTime = 0;
        this.worker = new Worker('./webworkers/physics.js');
        this.tempShapes = {};
        sceneState.additionalPhysicsData = [];
        this.helpers = new PhysicsHelpers(sceneState);
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
            if(!s.fixedRotation) {
                s.mesh.quaternion.set(
                    quaternions[i * 4],
                    quaternions[i * 4 + 1],
                    quaternions[i * 4 + 2],
                    quaternions[i * 4 + 3]
                );
            }
            this.helpers.updatePhysicsHelpers(positions, quaternions, i);
            if(s.updateFn) s.updateFn(s);
        }

        // Rescale the Float32Arrays (double their sizes), if shapes' count is half of positions and quaternions counts
        if(positions.length + quaternions.length <= shapesL * 14) { // shapesL * (3 + 4) * 2 = shapesL * 14
            this.sceneState.physics.positions = new Float32Array(positions.length * 2);
            this.sceneState.physics.quaternions = new Float32Array(quaternions.length * 2);
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
                    this.sceneState.physics.movingShapesLength = this.sceneState.physics.movingShapes.length;
                } else {
                    this.sceneState.physics.staticShapes.push(s);
                    this.sceneState.physics.staticShapesLength = this.sceneState.physics.staticShapes.length;
                }
                delete this.tempShapes[a.shape.id];
            } else if(a.phase === 'removeShape') {
                if(a.moving) {
                    this.sceneState.physics.movingShapes = this.sceneState.physics.movingShapes.filter(
                        shape => a.id !== shape.id
                    );
                    this.sceneState.physics.movingShapesLength = this.sceneState.physics.movingShapes.length;
                } else {
                    this.sceneState.physics.staticShapes = this.sceneState.physics.staticShapes.filter(
                        shape => a.id !== shape.id
                    );
                    this.sceneState.physics.staticShapesLength = this.sceneState.physics.staticShapes.length;
                }
            }
        }
    }

    addShape = (shapeData) => {
        if(!shapeData) this.sceneState.logger.error('Trying to add new shape, but shapeData is missing (Root.js).');
        let id = shapeData.id;
        if(!id) {
            id = 'phyShape_' + Math.random().toString().replace('.', '');
            shapeData.id = id;
        }
        this.tempShapes[id] = shapeData;
        this.sceneState.additionalPhysicsData.push({
            phase: 'addShape',
            shape: {
                type: shapeData.type,
                id: shapeData.id,
                compoundParentId: shapeData.compoundParentId,
                moving: shapeData.moving,
                mass: shapeData.mass,
                size: shapeData.size,
                radius: shapeData.radius,
                radiusTop: shapeData.radiusTop,
                radiusBottom: shapeData.radiusBottom,
                height: shapeData.height,
                numSegments: shapeData.numSegments,
                movingShape: shapeData.movingShape,
                position: shapeData.position,
                quaternion: shapeData.quaternion,
                rotation: shapeData.rotation,
                fixedRotation: shapeData.fixedRotation,
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
        this.helpers.createShape(shapeData);
    }

    removeShape = (data) => {
        if(typeof data === 'string') {
            this.sceneState.additionalPhysicsData.push({
                phase: 'removeShape',
                id: data,
            });
            this.helpers.removeShape({ id: data });
        } else {
            this.sceneState.additionalPhysicsData.push({
                phase: 'removeShape',
                id: data.id,
                moving: data.moving,
            });
            this.helpers.removeShape(data);
        }
    }
}

export default Physics;
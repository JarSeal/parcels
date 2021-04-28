let world,
    CANNON,
    lastCallTime = performance.now() / 1000,
    staticShapes = [],
    movingShapes = [],
    movingShapesCount = 0;
self.importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const init = e.data.init;
    let returnAdditionals = [];

    if(!init) {
        if(e.data.additionals) {
            const a = e.data.additionals;
            for(let i=0; i<a.length; i++) {
                if(a[i].phase === 'moveChar') {
                    moveChar(a[i].data);
                } else if(a[i].phase === 'addShape') {
                    const newShape = addShape(a[i].shape);
                    if(newShape.shapeAdded) {
                        a[i].shape = newShape.shape;
                        returnAdditionals.push(a[i]);
                    } else {
                        self.postMessage({ error: newShape.error });
                    }
                } else if(a[i].phase === 'removeShape') {
                    const removedShape = removeShape(a[i]);
                    if(removedShape.removed) {
                        returnAdditionals.push(removedShape);
                    } else {
                        self.postMessage({ error: removedShape.error });
                    }
                }
            }
        }
        stepTheWorld(e.data, returnAdditionals);
    } else {
        if(e.data && e.data.initParams && CANNON) {
            const params = e.data.initParams;
            initPhysics(params);
        } else {
            self.postMessage({
                initPhysicsDone: false,
                error: 'Web worker physics could not init CANNON world.'
            });
        }
    }
});

const stepTheWorld = (data, returnAdditionals) => {
    const time = performance.now() / 1000;
    const dt = time - lastCallTime;
    const { positions, quaternions, timeStep } = data;
    let i;
    world.step(timeStep, dt);
    for(i=0; i<movingShapesCount; i++) {
        const body = movingShapes[i];
        positions[i * 3 + 0] = body.position.x;
        positions[i * 3 + 1] = body.position.y;
        positions[i * 3 + 2] = body.position.z;
        quaternions[i * 4 + 0] = body.quaternion.x;
        quaternions[i * 4 + 1] = body.quaternion.y;
        quaternions[i * 4 + 2] = body.quaternion.z;
        quaternions[i * 4 + 3] = body.quaternion.w;
        if(body.moveValues.onTheMove) {
            body.velocity.x = body.moveValues.veloX;
            body.velocity.z = body.moveValues.veloZ;
        } else {
            body.velocity.x = 0;
            body.velocity.z = 0;
        }
    }
    let returnMessage = {
        positions,
        quaternions,
        loop: true,
    };
    if(returnAdditionals.length) {
        returnMessage.additionals = returnAdditionals;
        returnMessage.loop = false; // Because we want the additionals to be handled in the main thread (returns to normal loop after that)
    }
    self.postMessage(returnMessage, [data.positions.buffer, data.quaternions.buffer]);
    lastCallTime = time;
};

const moveChar = (data) => {
    const veloX = data.xPosMulti * data.speed;
    const veloZ = data.zPosMulti * data.speed;
    movingShapes[data.bodyIndex].moveValues.veloX = veloX;
    movingShapes[data.bodyIndex].moveValues.veloZ = veloZ;
    movingShapes[data.bodyIndex].moveValues.speed = data.speed;
    const onTheMove = veloX === 0 && veloZ === 0 ? false : true;
    movingShapes[data.bodyIndex].moveValues.onTheMove = onTheMove;
};

const addShape = (shape) => {
    const material = new CANNON.Material(shape.material);
    let body;
    if(shape.type === 'box') {
        body = new CANNON.Body({
            mass: shape.mass,
            position: new CANNON.Vec3(shape.position[0], shape.position[1], shape.position[2]),
            shape: new CANNON.Box(new CANNON.Vec3(shape.size[0], shape.size[1], shape.size[2])),
            material: material
        });
    } else {
        return {
            shapeAdded: false,
            error: 'Shape could not be added to the physics, type unknown (type: ' + shape.type + ').',
        };
    }
    body.shapeData = shape;
    body.quaternion.setFromEuler(shape.rotation[0], shape.rotation[1], shape.rotation[2], 'XYZ');
    body.allowSleep = shape.sleep.allowSleep;
    body.sleepSpeedLimit = shape.sleep.sleepSpeedLimit;
    body.sleepTimeLimit = shape.sleep.sleepTimeLimit;
    body.bodyId = shape.id;
    world.addBody(body);
    if(shape.moving) {
        body.moveValues = {
            speed: 0,
            veloX: 0,
            veloZ: 0,
            onTheMove: false,
        };
        movingShapes.push(body);
        movingShapesCount++;
    } else {
        staticShapes.push(body);
    }
    shape.quaternions = [
        body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w,
    ];
    return { shapeAdded: true, shape };
};

const removeShape = (data) => {
    let shapeRemoved = false,
        moving;
    if(data.moving === undefined) {
        movingShapes = movingShapes.filter(shape => {
            if(data.id === shape.bodyId) {
                world.removeBody(shape);
                shapeRemoved = true;
                moving = true;
            }
            return data.id !== shape.bodyId;
        });
        movingShapesCount = movingShapes.length;
        if(!shapeRemoved) {
            staticShapes = staticShapes.filter(shape => {
                if(data.id === shape.bodyId) {
                    world.removeBody(shape);
                    shapeRemoved = true;
                    moving = false;
                }
                return data.id !== shape.bodyId;
            });
        }
    } else {
        if(data.moving) {
            movingShapes = movingShapes.filter(shape => {
                if(data.id === shape.bodyId) {
                    world.removeBody(shape);
                    shapeRemoved = true;
                    moving = true;
                }
                return data.id !== shape.bodyId;
            });
            movingShapesCount = movingShapes.length;
        } else {
            staticShapes = staticShapes.filter(shape => {
                if(data.id === shape.bodyId) {
                    world.removeBody(shape);
                    shapeRemoved = true;
                    moving = false;
                }
                return data.id !== shape.bodyId;
            });
        }
    }
    return {
        id: data.id,
        removed: shapeRemoved,
        moving,
        phase: data.phase,
        error: shapeRemoved
            ? null
            : 'Could not find shape/body to remove in physics worker with id: "' + data.id + '" (moving: ' + data.moving + ')',
    };
};

const initPhysics = (params) => {
    world = new CANNON.World();
    world.allowSleep = params.allowSleep;
    world.gravity.set(params.gravity[0], params.gravity[1], params.gravity[2]);
    world.iterations = params.iterations;
    world.solver.iterations = params.iterations;
    // world.solver.tolerance = params.solverTolerance;
    self.postMessage({ initPhysicsDone: true });
};
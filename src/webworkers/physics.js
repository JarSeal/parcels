let world,
    CANNON,
    shapes = [],
    shapesCount = 0,
    movingShapes = [],
    movingShapesCount = 0;
self.importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const phase = e.data.phase;
    let returnAdditionals = [];

    if(!phase) {
        if(e.data.additionals) {
            const a = e.data.additionals;
            for(let i=0; i<a.length; i++) {
                if(a.phase == 'addShape') {
                    const newShape = addShape(a.shape);
                    if(newShape.shapeAdded) {
                        returnAdditionals.push(a);
                    } else {
                        self.postMessage({ error: newShape.error });
                    }
                }
            }
        }
        // DO PHYSICS..
        stepTheWorld(e.data, returnAdditionals);
    } else if(phase === 'init') {
        if(e.data.initParams) {
            const params = e.data.initParams;
            initPhysics(params);
        } else {
            self.postMessage({
                initPhysicsDone: false,
                error: 'Web worker physics could not init CANNON world.'
            });
        }
    }
    self.postMessage({
        error: 'Web worker (physics) phase was not recognised.',
    });
});

const stepTheWorld = (data, returnAdditionals) => {
    // Step the world and return pos and qua and possible returnAdditionals
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
    body.quaternion.setFromEuler(shape.rotation[0], shape.rotation[1], shape.rotation[2], 'XYZ');
    body.allowSleep = shape.sleep.allowSleep;
    body.sleepSpeedLimit = shape.sleep.sleepSpeedLimit;
    body.sleepTimeLimit = shape.sleep.sleepTimeLimit;
    world.addBody(body);
    return { shapeAdded: true };
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
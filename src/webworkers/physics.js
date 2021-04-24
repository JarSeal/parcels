let world,
    CANNON,
    shapes = [],
    shapesCount = 0,
    movingShapes = [],
    movingShapesCount = 0;
self.importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const phase = e.data.phase;

    if(!phase) {
        // DO PHYSICS..
    } else if(phase === 'addShape') {
        const shape = e.data.shape;
        console.log('ADD SHAPE', shape);
    } else if(phase === 'init') {
        if(e.data.initParams) {
            const params = e.data.initParams;
            initPhysics(params);
        } else {
            console.error('GAME ENGINE ERROR: web worker physics could not init CANNON world.');
            self.postMessage({ initPhysicsDone: false });
        }
    }
    // self.postMessage('sampleText');
});

const initPhysics = (params) => {
    world = new CANNON.World();
    world.allowSleep = params.allowSleep;
    world.gravity.set(params.gravity[0], params.gravity[1], params.gravity[2]);
    world.iterations = params.iterations;
    world.solver.iterations = params.iterations;
    self.postMessage({ initPhysicsDone: true });
};
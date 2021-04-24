let world, CANNON;
self.importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const phase = e.data.phase;

    if(!phase) {
        // render
    } else if(phase === 'init') {
        if(e.data.initParams) {
            console.log('INIT CANNON', CANNON);
            const params = e.data.initParams;
            initPhysics(params);
        } else {
            console.error('GAME ENGINE ERROR: web worker physics could not init CANNON world.');
        }
    }
    // self.postMessage('sampleText');
});

const initPhysics = (params) => {
    console.log('INIT---');
    world = new CANNON.World();
    world.allowSleep = params.allowSleep;
    world.gravity.set(params.gravity[0], params.gravity[1], params.gravity[2]);
    world.iterations = params.iterations;
    world.solver.iterations = params.iterations;
};
let world;
importScripts('/webworkers/cannon-es.js');

self.addEventListener('message', (e) => {

    const phase = e.data.phase;

    if(!phase) {
        // render
    } else if(phase === 'init') {
        if(e.data.initParams) {
            console.log('INIT CANNON', CANNON);
            world = new CANNON.World();
            world.allowSleep = true;
            world.gravity.set(0, -9.82, 0);
            world.iterations = 10;
            world.solver.iterations = 10;
            //initPhysics();
        } else {
            console.error('GAME ENGINE ERROR: web worker physics could not init CANNON world.');
        }
    }
    // self.postMessage('sampleText');
});

const initPhysics = () => {
    console.log('INIT---');
    // world = new CANNON.World();
    // world.allowSleep = true;
    // world.gravity.set(0, -9.82, 0);
    // world.iterations = 10;
    // world.solver.iterations = 10;
    // console.log('WORLD', world);
};
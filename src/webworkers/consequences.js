let scene, raycast, mat;
self.importScripts('/webworkers/three.min.js');
if(THREE) var THREE; // For eslint (I know, hackish..)

self.addEventListener('message', (e) => {
    console.log('consequences.sj', e.data);
    const init = e.data.init;
    const data = e.data;

    if(!init) {
        if(data.phase === 'addProjectile') {
            // Add projectile: from, to, speed, launchTime, id.
            // Update every position.
        } else if(data.phase === 'addEntity') {
            // Add entity: position, type, size, shape, etc.
            // Update every position.
        } else if(data.phase === 'removeEntity') {
            // Add entity: position, type, size, shape, etc.
            // Update every position.
        }
        checkConsequences();
    } else {
        scene = new THREE.Scene();
        raycast = new THREE.Raycaster();
        mat = new THREE.MeshBasicMaterial({ color:0x000000 });
        tempAdditions();
        self.postMessage({ initDone: true });
    }
});

const tempAdditions = () => {
    const geo = new THREE.BoxBufferGeometry(1, 2, 10);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(14, 2, 10);
    mesh.name = 'TADAA';
    // scene.add(mesh);
    mesh.updateMatrixWorld();

    setTimeout(() => {
        const startPoint = new THREE.Vector3(mesh.position.x - 20, 1, mesh.position.z);
        const endPoint = new THREE.Vector3(mesh.position.x + 20, 1, mesh.position.z);
        const direction = new THREE.Vector3();
        direction.subVectors(endPoint, startPoint).normalize();
        raycast.set(startPoint, direction);
        let intersects = raycast.intersectObject(
            mesh
        );
        console.log('SHOT', intersects, scene);
    }, 1200);
};

const checkConsequences = () => {
    // Update every position and check all projectile rays.
    // Then return all hitting obstacles (players, entities, etc.)
};

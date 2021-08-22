let raycast,
    meshes = [],
    meshesCount = 0,
    projectiles = [],
    projectilesCount = 0;
self.importScripts('/webworkers/three.min.js');
if(THREE) var THREE; // For eslint (I know, hackish..)

self.addEventListener('message', (e) => {
    // console.log('consequences.js', e.data);
    const init = e.data.init;
    const data = e.data;

    if(!init) {
        if(data.phase === 'getHits') {
            checkConsequences(data);
        } else if(data.phase === 'addProjectile') {
            addProjectile(data.params);
        } else if(data.phase === 'removeProjectile') {
            removeProjectile(data.id);
        } else if(data.phase === 'addEntity') {
            addEntity(data.params);
        } else if(data.phase === 'removeEntity') {
            removeEntity(data.id);
        }
    } else {
        raycast = new THREE.Raycaster();
        tempAdditions();
        self.postMessage({ initDone: true });
    }
});

const tempAdditions = () => {
    const geo = new THREE.BoxBufferGeometry(1, 2, 10);
    const mesh = new THREE.Mesh(geo);
    mesh.position.set(14, 2, 10);
    mesh.name = 'TADAA';
    mesh.updateMatrixWorld();

    const startPoint = new THREE.Vector3(mesh.position.x - 20, 1, mesh.position.z);
    const endPoint = new THREE.Vector3(mesh.position.x + 20, 1, mesh.position.z);
    const direction = new THREE.Vector3();
    direction.subVectors(endPoint, startPoint).normalize();
    raycast.set(startPoint, direction);
    let intersects = raycast.intersectObject(
        mesh
    );
    mesh.geometry.dispose();
    mesh.remove();
    console.log('SHOT', intersects);
};

const checkConsequences = (data) => {
    const { positions, quaternions, time } = data;
    const newHitList = [];
    let i;
    // console.log(positions[0], positions[1], positions[2]);
    for(i=0; i<meshesCount; i++) {
        meshes[i].position.set(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
        );
        meshes[i].quaternion.set(
            quaternions[i * 4],
            quaternions[i * 4 + 1],
            quaternions[i * 4 + 2],
            quaternions[i * 4 + 3],
        );
        meshes[i].updateMatrixWorld();
    }
    for(i=0; i<projectilesCount; i++) {
        checkProjectileHit(projectiles[i], time, newHitList);
    }
    self.postMessage({
        loop: true,
        positions,
        quaternions,
        hitList: newHitList,
    }, [data.positions.buffer, data.quaternions.buffer]);
};

const checkProjectileHit = (projectile, time, list) => {
    // { from, to, startTime, distance, weapon, id, index } (to - from) * vTimePhase
    const travelTime = projectile.weapon.speed * projectile.distance;
    const timeElapsed = time - projectile.startTime;
    const timePhase = timeElapsed / travelTime;
    const startPoint = new THREE.Vector3(
        (projectile.to.x - projectile.from.x) * timePhase,
        (projectile.to.y - projectile.from.y) * timePhase,
        (projectile.to.z - projectile.from.z) * timePhase,
    );
    const endPoint = projectile.to;
    const direction = new THREE.Vector3();
    direction.subVectors(endPoint, startPoint).normalize();
    raycast.set(startPoint, direction);
    const intersects = raycast.intersectObjects(meshes);
    if(intersects.length) {
        console.log('HIT', projectile, intersects, timePhase, timeElapsed);
    }
};

const addProjectile = (params) => {
    const projectile = Object.assign({
        hitEntity: null,
        hitTime: null,
        normal: null,
        point: null,
    }, params);
    projectiles.push(projectile);
    projectilesCount++;
};

const removeProjectile = (id) => {
    let i, removeIndex = -1;
    for(i=0; i<projectilesCount; i++) {
        if(projectiles[i].id === id) {
            removeIndex = i;
            break;
        }
    }
    if(removeIndex !== -1) {
        projectiles.splice(removeIndex, 1);
        projectilesCount--;
    } else {
        self.postMessage({
            loop: false,
            error: 'Web worker consequences could not find projectile to remove (id: ' + id + ')'
        });
    }
};

const addEntity = (params) => {
    const { type, id, size, position, rotation } = params;
    if(type === 'box') {
        const geo = new THREE.BoxBufferGeometry(size[0], size[1], size[2]);
        const mesh = new THREE.Mesh(geo);
        mesh.position.set(position[0], position[1], position[2]);
        if(rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        mesh.name = id;
        meshes.push(mesh);
        meshesCount++;
    } // Add cylinder or maybe even a group of different entities (boxes, cylinders, spheres) here for players to make a human shape
};

const removeEntity = (id) => {
    let i, removeIndex = -1;
    for(i=0; i<meshesCount; i++) {
        if(meshes[i].name === id) {
            removeIndex = i;
            break;
        }
    }
    if(removeIndex !== -1) {
        meshes[removeIndex].geometry.dispose();
        meshes[removeIndex].remove();
        meshes.splice(removeIndex, 1);
        meshesCount--;
    } else {
        self.postMessage({
            loop: false,
            error: 'Web worker consequences could not find entity to remove (id: ' + id + ')'
        });
    }
};

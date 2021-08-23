let raycast,
    meshes = [],
    meshesCount = 0,
    projectiles = [],
    projectilesCount = 0,
    hitList = {};
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
        self.postMessage({ initDone: true });
    }
});

const checkConsequences = (data) => {
    const { positions, quaternions, time } = data;
    let i;
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
        checkProjectileHit(projectiles[i], time, hitList);
    }
    self.postMessage({
        loop: true,
        positions,
        quaternions,
        hitList: hitList,
    }, [data.positions.buffer, data.quaternions.buffer]);
};

const checkProjectileHit = (projectile, time, list) => {
    const travelTime = projectile.weapon.speed * projectile.distance * 1000;
    const timeElapsed = time - projectile.startTime;
    const timePhase = timeElapsed / travelTime;
    const startPoint = new THREE.Vector3(
        projectile.from.x + (projectile.to.x - projectile.from.x) * timePhase,
        projectile.from.y + (projectile.to.y - projectile.from.y) * timePhase,
        projectile.from.z + (projectile.to.z - projectile.from.z) * timePhase,
    );
    const endPoint = projectile.to;
    const direction = new THREE.Vector3();
    direction.subVectors(endPoint, startPoint).normalize();
    raycast.set(startPoint, direction);
    const intersects = raycast.intersectObjects(meshes, true);
    
    if(intersects.length) {
        const timeToHit = projectile.weapon.speed * intersects[0].distance * 1000;
        if(timeElapsed + timeToHit < travelTime) {
            if(checkIfNewHit(projectile, intersects)) {
                // console.log('HIT', projectile, intersects, timePhase, timeElapsed, travelTime, startPoint);
                projectile.hitEntity = intersects[0].object.name;
                projectile.hitTime = projectile.startTime + timeElapsed + timeToHit;
                projectile.normal = [ intersects[0].face.normal.x, intersects[0].face.normal.y, intersects[0].face.normal.z ];
                projectile.direction = [ direction.x, direction.y, direction.z ];
                projectile.point = [ intersects[0].point.x, intersects[0].point.y, intersects[0].point.z ];
                list[projectile.id] = Object.assign({}, projectile);
            }
        } else {
            resetHit(projectile, list);
        }
    } else {
        resetHit(projectile, list);
    }
};

const checkIfNewHit = (projectile, intersects) => {
    if(projectile.hitEntity !== intersects[0].object.name) return true;
    if(Math.round(projectile.point[0] * 1000) !== Math.round(intersects[0].point.x * 1000)) return true;
    if(Math.round(projectile.point[1] * 1000) !== Math.round(intersects[0].point.y * 1000)) return true;
    if(Math.round(projectile.point[2] * 1000) !== Math.round(intersects[0].point.z * 1000)) return true;
    return false;
};

const resetHit = (projectile, list) => {
    projectile.hitEntity = null;
    projectile.hitTime = null;
    projectile.normal = null;
    projectile.direction = null;
    projectile.point = null;
    delete list[projectile.id];
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

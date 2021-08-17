import * as THREE from 'three';

class HitZonePlates {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.nextPlateIndex = 0;
        this.totalPlates = 10;
        this.material;
        this.plates;
        this.timeouts = [];
        this.dummy = new THREE.Object3D();
    }

    addHitZone(intersect) {
        const index = this.nextPlateIndex;
        const dummy = this.dummy;
        const hitPoint = intersect.point;
        const normalLookAt = new THREE.Vector3(
            hitPoint.x + intersect.face.normal.x,
            hitPoint.y + intersect.face.normal.y,
            hitPoint.z + intersect.face.normal.z
        );
        dummy.position.set(
            hitPoint.x + intersect.face.normal.x / 1000 * Math.random(),
            hitPoint.y + intersect.face.normal.y / 1000 * Math.random(),
            hitPoint.z + intersect.face.normal.z / 1000 * Math.random()
        );
        dummy.lookAt(normalLookAt);
        const scale = this.sceneState.utils.randomFloatFromInterval(0.32, 0.5);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        this.plates.setMatrixAt(this.nextPlateIndex, dummy.matrix);
        this.plates.instanceMatrix.needsUpdate = true;

        clearTimeout(this.timeouts[this.nextPlateIndex]);
        this.timeouts[this.nextPlateIndex] = setTimeout(() => {
            this.dummy.position.set(0, 2000, 0);
            this.dummy.updateMatrix();
            this.plates.setMatrixAt(index, this.dummy.matrix);
            this.plates.instanceMatrix.needsUpdate = true;
        }, 5000);

        this.nextPlateIndex++;
        if(this.nextPlateIndex > this.totalPlates) this.nextPlateIndex = 0;
    }

    initPlates() {
        const amount = this.totalPlates;
        const dummy = this.dummy;
        const geo = new THREE.PlaneBufferGeometry(0.4, 0.4, 1, 1);
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000) });
        const mesh = new THREE.InstancedMesh(geo, mat, amount);
        // mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        for(let i=0; i<amount; i++) {
            dummy.position.set(i, 0, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            this.timeouts.push(setTimeout(() => {}, 0));
        }
        mesh.instanceMatrix.needsUpdate = true;
        this.plates = mesh;
        this.sceneState.scenes[this.sceneState.curScene].add(this.plates);
        console.log('PLATES', this.plates);
    }

    _createShaderMaterial() {

    }
}

export default HitZonePlates;
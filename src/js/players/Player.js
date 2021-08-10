import * as THREE from 'three';
import { TimelineMax, Sine } from 'gsap-ssr';
import projectileWeapon from '../data/weapons/projectile01';

class Player {
    constructor(sceneState, data) {
        this.sceneState = sceneState;
        this.rotatationTL = null;
        this.twoPI = sceneState.utils.getCommonPIs('twoPi');
        this.halfPI = sceneState.utils.getCommonPIs('half');
        this.data = data;
        this.curWeapon = projectileWeapon;
        this.rayshooter = new THREE.Raycaster();
        data.render = this.render;
        data.xPosMulti = 0;
        data.zPosMulti = 0;
        data.direction = 0;
        data.moveStartTimes = {
            startX: 0,
            startZ: 0,
        };
        if(!this.sceneState.playerKeysCount) {
            this.sceneState.players = {};
            this.sceneState.playerKeys = [];
            this.sceneState.playerKeysCount = 0;
        }
        this.shooting = {
            maxDistance: 10, // Temp for now, this needs to be determined by the gun used.
        };
    }

    create() {
        this.data.createPlayerFn(
            this.data,
            this.sceneState,
            THREE
        );
        this._addPushableBox(); // TEMPORARY
    }

    _addPushableBox() { // TEMPORARY
        const position = [21, 2, 8];

        const geo = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xcc5522 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position[0], position[1], position[2]);
        this.sceneState.scenes[this.sceneState.curScene].add(mesh);

        this.sceneState.physicsClass.addShape({
            id: 'dummy-box-01',
            type: 'box',
            moving: true,
            mass: 50,
            size: [0.5, 0.5, 0.5],
            position,
            rotation: [0, 0, 0],
            material: { friction: 0.2 },
            mesh,
            sleep: {
                allowSleep: true,
                sleeSpeedLimit: 0.1,
                sleepTimeLimit: 1,
            },
        });
    }

    getPlayerData() {
        return this.data;
    }

    getDirection() {
        return this.data.direction;
    }

    rotatePlayer(toDir) {
        this.data.rotatingY = true;
        if(this.rotationTL) {
            this.rotationTL.kill();
        }
        this.data.direction = this._bringRotationToRange(this.data.direction);
        let from = this._makeRotationPositive(this.data.direction);
        if(Math.abs(from - toDir) > Math.PI) {
            if(from > Math.PI) {
                from -= this.twoPI;
            } else {
                from += this.twoPI;
            }
        }
        const mesh = this.data.mesh.children[0];
        mesh.rotation.y = from;
        this.rotationTL = new TimelineMax().to(mesh.rotation, 0.2, {
            y: toDir,
            ease: Sine.easeInOut,
            onUpdate: () => {
                this.data.direction = this._bringRotationToRange(mesh.rotation.y);
            },
            onComplete: () => {
                this.rotationTL = null;
                this.data.direction = this._bringRotationToRange(toDir);
                this.data.direction = this._makeRotationPositive(this.data.direction);
                mesh.rotation.y = this.data.direction;
                this.data.rotatingY = false;
            },
        });
    }

    _makeRotationPositive(dir) {
        if(dir < 0) {
            dir += this.twoPI;
        }
        return dir;
    }

    _bringRotationToRange(curDir) {
        if(curDir >= this.twoPI) {
            curDir -= this.twoPI;
            return this._bringRotationToRange(curDir);
        } else if(curDir <= this.twoPI * -1) {
            curDir += this.twoPI;
            return this._bringRotationToRange(curDir);
        }
        return curDir;
    }

    movePlayer(xPosMulti, zPosMulti, dir, startTimes) {
        this.rotatePlayer(dir);
        xPosMulti /= 4;
        zPosMulti /= 4;
        this.data.xPosMulti = xPosMulti;
        this.data.zPosMulti = zPosMulti;
        this.data.moveStartTimes = startTimes;
        this.sceneState.additionalPhysicsData.push({
            phase: 'moveChar',
            data: {
                id: this.data.id,
                bodyIndex: this.data.bodyIndex,
                speed: this.data.speed,
                xPosMulti,
                zPosMulti,
                moveStartTimes: startTimes,
                direction: dir,
            },
        });
    }

    jump(timePressed) {
        const power = timePressed / timePressed;
        this.sceneState.additionalPhysicsData.push({
            phase: 'jumpChar',
            data: {
                id: this.data.id,
                bodyIndex: this.data.bodyIndex,
                power,
                jump: power * this.data.jump,
            },
        });
    }

    shoot(pos) {
        const data = this.data;
        const shotHeight = data.mesh.children[0].position.y;
        const maxDistance = this.curWeapon.maxDistance;

        const curPosX = data.mesh.children[0].position.x;
        const curPosZ = data.mesh.children[0].position.z;
        const distX = pos.x - curPosX;
        const distZ = pos.z - curPosZ;
        let a = Math.atan2(distX, distZ);
        if(a - this.halfPI < Math.PI) {
            a += Math.PI * 2 - this.halfPI;
        } else {
            a -= this.halfPI;
        }
        if(Math.abs(a - data.mesh.children[0].rotation.y) > Math.PI) {
            data.mesh.children[0].rotation.y > a
                ? data.mesh.children[0].rotation.y -= this.twoPI
                : a -= this.twoPI;
        }
        this.rotatePlayer(a);

        const startPoint = data.mesh.children[0].position;
        startPoint.y = shotHeight;
        const direction = new THREE.Vector3();
        direction.subVectors(new THREE.Vector3(pos.x, shotHeight, pos.z), startPoint).normalize();
        this.rayshooter.set(startPoint, direction);
        let intersectsLevel = this.rayshooter.intersectObjects(
            this.sceneState.levelAssets.lvlMeshes,
            true
        );

        if(intersectsLevel.length && intersectsLevel[0].distance > maxDistance) intersectsLevel = [];
        if(!intersectsLevel.length) {
            // shot into space or the distance to a wall is longer than the max distance
            const targetPos = [0,0];
            let dir;
            if(startPoint.z > pos.z && startPoint.x > pos.x) { dir = 1; } else
            if(startPoint.z < pos.z && startPoint.x > pos.x) { dir = 3; } else
            if(startPoint.z < pos.z && startPoint.x < pos.x) { dir = 5; } else
            if(startPoint.z > pos.z && startPoint.x < pos.x) { dir = 7; }
            const xLength = Math.abs(Math.cos(a) * maxDistance);
            const zLength = Math.abs(Math.sin(a) * maxDistance);
            dir > 4 ? targetPos[0] = startPoint.x + xLength : targetPos[0] = startPoint.x - xLength;
            dir > 2 && dir < 6 ? targetPos[1] = startPoint.z + zLength : targetPos[1] = startPoint.z - zLength;
            intersectsLevel.push({
                point: new THREE.Vector3(targetPos[0], shotHeight, targetPos[1]),
                distance: maxDistance,
            });
        }

        const point = intersectsLevel[0].point;
        const distance = intersectsLevel[0].distance;

        if(this.sceneState.settings.debug.showProjectileStreaks) {
            const material = new THREE.LineBasicMaterial({ color: 0xff2ccc });
            const points = [];
            points.push(startPoint);
            points.push(new THREE.Vector3(point.x, shotHeight, point.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.sceneState.scenes[this.sceneState.curScene].add(line);
            setTimeout(() => {
                line.material.dispose();
                geometry.dispose();
                this.sceneState.scenes[this.sceneState.curScene].remove(line);
            }, 2000);
        }

        this.sceneState.projectiles.newProjectile(
            new THREE.Vector3(curPosX, shotHeight, curPosZ),
            point,
            distance,
            this.curWeapon,
            intersectsLevel[0]
        );
    }
}

export default Player;
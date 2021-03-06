import * as THREE from 'three';

class ProjectileParticles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.particles;
        this.maxProjectiles = 50;
        this.particlesPerProjectile = 30;
        this.trailParticlesStart = 20;
        this.trailParticlesStop = 26;
        this.delayPerParticle = 0.02;
        this.totalDelayPerProjectile = this.particlesPerProjectile * this.delayPerParticle * 1000;
        this.nextProjIndex = 0;
        this.sceneState.levelAssets.fxTextures.projectileBall = {
            url: this.sceneState.settings.assetsUrl + '/sprites/white_glow_256x256.png',
            texture: null,
        };
        this.material;
        this.timeouts = [];
    }

    initProjectiles() {
        this.material = this._createParticleShader();
        const projCount = this.maxProjectiles;
        const particlesPerProjectile = this.particlesPerProjectile;
        const trailParticlesStart = this.trailParticlesStart;
        const trailParticlesStop = this.trailParticlesStop;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        const targets = new Float32Array(projCount * particlesPerProjectile * 3);
        const timeSpeedDelays = new Float32Array(projCount * particlesPerProjectile * 3);
        const colors = new Float32Array(projCount * particlesPerProjectile * 3);
        const distanceTrails = new Float32Array(projCount * particlesPerProjectile * 3);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                positions[i] = 0;
                positions[i+1] = 2000;
                positions[i+2] = 0;
                targets[i] = 0;
                targets[i+1] = 2000;
                targets[i+2] = 0;
                timeSpeedDelays[i] = 0;
                timeSpeedDelays[i+1] = 0;
                timeSpeedDelays[i+2] = p2 * this.delayPerParticle;
                const color = new THREE.Color(0xff0000);
                colors[i] = color.r;
                colors[i+1] = color.g;
                colors[i+2] = color.b;
                distanceTrails[i] = 0;
                if(p2 >= trailParticlesStart-1 && p2 <= trailParticlesStop-1) {
                    distanceTrails[i+1] = Math.random();
                } else {
                    distanceTrails[i+1] = 1.1;
                }
                distanceTrails[i+2] = 0;
                i += 3;
            }
            this.timeouts[p1] = setTimeout(() => {}, 0);
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        projGeo.setAttribute('target', new THREE.BufferAttribute(targets, 3));
        projGeo.setAttribute('timeSpeedDelay', new THREE.BufferAttribute(timeSpeedDelays, 3));
        projGeo.setAttribute('distanceTrail', new THREE.BufferAttribute(distanceTrails, 3));
        projGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
        // setInterval(() => {
        //     this.newProjectile(
        //         new THREE.Vector3(12, 1, 4),
        //         new THREE.Vector3(17, 1, 4),
        //         5,
        //         { color: 0xfc2f00, speed: 0.8 }
        //     );
        // }, 1500);
    }

    newProjectile(from, to, distance, weapon, intersect) {
        const index = this.nextProjIndex;
        const attributes = this.particles.geometry.attributes;
        let i;
        const start = index * this.particlesPerProjectile * 3;
        const end = start + this.particlesPerProjectile * 3;
        const startTime = this.sceneState.atomClock.getTime();
        const id = 'PROJE-' + index + '-' + startTime; // TODO: Create a better id for a projectile (add shooter id)
        this.sceneState.consClass.addProjectile({ from, to, startTime, distance, weapon, id, index });
        const color = new THREE.Color(weapon.color);
        for(i=start; i<end; i+=3) {
            attributes.position.array[i] = from.x;
            attributes.position.array[i+1] = from.y;
            attributes.position.array[i+2] = from.z;
            attributes.target.array[i] = to.x;
            attributes.target.array[i+1] = to.y;
            attributes.target.array[i+2] = to.z;
            attributes.timeSpeedDelay.array[i] = startTime;
            attributes.timeSpeedDelay.array[i+1] = weapon.speed;
            attributes.distanceTrail.array[i] = distance;
            attributes.color.array[i] = color.r;
            attributes.color.array[i+1] = color.g;
            attributes.color.array[i+2] = color.b;
        }
        attributes.position.needsUpdate = true;
        attributes.target.needsUpdate = true;
        attributes.timeSpeedDelay.needsUpdate = true;
        attributes.distanceTrail.needsUpdate = true;
        attributes.color.needsUpdate = true;
        this.nextProjIndex++;
        if(this.nextProjIndex > this.maxProjectiles-1) this.nextProjIndex = 0;
        clearTimeout(this.timeouts[index]);
        if(intersect && intersect.object) {
            this.timeouts[index] = setTimeout(() => {
                this._createAHitAnimation(from, to, weapon, intersect, index, id);
            }, weapon.speed * (distance - 0.25) * 1000);
        } else {
            this.timeouts[index] = setTimeout(() => {
                this._resetProjectile(index, id);
            }, weapon.speed * distance * 1000 + this.totalDelayPerProjectile);
        }
    }

    setNewProjectileHit(proje) {
        clearTimeout(this.timeouts[proje.index]);
        const intersect = {
            face: {
                normal: {
                    x: proje.normal[0],
                    y: proje.normal[1],
                    z: proje.normal[2],
                }
            },
            point: {
                x: proje.point[0],
                y: proje.point[1],
                z: proje.point[2],
            },
        };
        this._createAHitAnimation(proje.from, intersect.point, proje.weapon, intersect, proje.index, false, false);
        setTimeout(() => {
            this._resetProjectile(proje.index);
        }, this.totalDelayPerProjectile * proje.weapon.speed + 70);
    }

    _createAHitAnimation(from, to, weapon, intersect, index, id, showHitPlate) {
        this.sceneState.physicsParticles.addParticles(from, to, weapon.speed, intersect);
        if(showHitPlate !== false) this.sceneState.hitZonePlates.addHitZone(intersect);
        const smokeDir = {
            x: to.x + intersect.face.normal.x * 0.3,
            y: to.y + intersect.face.normal.y * 0.3 + 1.5,
            z: to.z + intersect.face.normal.z * 0.3,
        };
        let size = this.sceneState.utils.randomFloatFromInterval(0.0001, 2.0);
        this.sceneState.smokeParticles.addSmoke(to, smokeDir, {
            lightness: this.sceneState.utils.randomFloatFromInterval(0.25, 0.45),
            size: size,
            life: this.sceneState.utils.randomIntFromInterval(2000, 2700),
            length: this.sceneState.utils.randomIntFromInterval(2, 4),
            delayPerParticle: 150 * size,
            startDelay: -300 * Math.random(),
        });
        if(Math.random() > 0.5) {
            size = this.sceneState.utils.randomFloatFromInterval(0.0002, 1.4);
            this.sceneState.smokeParticles.addSmoke(to, smokeDir, {
                lightness: this.sceneState.utils.randomFloatFromInterval(0.15, 0.25),
                size: size,
                life: this.sceneState.utils.randomIntFromInterval(1700, 2500),
                length: this.sceneState.utils.randomIntFromInterval(2, 4),
                delayPerParticle: 150 * size,
                startDelay: -500 * Math.random(),
            });
        }
        setTimeout(() => {
            this._resetProjectile(index, id);
        }, this.totalDelayPerProjectile);
    }

    _resetProjectile(index, id) {
        let i;
        const attributes = this.particles.geometry.attributes;
        const start = index * this.particlesPerProjectile * 3;
        const end = start + this.particlesPerProjectile * 3;
        const startTime = this.sceneState.atomClock.getTime();
        for(i=start; i<end; i+=3) {
            attributes.position.array[i] = 0;
            attributes.position.array[i+1] = 2000;
            attributes.position.array[i+2] = 0;
            attributes.target.array[i] = 0;
            attributes.target.array[i+1] = 2000;
            attributes.target.array[i+2] = 0;
            attributes.timeSpeedDelay.array[i] = startTime;
            attributes.timeSpeedDelay.array[i+1] = 0;
            attributes.distanceTrail.array[i] = 0;
        }
        attributes.position.needsUpdate = true;
        attributes.target.needsUpdate = true;
        attributes.timeSpeedDelay.needsUpdate = true;
        attributes.distanceTrail.needsUpdate = true;
        if(id) this.sceneState.consClass.removeProjectile(id);
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                scale: { value: window.innerHeight * pixelRatio / 2 },
                diffuseTexture: { value: this.sceneState.levelAssets.fxTextures.projectileBall.texture },
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute vec3 target;
                attribute vec3 timeSpeedDelay;
                attribute vec3 distanceTrail;
                attribute vec3 color;
                uniform float uStartTime;
                uniform float uTime;
                uniform float scale;
                varying float vTimePhase;
                varying vec3 vColor;
                varying float vIsTrail;
                varying float vTrailTime;
                varying float vDelay;

                void main() {
                    vColor = color;
                    vDelay = timeSpeedDelay[2];
                    float speed = timeSpeedDelay[1];
                    float startTime = timeSpeedDelay[0] + vDelay * 1000.0 * speed;
                    float travelTime = speed * distanceTrail[0] * 1000.0 + vDelay;
                    float timeElapsed = uTime - startTime;
                    vTimePhase = clamp(mod(timeElapsed, travelTime) / travelTime + floor(timeElapsed / travelTime), 0.0, 1.0);
                    vec3 from = position;
                    vec3 to = target;
                    float trails = distanceTrail[1];
                    vIsTrail = clamp(floor(vTimePhase / trails), 0.0, 1.0);
                    float notTrail = 1.0 - vIsTrail;
                    vTrailTime = trails;
                    vec3 trailPos = (to - from) * (trails + 0.2 * vTimePhase) * vIsTrail;
                    vec3 newPos = (to - from) * vTimePhase * notTrail;
                    newPos.y = newPos.y * (1.0 - floor(vTimePhase)) + 2000.0 * floor(vTimePhase);
                    vec4 mvPosition = modelViewMatrix * vec4(from + newPos + trailPos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    float pSize = vIsTrail * 2.0 + notTrail * 0.58 * (1.0 - vDelay / 2.0);
                    gl_PointSize = pSize * (scale / length(-mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                varying float vTimePhase;
                varying vec3 vColor;
                varying float vIsTrail;
                varying float vTrailTime;
                varying float vDelay;

                void main() {
                    float alpha = 1.0 - (vTimePhase / clamp(vTrailTime + 0.7, 0.0, 1.0)) * vIsTrail;
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(vColor + (0.5 - vDelay), alpha);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        this.sceneState.shadersToResize.push({ material: material });
        return material;
    }
}

export default ProjectileParticles;
import * as THREE from 'three';

class SmokeParticles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.particles;
        this.maxParticles = 50;
        this.particlesPerSmoke = 30;
        this.delayPerParticle = 0.02;
        this.nextProjIndex = 0;
        this.sceneState.levelAssets.fxTextures.projectileBall = {
            url: this.sceneState.settings.assetsUrl + '/sprites/white_glow_256x256.png',
            texture: null,
        };
        this.material;
    }

    initSmoke() {
        this.material = this._createParticleShader();
        const projCount = this.maxParticles;
        const particlesPerProjectile = this.particlesPerSmoke;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        // const targets = new Float32Array(projCount * particlesPerProjectile * 3);
        // const timeSpeedDelays = new Float32Array(projCount * particlesPerProjectile * 3);
        // const colors = new Float32Array(projCount * particlesPerProjectile * 3);
        // const distanceTrails = new Float32Array(projCount * particlesPerProjectile * 3);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                positions[i] = i;
                positions[i+1] = 0;
                positions[i+2] = 0;
                // targets[i] = 0;
                // targets[i+1] = 2000;
                // targets[i+2] = 0;
                // timeSpeedDelays[i] = 0;
                // timeSpeedDelays[i+1] = 0;
                // timeSpeedDelays[i+2] = p2 * this.delayPerParticle;
                // const color = new THREE.Color(0xff0000);
                // colors[i] = color.r;
                // colors[i+1] = color.g;
                // colors[i+2] = color.b;
                // distanceTrails[i] = 0;
                // if(p2 >= trailParticlesStart-1 && p2 <= trailParticlesStop-1) {
                //     distanceTrails[i+1] = Math.random();
                // } else {
                //     distanceTrails[i+1] = 1.1;
                // }
                // distanceTrails[i+2] = 0;
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        // projGeo.setAttribute('target', new THREE.BufferAttribute(targets, 3));
        // projGeo.setAttribute('timeSpeedDelay', new THREE.BufferAttribute(timeSpeedDelays, 3));
        // projGeo.setAttribute('distanceTrail', new THREE.BufferAttribute(distanceTrails, 3));
        // projGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
    }

    // newProjectile(from, to, distance, weapon, intersect) {
    //     const index = this.nextProjIndex;
    //     const attributes = this.particles.geometry.attributes;
    //     let i;
    //     const start = index * this.particlesPerSmoke * 3;
    //     const end = start + this.particlesPerSmoke * 3;
    //     const startTime = performance.now();
    //     const color = new THREE.Color(weapon.color);
    //     for(i=start; i<end; i+=3) {
    //         attributes.position.array[i] = from.x;
    //         attributes.position.array[i+1] = from.y;
    //         attributes.position.array[i+2] = from.z;
    //         attributes.target.array[i] = to.x;
    //         attributes.target.array[i+1] = to.y;
    //         attributes.target.array[i+2] = to.z;
    //         attributes.timeSpeedDelay.array[i] = startTime;
    //         attributes.timeSpeedDelay.array[i+1] = weapon.speed;
    //         attributes.distanceTrail.array[i] = distance;
    //         attributes.color.array[i] = color.r;
    //         attributes.color.array[i+1] = color.g;
    //         attributes.color.array[i+2] = color.b;
    //     }
    //     attributes.position.needsUpdate = true;
    //     attributes.target.needsUpdate = true;
    //     attributes.timeSpeedDelay.needsUpdate = true;
    //     attributes.distanceTrail.needsUpdate = true;
    //     attributes.color.needsUpdate = true;
    //     this.nextProjIndex++;
    //     if(this.nextProjIndex > this.maxParticles-1) this.nextProjIndex = 0;
    //     if(intersect && intersect.object) {
    //         setTimeout(() => {
    //             this.sceneState.physicsParticles.addParticles(from, to, weapon.speed, intersect);
    //             this.sceneState.hitZonePlates.addHitZone(intersect);
    //         }, weapon.speed * (distance - 0.25) * 1000);
    //     }
    //     setTimeout(() => {
    //         const start = index * this.particlesPerSmoke * 3;
    //         const end = start + this.particlesPerSmoke * 3;
    //         const startTime = performance.now();
    //         for(i=start; i<end; i+=3) {
    //             attributes.position.array[i] = 0;
    //             attributes.position.array[i+1] = 2000;
    //             attributes.position.array[i+2] = 0;
    //             attributes.target.array[i] = 0;
    //             attributes.target.array[i+1] = 2000;
    //             attributes.target.array[i+2] = 0;
    //             attributes.timeSpeedDelay.array[i] = startTime;
    //             attributes.timeSpeedDelay.array[i+1] = 0;
    //             attributes.distanceTrail.array[i] = 0;
    //         }
    //         attributes.position.needsUpdate = true;
    //         attributes.target.needsUpdate = true;
    //         attributes.timeSpeedDelay.needsUpdate = true;
    //         attributes.distanceTrail.needsUpdate = true;
    //     }, weapon.speed * distance * 1000);
    // }

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
            blending: THREE.NormalBlending,
            vertexShader: `
                uniform float uTime;
                uniform float scale;

                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    float pSize = 0.58;
                    gl_PointSize = pSize * (scale / length(-mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;

                void main() {
                    // float alpha = 1.0 - (vTimePhase / clamp(vTrailTime + 0.7, 0.0, 1.0)) * vIsTrail;
                    // gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(vColor + (0.5 - vDelay), alpha);
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        this.sceneState.shadersToResize.push({ material: material });
        return material;
    }
}

export default SmokeParticles;
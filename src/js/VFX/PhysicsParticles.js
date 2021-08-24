import * as THREE from 'three';

class PhysicsParticles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.maxParticles = this.sceneState.physics.particlesCount;
        const DL = this.sceneState.settings.physics.particleDetailLevel;
        this.subParticlesPerParticle = DL === 'high' ? 5 : DL === 'medium' ? 20 : 25;
        this.nextPartIndex = 0;
        this.sceneState.levelAssets.fxTextures.sparks = {
            url: this.sceneState.settings.assetsUrl + '/sprites/orange_glow_256x256.png',
            texture: null,
        };
        this.material;
        this.particles;
        this.timeouts = [];
    }

    initParticles() {
        this.material = this._createParticleShader();
        const partCount = this.maxParticles;
        const particlesPerParticle = this.subParticlesPerParticle;
        const positions = new Float32Array(partCount * particlesPerParticle * 3);
        const subindexes = new Float32Array(partCount * particlesPerParticle);
        const startTimes = new Float32Array(partCount * particlesPerParticle);
        const randoms = new Float32Array(partCount * particlesPerParticle * 3);
        const targetNormals = new Float32Array(partCount * particlesPerParticle * 3);
        let i = 0;
        for(let p1=0; p1<partCount; p1++) {
            for(let p2=0; p2<particlesPerParticle; p2++) {
                subindexes[p1*particlesPerParticle+p2] = p2;
                targetNormals[i] = 0;
                targetNormals[i+1] = 0;
                targetNormals[i+2] = 0;
                randoms[i] = Math.random() * (Math.random() < 0.5 ? -1 : 1);
                randoms[i+1] = Math.random() * (Math.random() < 0.5 ? -1 : 1);
                randoms[i+2] = Math.random() * (Math.random() < 0.5 ? -1 : 1);
                positions[i] = 0;
                positions[i+1] = 2000;
                positions[i+2] = 0;
                startTimes[i] = 0;
                i += 3;
            }
            this.timeouts.push(setTimeout(() => {}), 0);
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        projGeo.setAttribute('subpartindex', new THREE.BufferAttribute(subindexes, 1));
        projGeo.setAttribute('startTime', new THREE.BufferAttribute(startTimes, 1));
        projGeo.setAttribute('random', new THREE.BufferAttribute(randoms, 3));
        projGeo.setAttribute('targetNormal', new THREE.BufferAttribute(targetNormals, 3));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
    }

    addParticles(from, to, speed, intersect) {
        let maxAmount = 5, minAmount = 3;
        const detailLevel = this.sceneState.settings.physics.particleDetailLevel;
        if(detailLevel === 'high') {
            maxAmount = 22; minAmount = 14;
        } else if(detailLevel === 'medium') {
            maxAmount = 6; minAmount = 3;
        }
        const amount = this.sceneState.utils.randomIntFromInterval(minAmount, maxAmount);
        const normals = this.particles.geometry.attributes.targetNormal.array;
        for(let i=0; i<amount; i++) {
            const particleIndex = this.sceneState.physics.nextParticleIndex;
            let nextParticleIndex = particleIndex + 1;
            if(nextParticleIndex > this.sceneState.physics.particlesCount-1) {
                nextParticleIndex = 0;
            }
            clearTimeout(this.timeouts[particleIndex]);

            const yRandomer = Math.random() < 0.37 ? -0.5 : 1;
            this.sceneState.additionalPhysicsData.push({
                phase: 'moveParticle',
                data: {
                    bodyIndex: particleIndex,
                    position: [
                        from.x + (to.x - from.x) + (to.x < from.x ? 0.35 : -0.35),
                        from.y + (to.y - from.y) + (to.y < from.y ? 0.35 : -0.35),
                        from.z + (to.z - from.z) + (to.z < from.z ? 0.35 : -0.35),
                    ],
                    velocity: [
                        (to.x - from.x +
                            this.sceneState.utils.randomFloatFromInterval(0.5, 2.0) *
                            (Math.random() < 0.5 ? -1 : 1)
                        ) * speed * 10,
                        (to.y - from.y +
                            this.sceneState.utils.randomFloatFromInterval(3.0, 7.0) *
                            yRandomer
                        ) * speed * 10,
                        (to.z - from.z +
                            this.sceneState.utils.randomFloatFromInterval(0.5, 2.0) *
                            (Math.random() < 0.5 ? -1 : 1)
                        ) * speed * 10,
                    ],
                },
            });
            setTimeout(() => {
                const attributes = this.particles.geometry.attributes;
                let i;
                const start = particleIndex * this.subParticlesPerParticle;
                const end = start + this.subParticlesPerParticle;
                const startTime = this.sceneState.atomClock.getTime();
                for(i=start; i<end; i++) {
                    attributes.startTime.array[i] = startTime;
                }
                attributes.startTime.needsUpdate = true;
            }, 75);
            
            const start = particleIndex * this.subParticlesPerParticle * 3;
            const end = start + this.subParticlesPerParticle * 3;
            let i;
            const xNormal = intersect.face.normal.x;
            const zNormal = intersect.face.normal.z;
            for(i=start; i<end; i+=3) {
                normals[i] = (xNormal < 0 ? -1 : 1) * Math.random();
                normals[i+1] = yRandomer;
                normals[i+2] = (zNormal < 0 ? -1 : 1) * Math.random();
            }

            this.timeouts[particleIndex] = setTimeout(() => {
                this.sceneState.additionalPhysicsData.push({
                    phase: 'resetPosition',
                    data: {
                        bodyIndex: particleIndex,
                        position: [particleIndex, 2000, 0],
                        sleep: true,
                    },
                });
            }, 6000);
            this.sceneState.physics.nextParticleIndex = nextParticleIndex;
        }
        this.particles.geometry.attributes.targetNormal.needsUpdate = true;
    }

    updatePosition(index, pos) {
        if(!this.particles) return;
        const attributes = this.particles.geometry.attributes;
        let i;
        const start = index * this.subParticlesPerParticle * 3;
        const end = start + this.subParticlesPerParticle * 3;
        for(i=start; i<end; i+=3) {
            attributes.position.array[i] = pos[0];
            attributes.position.array[i+1] = pos[1];
            attributes.position.array[i+2] = pos[2];
        }
        attributes.position.needsUpdate = true;
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const DL = this.sceneState.settings.physics.particleDetailLevel;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uDetailLevel: { value: DL === 'high' ? 8 : DL === 'medium' ? 8 : 12 },
                scale: { value: window.innerHeight * pixelRatio / 2 },
                diffuseTexture: { value: this.sceneState.levelAssets.fxTextures.sparks.texture },
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float subpartindex;
                attribute vec3 random;
                attribute vec3 targetNormal;
                attribute float startTime;
                uniform float uStartTime;
                uniform float uTime;
                uniform float scale;
                uniform float uDetailLevel;
                varying float vAlpha;

                void main() {
                    float timeElapsed = uTime - startTime;
                    float bigGlow = clamp(floor(1.0 - mod(subpartindex, uDetailLevel)), 0.0, 1.0);
                    vAlpha = clamp(1.0 - (clamp(timeElapsed / (5800.0 * abs(random.x)), 0.0, 1.0) * (1.0 - bigGlow) * random.z) - (0.96 * bigGlow + (0.04 * clamp(timeElapsed / (5000.0 * abs(random.x)), 0.0, 1.0))), 0.0, 1.0);
                    float particleSize = clamp(1.0 - (clamp(timeElapsed / (5800.0 * abs(random.x)), 0.0, 1.0) * (1.0 - bigGlow)), 0.0, 1.0);
                    float moveTime = clamp(timeElapsed / (800.0 + random.y * 300.0), 0.0, 1.0);
                    float moveTimeY = clamp(timeElapsed / 1200.0, 0.0, 1.0);
                    float posX = position.x + targetNormal.x * random.x * 0.75 * moveTime;
                    float posY = position.y + (random.y * 2.5 * moveTimeY * (1.0 - moveTime)) * clamp(targetNormal.y, 0.0, 1.0) + 0.1;
                    float posZ = position.z + targetNormal.z * random.z * 0.75 * moveTime;
                    vec4 mvPosition = modelViewMatrix * vec4(posX, posY, posZ, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    gl_PointSize = (0.26 + abs(1.0 - random.y) / 15.0 * random.x + 4.0 * bigGlow) * particleSize * (scale / length(-mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                varying float vAlpha;

                void main() {
                    float intensifier = clamp(vAlpha - 0.7, 0.0, 1.0);
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord)
                        * vec4(1.0, 1.0, 1.0, vAlpha)
                        + vec4(intensifier, intensifier, intensifier, 0.0);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        this.sceneState.shadersToResize.push({ material: material });
        return material;
    }
}

export default PhysicsParticles;
import * as THREE from 'three';

class Projectiles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.particles;
        this.maxProjectiles = 50;
        this.particlesPerProjectile = 30;
        this.trailParticlesStart = 20;
        this.trailParticlesStop = 26;
        this.delayPerParticle = 0.02;
        this.totalDelayPerProjectile = this.particlesPerProjectile * this.delayPerParticle * 1000;
        this.material = this._createParticleShader();
        this.nextProjIndex = 0;
        this._initProjectiles();
    }

    _initProjectiles() {
        const projCount = this.maxProjectiles;
        const particlesPerProjectile = this.particlesPerProjectile;
        const trailParticlesStart = this.trailParticlesStart;
        const trailParticlesStop = this.trailParticlesStop;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        const delays = new Float32Array(projCount * particlesPerProjectile);
        const projIndexes = new Float32Array(projCount * particlesPerProjectile);
        const trails = new Float32Array(projCount * particlesPerProjectile);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                projIndexes[p1*particlesPerProjectile+p2] = p1;
                delays[p1*particlesPerProjectile+p2] = p2 * 0.02;
                positions[i] = 0;
                positions[i+1] = 0;
                positions[i+2] = 0;
                if(p2 >= trailParticlesStart-1 && p2 <= trailParticlesStop-1) {
                    trails[p1*particlesPerProjectile+p2] = Math.random();
                } else {
                    trails[p1*particlesPerProjectile+p2] = 1.1;
                }
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('projindex', new THREE.BufferAttribute(projIndexes, 1));
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        projGeo.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
        projGeo.setAttribute('trails', new THREE.BufferAttribute(trails, 1));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
        setInterval(() => {
            this.newProjectile(
                new THREE.Vector3(12, 1, 4),
                new THREE.Vector3(17, 1, 4),
                5,
                { color: 0xfc2f00, speed: 0.8 }
            );
        }, 1500);
    }

    newProjectile(from, to, distance, weapon, intersect) {
        const index = this.nextProjIndex;
        this.material.uniforms.uColors.value[index] = new THREE.Color(weapon.color);
        this.material.uniforms.uFroms.value[index] = from;
        this.material.uniforms.uTos.value[index] = to;
        this.material.uniforms.uDistances.value[index] = distance;
        this.material.uniforms.uSpeeds.value[index] = weapon.speed;
        this.material.uniforms.uStartTimes.value[index] = performance.now();
        this.nextProjIndex++;
        if(this.nextProjIndex > this.maxProjectiles-1) this.nextProjIndex = 0;
        if(intersect && intersect.object) {
            console.log('HITS SOMETHING');
        }
        setTimeout(() => {
            this.material.uniforms.uFroms.value[index] = new THREE.Vector3(0, 2000, 0);
            this.material.uniforms.uTos.value[index] = new THREE.Vector3(0, 2000, 0);
            this.material.uniforms.uDistances.value[index] = 0;
            this.material.uniforms.uSpeeds.value[index] = 0;
            this.material.uniforms.uStartTimes.value[index] = performance.now();
        }, weapon.speed * distance * 1000 + this.totalDelayPerProjectile);
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColors: { value: this._initShaderPart('color') },
                uTime: { value: 0 },
                uStartTimes: { value: this._initShaderPart('startTime') },
                uSpeeds: { value: this._initShaderPart('speed') },
                uDistances: { value: this._initShaderPart('zeros') },
                uFroms: { value: this._initShaderPart('position') },
                uTos: { value: this._initShaderPart('position') },
                uPixelRatio: { value: pixelRatio },
                scale: { type: 'f', value: window.innerHeight * pixelRatio / 2 },
                diffuseTexture: { value: new THREE.TextureLoader().load(
                    this.sceneState.settings.assetsUrl + '/sprites/white_glow_256x256.png'
                )},
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float delay;
                attribute float projindex;
                attribute float trails;
                uniform float uStartTime;
                uniform float uTime;
                uniform vec3 uFroms[${this.maxProjectiles}];
                uniform vec3 uTos[${this.maxProjectiles}];
                uniform vec3 uColors[${this.maxProjectiles}];
                uniform float uStartTimes[${this.maxProjectiles}];
                uniform float uSpeeds[${this.maxProjectiles}];
                uniform float uDistances[${this.maxProjectiles}];
                uniform float uPixelRatio;
                uniform float scale;
                varying float vTimePhase;
                varying vec3 vColor;
                varying float vIsTrail;
                varying float vTrailTime;
                varying float vDelay;

                void main() {
                    float sparkScatterDuration = 3.0;
                    int intIndex = int(projindex);
                    vColor = uColors[intIndex];
                    float speed = uSpeeds[intIndex];
                    float startTime = uStartTimes[intIndex] + delay * 1000.0 * speed;
                    float travelTime = speed * uDistances[intIndex] * 1000.0 + delay;
                    float timeElapsed = uTime - startTime;
                    vTimePhase = clamp(mod(timeElapsed, travelTime) / travelTime + floor(timeElapsed / travelTime), 0.0, 1.0);
                    vec3 from = uFroms[intIndex];
                    vec3 to = uTos[intIndex];
                    vIsTrail = clamp(floor(vTimePhase / trails), 0.0, 1.0);
                    float notTrail = 1.0 - vIsTrail;
                    vTrailTime = trails;
                    vDelay = delay;
                    vec3 trailPos = (to - from) * (trails + 0.2 * vTimePhase) * vIsTrail;
                    vec3 newPos = (to - from) * vTimePhase * notTrail;
                    newPos.y = newPos.y * (1.0 - floor(vTimePhase)) + 2000.0 * floor(vTimePhase);
                    vec4 mvPosition = modelViewMatrix * vec4(from + newPos + trailPos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    float pSize = vIsTrail * 2.0 + notTrail * 0.58 * (1.0 - delay / 2.0);
                    gl_PointSize = pSize * (scale / length(-mvPosition.xyz));
                    // gl_PointSize = pSize * 50.0;
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
                    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        this.sceneState.shadersToResize.push({ material: material });
        return material;
    }

    _initShaderPart(part) {
        const returnArray = [];
        if(part === 'color') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(new THREE.Color(0xff0000));
            }
        } else if(part === 'startTime') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(performance.now());
            }
        } else if(part === 'speed') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(0.15);
            }
        } else if(part === 'zeros') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(0);
            }
        } else if(part === 'position') {
            for(let i=0; i<this.maxProjectiles; i++) {
                returnArray.push(new THREE.Vector3(0, 0, 0));
            }
        }
        return returnArray;
    }
}

export default Projectiles;
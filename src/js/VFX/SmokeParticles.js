import * as THREE from 'three';

class SmokeParticles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.particles;
        this.maxParticles = 50;
        this.particlesPerSmoke = 15;
        this.delayPerParticle = 200;
        this.nextSmokeIndex = 0;
        this.sceneState.levelAssets.fxTextures.smoke = {
            url: this.sceneState.settings.assetsUrl + '/sprites/smoke01_512x512.png',
            texture: null,
        };
        this.material;
    }

    initSmoke() {
        this.material = this._createParticleShader();
        const projCount = this.maxParticles;
        const particlesPerProjectile = this.particlesPerSmoke;
        const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        const targets = new Float32Array(projCount * particlesPerProjectile * 3);
        const timeLengthLife = new Float32Array(projCount * particlesPerProjectile * 3);
        const sizeLightnessIndex = new Float32Array(projCount * particlesPerProjectile * 3);
        const randoms = new Float32Array(projCount * particlesPerProjectile * 3);
        const colors = new Float32Array(projCount * particlesPerProjectile * 3);
        let i = 0;
        for(let p1=0; p1<projCount; p1++) {
            for(let p2=0; p2<particlesPerProjectile; p2++) {
                positions[i] = 0;
                positions[i+1] = 2000;
                positions[i+2] = 6;
                targets[i] = 0;
                targets[i+1] = 2000;
                targets[i+2] = 0;
                timeLengthLife[i] = 0;
                timeLengthLife[i+1] = 0;
                timeLengthLife[i+2] = 0;
                sizeLightnessIndex[i] = 1.0;
                sizeLightnessIndex[i+1] = 0.5 * Math.random() + 0.1;
                sizeLightnessIndex[i+2] = p2;
                randoms[i] = Math.random() * Math.random() < 0.5 ? -1 : 1;
                randoms[i+1] = Math.random() * Math.random() < 0.5 ? -1 : 1;
                randoms[i+2] = 200; // Delay per particle
                colors[i] = 1; // R
                colors[i+1] = 0; // G
                colors[i+2] = 0; // B
                i += 3;
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        projGeo.setAttribute('target', new THREE.BufferAttribute(targets, 3));
        projGeo.setAttribute('timeLengthLife', new THREE.BufferAttribute(timeLengthLife, 3));
        projGeo.setAttribute('sizeLightnessIndex', new THREE.BufferAttribute(sizeLightnessIndex, 3));
        projGeo.setAttribute('random', new THREE.BufferAttribute(randoms, 3));
        projGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
    }

    addSmoke(from, to, params) {
        let { size, life, startDelay, delayPerParticle, lightness, length } = params;
        if(!size) size = 3.0;
        if(!life) life = 1200;
        if(!startDelay) startDelay = 0;
        if(!delayPerParticle) delayPerParticle = 200;
        if(!lightness) lightness = 0;
        if(!length || length > this.particlesPerSmoke) length = this.particlesPerSmoke;
        const index = this.nextSmokeIndex;
        const attributes = this.particles.geometry.attributes;
        let i;
        const start = index * this.particlesPerSmoke * 3;
        const end = start + length * 3;
        const startTime = performance.now() + startDelay;
        const color = new THREE.Color(0x000000);
        for(i=start; i<end; i+=3) {
            attributes.position.array[i] = from.x;
            attributes.position.array[i+1] = from.y;
            attributes.position.array[i+2] = from.z;
            attributes.target.array[i] = to.x;
            attributes.target.array[i+1] = to.y;
            attributes.target.array[i+2] = to.z;
            attributes.timeLengthLife.array[i] = startTime;
            attributes.timeLengthLife.array[i+1] = length; // Grow to max size speed
            attributes.timeLengthLife.array[i+2] = life; // One particle life span
            attributes.sizeLightnessIndex.array[i] = size;
            attributes.sizeLightnessIndex.array[i+1] = lightness;
            attributes.random.array[i+2] = delayPerParticle;
            attributes.color.array[i] = color.r;
            attributes.color.array[i+1] = color.g;
            attributes.color.array[i+2] = color.b;
        }
        attributes.position.needsUpdate = true;
        attributes.target.needsUpdate = true;
        attributes.timeLengthLife.needsUpdate = true;
        attributes.sizeLightnessIndex.needsUpdate = true;
        attributes.random.needsUpdate = true;
        attributes.color.needsUpdate = true;
        this.nextSmokeIndex++;
        if(this.nextSmokeIndex > this.maxParticles-1) this.nextSmokeIndex = 0;
        setTimeout(() => {
            const start = index * this.particlesPerSmoke * 3;
            const end = start + length * 3;
            for(i=start; i<end; i+=3) {
                attributes.position.array[i] = 0;
                attributes.position.array[i+1] = 2000;
                attributes.position.array[i+2] = 0;
                attributes.target.array[i] = 0;
                attributes.target.array[i+1] = 2000;
                attributes.target.array[i+2] = 0;
            }
            attributes.position.needsUpdate = true;
            attributes.target.needsUpdate = true;
        }, life + startDelay + delayPerParticle * length);
    }

    _createParticleShader() {
        let pixelRatio = window.devicePixelRatio;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                scale: { value: window.innerHeight * pixelRatio / 2 },
                smokeTexture: { value: this.sceneState.levelAssets.fxTextures.smoke.texture },
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.NormalBlending,
            vertexShader: `
                attribute vec3 target;
                attribute vec3 timeLengthLife;
                attribute vec3 sizeLightnessIndex;
                attribute vec3 random;
                attribute vec3 color;
                uniform float uTime;
                uniform float scale;
                varying float vTimePhase;
                varying float vLightness;
                varying float vHasStarted;
                varying float vHasEnded;
                varying vec2 vAngle;
                varying vec3 vColor;

                void main() {
                    vColor = color;
                    vLightness = sizeLightnessIndex[1];
                    float delay = random.z;
                    float index = sizeLightnessIndex[2];
                    float isParticleShown = ceil(clamp(timeLengthLife[1] - index, 0.0, 1.0));
                    float startTime = timeLengthLife[0] + index * delay;
                    float lifeTime = timeLengthLife[2];
                    float timeElapsed = uTime - startTime;
                    vHasStarted = ceil(clamp(uTime - startTime, 0.0, 1.0)) * isParticleShown;
                    vHasEnded = ceil(clamp(lifeTime - timeElapsed, 0.0, 1.0));
                    vTimePhase = clamp(mod(timeElapsed, lifeTime) / lifeTime, 0.0, 1.0) * vHasStarted;
                    vAngle = vec2(cos(random.x * ${Math.PI} * vTimePhase), sin(random.y * ${Math.PI} * vTimePhase));
                    vec3 newPos = position + (target - position) * vTimePhase;
                    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    float pSize = sizeLightnessIndex[0] * vTimePhase;
                    gl_PointSize = pSize * (scale / length(-mvPosition.xyz));
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D smokeTexture;
                varying float vTimePhase;
                varying float vLightness;
                varying float vHasStarted;
                varying float vHasEnded;
                varying vec2 vAngle;
                varying vec3 vColor;

                void main() {
                    vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
                    vec4 curPixel = texture2D(smokeTexture, coords)
                        + vec4(vLightness, vLightness, vLightness, 0.0)
                        + vec4(vColor, 0.0);
                    curPixel.a *= vHasStarted * vHasEnded * (1.0 - vTimePhase);
                    gl_FragColor = curPixel;
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
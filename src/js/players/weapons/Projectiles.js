import * as THREE from 'three';

class Projectiles {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.particles;
        this.maxProjectiles = 3;
        this.material = this._createParticleShader();
        this._initProjectiles();
    }

    _initProjectiles() {
        // Init points here:
        // Create a large number of points (float32 attributes as vertices for the BufferGeometry)
        // (let's say about 30 x 100 = 3000, this means 100 simultaneous projectiles)
        // Add a COLOR uniform (THREE.Color) for each projectile.
        // Add a FROM uniform (THREE.Vector3) for each projectile.
        // Add a TO uniform (THREE.Vector3) for each projectile.
        // Add a SPEED uniform (float) for each projectile.
        // Add a HIT uniform (boolean) for each projectile.
        // Every uniform is an array where each index represents a projectile.

        const projCount = this.maxProjectiles;
        const particlesPerProjectile = 35;
        const trailParticlesStart = 30;
        const trailParticlesStop = 35;
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
                i += 3;
                if(p2 >= trailParticlesStart-1 && p2 <= trailParticlesStop-1) {
                    trails[p1*particlesPerProjectile+p2] = Math.random();
                } else {
                    trails[p1*particlesPerProjectile+p2] = 1.1;
                }
            }
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('projindex', new THREE.BufferAttribute(projIndexes, 1));
        projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        projGeo.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
        projGeo.setAttribute('trails', new THREE.BufferAttribute(trails, 1));
        this.particles = new THREE.Points(projGeo, this.material);
        this.particles.frustumCulled = false;
        console.log(this.particles);
        this.sceneState.scenes[this.sceneState.curScene].add(this.particles);
    }

    newProjectile(from, to, angle, distance, playerId) {
        console.log('NEW PROJECTILE', from, to, angle, distance, playerId);
    }

    _createParticleShader() {
        let pixelRatio = this.sceneState.settings.graphics.devicePixelRatio;
        if(pixelRatio < 1) pixelRatio = 1.5;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColors: { value: [ new THREE.Color(0xffff00), new THREE.Color(0xffffff), new THREE.Color(0xff0000) ] },
                uTime: { value: 0 },
                uStartTimes: { value: [ performance.now(), performance.now(), performance.now() ] },
                uSpeeds: { value: [ 0.15, 1, 2 ] },
                uDistances: { value: [ 8, 2, 2 ] },
                uFroms: { value: [ new THREE.Vector3(12, 1, 4), new THREE.Vector3(12, 1, 6), new THREE.Vector3(12, 1, 8) ] },
                uTos: { value: [ new THREE.Vector3(20, 1, 6), new THREE.Vector3(14, 1, 6), new THREE.Vector3(14, 1, 8) ] },
                uPixelRatio: { value: pixelRatio / 10 },
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
                varying float vTimePhase;
                varying vec3 vColor;
                varying float vIsTrail;
                varying float vTrailTime;
                varying float vDelay;

                void main() {
                    int intIndex = int(projindex);
                    vColor = uColors[intIndex];
                    float speed = uSpeeds[intIndex];
                    float startTime = uStartTimes[intIndex] + delay * 1000.0 * speed;
                    float travelTime = speed * uDistances[intIndex] * 1000.0;
                    float timeElapsed = uTime - startTime;
                    vTimePhase = mod(timeElapsed, travelTime) / travelTime;
                    vec3 from = uFroms[intIndex];
                    vec3 to = uTos[intIndex];
                    vIsTrail = clamp(floor(vTimePhase / trails), 0.0, 1.0);
                    float notTrail = 1.0 - vIsTrail;
                    vTrailTime = trails;
                    vDelay = delay;
                    vec3 trailPos = (to - from) * (trails + 0.2 * vTimePhase) * vIsTrail;
                    vec3 newPos = (to - from) * vTimePhase * notTrail;
                    vec4 mvPosition = modelViewMatrix * vec4(from + newPos + trailPos, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    float size = vIsTrail * 10000.0 + notTrail * 4000.0 * (1.0 - delay / 2.0);
                    gl_PointSize = (size * uPixelRatio) / distance(vertexPosition, mvPosition);
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
                    // if(length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
                    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                    // gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(
                    //     1.0 - (vTimePhase / 1000.0),
                    //     1.0 - (vTimePhase / 200.0),
                    //     1.0 - (vTimePhase / 200.0)
                    // , 1.0);
                    float alpha = 1.0 - (vTimePhase / clamp(vTrailTime + 0.7, 0.0, 1.0)) * vIsTrail;
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(vColor + (0.5 - vDelay), alpha);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        return material;
    }

    _initProjectiles_old() {
        // const projCount = 2;
        // const particlesPerProjectile = 50;
        // const positions = new Float32Array(projCount * particlesPerProjectile * 3);
        // const delays = new Float32Array(projCount * particlesPerProjectile);
        // const indexes = new Float32Array(projCount * particlesPerProjectile);
        // let i = 0;
        // for(let p1=0; p1<projCount; p1++) {
        //     for(let p2=0; p2<particlesPerProjectile; p2++) {
        //         indexes[p1*p2+p2] = p1;
        //         positions[i] = 0;
        //         positions[i+1] = 0;
        //         positions[i+2] = 0;
        //         delays[p2+p1*particlesPerProjectile] = p2 * 0.04 * Math.random();
        //         i += 3;
        //     }
        // }
        // const projGeo = new THREE.BufferGeometry();
        // projGeo.setAttribute('index', new THREE.BufferAttribute(indexes, 1));
        // projGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); // This is used for the initial unused state (hidden from view)
        // projGeo.setAttribute('delay', new THREE.BufferAttribute(delays, 1));
        // const particles = new THREE.Points(projGeo, this.material);
        // particles.frustumCulled = false;
        // console.log(particles);
        // this.sceneState.scenes[this.sceneState.curScene].add(particles);
    }
    
    _createParticleShader_old() {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(0xff0000) },
                uTime: { value: 0 },
                uStartTime: { value: performance.now() },
                uDeltaTime: { value: 0 },
                uFrom: { value: new THREE.Vector3(12, 1, 4) },
                uTo: { value: new THREE.Vector3(14, 1, 4) },
                diffuseTexture: { value: new THREE.TextureLoader().load(
                    this.sceneState.settings.assetsUrl + '/sprites/orange_glow2_256x256.png'
                )},
            },
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float delay;
                uniform float uStartTime;
                uniform float uTime;
                uniform vec3 uFrom;
                uniform vec3 uTo;
                varying float timePhase;
                varying float _delay;

                const float LIFETIME = 1000.0;

                void main() {
                    float timeElapsed = uTime - uStartTime;
                    timePhase = mod(timeElapsed, LIFETIME * delay);
                    float newPosX = uFrom.x + (uTo.x - uFrom.x) * 0.002 * timePhase;
                    vec4 mvPosition = modelViewMatrix * vec4(newPosX, uFrom.y, uFrom.z, 1.0);
                    vec4 vertexPosition = projectionMatrix * mvPosition;
                    // gl_PointSize = 500.0 * (1.0 - (timePhase / LIFETIME * delay)) / distance(vertexPosition, mvPosition);
                    gl_PointSize = 500.0 / distance(vertexPosition, mvPosition);
                    gl_Position = vertexPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D diffuseTexture;
                uniform vec3 uColor;
                varying float timePhase;
                varying float _delay;

                void main() {
                    if(length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
                    // gl_FragColor = vec4(color, 1.0);
                    gl_FragColor = texture2D(diffuseTexture, gl_PointCoord) * vec4(
                        1.0 - (timePhase / 1000.0),
                        1.0 - (timePhase / 200.0),
                        1.0 - (timePhase / 200.0)
                    , 1.0);
                    // gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
                }
            `,
        });

        this.sceneState.shadersToUpdate.push({ material: material });
        this.sceneState.shadersToUpdateLength++;
        return material;
    }
}

export default Projectiles;
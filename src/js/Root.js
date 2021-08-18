import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Settings from './settings/Settings';
import Utils from './utils/Utils';
import Logger from './utils/Logger';
import PostProcessing from './postProcessing/PostProcessing';
import LevelLoader from './loaders/LevelLoader';
import Player from './players/Player';
import userPlayerData from './data/userPlayerData';
import UserControls from './controls/UserControls';
import Physics from './physics/Physics';
import ProjectileParticles from './VFX/ProjectileParticles';
import PhysicsParticles from './VFX/PhysicsParticles';
import HitZonePlates from './VFX/HitZonePlates';

class Root {
    constructor() {
        this.sceneState = {
            curLevelId: 'ship01',
            curScene: 'level',
            curFloor: 0,
            constants: {
                FLOOR_HEIGHT: 3,
            },
        };
        this.utils = new Utils();
        this.sceneState.utils = this.utils;
        this.sceneState.logger = new Logger(this.sceneState);

        // Settings [START]
        const settings = new Settings(this.sceneState);
        this.stats = settings.createStats();
        this.sceneState.settingsClass = settings;
        // Settings [/END]

        // Setup renderer [START]
        const renderer = new THREE.WebGLRenderer({
            antialias: this.sceneState.settings.graphics.antialiasing
        });
        renderer.setClearColor('#000000');
        renderer.debug.checkShaderErrors = true; // Disable this for production (performance gain)
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        this.sceneState.renderer = renderer;
        // Setup renderer [/END]

        // Setup scene and basic lights [START]
        const scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff, 1));
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        hemiLight.position.set(32, -32, 5);
        scene.add(hemiLight);
        this.sceneState.axesHelper = new THREE.AxesHelper(100);
        scene.add(this.sceneState.axesHelper);
        this.scene = scene;
        this.sceneState.scenes = {
            level: scene,
        };
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        const screenSize = this.utils.getScreenResolution();
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.1, 256);
        const controls = new OrbitControls(camera, renderer.domElement); // Disable this for production (performance gain)
        controls.update(); // Disable this for production (performance gain)
        this.controls = controls; // Disable this for production (performance gain)
        this.camera = camera;
        camera.userData.followXOffset = 6;
        camera.userData.followYOffset = 10;
        camera.userData.followZOffset = 6;
        this.sceneState.cameras = {
            level: camera,
        };
        this.sceneState.orbitControls = controls; // Disable this for production (performance gain)
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        this.sceneState.physics = {};
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.movingShapes = [];
        this.sceneState.physics.movingShapesLength = 0;
        this.sceneState.physics.staticShapes = [];
        this.sceneState.physics.staticShapesLength = 0;
        if(this.sceneState.settings.physics.particleDetailLevel === 'high') {
            this.sceneState.physics.particlesCount = 400;
        } else if(this.sceneState.settings.physics.particleDetailLevel === 'medium') {
            this.sceneState.physics.particlesCount = 150;
        } else {
            this.sceneState.physics.particlesCount = 18;
        }
        this.sceneState.physics.nextParticleIndex = 0;
        this.sceneState.physics.positions = new Float32Array(this.sceneState.physics.particlesCount * 2 * 3);
        this.sceneState.physics.quaternions = new Float32Array(this.sceneState.physics.particlesCount * 2 * 4);
        this.sceneState.physics.params = new Float32Array(1024);
        this.sceneState.physics.initiated = false;
        // Setup physics (cannon.js) [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock();
        this.sceneState.atomClock = { // TODO: get synchronised server time
            time: 0,
            lastCheck: performance.now(),
            getTime: () => {
                return this.sceneState.atomClock.time +
                    performance.now() -
                    this.sceneState.atomClock.lastCheck;
            },
        };
        this.sceneState.pp = new PostProcessing(this.sceneState);
        this.sceneState.resizeFns = [this._resize];
        this.sceneState.shadersToUpdate = [];
        this.sceneState.shadersToUpdateLength = 0;
        this.sceneState.shadersToResize = [];
        this.levelLoader = new LevelLoader(this.sceneState);
        this._initResizer();
        // Other setup [/END]

        this.sceneState.physicsClass = new Physics(this.sceneState, () => {
            this._runApp(camera);
        });
    }

    _runApp = (camera) => {
        
        this.sceneState.projectiles = new ProjectileParticles(this.sceneState);
        this.sceneState.physicsParticles = new PhysicsParticles(this.sceneState);
        this.sceneState.hitZonePlates = new HitZonePlates(this.sceneState);

        this.levelLoader.load(this.sceneState.curLevelId, () => {           

            this.sceneState.projectiles.initProjectiles();
            this.sceneState.physicsParticles.initParticles();
            this.sceneState.hitZonePlates.initPlates();
            const userPlayer = new Player(this.sceneState, userPlayerData);
            userPlayer.create();
            new UserControls(this.sceneState, userPlayer);

            const playerPos = this.sceneState.players[this.sceneState.userPlayerId].position;
            camera.position.set(
                camera.userData.followXOffset + playerPos[0],
                camera.userData.followYOffset + playerPos[1],
                camera.userData.followZOffset + playerPos[2]
            );
            camera.lookAt(new THREE.Vector3(playerPos[0], playerPos[1], playerPos[2]));
    
            this._resize(this.sceneState);
            this.sceneState.settingsClass.endInit();
            this.sceneState.loadingLevel = false;
            this.sceneState.settingsClass.createSettingsUI();
            this.renderLoop();
            this.sceneState.logger.log('sceneState', this.sceneState, this.renderer);
        });
    }

    renderLoop = () => {
        const ss = this.sceneState;
        // const delta = ss.clock.getDelta();
        requestAnimationFrame(() => {
            this.renderLoop();
        });
        this._updateShaders(ss);
        ss.renderer.render(ss.scenes[ss.curScene], ss.cameras.level);
        // ss.pp.getComposer().render();
        if(ss.settings.debug.showStats) this.stats.update(); // Debug statistics
    }

    _updateShaders = (ss) => {
        let i = 0;
        const shadersLength = ss.shadersToUpdateLength,
            now = performance.now();
        for(i=0; i<shadersLength; i++) {
            ss.shadersToUpdate[i].material.uniforms.uTime.value = now;
        }
    };

    _resize(sceneState) {
        const reso = new Utils().getScreenResolution();
        const width = reso.x;
        const height = reso.y;
        const pixelRatio = window.devicePixelRatio;
        sceneState.renderer.setSize(
            width * pixelRatio | 0,
            height * pixelRatio | 0,
            false
        );
        sceneState.cameras.level.aspect = width / height;
        sceneState.cameras.level.updateProjectionMatrix();
        for(let i=0; i<sceneState.shadersToResize.length; i++) {
            sceneState.shadersToResize[i].material.uniforms.scale.value = height * pixelRatio / 2;
        }
        // sceneState.pp.getComposer().setSize(width, height);
    }

    _initResizer() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                let i;
                const fns = this.sceneState.resizeFns,
                    fnsLength = fns.length;
                for(i=0; i<fnsLength; i++) {
                    fns[i](this.sceneState);
                }
            }, 500);
        });
    }
}

new Root();
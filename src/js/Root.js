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
import Projectiles from './players/weapons/Projectiles';

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
        const screenSize = this.utils.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
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
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.5, 128);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        this.controls = controls;
        this.camera = camera;
        camera.userData.followXOffset = 6;
        camera.userData.followYOffset = 10;
        camera.userData.followZOffset = 6;
        this.sceneState.cameras = {
            level: camera,
        };
        this.sceneState.orbitControls = controls;
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        this.sceneState.physics = {};
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.movingShapes = [];
        this.sceneState.physics.movingShapesLength = 0;
        this.sceneState.physics.staticShapes = [];
        this.sceneState.physics.staticShapesLength = 0;
        this.sceneState.physics.positions = new Float32Array(100 * 3);
        this.sceneState.physics.quaternions = new Float32Array(100 * 4);
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
        this.levelLoader = new LevelLoader(this.sceneState);
        this._initResizer();
        // Other setup [/END]

        this.sceneState.physicsClass = new Physics(this.sceneState, () => {
            this._runApp(camera);
        });
    }

    _runApp = (camera) => {

        this.levelLoader.load(this.sceneState.curLevelId, () => {           

            this.sceneState.projectiles = new Projectiles(this.sceneState);
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
        const delta = ss.clock.getDelta();
        requestAnimationFrame(() => {
            this.renderLoop();
        });
        this._updateShaders(ss, delta);
        ss.renderer.render(ss.scenes[ss.curScene], ss.cameras.level);
        // ss.pp.getComposer().render();
        if(ss.settings.debug.showStats) this.stats.update(); // Debug statistics
    }

    _updateShaders = (ss, delta) => {
        let i = 0;
        const shadersLength = ss.shadersToUpdateLength,
            now = performance.now();
        for(i=0; i<shadersLength; i++) {
            // ss.shadersToUpdate[i].material.uniforms.uDeltaTime.value = delta;
            ss.shadersToUpdate[i].material.uniforms.uTime.value = now;
        }
    };

    _resize(sceneState) {
        const reso = new Utils().getScreenResolution();
        const width = reso.x;
        const height = reso.y;
        const pixelRatio = window.devicePixelRatio || 1;
        sceneState.renderer.setPixelRatio(pixelRatio);
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        sceneState.cameras.level.aspect = width / height;
        sceneState.cameras.level.updateProjectionMatrix();
        sceneState.renderer.setSize(width, height);
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
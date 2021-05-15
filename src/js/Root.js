import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Settings from './settings/Settings';
import Utils from './utils/Utils';
import Logger from './utils/Logger';
import PostProcessing from './postProcessing/PostProcessing';
import levelData from './data/dummyLevel01';
import userPlayerData from './data/userPlayerData';
import ModelLoader from './loaders/ModelLoader';
import LevelLoader from './loaders/LevelLoader';
import Player from './players/Player';
import UserControls from './controls/UserControls';
import Physics from './physics/Physics';

class Root {
    constructor() {
        this.sceneState = {
            curLevelId: 'levelDummy01',
            curScene: 'level',
            curFloor: 0,
        };
        this.utils = new Utils();
        this.sceneState.utils = this.utils;
        this.sceneState.logger = new Logger(this.sceneState);

        // Setup renderer [START]
        const urlParams = new URLSearchParams(window.location.search);
        const rendererAA = urlParams.get('aa');
        const renderer = new THREE.WebGLRenderer({ antialias: rendererAA === '1' });
        renderer.setClearColor('#000000');
        const screenSize = this.utils.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        this.sceneState.renderer = renderer;
        this.requestDelta = 0;
        this.logicDelta = 0;
        this.renderDelta = 0;
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

        // Settings [START]
        const settings = new Settings(this.sceneState);
        this.stats = settings.createStats();
        settings.setAA(rendererAA);
        this.sceneState.settingsClass = settings;
        // Settings [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock();
        this.sceneState.pp = new PostProcessing(this.sceneState);
        this.sceneState.resizeFns = [this._resize];
        this.levelLoader = new LevelLoader(this.sceneState);
        this._initResizer();
        // Other setup [/END]

        this.sceneState.physicsClass = new Physics(this.sceneState, () => {
            this._runApp(camera);
        });
    }

    _runApp = (camera) => {

        this.levelLoader.load(this.sceneState.curLevelId);
        
        const modelLoader = new ModelLoader(this.sceneState);
        modelLoader.loadModel(levelData);
        modelLoader.loadModel(levelData, true);

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
        this.renderLoop();

    }

    renderLoop = () => {
        const ss = this.sceneState;
        // const delta = ss.clock.getDelta();
        // let timeStep = delta; // * 1 = time scale
        // timeStep = Math.max(timeStep, 0.03333333); // = 1 / 30 (min 30 fps)
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.renderLoop();
            }, 0);
        });
        ss.pp.getComposer().render();
        if(ss.settings.debug.showStats) this.stats.update(); // Debug statistics
    }

    _resize(sceneState) {
        const reso = new Utils().getScreenResolution();
        const width = reso.x;
        const height = reso.y;
        const pixelRatio = window.devicePixelRatio || 1;
        sceneState.renderer.setPixelRatio(pixelRatio);
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        const curScene = sceneState.curScene;
        sceneState.cameras[curScene].aspect = width / height;
        sceneState.cameras[curScene].updateProjectionMatrix();
        sceneState.renderer.setSize(width, height);
        sceneState.pp.getComposer().setSize(width, height);
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
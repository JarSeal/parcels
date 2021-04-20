import * as THREE from 'three';
import * as CANNON from 'cannon';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CannonHelper from './vendor/CannonHelper';
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

class Root {
    constructor() {
        this.sceneState = {
            curScene: 'level',
        };
        this.utils = new Utils();
        this.sceneState.utils = this.utils;
        this.sceneState.logger = new Logger(this.sceneState);

        // Setup renderer [START]
        const urlParams = new URLSearchParams(window.location.search);
        const rendererAA = urlParams.get('aa');
        const renderer = new THREE.WebGLRenderer({ antialias: rendererAA === '1' });
        renderer.setClearColor('#ffffff');
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
        camera.userData.followXOffset = 10;
        camera.userData.followYOffset = 17;
        camera.userData.followZOffset = 10;
        this.sceneState.cameras = {
            level: camera,
        };
        this.sceneState.orbitControls = controls;
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        const world = new CANNON.World();
        world.allowSleep = true;
        world.gravity.set(0, -9.82, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.iterations = 50;
        world.solver.iterations = 50;
        this.sceneState.physics = {};
        this.sceneState.physics.world = world;
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.maxSubSteps = 5;
        this.sceneState.physics.addShape = this.addShapeToPhysics; // CHECK WHETHER OR NOT NEEDED!
        this.sceneState.physics.shapes = [];
        this.sceneState.physics.shapesLength = 0;
        // this.sceneState.isGroundMeshes = []; // CHECK WHETHER OR NOT NEEDED!
        this.world = world;
        this.sceneState.physics.helper = new CannonHelper(scene, world);
        this.helper = this.sceneState.physics.helper;
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
        this.sceneState.resizeFns = [this.resize];
        this.levelLoader = new LevelLoader(this.sceneState);
        this._initResizer();
        // Other setup [/END]

        this.runApp(scene, camera);
    }

    runApp(scene, camera) {

        this.levelLoader.load('levelDummy01');
        
        const modelLoader = new ModelLoader(this.sceneState);
        modelLoader.loadModel(levelData);

        const userPlayer = new Player(this.sceneState, userPlayerData);
        userPlayer.create();
        new UserControls(this.sceneState, userPlayer);

        const playerPos = this.sceneState.players[this.sceneState.userPlayerId].position;
        camera.position.set(
            camera.userData.followXOffset + playerPos[0],
            camera.userData.followYOffset + playerPos[1],
            camera.userData.followZOffset + playerPos[2]);
        camera.lookAt(new THREE.Vector3(playerPos[0], playerPos[1], playerPos[2]));

        this.resize(this.sceneState);
        this.sceneState.settingsClass.endInit();
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        const ss = this.sceneState;
        const delta = ss.clock.getDelta();
        this._updatePhysics(delta);
        ss.pp.getComposer().render();
        this._renderPlayers(ss);
        if(ss.settings.debug.showStats) this.stats.update(); // Debug statistics
    }

    _renderPlayers(ss) {
        let i = 0;
        const c = ss.playerKeysCount,
            k = ss.playerKeys,
            p = ss.players;
        for(i=0; i<c; i++) {
            p[k].render();
        }
    }

    resize(sceneState) {
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

    _updatePhysics = (delta) => {
        let i, shape;
        const l = this.sceneState.physics.shapesLength,
            s = this.sceneState.physics.shapes,
            settings = this.sceneState.settings;
        this.world.step(this.sceneState.physics.timeStep, delta, this.sceneState.physics.maxSubSteps);
        for(i=0; i<l; i++) {
            shape = s[i];
            shape.updateFn(shape);
        }
        if(settings.physics.showPhysicsHelpers) this.helper.update();
    }

    addShapeToPhysics = (object, moving, helperColor) => {
        const mesh = object.mesh,
            body = object.body,
            updateFn = object.updateFn || null,
            id = 'phyShape-' + performance.now();
        mesh.name = id;
        body.bodyID = id;
        if(!this.sceneState.settings.physics.showPhysicsHelpers) this.scene.add(mesh);
        this.world.addBody(body);
        if(moving) {
            this.sceneState.physics.shapes.push({ id, mesh, body, updateFn });
        }
        this.sceneState.physics.shapesLength = this.sceneState.physics.shapes.length;
        if(this.sceneState.settings.physics.showPhysicsHelpers) {
            let color = helperColor;
            if(!color) moving ? color = 0xFF0000 : color = 0xFFFFFFF;
            this.helper.addVisual(body, color);
        }
    }
}

new Root();
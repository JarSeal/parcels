import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

class PostProcessing {
    constructor(sceneState) {
        this.sceneState = sceneState;
        this.composer = new EffectComposer(sceneState.renderer);
        this._addRenderPass();
        
        this._addSAO();
        this._addSSAO();

        this._addFXAA();
        this._addSMAA();
    }

    _addRenderPass() {
        const curScene = this.sceneState.curScene;
        const renderPass = new RenderPass(
            this.sceneState.scenes[curScene],
            this.sceneState.cameras[curScene]
        );
        this.composer.addPass(renderPass);
    }

    _addFXAA() {
        const ss = this.sceneState;
        if(ss.settings.aa.rendererAA) return;
        const fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = ss.renderer.getPixelRatio();
        const container = document.getElementById('main-stage');
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (container.offsetWidth * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (container.offsetHeight * pixelRatio);
        this.composer.addPass(fxaaPass);
        fxaaPass.enabled = ss.settings.aa.fxaa;
        ss.settingsClass.addUserSetting(
            'boolean',
            ss.settings.aa,
            'fxaa',
            'Use FXAA',
            'Antialiasing',
            (value) => {
                fxaaPass.enabled = value;
                ss.LStorage.setItem('fxaa', value);
            }
        );
    }

    _addSMAA() {
        const ss = this.sceneState;
        if(ss.settings.aa.rendererAA) return;
        const pixelRatio = ss.renderer.getPixelRatio();
        const container = document.getElementById('main-stage');
        const smaaPass = new SMAAPass(container.offsetWidth * pixelRatio, container.offsetHeight * pixelRatio);
        this.composer.addPass(smaaPass);
        smaaPass.enabled = ss.settings.aa.smaa;
        ss.settingsClass.addUserSetting(
            'boolean',
            ss.settings.aa,
            'smaa',
            'Use SMAA',
            'Antialiasing',
            (value) => {
                smaaPass.enabled = value;
                ss.LStorage.setItem('smaa', value);
            }
        );
    }

    _addSAO() {
        const ss = this.sceneState;
        if(ss.settings.aa.rendererAA) return;
        const saoPass = new SAOPass(ss.scenes[ss.curScene], ss.cameras[ss.curScene], true, true, 4096);
        saoPass.params.saoBias = 0.73;
        saoPass.params.saoIntensity = 0.01;
        saoPass.params.saoScale = 2.3;
        saoPass.params.saoKernelRadius = 22;
        saoPass.params.saoBlurRadius = 60;
        saoPass.params.saoBlurStdDev = 6.7;
        saoPass.params.saoBlurDepthCutoff = 0.003;
        this.composer.addPass(saoPass);
        saoPass.enabled = ss.settings.ao.sao;
        ss.settingsClass.addUserSetting(
            'boolean',
            ss.settings.ao,
            'sao',
            'Use SAO',
            'AO',
            (value) => {
                saoPass.enabled = value;
                ss.LStorage.setItem('sao', value);
            }
        );
    }

    _addSSAO() {
        const ss = this.sceneState;
        if(ss.settings.aa.rendererAA) return;
        const container = document.getElementById('main-stage');
        const ssaoPass = new SSAOPass(ss.scenes[ss.curScene], ss.cameras[ss.curScene], container.offsetWidth, container.offsetHeight);
        ssaoPass.kernelRadius = 0.5;
        ssaoPass.minDistance = 0.001;
        ssaoPass.maxDistance = 0.1;
        this.composer.addPass(ssaoPass);
        ssaoPass.enabled = ss.settings.ao.ssao;
        ss.settingsClass.addUserSetting(
            'boolean',
            ss.settings.ao,
            'ssao',
            'Use SSAO',
            'AO',
            (value) => {
                ssaoPass.enabled = value;
                ss.LStorage.setItem('ssao', value);
            }
        );
    }

    getComposer() {
        return this.composer;
    }
}

export default PostProcessing;
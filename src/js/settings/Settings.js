import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import * as Stats from '../vendor/stats.min.js';
import LStorage from '../utils/LocalStorage.js';
import defaultSettings from './defaultSettings';

class Settings {
    constructor(sceneState) {
        this.sceneState = sceneState;
        sceneState.LStorage = new LStorage();
        this.userSettings = {};
        this._initSettings(sceneState);
        this._debugSettings(sceneState);
    }

    _initSettings(sceneState) {
        sceneState.settings = { ...defaultSettings };
        this._checkLocalStorage(sceneState);
        sceneState.defaultSettings = defaultSettings;

        // GUI setup [START]
        if(sceneState.settings.enableGui) {
            const gui = new GUI();
            if(!sceneState.settings.openGuiControls) gui.close();
            sceneState.gui = gui;
        }
        // GUI setup [/END]
    }

    _checkLocalStorage(sceneState) {
        const ls = sceneState.LStorage,
            defaults = defaultSettings,
            defKeys = Object.keys(defaults);
        let data, fData;
        defKeys.forEach(key => {
            data = ls.getItem(key);
            sceneState.settings[key] = null;
            if(data) {
                const value = ls.convertValue(defaults[key], data);
                sceneState.settings[key] = value;
            } else {
                const folderKeys = Object.keys(defaults[key]);
                if(folderKeys.length) sceneState.settings[key] = {};
                folderKeys.forEach(fKey => {
                    fData = ls.getItem(fKey);
                    if(fData) {
                        const value = ls.convertValue(defaults[key][fKey], fData);
                        sceneState.settings[key][fKey] = value;
                    } else {
                        sceneState.settings[key][fKey] = defaults[key][fKey];
                    }
                });
                if(!folderKeys.length) sceneState.settings[key] = defaults[key];
            }
        });
    }

    _debugSettings(sceneState) {
        const settings = sceneState.settings;
        if(!settings.debug.showAxesHelper) sceneState.axesHelper.visible = false;
        this.addGuiElem(
            'boolean',
            settings.debug,
            'showAxesHelper',
            'Show axes helper',
            'Debug',
            (value) => {
                sceneState.axesHelper.visible = value;
                sceneState.LStorage.setItem('showAxesHelper', value);
            }
        );
        if(settings.debug.cameraFollowsPlayer) sceneState.orbitControls.enabled = false;
        sceneState.orbitControls.update();
        this.addGuiElem(
            'boolean',
            settings.debug,
            'cameraFollowsPlayer',
            'camera lock',
            'Debug',
            (value) => {
                sceneState.orbitControls.enabled = !value;
                sceneState.LStorage.setItem('cameraFollowsPlayer', value);
                sceneState.orbitControls.update();
            }
        );
        this.addGuiElem(
            'boolean',
            settings.physics,
            'showPhysicsHelpers',
            'Show helpers',
            'Physics',
            (value) => {
                sceneState.LStorage.setItem('showPhysicsHelpers', value);
                window.location.reload();
            }
        );
    }

    createStats() {
        const stats = new Stats();
        stats.setMode(0);
        stats.domElement.id = 'debug-stats-wrapper';
        document.body.appendChild(stats.domElement);
        if(!this.sceneState.settings.debug.showStats) {
            document.getElementById('debug-stats-wrapper').style.display = 'none';
        }
        if(this.sceneState.settings.enableGui) {
            this.addGuiElem(
                'boolean',
                this.sceneState.settings.debug,
                'showStats',
                'Show stats',
                'Debug',
                (value) => {
                    document.getElementById('debug-stats-wrapper').style.display = value ? 'block' : 'none';
                    this.sceneState.LStorage.setItem('showStats', value);
                }
            );
        }
        return stats;
    }

    setAA(rendererAA) {
        let buttonText, url = window.location.href;
        if(rendererAA === '1') {
            this.sceneState.settings.aa.rendererAA = true;
            buttonText = 'Disable renderer AA (refreshes app)';
            url = url.replace('aa=1', 'aa=0');
        } else {
            buttonText = 'Enable renderer AA (refreshes app)';
            if(url.indexOf('aa=0') > -1) {
                url = url.replace('aa=0', 'aa=1');
            } else {
                url.indexOf('?') > -1 ? url += '&aa=1' : url += '?aa=1';
            }
        }
        this.sceneState.settings.aa.rendererAAFunc = () => {
            window.location = url;
        };
        this.addUserSetting(
            'button',
            this.sceneState.settings.aa,
            'rendererAAFunc',
            buttonText,
            'Antialiasing',
            null
        );
    }

    addGuiElem(type, setting, settingKey, name, folder, onChange) {
        const ss = this.sceneState;
        if(!ss.settings.enableGui) return;
        let target;
        folder ? target = this._addGuiFolder(folder) : target = ss.gui;
        switch(type) {
        case 'boolean':
            target.add(setting, settingKey).name(name).onChange(onChange);
            break;
        case 'button':
            target.add(setting, settingKey).name(name);
            break;
        }
    }

    _addGuiFolder(name) {
        const ss = this.sceneState;
        if(ss.settings.enableGui) {
            const folders = Object.keys(ss.gui.__folders);
            if(folders.includes(name)) return ss.gui.__folders[name];
            return ss.gui.addFolder(name);
        }
        return null;
    }

    addUserSetting(type, setting, settingKey, name, folder, onChange) {
        this.addGuiElem(type, setting, settingKey, name, folder, onChange);
        // TODO
    }

    endInit() {
        if(this.sceneState.settings.openAllGuiFolders) {
            const folders = Object.keys(this.sceneState.gui.__folders);
            folders.forEach(folder => {
                this.sceneState.gui.__folders[folder].open();
            });
        }
    }
}

export default Settings;
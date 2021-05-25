const defaultSettings = {

    // Assets
    assetsUrl: process.env.DEV_ASSETS_URL === 'useProductionCDN'
        ? 'https://parcels.netlify.app'
        : process.env.DEV_ASSETS_URL,
    
    // GUI
    enableGui: true,
    openGuiControls: true,
    openAllGuiFolders: true,

    // Debugging
    debug: {
        showStats: true,
        showAxesHelper: false,
        cameraFollowsPlayer: true,
    },

    // Physics
    physics: {
        showPhysicsHelpers: false,
    }
};

export default defaultSettings;
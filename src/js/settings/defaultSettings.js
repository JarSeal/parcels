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
        showPhysicsStats: true,
        showAxesHelper: false,
        cameraFollowsPlayer: true,
        showProjectileStreaks: false,
    },

    // Physics
    physics: {
        showPhysicsHelpers: false,
        particleDetailLevel: 'low',
    },

    // Graphics
    graphics: {
        antialiasing: true,
    },
};

export default defaultSettings;
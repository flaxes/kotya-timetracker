// @ts-check

// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");

const bootstrap = require("./bootstrap");
const { port } = require("./config");

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile("./public/index.html");

    mainWindow.loadURL(`http://localhost:${port}`);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    const mainWindow = createWindow();
    bootstrap()
        .then(() => {})
        .catch((err) => {
            console.error(err);
            if (err.message.includes("EADDRINUSE")) {
                err.message = `Program already opened.\nIf not - maybe port:${port} is used by another program.\nYou can change port in config.js`;
            }

            dialog.showMessageBoxSync({
                title: "Run error",
                type: "error",
                message: err.message,
            });

            mainWindow.close();

            // process.exit(1);
        });

    app.on("activate", function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

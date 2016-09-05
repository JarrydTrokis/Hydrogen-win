const electron = require('electron');

const app = electron.app;
const globalShortcut = electron.globalShortcut;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const ipcMain = electron.ipcMain;

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
var clickable = true;
var draggable = false;
var minimode = false;

function setupApp() {
	registerGlobalShortcuts();
	buildMenu();
	createWindow();
	ipcMain.on('resize', function(event, arg) {
		if (arg == "big") {
			minimode = false;
			var bounds = mainWindow.getBounds();
			bounds['x'] -= 300;
			bounds['y'] -= 150;
			bounds['width'] = 1200;
			bounds['height'] = 700;
			mainWindow.setBounds(bounds);
		}
		else {
			minimode = true;
			var bounds = mainWindow.getBounds();
			bounds['width'] = 570;
			bounds['height'] = 320;
			mainWindow.setBounds(bounds);
		}
	});
}

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({width: 570, height: 320, frame: false, transparent: true, alwaysOnTop: true, focusable: true, show: false, fullscreenable: false});
	// mainWindow.setResizable(true);

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`);

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {

		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	});

	mainWindow.once('ready-to-show', function() {
		mainWindow.show();
	});
}

function buildMenu() {
	var template = [
		{
			label: 'Window',
			submenu: [
				{
					accelerator: 'CommandOrControl+-',
					click(item, focusedWindow) {
						focusedWindow.webContents.send('opacity', '-');
					}
				},
				{
					accelerator: 'CommandOrControl+=',
					click(item, focusedWindow) {
						focusedWindow.webContents.send('opacity', '+');
					}
				},
				{
					accelerator: 'CommandOrControl+M',
					click(item, focusedWindow) {
						clickable = !clickable;

						// if window is clickable, it should not be draggable
						if (clickable) {
							draggable = false
							focusedWindow.webContents.send("draggable", draggable);
						}
						mainWindow.setIgnoreMouseEvents(!clickable);
					}
				},
				{
					accelerator: 'CommandOrControl+D',
					click(item, focusedWindow) {
						draggable = !draggable;

						// if window is draggable, the window must accept mouse events
						if (draggable) {
							clickable = true;
							mainWindow.setIgnoreMouseEvents(!clickable);
						}
						focusedWindow.webContents.send("draggable", draggable);

						var bounds = focusedWindow.getBounds();
						bounds['width'] += 1;
						bounds['height'] += 1;
						focusedWindow.setBounds(bounds);

						bounds['width'] -= 1;
						bounds['height'] -= 1;
						focusedWindow.setBounds(bounds);
					}
				},
				{
					accelerator: 'CommandOrControl+shift+J',
					click(item, focusedWindow) {
						focusedWindow.toggleDevTools();
					}
				},
				{
					accelerator: 'CommandOrControl+space',
					click(item, focusedWindow) {
						minimode = !minimode;
						if (minimode) {
							var bounds = focusedWindow.getBounds();
							bounds['width'] = 570;
							bounds['height'] = 320;
							focusedWindow.setBounds(bounds);
							focusedWindow.webContents.send("navbar", "hide");
						}
						else {
							var bounds = focusedWindow.getBounds();
							bounds['width'] = 1200;
							bounds['height'] = 700;
							focusedWindow.setBounds(bounds);
							focusedWindow.webContents.send("navbar", "show");
						}
					}
				},
			],
		},
		{
			label: 'Application',
			submenu: [
				{
					'accelerator': 'CommandOrControl+R',
					click(item, focusedWindow) {
						restartApp();
					}
				},
				{
					'accelerator': 'CommandOrControl+Q',
					click(item, focusedWindow) {
						app.exit(0);
					}
				},
			],
		}
	];
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

function registerGlobalShortcuts() {
	var global = globalShortcut.register('CommandOrControl+Shift+H', () => {
		mainWindow.focus();
	});
	console.log("registerGlobalShortcuts(): "+global);
	if (!global) {
		setTimeout(function() {
			registerGlobalShortcuts()
		}, 1000);
	}
}

function restartApp() {
	app.relaunch();
	app.exit(0);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', setupApp);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	globalShortcut.unregisterAll();

	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

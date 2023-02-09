import * as path from 'path';
import { BrowserWindow, Menu, Tray, app, nativeTheme } from 'electron';

let window: BrowserWindow;
let tray: Tray;

const ROOT = app.isPackaged
  ? process.resourcesPath
  : path.resolve(__dirname, '..');

function createTray() {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  tray = new Tray(
    path.resolve(ROOT, 'electron', 'assets', 'tray', `${theme}.ico`),
  );
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show', click: () => window.show() },
      { label: 'Quit', click: () => app.quit() },
    ]),
  );

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    tray.setImage(
      path.resolve(ROOT, 'electron', 'assets', 'tray', `${theme}.ico`),
    );
  });

  tray.on('click', () => window.show());

  window.on('close', () => tray?.destroy());
}

async function createWindow() {
  window = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.resolve(ROOT, 'electron', 'assets', 'app.ico'),
    autoHideMenuBar: true,
  });

  const indexUrl = 'http://127.0.0.1:3000';
  const indexPath = path.resolve(ROOT, 'dist', 'index.html');

  if (app.isPackaged) {
    await window.loadFile(indexPath);
  } else {
    await window.loadURL(indexUrl);
  }

  window.webContents.on('will-redirect', async (event, url) => {
    if (url.includes('access_token')) {
      const tokens = new URL(url).search;
      if (app.isPackaged) {
        await window.loadFile(indexPath, { search: tokens });
      } else {
        await window.loadURL(`${indexUrl}${tokens}`);
      }
    }
  });
}

app.whenReady().then(async () => {
  await createWindow();
  createTray();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const prodRoute = '/../../../'
const devRoute = '/../../'
const mainRoute = is.dev ? devRoute : prodRoute

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    minWidth: 620,
    height: 910,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('open-directory-dialog', () => {
  const dialog = require('electron').dialog
  return dialog.showOpenDialog({
    properties: ['openDirectory']
  })
})

ipcMain.handle('open-file-dialog', () => {
  const dialog = require('electron').dialog
  return dialog.showOpenDialog({
    properties: ['openFile']
  })
})

ipcMain.on('run-script', async (event, args) => {
  const { PythonShell } = require('python-shell')
  const path = require('path')

  const route = path.join(__dirname, mainRoute, 'scripts')

  const is_dev = is.dev ? 'dev' : 'prod'

  const options = {
    scriptPath: route,
    args: [is_dev, ...args]
    // pythonPath: path.join(__dirname, '/../../python/bin/python3.9'), //TODO: python path will be specified here
  }

  let output = ''
  let errorOutput = ''

  event.reply('script-message', 'Attempting to run script')
  return new Promise((resolve, reject) => {
    new PythonShell('main.py', options)
      .on('message', function (message) {
        console.log('ON: ' + message)
        output += message + '$$'
        event.reply('script-message', output)
      })
      .on('close', (e) => {
        console.log('Finished script execution')
        if (errorOutput !== '') {
          event.reply('script-error', errorOutput)
          reject(errorOutput)
        } else {
          event.reply('script-success', '1')
          resolve(e)
        }
      })
      .on('stderr', (stderr) => {
        console.log(stderr)
        errorOutput += stderr + '\n'
      })
  })
})

ipcMain.on('run-script-mail-agenda', async (event, args) => {
  const { PythonShell } = require('python-shell')
  const path = require('path')

  const route = path.join(__dirname, mainRoute, 'scripts')

  // const is_dev = is.dev ? 'dev' : 'prod'

  const options = {
    scriptPath: route,
    args: [...args]
  }

  let output = ''
  let errorOutput = ''

  event.reply('script-message', 'Attempting to run script')
  return new Promise((resolve, reject) => {
    new PythonShell('mail-agenda-generation.py', options)
      .on('message', function (message) {
        console.log('ON: ' + message)
        output += message + '$$'
        event.reply('script-message-mail', output)
      })
      .on('close', (e) => {
        console.log('Finished script execution')
        if (errorOutput !== '') {
          event.reply('script-error-mail', errorOutput)
          reject(errorOutput)
        } else {
          event.reply('script-success-mail', '1')
          resolve(e)
        }
      })
      .on('stderr', (stderr) => {
        console.log(stderr)
        errorOutput += stderr + '\n'
        event.reply('script-error-mail', errorOutput)
        reject(stderr)
      })
  })
})

//@ts-ignore
ipcMain.handle('getAllClients', async (event, args) => {
  const { PythonShell } = require('python-shell')
  const path = require('path')

  const route = path.join(__dirname, mainRoute, 'scripts')

  const options = {
    scriptPath: route,
    args: args
  }

  type Client = {
    id: string
    bankCode: string
    bankName: string
    country: string
  }

  const output: Client[] = []
  let errorOutput = ''

  try {
    await new Promise((resolve, reject) => {
      new PythonShell('initial-clients.py', options)
        .on('message', (message: string) => {
          output.push(JSON.parse(message) as Client)
        })
        .on('close', (e) => {
          if (errorOutput !== '') {
            reject(errorOutput)
          } else {
            console.log('Finished script execution -> initial-clients.py ==============')
            resolve(e)
          }
        })
        .on('stderr', (stderr) => {
          console.log('Error stderr: ', stderr)
          errorOutput += stderr + '\n'
        })
    })
  } catch (error) {
    console.log('Ups, algo salio mal. Intenta de nuevo. ===== ')
    console.log(error)
    return {
      status: 'Error',
      message: errorOutput,
      result: null
    }
  }

  return {
    status: 'Success',
    message: 'Initial clients read successfully',
    result: output
  }
})

//@ts-ignore
ipcMain.handle('checkDependencies', async (event, args) => {
  const { PythonShell } = require('python-shell')
  const path = require('path')
  //'/../../python'

  const route = path.join(__dirname, mainRoute, 'scripts')

  const options = {
    scriptPath: route,
    args: args
  }

  try {
    //@ts-ignore
    await new Promise((resolve, reject) => {
      new PythonShell('dependency-check.py', options)
        .on('message', (message: string) => {
          console.log('Message: ', message)
        })
        .on('close', (e) => {
          console.log('Finished script execution')
          resolve(e)
        })
        .on('error', (err) => {
          console.log('Error general: ', err)
          // reject(err);
        })
        .on('stderr', (stderr) => {
          console.log('Error stderr: ', stderr)
          // reject(stderr);
        })
    })
  } catch (error) {
    console.error('Error running python script: ', error)
  }
})

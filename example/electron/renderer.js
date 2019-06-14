const { app, BrowserWindow } = require('electron')
let mainWindow

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

if (!app.isDefaultProtocolClient('electron-demonstration'))
    app.setAsDefaultProtocolClient('electron-demonstration')

const createWindow = () => {
    mainWindow = new BrowserWindow({ 
        width: 1200, 
        height: 800, 
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.show()

    mainWindow.loadFile('./index.html')
    mainWindow.maximize()
    mainWindow.on('closed', () => mainWindow = null)
    
    mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow)
app.on('window-all-closed', () => process.platform !== 'darwin' ? app.quit() : '')
app.on('activate', () => mainWindow === null ? createWindow() : '')
/*:
 * 
 * @param options
 * @type struct<OPTION>[]
 * @text Options List
 * @desc A list of settings for individual Options
 * 
 * @param menus
 * @type struct<MENU>[]
 * @text Menus List
 * @desc A list of settings for individual Menus
 */

/*~struct~OPTION:
 * @param name
 * @type text
 * @text Name
 * @desc Used to identify this Option when setting up Menus
 * 
 * @param callback
 * @type text
 * @text Callback
 * @desc Function name or path to call when User hits 'OK' with this option highlighted
 * 
 * @param img
 * @type file
 * @dir img/
 * @text Image
 * @desc Filepath to image to show inside of diamond for this option. Can be left blank.
 * 
 * @param title
 * @type text
 * @text Title
 * @desc Text to display for this option. eg Menu or Equipment
 * 
 */

/*~struct~MENU:
 * @param name
 * @type text
 * @text Name
 * @desc Used to identify this specific menu with a script call
 * 
 * @param bottom
 * @type text
 * @text Bottom
 * @desc Name of Option for bottom diamond
 * 
 * @param top
 * @type text
 * @text Top
 * @desc Name of Option for top diamond
 * 
 * @param right
 * @type text
 * @text Right
 * @desc Name of Option for right diamond
 * 
 * @param left
 * @type text
 * @text Left
 * @desc Name of Option for left diamond
 * 
 * @param diamondGraphic
 * @type file
 * @dir img/
 * @text Diamond Graphic
 * @desc Filepath for Diamond Graphic to use for this menu
 * 
 * @param animFrames
 * @type number
 * @text Animation Frames
 * @desc Number of frames for the diamond selection movement animation to complete
 * 
 * @param distanceMod
 * @type number
 * @decimals 3
 * @text Distance Modifier
 * @desc Distance to move a diamond when selected, relative to its width/height.
 * 
 * @param scaleMod
 * @type number
 * @decimals 3
 * @text Scale Modifier
 * @desc Decimal to scale by each frame. .02 means it should be 1.02 scale on frame 1
 * 
 * @param highlightSE
 * @type file
 * @dir audio/se
 * @text Highlight SE
 * @desc Name of SE file to play when an option is highlighted 
 * 
 * @param selectionSE
 * @type file
 * @dir audio/se
 * @text Selection SE
 * @desc Name of SE file to play when ok is pressed 
 * 
 * @param cancelSE
 * @type file
 * @dir audio/se
 * @text Cancel SE
 * @desc Name of SE file to play when cancel is pressed 
 */

var Imported = Imported || {};
Imported.sp_diamondMenu = 'sp_diamondMenu';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.sp_diamondMenu = standardPlayer.sp_diamondMenu || {};

standardPlayer.sp_diamondMenu.parameters = standardPlayer.sp_Core.fullUnpack(PluginManager.parameters('sp_diamondMenu'));

function Scene_DMenu() {
    this.initialize.apply(this, arguments)
}

Scene_DMenu.prototype = Object.create(Scene_MenuBase.prototype)
Scene_DMenu.prototype.constructor = Scene_DMenu;

Scene_DMenu.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this)
    this.setProps()
    this.loadDiamondWindows()
    
}

Scene_DMenu.prototype.setProps = function () {
    let settings = DMenuManager.menu();
    this.index = -1;
    this.moveInterval = settings.animFrames;
    this.distanceMultiplier = settings.distanceMod
    this.scaleMultiplier = settings.scaleMod
    this.highlightSE = settings.highlightSE
    this.selectionSE = settings.selectionSE;
    this.cancelSE = settings.cancelSE;
    this.diamondImagePath = `img/${settings.diamondGraphic}.png`
    this.popoutLineStyle = {brushThickness: 2, xRise: .03, xRun: .2, yRise: -.03, color: 0x000000}
    this.down = 0;
    this.up = 1;
    this.right = 2;
    this.left = 3;
    this.settings = settings;
    this.stage = new PIXI.Container
    this.lines = new PIXI.Container
    this.diamondContainer = new PIXI.Container
    this.stage.addChild(this.diamondContainer, this.lines)
    this.addChild(this.stage)
}

Scene_DMenu.prototype.fontStyle = function(){
    return new PIXI.TextStyle({
        fontSize: 14
    })
}


Scene_DMenu.prototype.loadDiamondWindows = function () {
    let cont = this.diamondContainer

    for (let i = 0; i < 4; i++) {
        cont.addChild(this.createDiamondSprite())
    }
    this._diamondsInitialized = false;
}

Scene_DMenu.prototype.createDiamondSprite = function () {
    let spr = new PIXI.Sprite.from(this.diamondImagePath)

    spr.anchor.set(.5)
    return spr
}

Scene_DMenu.prototype.removePIXIGraphics = function(){
    this.removeChild(this.stage)
    this.stage.destroy(true);
    this.stage = undefined;
}

Scene_DMenu.prototype.drawPopoutLines = function(){
    let length = 4;
    let style = this.popoutLineStyle;
    let cont = this.lines;

    for(let i = 0; i < length; i++){
        let line = new PIXI.Graphics
        line.lineStyle(style.brushThickness, style.color, 1)
        line.lineTo(Graphics.width * style.xRise, Graphics.height * style.yRise)
        line.lineTo(line.x + Graphics.width * style.xRun, Graphics.height * style.yRise)

        // line.width += line.width * -1 * 2 * (i % 2)
        cont.addChild(line)
    }
}


Scene_DMenu.prototype.createDiamondText = function(){
    let list = [
        this.diamondContainer.children[this.left],
        this.diamondContainer.children[this.up],
        this.diamondContainer.children[this.right],
        this.diamondContainer.children[this.down]
    ]
    let length = 4;

    for(let i = 0; i < length; i++){
        let txt = new PIXI.Text(`Option ${i}`, this.fontStyle())

        list[i].addChild(txt)
        txt.pivot.set(txt.width / 2, txt.height / 2)
    }
}

Scene_DMenu.prototype.diamondsLoaded = function () {
    let list = this.diamondContainer.children;;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        if (list[i].width <= 1 && list[i].height <= 1)
            return false;
    }

    this.initializeDiamondPositions()
    // this.drawPopoutLines()
    // this.initializePopoutPositions()
    this.cacheInitialPositions()
    this.setMoveInterval()
    this.setCallbackFunctions()
    // this.createDiamondText()
    return true;
}

Scene_DMenu.prototype.setCallbackFunctions = function(){
    let settings = this.settings; 

    this.select_down = DMenuManager.parseFunction(settings.bottomSettings.callback)
    this.select_up = DMenuManager.parseFunction(settings.topSettings.callback)
    this.select_right = DMenuManager.parseFunction(settings.rightSettings.callback)
    this.select_left = DMenuManager.parseFunction(settings.leftSettings.callback)
}

Scene_DMenu.prototype.diamondWidth = function () {
    return this.diamondContainer.children[0].width;
}

Scene_DMenu.prototype.diamondHeight = function () {
    return this.diamondContainer.children[0].height;
}

Scene_DMenu.prototype.initializeDiamondPositions = function () {
    let diamonds = this.diamondContainer.children;
    let width = this.diamondWidth()
    let height = this.diamondHeight();

    diamonds[this.down].position.set(0, (height * .5));
    diamonds[this.down].controlId = "down"
    diamonds[this.up].position.set(0, (height * .5) * -1)
    diamonds[this.up].controlId = "up"
    diamonds[this.right].position.set(width * .5, 0)
    diamonds[this.right].controlId = "right"
    diamonds[this.left].position.set((width * .5) * -1, 0)
    diamonds[this.left].controlId = "left"


    this.diamondContainer.position.set(Graphics.width * .5, Graphics.height * .8)
}

Scene_DMenu.prototype.initializePopoutPositions = function(){
    let lines = this.lines.children;
    let width = this.diamondWidth()
    let height = this.diamondHeight()
    let leftDiamond = this.getDiamond(this.left)
    let rightDiamond = this.getDiamond(this.right)
    let upDiamond = this.getDiamond(this.up)
    let downDiamond = this.getDiamond(this.down)
    let distMod = this.distanceMultiplier * width;

    lines[this.down].position.set(downDiamond.x, downDiamond.y + distMod);
    lines[this.down].controlId = "down"
    lines[this.down].height *= -1
    lines[this.up].position.set(upDiamond.x, upDiamond.y - distMod)
    lines[this.up].controlId = "up"
    lines[this.right].position.set(rightDiamond.x + width + distMod, rightDiamond.y + height / 2)
    lines[this.right].controlId = "right"
    lines[this.left].position.set(leftDiamond.x - distMod, leftDiamond.y + height / 2)
    lines[this.left].controlId = "left"
    lines[this.left].width *= -1

    this.lines.position = this.diamondContainer.position;
}

Scene_DMenu.prototype.cacheInitialPositions = function () {
    let list = this.diamondContainer.children;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        list[i].cachedDiamondPosition = [list[i].x, list[i].y]
        list[i].moveInterval = 0;
    }
}

Scene_DMenu.prototype.getDiamond = function (index) {
    return this.diamondContainer.children[index]
}

Scene_DMenu.prototype.getDiamondByDirection = function(direction){
    let list = this.diamondContainer.children;
    let length = list.length;

    for(let i = 0; i < length; i++){
        if(list[i].controlId == direction)
            return list[i]
    }
}

Scene_DMenu.prototype.setMoveInterval = function () {
    let diamonds = this.diamondContainer.children;
    let width = this.diamondWidth()
    let height = this.diamondHeight();
    let xMod = width / this.moveInterval * this.distanceMultiplier
    let yMod = height / this.moveInterval * this.distanceMultiplier

    diamonds[this.down].moveData = ['y', yMod]
    diamonds[this.up].moveData = ['y', yMod * -1]
    diamonds[this.right].moveData = ['x', xMod]
    diamonds[this.left].moveData = ['x', xMod * -1]
}

Scene_DMenu.prototype.dMenuUpdate = function () {
    this.checkPositions()
    this.checkInput()
    this.checkSEPlay()
}

Scene_DMenu.prototype.checkPositions = function () {
    let list = this.diamondContainer.children;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        let diamond = list[i];

        if (DMenuControl.isPressed(list[i].controlId)) {
            if (!this.isInSelectedPosition(i)) {
                this.moveDiamond(diamond)
            }
        } else if (!this.isInitialPosition(i)) {
            this.returnDiamond(diamond)
        }
    }
}


Scene_DMenu.prototype.isInSelectedPosition = function (index) {
    let diamond = this.getDiamond(index);

    return diamond.moveInterval == this.moveInterval;
}

Scene_DMenu.prototype.isInitialPosition = function (index) {
    let diamond = this.getDiamond(index)
    return !diamond.moveInterval;
}

Scene_DMenu.prototype.moveDiamond = function (diamond) {
    diamond.moveInterval++
    diamond[diamond.moveData[0]] += diamond.moveData[1]
    diamond.scale.set(1 + diamond.moveInterval * this.scaleMultiplier)
}

Scene_DMenu.prototype.returnDiamond = function (diamond) {
    diamond.moveInterval--
    diamond[diamond.moveData[0]] -= diamond.moveData[1]
    diamond.scale.set(1 + diamond.moveInterval * this.scaleMultiplier)
}


Scene_DMenu.prototype.checkInput = function () {
    if(Input.isTriggered('cancel')){
        this.removePIXIGraphics()
        DMenuManager.popScene()
    }

    DMenuControl.pollControls()

    if(!DMenuControl.isPressed() && DMenuControl.selectedOptions.length){
        let key = DMenuControl.selectedOptions[0]
        this[`select_${key}`]()
    }
    DMenuControl.setActiveSelections()
}

Scene_DMenu.prototype.checkSEPlay = function () {
    if (this.playSE && this[`${this.playSE}SE`]) {
        this.playSound(this[`${this.playSE}SE`])
    }
    this.playSE = false;
}

Scene_DMenu.prototype.playSound = function (name) {
    let options = {
        name: name,
        pitch: 50,
        volume: 100,
        pan: 0
    }
    AudioManager.playSe(options)
}


Scene_DMenu.prototype.select_down = function(){
    console.log('selected bottom')
}

Scene_DMenu.prototype.select_top = function(){
    console.log('selected top')    
}

Scene_DMenu.prototype.select_left = function(){
    console.log('selected left')    
}

Scene_DMenu.prototype.select_right = function(){
    console.log('selected right')    
}

Scene_DMenu.prototype.update = function () {
    if (!this._diamondsInitialized) {
        return this._diamondsInitialized = this.diamondsLoaded()
    }
    Scene_MenuBase.prototype.update.call(this)
    this.dMenuUpdate()
}





/*
    DMenuManager
*/

function DMenuManager(){
    throw new Error('This is a static class')
}

DMenuManager.sceneSettings = [];
DMenuControl.selectedOptions = [];

DMenuManager.getSettings = function(type, name){
    let list = type == 'menu' ? 
    standardPlayer.sp_diamondMenu.parameters.menus:
    standardPlayer.sp_diamondMenu.parameters.options;
    let length = list.length;
    name = name.toLocaleLowerCase()

    for(let i = 0; i < length; i++){
        if(list[i].name.toLocaleLowerCase() == name)
            return list[i]
    }

    console.log('did not find menu')
    return false;
}

DMenuManager.loadMenu = function(name){
    let menu = this.getSettings('menu', name)

    if(menu){
        menu.bottomSettings = this.getSettings('option', menu.bottom)
        menu.topSettings = this.getSettings('option', menu.top)
        menu.rightSettings = this.getSettings('option', menu.right)
        menu.leftSettings = this.getSettings('option', menu.left)

        this.sceneSettings.push(menu)
        SceneManager.push(Scene_DMenu)
    }
}

DMenuManager.menu = function(){
    return this.sceneSettings[this.sceneSettings.length - 1]
}


DMenuManager.parseFunction = function(path){
    path = path.split('.')
    let obj = path.length > 1 ? window[path.shift()] : window;
    let length = path.length;

    for (let i = 0; i < length; i++){
        obj = obj[path[i]];
    };
    return obj;
};

DMenuManager.popScene = function(){
    this.sceneSettings.pop()
    SceneManager.pop()
}


function funcA(){
    DMenuManager.loadMenu('MenuB')
}

function funcB(){
    console.log('ran func b')
}

function funcC(){
    console.log('ran func c')
}

function funcD(){
    console.log('ran func d')
}



function DMenuControl(){
    throw new Error('This is a static class')
}

DMenuControl.controls = {left:false, right:false, up:false, down:false}

DMenuControl.isPressed = function(direction){
    direction = direction ? [this.controls[direction]] : Object.values(this.controls)
    return direction.indexOf(true) != -1
}

DMenuControl.pollControls = function(){
    this.pollDirections()
}

DMenuControl.pollDirections = function(){
    let list = Object.keys(this.controls)
    let length = 4;

    for(let i = 0; i < length; i++){
        if(Input.isPressed(list[i])){
            this.controls[list[i]] = true;
        } else {
            this.controls[list[i]] = false;
        }
    }
}

DMenuControl.setActiveSelections = function(){
    let list = this.controls
    let keys = Object.keys(list)
    let length = 4;
    let pressed = []

    for(let i = 0; i < length; i++){
        if(list[keys[i]])
            pressed.push(keys[i])
    }
    this.selectedOptions = pressed;
}


let aliasTitleWindow = Window_TitleCommand.prototype.makeCommandList;
Window_TitleCommand.prototype.makeCommandList = function(){
    aliasTitleWindow.call(this)
    this.addCommand("Test Diamond", "dMenu")
}

let aliasSceneTitle = Scene_Title.prototype.createCommandWindow;
Scene_Title.prototype.createCommandWindow = function(){
    aliasSceneTitle.call(this)
    this._commandWindow.setHandler("dMenu", ()=>{DMenuManager.loadMenu("MenuA")})
}
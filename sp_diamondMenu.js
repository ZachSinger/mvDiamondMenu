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
    this.index = -1;
    this.moveInterval = 7;
    this.distanceMultiplier = .2
    this.scaleMultiplier = .02
    this.highlightSE = 'Cursor1';
    this.selectionSE = 'Cursor2';
    this.BOTTOM = 0;
    this.TOP = 1;
    this.RIGHT = 2;
    this.LEFT = 3;
}


Scene_DMenu.prototype.loadDiamondWindows = function () {
    let cont = new PIXI.Container;

    for (let i = 0; i < 4; i++) {
        cont.addChild(this.createDiamondSprite())
    }
    this._diamondsInitialized = false;
    this.diamondContainer = cont;
}

Scene_DMenu.prototype.createDiamondSprite = function () {
    let spr = new PIXI.Sprite.from('img/diamond.png')

    spr.anchor.set(.5)
    return spr
}

Scene_DMenu.prototype.diamondsLoaded = function () {
    let list = this.diamondContainer.children;;
    let length = list.length;

    for (let i = 0; i < length; i++) {
        if (list[i].width <= 1 && list[i].height <= 1)
            return false;
    }

    this.initializeDiamondPositions()
    this.cacheInitialPositions()
    this.setMoveInterval()
    return true;
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

    this.addChild(this.diamondContainer);
    diamonds[this.BOTTOM].position.set(0, (height * .5));
    diamonds[this.TOP].position.set(0, (height * .5) * -1)
    diamonds[this.RIGHT].position.set(width * .5, 0)
    diamonds[this.LEFT].position.set((width * .5) * -1, 0)


    this.diamondContainer.position.set(Graphics.width * .5, Graphics.height * .8)
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

Scene_DMenu.prototype.setMoveInterval = function () {
    let diamonds = this.diamondContainer.children;
    let width = this.diamondWidth()
    let height = this.diamondHeight();
    let xMod = width / this.moveInterval * this.distanceMultiplier
    let yMod = height / this.moveInterval * this.distanceMultiplier

    diamonds[this.BOTTOM].moveData = ['y', yMod]
    diamonds[this.TOP].moveData = ['y', yMod * -1]
    diamonds[this.RIGHT].moveData = ['x', xMod]
    diamonds[this.LEFT].moveData = ['x', xMod * -1]
}

Scene_DMenu.prototype.dMenuUpdate = function () {
    this.checkPositions()
    this.checkInput()
    this.checkSEPlay()
}

Scene_DMenu.prototype.checkPositions = function () {
    let list = this.diamondContainer.children;
    let length = list.length;
    let index = this.index;

    for (let i = 0; i < length; i++) {
        let diamond = list[i];

        if (i == index) {
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
    let playSE = false;

    if (Input.isTriggered('up')) {
        this.index = this.TOP;
        playSE = 'highlight'
    }

    if (Input.isTriggered('down')) {
        this.index = this.BOTTOM;
        playSE = 'highlight'
    }

    if (Input.isTriggered('left')) {
        this.index = this.LEFT;
        playSE = 'highlight'
    }

    if (Input.isTriggered('right')) {
        this.index = this.RIGHT;
        playSE = 'highlight'
    }

    if (Input.isTriggered('ok')) {
        this.makeSelection()
        playSE = 'selection'
    }

    this.playSE = playSE;
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

Scene_DMenu.prototype.makeSelection = function () {
    let playSE = false;

        switch (this.index) {
            case this.BOTTOM:
                this.selectBottom()
                break;
            case this.TOP:
                this.selectTop()
                break;
            case this.RIGHT:
                this.selectRight()
                break;
            case this.LEFT:
                this.selectLeft()
                break;
            default:
        }

    this.playSE = playSE;
}

Scene_DMenu.prototype.selectBottom = function(){
    console.log('selected bottom')
}

Scene_DMenu.prototype.selectTop = function(){
    console.log('selected top')    
}

Scene_DMenu.prototype.selectLeft = function(){
    console.log('selected left')    
}

Scene_DMenu.prototype.selectRight = function(){
    console.log('selected right')    
}

Scene_DMenu.prototype.update = function () {
    if (!this._diamondsInitialized) {
        return this._diamondsInitialized = this.diamondsLoaded()
    }
    Scene_MenuBase.prototype.update.call(this)
    this.dMenuUpdate()
}

/*:
* @plugindesc standardPlayer Standard UI Class specification
* @author standardplayer
*/


var Imported = Imported || {};
Imported.standardUI = 'standardUI';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.standardUI = standardPlayer.standardUI || { animations: [], active: true };

standardPlayer.standardUI.Parameters = PluginManager.parameters('standardPlayer.standardUI');

function sp_UIFactory() {
    throw new Error('This is a static class')
}

sp_UIFactory.uiProto = function () {
    return Object.create(sp_UI.prototype)
}

sp_UIFactory.lineStyle = function () {
    return [2, 0xFFFFFF, 1]
}

sp_UIFactory.fill = function () {
    return 0x54aeba
}

sp_UIFactory.windowBackgroundStyler = function (graphicsStub) {
    let lineStyle = this.lineStyle()
    let fill = this.fill()

    console.log(graphicsStub)
    graphicsStub.stub.lineStyle(...lineStyle)
    graphicsStub.stub.beginFill(fill)
}


function sp_UI() {
    throw new Error('This is an abstract class')
}

sp_UI.prototype.initialize = function () {
    throw new Error('Classes extending sp_UI should implement an initialize method')
}

sp_UI.prototype.constructor = sp_UI.prototype.build;

sp_UI.prototype.build = function () {
    this.setProps()
    this.setDimensions()
    this.createBackground()
    this.createTextContainer()
    this.initialize()
    this.preload()
    this.setInteractive()
}

sp_UI.prototype.setProps = function () {
    this._initialized = false;
    this._stage = standardPlayer.sp_ImageCache.createContainer()
}

sp_UI.prototype.setDimensions = function () {
    this._backWidth = this.initialDrawWidth()
    this._backHeight = this.initialDrawHeight()
}

sp_UI.prototype.initialDrawWidth = function(){
    return Graphics.width * .2
}

sp_UI.prototype.initialDrawHeight = function(){
    return Graphics.width * .2
}

sp_UI.prototype.preload = function () {
    if (this._filepaths) {
        this.setPreloader()
    }
}

sp_UI.prototype.setPreloader = function () {
    let filepaths = this._filepaths;
    this._loadedStubs = standardPlayer.sp_ImageCache.loadBatch("preloader", filepaths, () => { this.baseOnPreloaded() })
}

sp_UI.prototype.baseOnPreloaded = function () {
    this._isPreloaded = true;
    this.onPreloaded()
}

sp_UI.prototype.onPreloaded = function () {
    throw new Error('Classes extending sp_UI that set the ._filepaths property in the initalize method should have their own .onPreloaded method')
}

sp_UI.prototype.imageCache = function () {
    return standardPlayer.sp_ImageCache
}

sp_UI.prototype.isInteractive = function () {
    return false;
}

sp_UI.prototype.setInteractive = function () {
    if (this.isInteractive()) {
        this._stage.setInteractive()
        this._back.setInteractive()
    }
}

sp_UI.prototype.createBackground = function (useText) {
    let back = this.imageCache().createGraphic()

    sp_UIFactory.windowBackgroundStyler(back)
    back.stub.drawRoundedRect(0, 0, this._backWidth, this._backHeight, 12)

    this._stage.addChild(back)
    this._back = back;
        
}

sp_UI.prototype.createTextContainer = function(){
    this._text = this.imageCache().createContainer()
    this._textObjects = {main: this.imageCache().createText()}

    this._text.addChild(this._textObjects.main)
    this._stage.addChild(this._text)
}

sp_UI.prototype.stage = function () {
    return this._stage.stub
}

sp_UI.prototype.update = function () {

}

sp_UI.prototype.mouseCollision = function () {

    let bounds = this.stage().getBounds();

    return standardPlayer.sp_Core.collision(bounds)
}

sp_UI.prototype.isTriggered = function () {
    return TouchInput.isTriggered() && this.mouseCollision()
}

sp_UI.prototype.isPressed = function () {
    return TouchInput.isPressed() && this.mouseCollision()
}

/**
 * 
 * USE A SHARED FILTER THAT IS AVAIALABLE  TO ALL CHILD CLASSES
 * SET SP_UI TO BE INTERACTIVE IF DESIRED (OR CREATE SEPARATE INTERACTABLE CLASS<<INTERACTIVE AS FAR AS TOUCHINPUT>>)
 * 
 */


function sp_CheckBox() {
    this.build(true)
}

sp_CheckBox.prototype = sp_UIFactory.uiProto()


sp_CheckBox.prototype.initialize = function (toggled) {
    this._toggled = !toggled || false;
    // this.positionText()
    this.draw()
}

sp_CheckBox.prototype.initialDrawWidth = function(){
    return Graphics.width * .04
}

sp_CheckBox.prototype.initialDrawHeight = function(){
    return Graphics.width * .04
}

sp_CheckBox.prototype.onPreloaded = function () {
    console.log('finished preloading')
}

sp_CheckBox.prototype.positionText = function(){
    let txt = this._textObjects.main.stub;
    let back = this._back.stub
    
    txt.position.set(back.width / 2, back.height / 2 )
    txt.y -= txt.height / 2
    txt.y -= txt.height / 16

    txt.x -= txt.width / 2
    txt.x -= txt.width / 16
}

sp_CheckBox.prototype.isInteractive = function () {
    return true;
}

sp_CheckBox.prototype.draw = function () {
    let content = this._toggled ? 'X' : '';
    this._textObjects.main.setText(content, true)

    this.positionText()
}

sp_CheckBox.prototype.update = function () {
    sp_UI.prototype.update.call(this)
    if (this.isTriggered()) {
        this.onCollision()
    }
}

sp_CheckBox.prototype.onCollision = function () {
    this._toggled = !this._toggled;
    this.draw()
}





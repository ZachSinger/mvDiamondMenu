/*:
* @plugindesc standardPlayer Animation Builder script
* @author standardplayer
* @target MZ
* @base sp_Core
* @orderAfter sp_Core
*/


var Imported = Imported || {};
Imported.sp_Animations = 'sp_Animations';

var standardPlayer = standardPlayer || { params: {} };
standardPlayer.sp_Animations = standardPlayer.sp_Animations || { animations: [], active: true };

standardPlayer.sp_Animations.Parameters = PluginManager.parameters('standardPlayer.sp_Animations');
standardPlayer.sp_Animations.useCustom = {};

standardPlayer.sp_Core.addBaseUpdate(() => {
    requestAnimationFrame(() => {
        let thisObject = standardPlayer.sp_Animations;
        if (thisObject.active)
            thisObject.run();
    })
})

standardPlayer.sp_Animations.createAnimation = function (target) {
    let anim = new spAnimation(target);

    this.addAnim(anim);
    target.anim = anim;
    return anim;
}

standardPlayer.sp_Animations.reserveAnimation = function (url, cb) {
    let stub = standardPlayer.sp_ImageCache.loadSprite(url, cb);

    stub.retrieve().onCacheArgs = this.createAnimation(() => { return stub.retrieve() })

    return stub
}

standardPlayer.sp_Animations.reserveAnimationShared = function (url, cb) {
    let stub = standardPlayer.sp_ImageCache.loadSharedSprite(url, cb);

    stub.retrieve().onCacheArgs = this.createAnimation(() => { return stub.retrieve() })

    return stub

}

standardPlayer.sp_Animations.createTemplate = function () {
    let target = {
        'x': 0,
        'y': 0,
        'width': 0,
        'height': 0,
        'scale': {},
        'alpha': 0,
        'rotation': 0
    }
    target.scale.x = 0;
    target.scale.y = 0;

    return new templateAnimation(target);
}

standardPlayer.sp_Animations.createFromTemplate = function(template, stub){
    let anim = this.createAnimation(()=>{return stub.retrieve()})

    anim.actions = template.actions
    this.copyTemplateActions(anim)
    template.prepareAnimation.call(anim)
    return anim
}

standardPlayer.sp_Animations.copyTemplateActions = function(anim){
    let actions = anim.actions
    let length = actions.length;
    

    for(let i = 0; i < length; i++){
        actions[i].animation = anim
    }
}

standardPlayer.sp_Animations.addAnim = function (anim) {
    this.animations.push(anim);
    this.active = true;
}

standardPlayer.sp_Animations.run = function () {
    let list = this.animations;
    let length = list.length;
    let results = [];

    // console.log('running animations master')

    for (let i = 0; i < length; i++) {
        if (!list[i].allComplete() || !list[i].actions.length) {
            this.runActions(list[i])
            results.push(list[i])
        }

    }

    this.animations = results
}

standardPlayer.sp_Animations.runActions = function (animation) {
    let actions = animation.actions;

    actions.forEach(action => this.playAction(action))
}

standardPlayer.sp_Animations.playAction = function (action) {
    if (action.isCompleted()) {
        action.masterCb()
        action.active = false;
    } else if (action.active && action.passesRunConditions()) {
        action.play();
    }
}

/* ===================================================================================================
        spAnimation class
 ===================================================================================================*/

class spAnimation {
    constructor(target) {
        this.kill = false;
        this.actions = [];
        this.steps = [];
        this.setTarget(target)
        this.cacheProps();
    }

    target() {
        return this._target;
    }

    setTarget(target) {
        if (typeof target == 'function') {
            this.target = target
        } else {
            this._target = target
        }
    }

    cacheProps() {
        this.initialCache = this.extractInitialProps();
        this.currentPosition = this.extractInitialProps();
    }

    extractInitialProps() {
        let target = this.target();
        let props = {
            'x': target.x,
            'y': target.y,
            'width': target.width,
            'height': target.height,
            'scale': {},
            'alpha': target.alpha,
            'rotation': target.rotation
        }
        props.scale.x = target.scale && target.scale._x ? target.scale._x : 1;
        props.scale.y = target.scale && target.scale._y ? target.scale._y : 1;
        return props;
    }

    checkPreload() {
        if (this.reserved) {
            if (this.isPreloaded) {
                return true
            } else {
                return false
            }

        }
        return true

    }

    action(index) {
        if (index > this.actions.length - 1) {
            return this.addNewAction();
        } else {
            return this.actions[index]
        }
    }

    addNewAction() {
        let action = new sp_Action(this)

        this.actions.push(action);
        return action;
    }

    allComplete() {
        let complete = true;
        let list = this.actions;
        let length = list.length;

        for (let i = 0; i < length; i++) {
            if (list[i].active) {
                complete = false
            }
        }

        return complete || this.kill
    }

    activate() {
        this.active = true;
        this.actions.forEach(action => action.activate())
    }

}

/* ===================================================================================================
        templateAnimation class
 ===================================================================================================*/

class templateAnimation extends spAnimation{
    constructor(target){
        super(target)
    }

    create(stub){
        return standardPlayer.sp_Animations.createFromTemplate(this, stub)
    }

    prepareAnimation(){
        console.log(this)
        this.actions.forEach((action) => {
            for(let i = 0; i < action.steps.length; i++){
                action.index = i
                action.prepareStep();
            }
        })
    }


}

/* ===================================================================================================
        sp_Action Class
 ===================================================================================================*/

class sp_Action {
    constructor(animation) {
        this.animation = animation;
        this.steps = [{}];
        this.stepTemplate = [{}];
        this.dur = [];
        this.pad = [];
        this.index = 0;
        this.tick = 0;
        this.active = false;
        this.repeat = [0];
        this.repeatCache = [0]
        this.masterRepeat = 0;
        this.throughCb = () => { };
        this.stepCb = [() => { }]
        this.masterCb = () => { }
        this.runCondition = [() => { return true }];
        this.masterRunCondition = () => { return true };
    }

    step() {
        return this.steps[this.index]
    }

    template(prop) {
        if(prop && typeof this.animation.initialCache[prop] == 'undefined'){
            console.log(prop + ' not on original cache')
            
        }
        return this.stepTemplate[this.index]
    }

    checkWrapperRequirement(prop, initValue){
        let target = this.target();
        
        if(typeof target[prop] == 'function'){
            console.log('prop is function')
            Object.defineProperty(target, `_${prop}`, {
                set: (x)=> {target[prop](x)}
            })
            this.stepTemplate[this.index][`_${prop}`] = initValue
            this.animation.initialCache[`_${prop}`] = initValue
            this.animation.currentPosition[`_${prop}`] = initValue
            this.animation.initialCache[prop] = standardPlayer.sp_Animations.useCustom;
        } else {
            this.animation.initialCache[prop] = this.target()[prop]
            this.animation.currentPosition[prop] = this.target()[prop]
            this.stepTemplate[this.index][prop] = this.target()[prop];
        }
    }

    currentDur() {
        return this.dur[this.index] + this.pad[this.index]
    }

    target() {
        return this.animation.target();
    }

    moveXY(x, y, dur, pad) {
        console.log('runninng moveX')
        let step = this.template();

        step.x = x;
        step.y = y;

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    moveXYRel(x, y, dur, pad) {
        let step = this.template();

        step.x = this.getLastPropValue('x') + x;
        step.y = this.getLastPropValue('y') + y;

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    setRotation(value, dur, pad) {
        let step = this.template();

        step.rotation = value;


        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    setAlpha(value, dur, pad) {
        let step = this.template();

        step.alpha = value

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    setDimensions(width, height, dur, pad) {
        this.setWidth(width, dur, pad)
        this.setHeight(height, dur, pad)
        return this;
    }

    setWidth(value, dur, pad) {
        let step = this.template();

        step.width = value

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    setHeight(value, dur, pad) {
        let step = this.template();

        step.height = value

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    setScale(x, y, dur, pad) {
        let step = this.template();

        step.scale = {};
        step.scale.x = x;
        step.scale.y = y;

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    addCustomProp(prop, initValue) {
        this.checkWrapperRequirement(prop, initValue)

        return this;
    }


    setCustomProp(prop, value, dur, pad) {
        let step = this.template(prop, value);
        prop = this.animation.initialCache[prop] == standardPlayer.sp_Animations.useCustom ? `_${prop}` : prop
        step[prop] = value;

        // this.animation.initialCache[prop] = this.target()[prop]

        this.dur[this.index] = dur;
        this.pad[this.index] = pad || 0;
        return this;
    }

    setWait(value) {
        let step = this.template();

        step.wait = value
        this.then();
        return this;
    }

    resetPosition(dur, pad) {
        let step = this.template();
        step.resetPosition = true;
        this.dur[this.index] = dur;
        this.pad[this.index] = pad;
        return this
    }

    prepareStep() {
        let template = this.template();
        let keys = Object.keys(template)
        let length = keys.length;
        let step = this.step();
        let current;
        let cb = this.getLastPropValue;

        // if(keys[0] == 'wait')
        for (let i = 0; i < length; i++) {
            current = keys[i];
            if (current == 'scale') {
                step[current] = { x: [], y: [] }
                step[current].x = standardPlayer.sp_Core.plotLinearPath(
                    cb.call(this, 'scale').x,
                    template[current].x,
                    this.dur[this.index],
                    this.pad[this.index]
                )

                step[current].y = standardPlayer.sp_Core.plotLinearPath(
                    cb.call(this, 'scale').y,
                    template[current].y,
                    this.dur[this.index],
                    this.pad[this.index]
                )
                continue
            }

            step[current] = standardPlayer.sp_Core.plotLinearPath
                (
                    cb.call(this, current),
                    template[current],
                    this.dur[this.index],
                    this.pad[this.index]
                )
        }
        return this
    }

    plotResetPath() {
        let template = this.animation.initialCache;
        let keys = Object.keys(template)
        let length = keys.length;
        let step = this.step();
        let current;

        // if(keys[0] == 'wait')
        for (let i = 0; i < length; i++) {
            current = keys[i];
            if (current == 'scale') {
                step[current] = { x: [], y: [] }
                step[current].x = standardPlayer.sp_Core.plotLinearPath(
                    this.target().scale.x,
                    template[current].x,
                    this.dur[this.index],
                    this.pad[this.index]
                )

                step[current].y = standardPlayer.sp_Core.plotLinearPath(
                    this.target().scale.y,
                    template[current].y,
                    this.dur[this.index],
                    this.pad[this.index]
                )
                continue
            }

            step[current] = standardPlayer.sp_Core.plotLinearPath
                (
                    this.target()[current],
                    template[current],
                    this.dur[this.index],
                    this.pad[this.index]
                )
        }
        return this
    }



    setRunCondition(cb) {
        this.runCondition[this.index] = cb;
        return this;
    }

    setMasterRunCondition(cb) {
        this.masterRunCondition = cb;
        return this;
    }

    setRepeat(numberOfTimes) {
        this.repeat[this.index] = numberOfTimes;
        this.repeatCache[this.index] = numberOfTimes;
        return this;
    }

    setMasterRepeat(numberOfTimes) {
        this.masterRepeat = numberOfTimes;
        return this;
    }

    getRepeat() {
        return this.repeat[this.index];
    }


    checkRepeat() {
        if (this.masterRepeat <= -1 || this.masterRepeat--) {
            this.tick = 0;
            this.index = 0;
            this.resetForRepeat();
            return true
        }
        return false;
    }

    checkStepRepeat() {
        if (this.getRepeat() === -1 || this.repeat[this.index]--) {
            this.tick = 0;
            return true;
        }

        return false;
    }

    resetForRepeat() {
        let list = this.steps;
        let length = list.length;

        for (let i = 0; i < length; i++) {
            this.repeat[i] = this.repeatCache[i];
        }
    }

    setStepCb(cb) {
        this.stepCb[this.index] = cb;
        return this;
    }

    setMasterCb(cb) {
        this.masterCb = cb;
        return this
    }

    runStepCb() {
        this.stepCb[this.index - 1]()
    }

    setThroughCb(cb) {
        this.throughCb = cb;
        return this
    }

    getRunCondition() {
        return this.runCondition[this.index];
    }

    passesRunConditions() {
        return this.getRunCondition()() && this.masterRunCondition()
    }

    getPositionData() {
        if (!this.index) {
            return this.animation.initialCache
        }
        else {
            return this.stepTemplate[this.index - 1]
        }
    }

    getLastPropValue(prop) {
        let templates = this.stepTemplate;
        for (let i = this.index - 1; i >= 0; i--) {
            if (typeof templates[i][prop] != 'undefined')
                return templates[i][prop]
        }

        return this.animation.initialCache[prop]
    }


    isResetPosition() {
        let step = this.template();

        if (step.resetPosition) {
            step.resetPosition = false
            return true
        }

        return false;
    }

    hasWait() {
        let step = this.template();

        if (typeof step.wait != 'undefined') {
            if (step.wait-- > 0) {

                return true;
            }

            this.index++;
            this.tick = 0;
            this.updateCache();

        }
        return false;
    }

    play() {
        let step = this.step();
        let target = this.target();
        let props = Object.keys(step);
        let paths = Object.values(step);
        let length = props.length;
        let index = ++this.tick;

        if (this.hasWait())
            return;

        if (this.isResetPosition()) {
            console.log('resetting position live')
            this.plotResetPath()
            step = this.step()
            props = Object.keys(step);
            paths = Object.values(step);
            length = props.length;

        }

        for (let i = 0; i < length; i++) {
            if (props[i] === 'scale') {
                this.updateScale(paths[i], index)
            } else {
                target[props[i]] = paths[i][index];
            }

        }

        this.throughCb()

    }

    isCompleted() {
        return this.index < this.steps.length && this.isCompletedStep() && this.index >= this.steps.length && !this.checkRepeat();
    }

    isCompletedStep() {
        if (this.tick + 1 >= this.currentDur()) {
            console.log('is passed condition')
            if (this.checkStepRepeat())
                return false;
            this.index++;
            this.tick = 0;
            this.updateCache();
            this.runStepCb()
            return true;
        }

        return false;
    }

    updateCache() {
        let target = this.target();
        let keys = Object.keys(target)
        let currentPosition = {}
        keys.forEach(key => currentPosition[key] = target[key])

        this.animation.currentPosition = currentPosition;
    }

    updateScale(props, index) {
        this.target().scale.set(props.x[index], props.y[index])
    }


    activate() {
        this.tick = 0;
        this.index = 0;
        this.active = true;
    }

    finalize() {
        this.prepareStep()
        this.animation.activate()
    }

    then() {
        this.prepareStep()
        this.index++;
        this.repeat.push(0);
        this.repeatCache.push(0);
        this.steps[this.index] = {}//this.getPositionData()
        this.stepTemplate[this.index] = {}//Object.assign({}, this.stepTemplate[this.index - 1]);
        this.stepCb[this.index] = () => { };
        this.runCondition.push(() => { return true })
        return this;
    }

}


let tFunc = ()=>{
    let d = DMenuManager.scene.diamondContainer.children[0]
    let f= new PIXI.filters.ColorMatrixFilter
    d.filters = [f]
    standardPlayer.sp_Animations.createAnimation(f)
        .action(0)
        .addCustomProp('brightness', 1)
        .setCustomProp('brightness', 10, 9)
        .then()
        .setCustomProp('brightness', .5, 9)
        .then()
        .setCustomProp('brightness', 10, 9)
        .then()
        .setCustomProp('brightness', 1, 9)
        .finalize()

    window.fil = f
}

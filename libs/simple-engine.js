function __mergeDefault__(now, template) {
    let res = now;
    for (const i in template) {
        if (res[i] === undefined) {
            res[i] = template[i];
        }
    }
    return res;
}

class BaseElement {
    static MAX_ID = 0;

    constructor(attr = {}) {
        const tmpConf = __mergeDefault__(attr, {
            'id': BaseElement.MAX_ID++,
            'name': 'untitled',
            'position': [0, 0, 0],
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'transparency': 1.0
        })

        this.id = tmpConf.id;
        this.name = tmpConf.name;
        this.position = tmpConf.position;
        this.rotation = tmpConf.rotation;
        this.scale = tmpConf.scale;
        this.transparency = tmpConf.transparency;
    }

    init(engine) {}
    update(engine) {}
    onDelete(engine) {}

    setSegment(seg) {
        this.__segment__ = seg;
    }
}

class BasicAnimation {
    static MAX_ID = 0;

    constructor(attr = {}) {
        const tempConf = __mergeDefault__(attr, {
            'id': BasicAnimation.MAX_ID++,
        })
        this.id = tempConf.id;
        this.ref = null;
        this.seg = null;
    }

    setRef(ref) {
        this.ref = ref;
    }
    setSegment(seg) {
        this.seg = seg;
    }

    init(engine) {}
    update(engine) {}
    onDelete(engine) {}
    hasEnd(engine) {
        return false;
    }
}

class BaseSegment {
    static MAX_ID = 0;

    constructor(attr = {}) {
        const tempConf = __mergeDefault__(attr, {
            'id': BaseSegment.MAX_ID++,
            'ref': new BaseElement(),
            'animations': [ new BasicAnimation() ],
            'hasStarted': ( engine ) => { return true },
            'hasEnd': ( engine ) => { return this.isEnd; },
            'onDelete': ( engine ) => {},
        })

        this.id = tempConf.id;
        this.ref = tempConf.ref;
        this.animations = tempConf.animations;
        this.isEnd = false;
        this.isRegistered = false;
        this.hasEnd = tempConf.hasEnd;
        this.hasStarted = tempConf.hasStarted;
        this.onDelete = tempConf.onDelete;

        for (const i in this.animations) {
            this.animations[i].setRef(this.ref);
            this.animations[i].setSegment(this);
        }
    }

    init(engine) {
        this.engine = engine;
        this.isEnd = false;
        this.nowAniIndex = 0;
    }
    update(engine) {
        if (this.nowAniIndex === this.animations.length) {
            if (this.loop) {
                this.nowAniIndex = 0;
            } else {
                this.isEnd = true;
            }
        } else if (this.animations[this.nowAniIndex].hasEnd( engine )) {
            ++this.nowAniIndex;
        }
    }
    onDelete(engine) {}
    hasStarted(engine) {
        return true;
    }
    hasEnd(engine) {
        return this.isEnd;
    }
    addAnimation(ani, index = -1) {
        if (ani instanceof BasicAnimation) {
            if (index === -1) {
                this.animations.push(ani);
                this.isEnd = false;
            } else {
                this.animations.splice(index, 0, ani);
                if (index > this.nowAniIndex) {
                    this.isEnd = false;
                }
            }
        } else {
            throw "Animation is legal. ";
        }
    }
    getCurrentAnimation() {
        if (this.nowAniIndex === this.animations.length) {
            this.nowAniIndex = 0;
            this.isEnd = true;
            return null;
        }
        if (this.animations[this.nowAniIndex].hasEnd(this.engine)) {
            ++this.nowAniIndex;
        }
        if (this.nowAniIndex === this.animations.length) {
            this.nowAniIndex = 0;
            this.isEnd = true;
            return null;
        }
        return this.animations[this.nowAniIndex];
    }
}

class TimeLineEngine {
    constructor(attr = {}) {
        const tmpConf = __mergeDefault__(attr, {
            'startTime': 0,
            'backgroundColor': 0xEEEEEE,
            'cameraFov': 45,
            'cameraNear': 0.1,
            'cameraFar': 1000,
            'cameraInitPosition': [0, 0, 100],
            'cameraInitLookAt': 'default'
        })

        this.activeElements = {};
        this.activeAnimations = {};
        this.activeSegments = {};
        this.segments = [];

        this.hasCompile = false;

        this.startTime = tmpConf.startTime;

        this.__scene__ = new THREE.Scene();
        this.__renderer__ = new THREE.WebGLRenderer();
        this.__renderer__.setClearColor(new THREE.Color(tmpConf.backgroundColor));
        this.__renderer__.setSize(window.innerWidth, window.innerHeight);

        this.__camera__ = new THREE.PerspectiveCamera(
            tmpConf.cameraFov,
            window.innerWidth / window.innerHeight,
            tmpConf.cameraNear,
            tmpConf.cameraFar
        );
        this.__camera__.position.set(
            tmpConf.cameraInitPosition[0],
            tmpConf.cameraInitPosition[1],
            tmpConf.cameraInitPosition[2],
        );
        if (tmpConf.cameraInitLookAt === 'default') {
            this.__camera__.lookAt(this.__scene__.position);
        } else {
            this.__camera__.lookAt(tmpConf.cameraInitLookAt);
        }

        this.setup();

        document.getElementById("WebGL-output").appendChild(this.__renderer__.domElement);
    }

    addSegment(seg) {
        if (seg instanceof BaseSegment) {
            this.segments.push(seg);
        } else {
            throw "Segment is illegal. ";
        }
    }

    addActiveAnimation(ani) {
        if (ani instanceof BasicAnimation) {
            if (this.activeAnimations[ani.id] === undefined) {
                this.activeAnimations[ani.id] = {
                    'data': ani,
                    'cnt': 1
                };
            } else {
                ++this.activeAnimations[ani.id].cnt;
            }
        }
    }

    setup() {}

    compile() {
        this.activateTime = new Date().getTime();
        console.log("compiled");
        this.hasCompile = true;
    }

    run() {
        // compile if not
        if (!this.hasCompile) {
            this.compile();
        }

        // it is time to start segment
        this.nowTime = this.startTime + ((new Date().getTime()) - this.activateTime);

        for (const iid in this.segments) {
            let tmpSeg = this.segments[iid];
            if (!tmpSeg.hasStarted(this) || tmpSeg.isRegistered || tmpSeg.hasEnd(this)) {
                continue;
            }
            tmpSeg.isRegistered = true;
            if (tmpSeg instanceof BaseSegment) {
                if (this.activeSegments[tmpSeg.id] === undefined) {
                    this.activeSegments[tmpSeg.id] = {
                        'data': tmpSeg,
                        'cnt': 1
                    };
                    tmpSeg.init(this);
                } else {
                    ++this.activeSegments[tmpSeg.id].cnt;
                }
            } else {
                throw "Segment is illegal. ";
            }

            //activate element
            let tmpEle = tmpSeg.ref;
            if (tmpEle) {
                if (tmpEle instanceof BaseElement) {
                    if (this.activeElements[tmpEle.id] === undefined) {
                        this.activeElements[tmpEle.id] = {
                            'data': tmpEle,
                            'cnt': 1
                        };
                        tmpEle.setSegment(tmpSeg);
                        tmpEle.init(this);
                    } else {
                        ++this.activeElements[tmpEle.id].cnt;
                    }
                } else {
                    throw "Element is illegal. ";
                }
            }

            // activate animation
            let tmpAni = tmpSeg.getCurrentAnimation();
            if (tmpAni) {
                this.addActiveAnimation(tmpAni);
                tmpAni.init();
            }
        }

        // segment is end
        let elementKickoutList = [];
        let animationKickoutList = [];
        let segmentKickoutList = [];

        for (const i in this.activeAnimations) {
            let tmpAni = this.activeAnimations[i].data;
            if (tmpAni.hasEnd(this)) {
                --this.activeAnimations[tmpAni.id].cnt;
                if (this.activeAnimations[tmpAni.id].cnt === 0) {
                    animationKickoutList.push(tmpAni.id);
                    if (tmpAni.seg) {
                        let nxtAni = tmpAni.seg.getCurrentAnimation();
                        if (nxtAni) {
                            this.addActiveAnimation(nxtAni);
                            nxtAni.init();
                        }
                    }
                }
            }
        }

        for (const i in this.activeSegments) {
            let tmpSeg = this.activeSegments[i].data;
            if (tmpSeg.hasEnd(this)) {
                segmentKickoutList.push(i);

                let tmpEle = tmpSeg.ref;
                if (tmpEle) {
                    --this.activeElements[tmpEle.id].cnt;
                    if (this.activeElements[tmpEle.id].cnt === 0) {
                        elementKickoutList.push(tmpEle.id);
                    }
                }
            }
        }

        // kickout
        for (const id in elementKickoutList) {
            this.activeElements[elementKickoutList[id]].data.onDelete(this);
            delete this.activeElements[elementKickoutList[id]];
        }
        for (const id in animationKickoutList) {
            this.activeAnimations[animationKickoutList[id]].data.onDelete(this);
            delete this.activeAnimations[animationKickoutList[id]];
        }
        for (const id in segmentKickoutList) {
            this.activeSegments[segmentKickoutList[id]].data.onDelete(this);
            delete this.activeSegments[segmentKickoutList[id]];
        }

        // update element
        for (const id in this.activeSegments) {
            this.activeSegments[id].data.update(this);
        }
        for (const id in this.activeAnimations) {
            this.activeAnimations[id].data.update(this);
        }
        for (const id in this.activeElements) {
            this.activeElements[id].data.update(this);
        }

        // next frame
        requestAnimationFrame(() => { this.run(); });
        this.__renderer__.render(this.__scene__, this.__camera__);
    }
}

class CustomElement extends BaseElement {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'init': ( engine ) => {},
            'update': ( engine ) => {},
            'onDelete': ( engine ) => {},
        });
        this.init = tmpConf.init;
        this.update = tmpConf.update;
        this.onDelete = tmpConf.onDelete;
    }
}

class AxesHelperElement extends BaseElement {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'axesSize': 20
        })

        this.axesSize = tmpConf.axesSize;
    }

    init(engine) {
        super.init(engine);
        this.axes = new THREE.AxisHelper(this.axesSize * this.scale[0]);
        engine.__scene__.add(this.axes);
    }

    onDelete(engine) {
        super.onDelete(engine);
        engine.__scene__.remove(this.axes);
    }
}

class SquareElement extends BaseElement {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'color': 0x66CCFF,
            'width': 10,
            'height': 10,
            'widthSegments': 1,
            'heightSegments': 1,
            'side': THREE.DoubleSide
        })

        this.color = tmpConf.color;
        this.width = tmpConf.width;
        this.height = tmpConf.height;
        this.widthSegments = tmpConf.widthSegments;
        this.heightSegments = tmpConf.heightSegments;
        this.side = tmpConf.side;
    }

    init(engine) {
        super.init(engine);
        const geo = new THREE.PlaneGeometry(
            this.width,
            this.height,
            this.widthSegments,
            this.heightSegments
        );

        const mat = new THREE.MeshBasicMaterial({
            'color': this.color,
            'side': this.side,
            'transparent': true,
        })

        this.ele = new THREE.Mesh(geo, mat);
        engine.__scene__.add(this.ele);
    }

    update(engine) {
        super.update(engine);

        this.ele.position.set(
            this.position[0],
            this.position[1],
            this.position[2]
        );

        this.ele.rotation.set(
            this.rotation[0],
            this.rotation[1],
            this.rotation[2],
        );

        this.ele.scale.set(
            this.scale[0],
            this.scale[1],
            this.scale[2]
        );

        this.ele.material.color.setHex(this.color);
        this.ele.material.opacity = this.transparency;
    }

    onDelete(engine) {
        super.onDelete(engine);
        engine.__scene__.remove(this.ele);
    }
}

class CircleElement extends BaseElement {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'color': 0x66CCFF,
            'r': 10,
            'segments': 50,
            'thetaStart': 0,
            'thetaLength': Math.PI * 2,
            'side': THREE.DoubleSide
        })

        this.color = tmpConf.color;
        this.r = tmpConf.r;
        this.segments = tmpConf.segments;
        this.thetaStart = tmpConf.thetaStart;
        this.thetaLength = tmpConf.thetaLength;
        this.side = tmpConf.side;
    }

    init(engine) {
        super.init(engine);
        const geo = new THREE.CircleGeometry(
            this.r,
            this.segments,
            this.thetaStart,
            this.thetaLength
        );

        const mat = new THREE.MeshBasicMaterial({
            'color': this.color,
            'side': this.side,
            'transparent': true,
        })

        this.ele = new THREE.Mesh(geo, mat);
        engine.__scene__.add(this.ele);
    }

    update(engine) {
        super.update(engine);

        this.ele.position.set(
            this.position[0],
            this.position[1],
            this.position[2]
        );

        this.ele.rotation.set(
            this.rotation[0],
            this.rotation[1],
            this.rotation[2],
        );

        this.ele.scale.set(
            this.scale[0],
            this.scale[1],
            this.scale[2]
        );

        this.ele.material.color.setHex(this.color);
        this.ele.material.opacity = this.transparency;
    }

    onDelete(engine) {
        super.onDelete(engine);
        engine.__scene__.remove(this.ele);
    }
}

class CustomAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);
        let tmpConf = __mergeDefault__(attr, {
            'init': ( engine ) => {},
            'update': ( engine ) => {},
            'onDelete': ( engine ) => {},
            'hasEnd': ( engine ) => { return false; }
        })
        this.init_ = tmpConf.init;
        this.update_ = tmpConf.update;
        this.onDelete_ = tmpConf.onDelete;
        this.hasEnd = tmpConf.hasEnd;
    }

    init(engine) {
        super.init(engine);
        this.init_(engine);
    }

    update(engine) {
        super.update(engine);
        this.update_(engine);
    }

    onDelete(engine) {
        super.onDelete(engine);
        this.onDelete_(engine);
    }
}

class DoNothingAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'duration': 1000
        });

        this.duration = tmpConf.duration;
    }


    init(engine) {
        super.init(engine);
        this.startTime = new Date().getTime();
    }

    hasEnd(engine) {
        return new Date().getTime() > this.startTime + this.duration;
    }
}

class MoveAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'from': 'current',
            'to': [10, 10, 0],
            'relative': true,
            'duration': 1000,
            'curve': TWEEN.Easing.Sinusoidal.InOut
        });

        this.from = tmpConf.from;
        this.to = tmpConf.to;
        this.relative = tmpConf.relative;
        this.duration = tmpConf.duration;
        this.curve = tmpConf.curve;
    }

    init(engine) {
        super.init(engine);
        const that = this;

        if (this.from === 'current') {
            this.from = this.ref.position;
        }
        if (this.relative) {
            this.to = this.to.map((v, i) => { return v + this.from[i]; });
        }

        this.tween = new TWEEN.Tween({
            'x': this.from[0],
            'y': this.from[1],
            'z': this.from[2]
        }).to({
            'x': this.to[0],
            'y': this.to[1],
            'z': this.to[2]
        }, this.duration).onUpdate(function () {
            that.ref.position[0] = this.x;
            that.ref.position[1] = this.y;
            that.ref.position[2] = this.z;
        }).easing(
            this.curve
        ).start();

        this.startTime = new Date().getTime();
    }

    update(engine) {
        super.update(engine);
        TWEEN.update();
    }

    hasEnd(engine) {
        return new Date().getTime() > this.startTime + this.duration;
    }
}

class RotationAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'from': 'current',
            'to': [0, 0, Math.PI / 2],
            'relative': true,
            'duration': 1000,
            'curve': TWEEN.Easing.Sinusoidal.InOut
        });

        this.from = tmpConf.from;
        this.to = tmpConf.to;
        this.relative = tmpConf.relative;
        this.duration = tmpConf.duration;
        this.curve = tmpConf.curve;
    }

    init(engine) {
        super.init(engine);
        const that = this;

        if (this.from === 'current') {
            this.from = this.ref.rotation;
        }
        if (this.relative) {
            this.to = this.to.map((v, i) => { return v + this.from[i]; });
        }
        this.tween = new TWEEN.Tween({
            'x': this.from[0],
            'y': this.from[1],
            'z': this.from[2]
        }).to({
            'x': this.to[0],
            'y': this.to[1],
            'z': this.to[2]
        }, this.duration).onUpdate(function () {
            that.ref.rotation[0] = this.x;
            that.ref.rotation[1] = this.y;
            that.ref.rotation[2] = this.z;
        }).easing(
            this.curve
        ).start();

        this.startTime = new Date().getTime();
    }

    update(engine) {
        super.update(engine);
        TWEEN.update();
    }

    hasEnd(engine) {
        return new Date().getTime() > this.startTime + this.duration;
    }
}

class ScaleAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'from': 'current',
            'to': 2.0,
            'duration': 1000,
            'curve': TWEEN.Easing.Sinusoidal.InOut
        });

        this.from = tmpConf.from;
        this.to = tmpConf.to;
        this.duration = tmpConf.duration;
        this.curve = tmpConf.curve;
    }

    init(engine) {
        super.init(engine);
        const that = this;

        if (this.from === 'current') {
            this.from = this.ref.scale;
        }

        this.tween = new TWEEN.Tween({
            'x': this.from[0],
            'y': this.from[1],
            'z': this.from[2]
        }).to({
            'x': this.to[0],
            'y': this.to[1],
            'z': this.to[2]
        }, this.duration).onUpdate(function () {
            that.ref.scale[0] = this.x;
            that.ref.scale[1] = this.y;
            that.ref.scale[2] = this.z;
        }).easing(
            this.curve
        ).start();

        this.startTime = new Date().getTime();
    }

    update(engine) {
        super.update(engine);
        TWEEN.update();
    }

    hasEnd(engine) {
        return new Date().getTime() > this.startTime + this.duration;
    }
}

class TransparencyAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'from': 'current',
            'to': 0.5,
            'duration': 1000,
            'curve': TWEEN.Easing.Sinusoidal.InOut
        });

        this.from = tmpConf.from;
        this.to = tmpConf.to;
        this.duration = tmpConf.duration;
        this.curve = tmpConf.curve;
    }

    init(engine) {
        super.init(engine);
        const that = this;

        if (this.from === 'current') {
            this.from = this.ref.transparency;
        }
        this.tween = new TWEEN.Tween({
            'transparency': this.from
        }).to({
            'transparency': this.to
        }, this.duration).onUpdate(function () {
            that.ref.transparency = this.transparency;
        }).easing(
            this.curve
        ).start();

        this.startTime = new Date().getTime();
    }

    update(engine) {
        super.update(engine);
        TWEEN.update();
    }

    hasEnd(engine) {
        return new Date().getTime() > this.startTime + this.duration;
    }
}

class ChangeColorAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'from': 'current',
            'to': 0x0,
            'duration': 1000,
            'curve': TWEEN.Easing.Sinusoidal.InOut
        });

        this.from = tmpConf.from;
        this.to = tmpConf.to;
        this.duration = tmpConf.duration;
        this.curve = tmpConf.curve;
    }

    init(engine) {
        super.init(engine);
        const that = this;

        if (this.from === 'current') {
            this.from = this.ref.color;
            if (this.from === undefined) {
                throw "Element do not have Attribute Color. "
            }
        }
        this.tween = new TWEEN.Tween({
            'r': (this.from & 0xff0000) >> 16,
            'g': (this.from & 0xff00) >> 8,
            'b': this.from & 0xff
        }).to({
            'r': (this.to & 0xff0000) >> 16,
            'g': (this.to & 0xff00) >> 8,
            'b': this.to & 0xff
        }, this.duration).onUpdate(function () {
            that.ref.color = (this.r << 16) | (this.g << 8) | (this.b);
        }).easing(
            this.curve
        ).start();

        this.startTime = new Date().getTime();
    }

    update(engine) {
        super.update(engine);
        TWEEN.update();
    }

    hasEnd(engine) {
        return new Date().getTime() > this.startTime + this.duration;
    }
}

class GroupAnimation extends BasicAnimation {
    constructor(attr = {}) {
        super(attr);

        const tmpConf = __mergeDefault__(attr, {
            'animations': [],
            'endBy': 'all'    // 'any'
        });

        this.animations = tmpConf.animations;
        this.endBy = tmpConf.endBy;
    }

    setRef(ref) {
        super.setRef(ref);
        for (const i in this.animations) {
            this.animations[i].setRef(ref);
        }
    }

    setSegment(seg) {
        super.setSegment(seg);
        for (const i in this.animations) {
            this.animations[i].setSegment(seg);
        }
    }

    init(engine) {
        super.init(engine);
        for (const i in this.animations) {
            this.animations[i].init(engine);
        }
    }

    update(engine) {
        super.update(engine);
        for (const i in this.animations) {
            if (!this.animations[i].hasEnd(engine)) {
                this.animations[i].update(engine);
            }
        }
    }

    onDelete(engine) {
        super.onDelete(engine);
        for (const i in this.animations) {
            this.animations[i].onDelete(engine);
        }
    }

    hasEnd(engine) {
        if (this.endBy === 'any') {
            for (const i in this.animations) {
                if (this.animations[i].hasEnd(engine)) {
                    return true;
                }
            }
            return false;
        }
        else if (this.endBy === 'all') {
            for (const i in this.animations) {
                if (!this.animations[i].hasEnd(engine)) {
                    return false;
                }
            }
            return true;
        } else {
            throw "group animation mode error. "
        }
    }
}
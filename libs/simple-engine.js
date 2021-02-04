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
        let tmpConf = __mergeDefault__(attr, {
            'id': BaseElement.MAX_ID++,
            'name': 'untitled',
            'position': [0, 0, 0],
            'rotation': [0, 0, 0],
            'scale': 1.0,
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

class Animation {
    static MAX_ID = 0;

    constructor(attr = {}) {
        const tempConf = __mergeDefault__(attr, {
            'id': Animation.MAX_ID++,
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

class CustomAnimation extends Animation {
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

class BaseSegment {
    static MAX_ID = 0;

    constructor(attr = {}) {
        const tempConf = __mergeDefault__(attr, {
            'id': BaseSegment.MAX_ID++,
            'ref': new BaseElement(),
            'animations': [ new Animation() ],
            'nowAniIndex': 0,
            'hasStarted': ( engine ) => { return true },
            'hasEnd': ( engine ) => { return this.isEnd; }
        })

        this.id = tempConf.id;
        this.ref = tempConf.ref;
        this.animations = tempConf.animations;
        this.nowAniIndex = tempConf.nowAniIndex;
        this.isEnd = false;
        this.isRegistered = false;
        this.hasEnd = tempConf.hasEnd;
        this.hasStarted = tempConf.hasStarted;

        for (const i in this.animations) {
            this.animations[i].setRef(this.ref);
            this.animations[i].setSegment(this);
        }
    }

    init(engine) {
        this.engine = engine;
    }
    update(engine) {
        if (this.nowAniIndex === this.animations.length) {
            this.isEnd = true;
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
        if (ani instanceof Animation) {
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
            this.isEnd = true;
            return null;
        }
        if (this.animations[this.nowAniIndex].hasEnd(this.engine)) {
            ++this.nowAniIndex;
        }
        if (this.nowAniIndex === this.animations.length) {
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
        if (ani instanceof Animation) {
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
        for (const id in this.activeElements) {
            this.activeElements[id].data.update(this);
        }
        for (const id in this.activeAnimations) {
            this.activeAnimations[id].data.update(this);
        }
        for (const id in this.activeSegments) {
            this.activeSegments[id].data.update(this);
        }

        // next frame
        requestAnimationFrame(() => { this.run(); });
        this.__renderer__.render(this.__scene__, this.__camera__);
    }
}
class Scene1 extends TimeLineEngine {
    constructor(attr = {}) {
        super(attr);

        this.r = 100;
        this.rad = 0;
    }

    setup() {
        const that = this;

        this.addSegment(new BaseSegment({'ref': new AxesHelperElement({
            'axesSize': 100
        })}));

        this.addSegment(new BaseSegment({
            'ref': new CircleElement({
                'thetaLength': Math.PI / 2,
                'thetaStart': Math.PI / 4
            }),
            'animations': [
                new TransparencyAnimation({
                    'from': 0,
                    'to': 1
                }),
                new ChangeColorAnimation({
                    'to': 0xff7799
                }),
                new DoNothingAnimation(),
                // new testAnimation(),
                new MoveAnimation({
                    'to': [30, 30, 0]
                }),
                new RotationAnimation({
                    'to': [0, 0, Math.PI * 2]
                }),
                new MoveAnimation({
                    'to': [-20, -20, 0]
                }),
                new GroupAnimation({
                    'animations': [
                        new MoveAnimation({
                            'to': [-10, -10, 0],
                            'relative': false
                        }),
                        new RotationAnimation({
                            'to': [0, 0, -Math.PI / 2]
                        }),
                        new ChangeColorAnimation({
                            'to': 0x66ccff,
                            'duration': 5000
                        })
                    ]
                }),
                new RotationAnimation({
                    'to': [0, 0, Math.PI / 4]
                }),
                new RotationAnimation({
                    'to': [0, 0, Math.PI / 4]
                }),
                new RotationAnimation({
                    'to': [0, 0, Math.PI * 4],
                    'relative': false
                }),
                new ScaleAnimation({
                    'to': [3.0, 5.0, 3.0]
                }),
                new TransparencyAnimation({
                    'to': 0.5
                }),
                new BasicAnimation()
            ]
        }));

        this.addSegment(new BaseSegment({
            'animations': [ new CustomAnimation({
                'init': function ( engine ) {
                    console.log("camera init")
                    this.__camera__ = that.__camera__;
                    this.rad = 0;
                    this.r = 50;
                },
                'update': function ( engine ) {
                    this.__camera__.position.set(
                        this.r * Math.cos(this.rad),
                        this.r * Math.sin(this.rad),
                        100
                    );
                    this.__camera__.lookAt(that.__scene__.position);
                    this.rad += 0.005;
                },
                'hasEnd': function ( engine ) {
                    return engine.nowTime > 12000;
                }
            })],
        }));

        this.addSegment(new BaseSegment({
            'ref': new LatexElement({
                'content': '123',
                'rotation': [Math.PI, 0, 0]
            }), 
            'animations': [
                new GroupAnimation({
                    'animations': [
                        new ChangeColorAnimation({
                            'to': 0x66ccff
                        }),
                        new MoveAnimation({
                            'to': [10, 10, 0]
                        }),
                        new ScaleAnimation({
                            'to': [2, 2, 2]
                        })
                    ]
                }),
                new BasicAnimation()
            ]
        }))
    }
}

scene1 = new Scene1();
window.onload = () => {
    scene1.run();
}
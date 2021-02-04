class Scene1 extends TimeLineEngine {
    constructor() {
        super();

        this.r = 100;
        this.rad = 0;
    }

    setup() {
        const that = this;
        this.addSegment(new BaseSegment({
           'ref': new CustomElement({
               'init': ( engine ) => {
                   console.log("axes init")
                   this.axes = new THREE.AxisHelper(20);
                   engine.__scene__.add(this.axes);
               },
               'onDelete': ( engine ) => {
                   engine.__scene__.remove(this.axes);
               }
           }),
            'animations': [ new CustomAnimation({
                'hasEnd': ( engine ) => { return engine.nowTime > 9000; }
            }) ],
            'hasEnd': ( engine ) => {
               return engine.nowTime > 10000;
            }
        }));

        // this.addSegment()

        this.addSegment(new BaseSegment({
            'animations': [ new CustomAnimation({
                'init': ( engine ) => {
                    console.log("camera init")
                    this.__camera__ = that.__camera__;
                    this.rad = 0;
                    this.r = 50;
                },
                'update': ( engine ) => {
                    this.__camera__.position.set(
                        this.r * Math.cos(this.rad),
                        this.r * Math.sin(this.rad),
                        50
                    );
                    this.__camera__.lookAt(this.__scene__.position);
                    this.rad += 0.01;
                },
                'hasEnd': ( engine ) => {
                    return engine.nowTime > 4000;
                }
            }), new CustomAnimation({
                'update': ( engine ) => {
                    this.__camera__.position.set(
                        this.r * Math.cos(this.rad),
                        this.r * Math.sin(this.rad),
                        50
                    );
                    this.__camera__.lookAt(this.__scene__.position);
                    this.rad -= 0.01;
                },
                'hasEnd': ( engine ) => {
                    return engine.nowTime > 8000;
                }
            }) ],
        }));
    }
}

scene1 = new Scene1();
window.onload = () => {
    scene1.run();
}
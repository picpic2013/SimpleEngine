class PrimeNumberScreen extends TimeLineEngine {
    constructor(attr = {}) {
        super(attr);

        this.r = 100;
        this.rad = 0;
    }

    setup() {
        const that = this;
        // this.addSegment(new BaseSegment({'ref': new AxesHelperElement({
        //     'axesSize': 100
        // })}));

        // this.addSegment(new BaseSegment({
        //     'ref': new SquareElement(),
        //     'animations': [
        //         new MoveAnimation({
        //             'to': [10, 10, 0]
        //         }),
        //         new BasicAnimation()
        //     ]
        // }))

        // this.addSegment(new BaseSegment({
        //     'ref': new LatexElement({
        //         'content': '1',
        //         'position': [-1.2, -1.8, 0.1]
        //     })
        // }))

        // this.addSegment(new BaseSegment({
        //     'ref': new LatexElement({
        //         'content': '10',
        //         'position': [-2.4, -1.8, 0.1]
        //     })
        // }))

        // this.addSegment(new BaseSegment({
        //     'ref': new LatexElement({
        //         'content': '100',
        //         'position': [-3.8, -1.8, 0.1]
        //     })
        // }))

        let mapPosition = ( c, x, y, z ) => {
            if (c.length === 1) {
                return [x - 1.2, y - 1.8, 0.1];
            }
            if (c.length === 2) {
                return [x - 2.4, y - 1.8, 0.1];
            }
            if (c.length === 3) {
                return [x - 3.8, y - 1.8, 0.1];
            }
        }

        let isPrime = ( n ) => {
            for (let i = 2; i < n; ++i) {
                if (n % i === 0) {
                    return false;
                }
            }
            return true;
        }

        let getSquareColor = ( n ) => {
            if (isPrime(n)) {
                return 0xff66cc;
            } else {
                return 0x66ccff;
            }
        }

        let getTextColor = ( n ) => {
            if (isPrime(n)) {
                return 0xffff00;
            } else {
                return 0x000000;
            }
        }

        for (let i = 0; i < 10; ++i) {
            for (let j = 0; j < 10; j++) {

                if (((10 - i - 1) * 10 + j + 2) >= 100) {
                    continue;
                }

                this.addSegment(new BaseSegment({
                    'ref': new SquareElement({
                        'position': [j * 10 - 50, i * 10 - 50, 0],
                        'color': getSquareColor(((10 - i - 1) * 10 + j + 2))
                    }),
                    'animations': [
                        new GroupAnimation({
                            'animations': [
                                new TransparencyAnimation({
                                    'from': 0,
                                    'to': 1
                                }),
                                new ScaleAnimation({
                                    'from': [0.3, 0.3, 0.3],
                                    'to': [1, 1, 1]
                                })
                            ]
                        }),
                        new BasicAnimation()
                    ],
                    'hasStarted': ( engine ) => {
                        return engine.nowTime > ((10 - i - 1) * 10 + j) * 20;
                    }
                }))

                this.addSegment(new BaseSegment({
                    'ref': new LatexElement({
                        'content': '' + ((10 - i - 1) * 10 + j + 2),
                        'position': mapPosition(
                            '' + ((10 - i - 1) * 10 + j),
                            j * 10 - 50,
                            i * 10 - 50,
                            0
                        ),
                        'color': getTextColor(((10 - i - 1) * 10 + j + 2))
                    }),
                    'animations': [
                        new GroupAnimation({
                            'animations': [
                                new TransparencyAnimation({
                                    'from': 0,
                                    'to': 1
                                }),
                                new ScaleAnimation({
                                    'from': [0.3, 0.3, 0.3],
                                    'to': [1, 1, 1]
                                })
                            ]
                        }),
                        new BasicAnimation()
                    ],
                    'hasStarted': ( engine ) => {
                        return engine.nowTime > ((10 - i - 1) * 10 + j) * 20;
                    }
                }))
            }
        }

        // this.addSegment(new BaseSegment({
        //     'animations': [ new CustomAnimation({
        //         'init': function ( engine ) {
        //             console.log("camera init")
        //             this.__camera__ = that.__camera__;
        //             this.rad = 0;
        //             this.r = 50;
        //         },
        //         'update': function ( engine ) {
        //             this.__camera__.position.set(
        //                 this.r * Math.cos(this.rad) + 50,
        //                 this.r * Math.sin(this.rad),
        //                 150
        //             );
        //             this.__camera__.lookAt(that.__scene__.position);
        //             this.rad += 0.005;
        //         },
        //         'hasEnd': function ( engine ) {
        //             return engine.nowTime > 12000;
        //         }
        //     })],
        // }));
    }
}

primeNumberScreen = new PrimeNumberScreen({
    'cameraInitPosition': [0, 0, 150],
});
window.onload = () => {
    primeNumberScreen.run();
}
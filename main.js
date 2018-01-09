//=============================================================================
//   定数
//=============================================================================
FPS         = 60
SCREEN_W    = 800
SCREEN_H    = 450


//=============================================================================
//   グローバル変数
//=============================================================================
var $canon;
var $spiders = [];
var $mouseX = null;
var $canonAngle = 0;
var $gameScene;

class Counter {
    constructor(frame) {
        this.initFrame = frame;
        this.frame = frame;
    }

    count() {
        this.frame -= 1;
    }

    reset() {
        this.frame = this.initFrame;
    }

    isFinished() {
        return this.frame <= 0;
    }
}

class Spider {
    constructor() {
        this.frame = 0;

        var sprite = new PIXI.Sprite(PIXI.loader.resources["img/spider.png"].texture);
        sprite.width = 40;
        sprite.height = 40;
        sprite.x = (Math.random() * SCREEN_W);
        sprite.y = (Math.random() * SCREEN_H);
        this.sprite = sprite;

        this.changeSpeed();
    }

    changeSpeed() {
        this.changeSpeedCounter = new Counter(randomInt(msToFrame(1000), msToFrame(2000)));
        var v = Math.random() * 4;
        var r = Math.random() * 2 * Math.PI;
        this.sprite.vx = v * Math.cos(r);
        this.sprite.vy = v * Math.sin(r);
    }

    action() {
        this.sprite.x += this.sprite.vx;
        this.sprite.y += this.sprite.vy;
        if (this.sprite.x < 0) this.sprite.x = SCREEN_W;
        if (this.sprite.x > SCREEN_W) this.sprite.x = 0;
        if (this.sprite.y < 0) this.sprite.y = SCREEN_W;
        if (this.sprite.y > SCREEN_W) this.sprite.y = 0;

        this.changeSpeedCounter.count();
        if (this.changeSpeedCounter.isFinished()) {
            console.log("Change!");
            this.changeSpeed();
        }
    }
}

function setup() {
    // add canon
    let canonSprite = new PIXI.Sprite(PIXI.loader.resources["img/canon.png"].texture);
    canonSprite.width = 70;
    canonSprite.height = 70;
    canonSprite.x = (SCREEN_W / 2) - 17;
    canonSprite.y = SCREEN_H - 35;
    canonSprite.rotation = 0.5;
    canonSprite.anchor.x = 0.5;
    canonSprite.anchor.y = 0.5;
    app.stage.addChild(canonSprite);
    $canon = canonSprite;

    // add text
    let style = new PIXI.TextStyle({
                              fontFamily: "Arial",
                              fontSize: 36,
                              fill: "white",
                              stroke: '#ff3300',
                              strokeThickness: 4,
                              dropShadow: true,
                              dropShadowColor: "#000000",
                              dropShadowBlur: 4,
                              dropShadowAngle: Math.PI / 6,
                              dropShadowDistance: 6,
    });
    let message = new PIXI.Text("Hello Pixi!", style);
    app.stage.addChild(message);

    $spiderSpawnCounter = new Counter(msToFrame(1000));

    app.ticker.add(delta => gameLoop(delta));

    window.addEventListener("mousemove", onMouseMove, false);
}

function gameLoop(delta) {
    $spiderSpawnCounter.count();
    if ($spiderSpawnCounter.isFinished()) {
        var spider = new Spider();
        app.stage.addChild(spider.sprite);
        $spiders.push(spider);

        $spiderSpawnCounter.reset();
    }
    $spiders.forEach(function(s) {
        s.action();
    });
}

function onMouseMove(e) {
    var x = e.clientX;
    if ($mouseX == null) {
        $mouseX = x;
        return;
    }
    var dx = x - $mouseX;
    $canonAngle += (dx / 5);
    $canonAngle = clamp(-90, $canonAngle, 90);
    $canon.rotation = 2 * Math.PI * ($canonAngle / 360);

    $mouseX = x;
}


//=============================================================================
//   ユーティリティ関数
//=============================================================================
function clamp(min, val, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

function msToFrame(ms) {
    return FPS * ms / 1000;
}

function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}


//=============================================================================
//   main
//=============================================================================
let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas";
}
PIXI.utils.sayHello(type);

let app = new PIXI.Application({width: SCREEN_W, height: SCREEN_H});
app.renderer.backgroundColor = 0xffffff;
document.body.appendChild(app.view);

PIXI.loader
    .add("img/canon.png")
    .add("img/spider.png")
    .load(setup);

//=============================================================================
//   定数
//=============================================================================
const FPS         = 60;        // 基本的にPixiJSでは60FPS固定らしい
const SCREEN_W    = 800;
const SCREEN_H    = 450;

const IMG_BULLET = "img/bullet.png";
const IMG_CANON  = "img/canon.png";
const IMG_CRASH  = "img/crash2.png";
const IMG_SPIDER = "img/spider.png";


//=============================================================================
//   グローバル変数
//=============================================================================
var $app;               // PIXI.Application
var $gameScene;         // PIXI.Container
var $mouseX = -1;

var $canon;
var $spiders = [];
var $spiderSpawnCounter;


//=============================================================================
//   ユーティリティ
//=============================================================================
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
//   システム
//=============================================================================
function main() {
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
        type = "canvas";
    }
    PIXI.utils.sayHello(type);

    $app = new PIXI.Application({width: SCREEN_W, height: SCREEN_H});
    $app.renderer.backgroundColor = 0xffffff;
    document.body.appendChild($app.view);

    PIXI.loader
        .add(IMG_BULLET)
        .add(IMG_CANON)
        .add(IMG_CRASH)
        .add(IMG_SPIDER)
        .load(setup);
}

function setup() {
    $gameScene = new PIXI.Container();
    $app.stage.addChild($gameScene);

    // add canon
    $canon = new Canon();
    $gameScene.addChild($canon.sprite);

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
    $app.stage.addChild(message);

    $spiderSpawnCounter = new Counter(msToFrame(1000));

    $app.ticker.add(delta => gameLoop(delta));

    window.addEventListener("mousemove", onMouseMove, false);
}

function gameLoop(delta) {
    $spiderSpawnCounter.count();
    if ($spiderSpawnCounter.isFinished()) {
        // add spider
        var spider = new Spider();
        $app.stage.addChild(spider.sprite);
        $spiders.push(spider);

        $spiderSpawnCounter.reset();
    }
    $spiders.forEach(function(s) {
        s.action();
    });
}

function onMouseMove(e) {
    var x = e.clientX;
    if ($mouseX == -1) {
        $mouseX = x;
        return;
    }
    var dx = x - $mouseX;
    $canon.rotateByDx(dx);

    $mouseX = x;
}

//=============================================================================
//   ゲームオブジェクト
//=============================================================================
class Canon {
    constructor() {
        let canonSprite = new PIXI.Sprite(PIXI.loader.resources[IMG_CANON].texture);
        canonSprite.width = 70;
        canonSprite.height = 70;
        canonSprite.x = (SCREEN_W / 2) - 17;
        canonSprite.y = SCREEN_H - 35;
        canonSprite.rotation = 0.5;
        canonSprite.anchor.x = 0.5;
        canonSprite.anchor.y = 0.5;
        this.sprite = canonSprite;

        this.angle = 0;
        this.rotateByDx(0);
    }

    rotateByDx(dx) {
        this.angle += (dx / 5);
        this.angle = clamp(-90, this.angle, 90);
        this.sprite.rotation = 2 * Math.PI * (this.angle / 360);
    }

}

class Spider {
    constructor() {
        this.frame = 0;

        var sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_SPIDER].texture);
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
        if (this.sprite.x < 0)          this.sprite.x = SCREEN_W;
        if (this.sprite.x > SCREEN_W)   this.sprite.x = 0;
        if (this.sprite.y < 0)          this.sprite.y = SCREEN_H;
        if (this.sprite.y > SCREEN_W)   this.sprite.y = 0;

        this.changeSpeedCounter.count();
        if (this.changeSpeedCounter.isFinished()) {
            this.changeSpeed();
        }
    }
}


//=============================================================================
//   main
//=============================================================================
main();

"use strict";

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
var $bullets = [];


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

function deg2rad(deg) {
  return deg / 180.0 * Math.PI;
}

function distance(p1, p2) {
  var dx = p1[0] - p2[0];
  var dy = p1[1] - p2[1];
  var dist = Math.sqrt(dx * dx + dy * dy);
  return dist;
}

function hitTestRectangle(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (x1 < x2 + w2 &&
            x2 < x1 + w1 &&
            y1 < y2 + h2 &&
            y2 < y1 + h1 );
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
    $gameScene.addChild(message);

    $spiderSpawnCounter = new Counter(msToFrame(2000));

    $app.ticker.add(delta => gameLoop(delta));

    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("click", onClick, false);
}

function gameLoop(delta) {
    $spiderSpawnCounter.count();
    if ($spiderSpawnCounter.isFinished()) {
        // add spider
        var spider = new Spider();
        $gameScene.addChild(spider.sprite);
        $spiders.push(spider);

        $spiderSpawnCounter.reset();
    }

    $spiders = doAction($spiders);
    $bullets = doAction($bullets);
}

function doAction(objects) {
    objects.forEach(function(x) {
        x.action();
        if (!x.isAlive())
            $gameScene.removeChild(x.sprite);
    });
    return objects.filter(function(x) { return x.isAlive(); });
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

function onClick() {
    console.log("click");
    var bullet = new Bullet();
    bullet.sprite.x = $canon.sprite.x;
    bullet.sprite.y = $canon.sprite.y;
    var v = 9;
    bullet.sprite.vx = v * -Math.cos(deg2rad($canon.angle + 90));
    bullet.sprite.vy = v * -Math.sin(deg2rad($canon.angle + 90));
    $gameScene.addChild(bullet.sprite);
    $bullets.push(bullet);
}

//=============================================================================
//   ゲームオブジェクト
//=============================================================================
class Canon {
    constructor() {
        let sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_CANON].texture);
        sprite.width = 70;
        sprite.height = 70;
        sprite.x = (SCREEN_W / 2);
        sprite.y = SCREEN_H - 30;
        // rotationは原点を回転の中心とするので、真ん中を原点としておく。
        // 統一のため、他の全オブジェクトも同様に真ん中を原点にする。
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        this.sprite = sprite;

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
        this.alive = true;

        var sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_SPIDER].texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
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

    isAlive() {
        return this.alive;
    }
}

class Bullet {
    constructor() {
        this.alive = true;

        var sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_BULLET].texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.width = 40;
        sprite.height = 40;
        this.sprite = sprite;

    }

    action() {
        this.sprite.x += this.sprite.vx;
        this.sprite.y += this.sprite.vy;
        if (this.sprite.x < 0 || this.sprite.x > SCREEN_W || this.sprite.y < 0 || this.sprite.SCREEN_H) {
            this.alive = false;
        }
    }

    isAlive() {
        return this.alive;
    }
}


//=============================================================================
//   main
//=============================================================================
main();

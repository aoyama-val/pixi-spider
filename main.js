// TODO
//
// 画像の定義をjsonにする
//
//
//  やっぱり配列へのpushはコンストラクタの中ではなく、呼び出し側でやる方がよかった
//
//  スタート、ゲーム、エンドは同一シーンで、変数でswitchする方がよかった（共通するデータが多いため）
//  いや、やっぱりシーンを分けて共通部分を関数などでくくりだすのがよさそう。

"use strict";

//=============================================================================
//   定数
//=============================================================================
const FPS         = 60;        // 基本的にPixiJSでは60FPS固定らしい
var SCREEN_W;
var SCREEN_H;
if (window.innerWidth <= 640 || window.innerHeight <= 400) {
    SCREEN_W    = window.innerWidth;
    SCREEN_H    = window.innerHeight;
        if (this.webkitRequestFullScreen) {
             this.webkitRequestFullScreen();
        }
        else if (this. mozRequestFullScreen) {
            this. mozRequestFullScreen();
        }
} else {
    SCREEN_W    = 640;
    SCREEN_H    = 400;
}

const IMG_BULLET = "img/bullet.png";
const IMG_CANON  = "img/canon.png";
const IMG_CRASH  = "img/crash2.png";
const IMG_SPIDER = "img/spider.png";


//=============================================================================
//   グローバル変数
//=============================================================================
var $app;               // PIXI.Application
var $sceneMgr;
var $mouseX = -1;
var $touchX = -1;

var $params = {
    bulletSpeed: 9.0,
    maxSpiders: 10,
    maxBullets: 3,
    spiderSpeedMax: 4.0,
    spiderSpawnInterval: 2000, // ms
    timeLimit: 60000,   // ms
};


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
        if (this.frame < 0)
            this.frame = 0;
    }

    reset(frame) {
        if (frame == null || frame == undefined)
            this.frame = this.initFrame;
        else
            this.frame = frame;
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

    $app = new PIXI.Application({width: SCREEN_W, height: SCREEN_H, backgroundColor: 0xffffff});
    document.body.appendChild($app.view);

    PIXI.loader
        .add(IMG_BULLET)
        .add(IMG_CANON)
        .add(IMG_CRASH)
        .add(IMG_SPIDER)
        .load(setup);
}

function setup() {
    $sceneMgr = new SceneManager($app)

    $sceneMgr.changeScene(new StartScene());

    $app.ticker.add(delta => gameLoop(delta));

    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("click", onClick, false);
    window.addEventListener("touchstart", onTouchStart, false);
    window.addEventListener("touchmove", onTouchMove, false);
    window.addEventListener("touchend", onTouchEnd, false);
}

function gameLoop(delta) {
    var scene = $sceneMgr.getTop();
    if (scene) {
        scene.update();
    }
}

function doUpdate(objects) {
    objects.forEach(function(x) {
        x.update();
    });
    return objects.filter(function(x) { return x.isAlive(); });
}

function onMouseMove(e) {
    var scene = $sceneMgr.getTop();
    if (scene) {
        scene.onMouseMove(e);
    }
}

function onClick() {
    var scene = $sceneMgr.getTop();
    if (scene) {
        scene.onClick();
    }
}

function onTouchStart(e) {
    e.preventDefault();
    $touchX = e.touches[0].pageX;
}

function onTouchMove(e) {
    var moveX = e.changedTouches[0].pageX - $touchX;
    var moveRate = moveX / SCREEN_W;
    var scene = $sceneMgr.getTop();
    if (scene) {
        scene.onTouchMove(moveRate);
    }
}

function onTouchEnd(e) {
    e.preventDefault();
    if (e.touches.length < 1 || Math.abs(e.touches[0].pageX - $touchX) < 2) {
        onClick();
    } else {
        alert(Math.abs(e.touches[0].pageX - $touchX));
    }
    $touchX = -1;
}

function createText(text, x, y, size, color) {
    var text = new PIXI.Text(text, {
        fontFamily: "Arial",
        fontSize: size,
        fill: "white",
        stroke: color,
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    return text;
}

//=============================================================================
//   シーン
//=============================================================================
class SceneManager {
    constructor() {
        this.scenes = []
    }

    changeScene(scene) {
        this.scenes.forEach(function(s) {
            $app.stage.removeChild(s.container);
        });
        this.scenes = [scene]
        $app.stage.addChild(scene.container);
    }

    pushScene(scene) {
        this.scenes.push(scene)
        $app.stage.addChild(scene.container);
    }

    popScene(scene) {
        this.scenes.pop();
    }

    getTop() {
        return this.scenes[this.scenes.length - 1];
    }
}

class IScene {
    constructor() {
        this.container = new PIXI.Container();
    }

    update() {
    }

    onClick() {
    }

    onMouseMove(e) {
    }

    onTouchMove(e) {
    }
}

class StartScene extends IScene {
    constructor() {
        super();

        var text = createText("Click to start", SCREEN_W / 2, SCREEN_H / 2, 40, "#ff3300");
        this.container.addChild(text);

        this.spiders = [];
        this.effects = [];

        var timer = new Timer(this);
        var score = new Score(this);
        var canon = new Canon(this);

        for (var i = 0; i < randomInt(4, 6); i++) {
            this.spiders.push(new Spider(this));
        }
    }

    onClick() {
        $sceneMgr.changeScene(new GameScene());
    }

    update() {
        this.spiders.forEach(function(x) {
            x.update();
        });
    }
}

class GameScene extends IScene {
    constructor() {
        super();

        this.spiders = [];
        this.bullets = [];
        this.effects = [];

        this.timer = new Timer(this);
        this.score = new Score(this);
        this.canon = new Canon(this);
        this.spiderSpawnCounter = new Counter(msToFrame($params.spiderSpawnInterval));
    }

    update() {
        var that = this;
        this.spiderSpawnCounter.count();
        if (this.spiderSpawnCounter.isFinished()) {
            if (this.spiders.length < $params.maxSpiders) {
                var spider = new Spider(this);
            }

            this.spiderSpawnCounter.reset();
        }

        that.bullets.forEach(function(b) {
            that.spiders.forEach(function(s) {
                if (hitTestRectangle(
                                    b.sprite.x - b.sprite.width / 2, 
                                    b.sprite.y - b.sprite.height / 2, 
                                    b.sprite.width,
                                    b.sprite.height,
                                    s.sprite.x - s.sprite.width / 2, 
                                    s.sprite.y - s.sprite.height / 2, 
                                    s.sprite.width,
                                    s.sprite.height)) {
                    var img = new Effect(that, IMG_CRASH, s.sprite.x, s.sprite.y, 40, 40, msToFrame(700));
                    that.effects.push(img);
                    s.die();
                    that.score.score += 100 * Math.sqrt(s.speed);
                }
            });
        });

        this.spiders = doUpdate(this.spiders);
        this.bullets = doUpdate(this.bullets);
        this.effects = doUpdate(this.effects);

        this.score.update();
        this.timer.update();
    }

    onClick() {
        if (this.bullets.length < $params.maxBullets) {
            var bullet = new Bullet(this, this.canon.sprite.x, this.canon.sprite.y, this.canon.angle);
        }
    }

    onMouseMove(e) {
        var x = e.clientX;
        if ($mouseX == -1) {
            $mouseX = x;
            return;
        }
        var dx = x - $mouseX;
        this.canon.rotateByDx(dx);

        $mouseX = x;
    }

    onTouchMove(moveRate) {
        this.canon.rotateByDx(moveRate * 120);
    }
}

class GameOverScene extends IScene {
    constructor() {
        super();

        var gameOverText = createText("GAME OVER", SCREEN_W / 2, SCREEN_H / 2, 40, "#ff3300");
        this.container.addChild(gameOverText);

        this.canRetryCounter = new Counter(msToFrame(1500));
        this.canRetry = false;
    }

    onClick() {
        if (this.canRetry) {
            $sceneMgr.changeScene(new GameScene());
        }
    }

    update() {
        if (this.canRetryCounter) {
            this.canRetryCounter.count();
            if (this.canRetryCounter.isFinished()) {
                this.canRetry = true;
                this.canRetryCounter = null;

                var sprite = createText("Click to retry", SCREEN_W - 150, SCREEN_H - 30, 20, "#ff3300");
                this.container.addChild(sprite);
            }
        }
    }
}


//=============================================================================
//   ゲームオブジェクト
//=============================================================================
class IGameObject {
    constructor(scene) {
        this.scene = scene;
        this.alive = true;
        this.sprite = null;
    }

    update() {
        if (this.sprite && !this.isAlive()) {
            this.scene.container.removeChild(this.sprite);
        }
    }

    isAlive() {
        return this.alive;
    }

    die() {
        this.alive = false;
    }
}

class Canon {
    constructor(scene) {
        this.scene = scene;
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
        this.scene.container.addChild(this.sprite);
    }

    rotateByDx(dx) {
        this.angle += (dx / 5);
        this.angle = clamp(-90, this.angle, 90);
        this.sprite.rotation = 2 * Math.PI * (this.angle / 360);
    }
}

class Spider extends IGameObject {
    constructor(scene) {
        super(scene);

        var sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_SPIDER].texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.width = 40;
        sprite.height = 40;
        sprite.x = (Math.random() * SCREEN_W);
        sprite.y = (Math.random() * SCREEN_H);
        this.sprite = sprite;
        this.speed = 0;

        this.changeSpeed();

        this.scene.container.addChild(this.sprite);
        this.scene.spiders.push(this);
    }

    changeSpeed() {
        this.changeSpeedCounter = new Counter(randomInt(msToFrame(1000), msToFrame(2000)));
        var v = Math.random() * $params.spiderSpeedMax;
        var angle = Math.random() * 2 * Math.PI;
        this.speed = v;
        this.sprite.vx = v * Math.cos(angle);
        this.sprite.vy = v * Math.sin(angle);
    }

    update() {
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
        super.update();
    }
}

class Bullet extends IGameObject {
    constructor(scene, x, y, angle) {
        super(scene);
        var sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_BULLET].texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.width = 40;
        sprite.height = 40;
        sprite.x = x;
        sprite.y = y;
        var v = $params.bulletSpeed;
        sprite.vx = v * -Math.cos(deg2rad(angle + 90));
        sprite.vy = v * -Math.sin(deg2rad(angle + 90));
        this.sprite = sprite;

        scene.container.addChild(this.sprite);
        this.scene.bullets.push(this);
    }

    update() {
        this.sprite.x += this.sprite.vx;
        this.sprite.y += this.sprite.vy;
        if (this.sprite.x < 0 || this.sprite.x > SCREEN_W || this.sprite.y < 0 || this.sprite.SCREEN_H) {
            this.die();
        }
        this.sprite.rotation += 0.5;
        super.update();
    }
}

class Score extends IGameObject {
    constructor(scene) {
        super(scene);
        this.score = 0;
        this.displayingScore = 0;

        this.sprite = createText("Score  0", 0, 0, 20, "#ff3300");
        this.sprite.anchor.set(0);
        this.scene.container.addChild(this.sprite);
        this.scene.effects.push(this);
    }

    update() {
        if (this.displayingScore < this.score) {
            this.displayingScore += 2;
            this.sprite.text = "Score:  " + this.displayingScore;
        }
        super.update();
    }
}

class Timer extends IGameObject {
    constructor(scene) {
        super(scene);
        this.sprite = createText("Time  ", 200, 0, 20, "#0033ff");
        this.sprite.anchor.set(0);
        this.scene.container.addChild(this.sprite);
        this.counter = new Counter(msToFrame($params.timeLimit));
        this.scene.effects.push(this);
    }

    update() {
        this.counter.count();
        this.sprite.text = "Time  " + Math.ceil(this.counter.frame / FPS);
        if (this.counter.isFinished()) {
             $sceneMgr.pushScene(new GameOverScene());
        }
    }
}

class Effect extends IGameObject {
    constructor(scene, resource_key, x, y, w, h, frame) {
        super(scene);
        this.resource_key = resource_key;
        
        if (frame >= 0) {
            this.counter = new Counter(frame);
        }

        var sprite = new PIXI.Sprite(PIXI.loader.resources[this.resource_key].texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.width = w;
        sprite.height = h;
        sprite.x = x;
        sprite.y = y;
        this.sprite = sprite;

        this.scene.container.addChild(this.sprite);
    }

    update() {
        if (this.counter) {
            this.counter.count();
            if (this.counter.isFinished()) {
                this.die();
            }
        }
        super.update();
    }
}


//=============================================================================
//   main
//=============================================================================
main();

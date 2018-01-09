// TODO
// - 時間制限1分。リトライ可能にする
// - モバイル対応
//  - タップとスワイプ対応
//  - 解像度

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

var $timer;
var $score;
var $canon;
var $spiders = [];
var $spiderSpawnCounter;
var $bullets = [];
var $effects = [];

var $params = {
    bullet_speed: 9.0,
    max_spiders: 10,
    max_bullets: 3,
    spider_speed_max: 4.0,
    spider_spawn_counter: 2000, // ms
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
    $gameScene = new PIXI.Container();
    $app.stage.addChild($gameScene);

    // add canon
    $canon = new Canon($gameScene);
    $gameScene.addChild($canon.sprite);

    $spiderSpawnCounter = new Counter(msToFrame($params.spider_spawn_counter));

    $timer = new Timer($gameScene);

    $app.ticker.add(delta => gameLoop(delta));

    $score = new Score($gameScene);

    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("click", onClick, false);
}

function gameLoop(delta) {
    $spiderSpawnCounter.count();
    if ($spiderSpawnCounter.isFinished()) {
        if ($spiders.length < $params.max_spiders) {
            // add spider
            var spider = new Spider($gameScene);
        }

        $spiderSpawnCounter.reset();
    }

    $bullets.forEach(function(b) {
        $spiders.forEach(function(s) {
            if (hitTestRectangle(
                                 b.sprite.x - b.sprite.width / 2, 
                                 b.sprite.y - b.sprite.height / 2, 
                                 b.sprite.width,
                                 b.sprite.height,
                                 s.sprite.x - s.sprite.width / 2, 
                                 s.sprite.y - s.sprite.height / 2, 
                                 s.sprite.width,
                                 s.sprite.height)) {
                console.log("collide");
                var img = new Effect($gameScene, IMG_CRASH, s.sprite.x, s.sprite.y, 40, 40, msToFrame(700));
                $effects.push(img);
                s.die();
                $score.score += 100 * Math.sqrt(s.speed);
            }
        });
    });

    $spiders = doUpdate($spiders);
    $bullets = doUpdate($bullets);
    $effects = doUpdate($effects);
}

function doUpdate(objects) {
    objects.forEach(function(x) {
        x.update();
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
    if ($bullets.length < $params.max_bullets) {
        var bullet = new Bullet($gameScene);
        bullet.sprite.x = $canon.sprite.x;
        bullet.sprite.y = $canon.sprite.y;
        var v = $params.bullet_speed;
        bullet.sprite.vx = v * -Math.cos(deg2rad($canon.angle + 90));
        bullet.sprite.vy = v * -Math.sin(deg2rad($canon.angle + 90));
        $gameScene.addChild(bullet.sprite);
        $bullets.push(bullet);
    }
}

//=============================================================================
//   ゲームオブジェクト
//=============================================================================
class GameObject {
    constructor(scene) {
        this.scene = scene;
        this.alive = true;
        this.sprite = null;
    }

    update() {
        if (this.sprite && !this.isAlive()) {
            console.log("remove object");
            this.scene.removeChild(this.sprite);
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
    }

    rotateByDx(dx) {
        this.angle += (dx / 5);
        this.angle = clamp(-90, this.angle, 90);
        this.sprite.rotation = 2 * Math.PI * (this.angle / 360);
    }
}

class Spider extends GameObject {
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

        this.scene.addChild(this.sprite);
        $spiders.push(this);
    }

    changeSpeed() {
        this.changeSpeedCounter = new Counter(randomInt(msToFrame(1000), msToFrame(2000)));
        var v = Math.random() * $params.spider_speed_max;
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

class Bullet extends GameObject {
    constructor(scene) {
        super(scene);
        var sprite = new PIXI.Sprite(PIXI.loader.resources[IMG_BULLET].texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.width = 40;
        sprite.height = 40;
        this.sprite = sprite;
    }

    update() {
        this.sprite.x += this.sprite.vx;
        this.sprite.y += this.sprite.vy;
        if (this.sprite.x < 0 || this.sprite.x > SCREEN_W || this.sprite.y < 0 || this.sprite.SCREEN_H) {
            this.die();
            console.log("die");
        }
        this.sprite.rotation += 0.5;
        super.update();
    }
}

class Score extends GameObject {
    constructor(scene) {
        super(scene);
        this.score = 0;
        this.displayingScore = -1;

        let style = new PIXI.TextStyle({
                                fontFamily: "Arial",
                                fontSize: 20,
                                fill: "white",
                                stroke: '#ff3300',
                                strokeThickness: 4,
                                dropShadow: true,
                                dropShadowColor: "#000000",
                                dropShadowBlur: 4,
                                dropShadowAngle: Math.PI / 6,
                                dropShadowDistance: 6,
        });
        this.sprite = new PIXI.Text("Score", style);
        this.scene.addChild(this.sprite);
        $effects.push(this);
    }

    update() {
        if (this.displayingScore < this.score) {
            this.displayingScore += 1;
            this.sprite.text = "Score:  " + this.displayingScore;
        }
        super.update();
    }
}

class Timer extends GameObject {
    constructor(scene) {
        super(scene);
        let style = new PIXI.TextStyle({
                                fontFamily: "Arial",
                                fontSize: 20,
                                fill: "white",
                                stroke: '#0033ff',
                                strokeThickness: 4,
                                dropShadow: true,
                                dropShadowColor: "#000000",
                                dropShadowBlur: 4,
                                dropShadowAngle: Math.PI / 6,
                                dropShadowDistance: 6,
        });
        this.sprite = new PIXI.Text("Time: ", style);
        this.sprite.x = 100;
        this.scene.addChild(this.sprite);
        this.counter = new Counter(msToFrame(6000));
        $effects.push(this);
    }

    update() {
        this.counter.count();
        this.sprite.text = "Time:  " + Math.ceil(this.counter.frame / FPS);
    }
}

class Effect extends GameObject {
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

        this.scene.addChild(this.sprite);
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

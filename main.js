SCREEN_W = 800
SCREEN_H = 450

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

var $canon;
var $objects = [];
var $frame = 0;
var $mouseX = null;
var $canonAngle = 0;

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

    app.ticker.add(delta => gameLoop(delta));

    window.addEventListener("mousemove", onMouseMove, false);
}

function gameLoop(delta) {
    if ($frame % 60 == 0) {
        var spider = new PIXI.Sprite(PIXI.loader.resources["img/spider.png"].texture);
        spider.width = 40;
        spider.height = 40;
        spider.x = (Math.random() * 800);
        spider.y = (Math.random() * 450);
        var v = Math.random() * 4;
        var r = Math.random() * 2 * Math.PI;
        spider.vx = v * Math.cos(r);
        spider.vy = v * Math.sin(r);
        app.stage.addChild(spider);
        $objects.push(spider);
    }
    $objects.forEach(function(o) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < 0) o.x = SCREEN_W;
        if (o.x > SCREEN_W) o.x = 0;
        if (o.y < 0) o.y = SCREEN_W;
        if (o.y > SCREEN_W) o.y = 0;
    });
    $canon.rotation = 2 * Math.PI * ($canonAngle / 360);
    $frame += 1;
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
    $mouseX = x;
}

function clamp(min, val, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

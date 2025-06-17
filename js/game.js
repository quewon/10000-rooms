const context = document.querySelector("canvas").getContext("2d");
const palette = {
    lines: "#1c1c1c",
    bg: "#fefefe"
};
const WALL_WIDTH = 5;
const BLOCK_SIZE = 40;
const LINE_WIDTH = 1.5;

const RADIAN_DOWN = Math.PI;
const RADIAN_UP = 0;
const RADIAN_RIGHT = Math.PI/2;
const RADIAN_LEFT = Math.PI * 1.5;

const DIALOGUE_POOL = [
    ["you got:", "a telephone ring!", "ring ring ring"],
    ["you got:", "a mysterious message!"],
    ["i think it’s outside"],
    ["call me when you get this xoxo"],
    ["is this your house? looks empty"],
    ["you forgot your [ object ] at my house", "come by to pick it up sometime"],
    ["i need to get a lamp here"],
    ["note to self", "get a secondhand table"],
    ["ossama told me,", "i’d rather the place be nice even if it’s temporary"],
    ["you can get stuck in a place"],
    ["i wish i knew what was behind a door before i had to open it"],
    ["in middle school", "when i missed my friends in manila", "i’d dream of opening a door and being back there"],
    ["i’m so bad at directions"],
];
var DIALOGUE_INDEX = DIALOGUE_POOL.length;

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

class room {
    width = 0;
    height = 0;
    props = [];
    offset_x = 0; offset_y = 0;
    audio = _audio[Math.random() * _audio.length | 0];
    item;

    line_x;
    line_y;

    constructor(entrance, previous_room) {
        this.width = Math.ceil(Math.random() * 7);
        this.height = Math.ceil(Math.random() * 7);

        if (previous_room) {
            if (previous_room.width * previous_room.height == 1 && this.width * this.height == 1) {
                this.width = Math.ceil(Math.random() * 6) + 1;
                this.height = Math.ceil(Math.random() * 6) + 1;
            }

            if (entrance.tiles.length > 1) {
                if (radian == RADIAN_DOWN || radian == RADIAN_UP) {
                    this.width = Math.ceil(Math.random() * (7 - entrance.tiles.length) + entrance.tiles.length);
                } else {
                    this.height = Math.ceil(Math.random() * (7 - entrance.tiles.length) + entrance.tiles.length);
                }
            }

            // match wall
            let radian;
            if (keypress["ArrowLeft"]) radian = RADIAN_RIGHT;
            else if (keypress["ArrowRight"]) radian = RADIAN_LEFT;
            else if (keypress["ArrowUp"]) radian = RADIAN_DOWN;
            else if (keypress["ArrowDown"]) radian = RADIAN_UP;

            let new_x = 0;
            let new_y = 0;
            if (radian == RADIAN_DOWN) {
                new_y = 0;
            } else if (radian == RADIAN_UP) {
                new_y = this.height-1;
            } else {
                new_y = Math.random() * this.height | 0;
            }
            if (radian == RADIAN_RIGHT) {
                new_x = 0;
            } else if (radian == RADIAN_LEFT) {
                new_x = this.width-1;
            } else {
                new_x = Math.random() * this.width | 0;
            }

            let ox = player.x - new_x;
            let oy = player.y - new_y;

            if (radian == RADIAN_DOWN) {
                this.offset_y = -this.height + previous_room.offset_y;
                this.offset_x = previous_room.offset_x + ox;
            } else if (radian == RADIAN_UP) {
                this.offset_y = previous_room.offset_y + previous_room.height;
                this.offset_x = previous_room.offset_x + ox;
            } else if (radian == RADIAN_RIGHT) {
                this.offset_x = -this.width + previous_room.offset_x;
                this.offset_y = previous_room.offset_y + oy;
            } else if (radian == RADIAN_LEFT) {
                this.offset_x = previous_room.offset_x + previous_room.width;
                this.offset_y = previous_room.offset_y + oy;
            }

            let shared_props = [];
            for (let y=0; y<previous_room.height; y++) {
                for (let x=0; x<previous_room.width; x++) {
                    if (
                        radian == RADIAN_DOWN && y == 0 ||
                        radian == RADIAN_UP && y == previous_room.height-1 ||
                        radian == RADIAN_RIGHT && x == 0 ||
                        radian == RADIAN_LEFT && x == previous_room.width-1
                    ) {
                        let p = previous_room.prop_on_tile(x, y);
                        if (p && p.is_on_wall && p.rotation == radian) {
                            shared_props.push(p);
                        } else {
                            p = new prop([{ x: x, y: y }]);
                            p.is_on_wall = true;
                            p.is_occupant = false;
                            shared_props.push(p);
                        }
                    }
                }
            }

            for (let prop of shared_props) {
                var out_of_bounds = false;
                for (let tile of prop.tiles) {
                    if (tile.x - ox < 0 || tile.x - ox >= this.width || tile.y - oy < 0 || tile.y - oy >= this.height) {
                        out_of_bounds = true;
                        break;
                    }
                }
                if (!out_of_bounds) {
                    var copy = new PROPS[prop.constructor.name]([]);
                    for (let property of Object.keys(prop)) {
                        copy[property] = prop[property];
                    }

                    this.add_prop(copy);

                    if (prop.destination && prop != entrance) copy.destination = null;
                    if (prop.flipped != null) copy.flipped = !prop.flipped;
                    if (prop.rotation != null) copy.rotation = flip_radian(prop.rotation);
                    
                    var tiles = [];
                    for (let tile of prop.tiles) {
                        if (radian == RADIAN_DOWN) tiles.push({ x: tile.x - ox, y: this.height - 1, rotation: copy.rotation });
                        else if (radian == RADIAN_UP) tiles.push({ x: tile.x - ox, y: 0, rotation: copy.rotation });
                        else if (radian == RADIAN_RIGHT) tiles.push({ x: this.width - 1, y: tile.y - oy, rotation: copy.rotation });
                        else if (radian == RADIAN_LEFT) tiles.push({ x: 0, y: tile.y - oy, rotation: copy.rotation });
                    }
                    copy.tiles = tiles;

                    if (prop == entrance) {
                        this.entrance = copy;
                    }
                }
            }
        } else {
            let empty_tiles = this.empty_tiles({ is_wall_tile: true, occupied: false, wall_occupied: false });
            this.entrance = new door([empty_tiles[Math.random() * empty_tiles.length | 0]]);
            this.add_prop(this.entrance);
        }

        // generate more doors

        for (let i=0; i<Math.ceil(Math.random() * 3); i++) {
            let empty_tiles = this.empty_tiles({ is_wall_tile: true, occupied: false, wall_occupied: false });
            if (empty_tiles.length == 0) break;
            this.add_prop(new door([empty_tiles[Math.random() * empty_tiles.length | 0]]));
        }

        // generate windows

        for (let i=0; i<(Math.random() * 10 | 0); i++) {
            var batch = [];

            let window_tiles = this.empty_tiles({ is_wall_tile: true, wall_occupied: false });
            for (let tile of window_tiles) batch.push([tile]);

            let no_tiles_found = window_tiles.length == 0;
            let chainlength = 2;
            while (!no_tiles_found) {
                let consecutive_tiles = this.consecutive_tiles(window_tiles, chainlength);
                for (let tiles of consecutive_tiles) batch.push(tiles);
                if (consecutive_tiles.length == 0) no_tiles_found = true;
                chainlength++;
            }

            if (batch.length == 0) break;

            this.add_prop(new windowprop(
                batch.splice(Math.random() * batch.length | 0, 1)[0]
            ));
        }

        // generate boxes
        
        for (let i=0; i<Math.random() * 4; i++) {
            var batch = [];

            let tiles = this.empty_tiles({ occupied: false });
            for (let tile of tiles) batch.push([tile]);

            let no_tiles_found = tiles.length == 0;
            let chainlength = 2;
            while (!no_tiles_found) {
                let consecutive_tiles = this.consecutive_tiles(tiles, chainlength);
                for (let tiles of consecutive_tiles) batch.push(tiles);
                if (consecutive_tiles.length == 0) no_tiles_found = true;
                chainlength++;
            }

            if (batch.length == 0) break;

            this.add_prop(new box(
                batch.splice(Math.random() * batch.length | 0, 1)[0]
            ));
        }

        // generate lines

        for (let y=0; y<this.height; y++) {
            var intersects_prop = false;
            for (let x=0; x<this.width; x++) {
                let prop = this.prop_on_tile(x, y);
                if (prop && !prop.is_occupant) continue;
                if (prop) {
                    intersects_prop = true;
                    break;
                }
            }
            if (y != 0) {
                this.line_y = { x1: 0, y1: y, x2: this.width, y2: y }; 
                break;
            }
            if (!intersects_prop) {
                this.line_y = { x1: 0, y1: y + .5, x2: this.width, y2: y + .5 };
                break;
            }
        }

        for (let x=0; x<this.width; x++) {
            var intersects_prop = false;
            for (let y=0; y<this.height; y++) {
                let prop = this.prop_on_tile(x, y);
                if (prop && !prop.is_occupant) continue;
                if (prop) {
                    intersects_prop = true;
                    break;
                }
            }
            if (x != 0) {
                this.line_x = { x1: x, y1: 0, x2: x, y2: this.height };
                break;
            }
            if (!intersects_prop) {
                this.line_x = { x1: x + .5, y1: 0, x2: x + .5, y2: this.height };
                break;
            }
        }

        let empty_tiles = this.empty_tiles({ occupied: false });

        search: for (let x=Math.ceil(this.line_x?.x1 || 0); x<=this.width; x++) {
            for (let y=Math.ceil(this.line_y?.y1 || 0); y<=this.height; y++) {
                if (x == this.width || y == this.height) {
                    if (x == this.width && y == this.height) {

                    } else {
                        let prop = this.prop_on_tile(Math.min(x, this.width-1), Math.min(y, this.height-1));
                        if (prop && prop.is_on_wall) continue;
                    }
                } else {
                    let prop = this.prop_on_tile(x, y);
                    if (prop && prop.is_occupant) continue;
                }

                let l = new label([{ x:x, y:y }]);
                l.text = this.width + "×" + this.height;
                this.add_prop(l);

                for (let i=0; i<empty_tiles.length; i++) {
                    if (empty_tiles[i].x == x && empty_tiles[i].y == y) {
                        empty_tiles.splice(i, 1);
                        break;
                    }
                }

                break search;
            }
        }

        // generate item
        
        if (empty_tiles.length > 0 && Math.random() > .5) {
            if (DIALOGUE_INDEX >= DIALOGUE_POOL.length) {
                DIALOGUE_INDEX = 0;
                shuffle(DIALOGUE_POOL);
            }
            this.item = new item(empty_tiles[empty_tiles.length * Math.random() | 0], DIALOGUE_POOL[DIALOGUE_INDEX]);
            DIALOGUE_INDEX++;
        }
    }

    prop_on_tile(x, y) {
        for (let prop of this.props) {
            for (let tile of prop.tiles) {
                if (tile.x == x && tile.y == y) return prop;
            }
        }
        return null;
    }

    consecutive_tiles_in_direction(tiles, chainlength, dx, dy) {
        let groups = [];
        for (let a of tiles) {
            let group = [a];
            let compare = a;
            for (let i=0; i<chainlength; i++) {
                for (let b of tiles) {
                    if (compare == b) continue;

                    var c_wall_tile = this.is_wall_tile(compare.x, compare.y);
                    var b_wall_tile = this.is_wall_tile(b.x, b.y);

                    if (c_wall_tile && dx != 0 && compare.y != 0 && compare.y != this.height-1) continue;
                    if (c_wall_tile && dy != 0 && compare.x != 0 && compare.x != this.width-1) continue;
                    if (compare.x == b.x + dx && compare.y == b.y + dy && c_wall_tile == b_wall_tile) {
                        group.push(b);
                        compare = b;
                    }
                }
            }
            if (group.length == chainlength) groups.push(group);
        }
        return groups;
    }

    consecutive_tiles(tiles, chainlength) {
        let g1 = this.consecutive_tiles_in_direction(tiles, chainlength, 1, 0);
        let g2 = this.consecutive_tiles_in_direction(tiles, chainlength, 0, 1);
        return [...g1, ...g2];
    }

    is_wall_tile(x, y) {
        return y == 0 || x == 0 || y == this.height - 1 || x == this.width - 1;
    }

    empty_tiles(params) {
        var tiles = [];
        for (let y=0; y<this.height; y++) {
            for (let x=0; x<this.width; x++) {
                if ('is_wall_tile' in params && params.is_wall_tile != this.is_wall_tile(x, y)) continue;
                
                if (!params.occupied || !params.wall_occupied) {
                    let prop = this.prop_on_tile(x, y);
                    if (prop) {
                        if (!params.occupied && prop.is_occupant) continue;
                        if (!params.wall_occupied && prop.is_on_wall) continue;
                    }
                }

                tiles.push({ x, y });
            }
        }
        return tiles;
    }

    add_prop(prop) {
        prop.room = this;

        for (let tile of prop.tiles) {
            if (!prop.rotation) {
                let x = tile.x;
                let y = tile.y;
                if (y == 0) {
                    tile.rotation = RADIAN_DOWN;
                } else if (y == this.height - 1) {
                    tile.rotation = RADIAN_UP;
                } else if (x == 0) {
                    tile.rotation = RADIAN_RIGHT;
                } else {
                    tile.rotation = RADIAN_LEFT;
                }
            } else {
                tile.rotation = prop.rotation;
            }
        }

        prop.set_rotation();

        this.props.push(prop);
    }
    
    draw_room() {
        context.strokeStyle = palette.lines;
        context.lineWidth = WALL_WIDTH;
        context.strokeRect(0, 0, this.width * BLOCK_SIZE, this.height * BLOCK_SIZE);
    }

    draw() {
        context.save();
            context.translate(
                this.offset_x * BLOCK_SIZE, 
                this.offset_y * BLOCK_SIZE
            );

            this.draw_room();

            for (let prop of this.props)
                prop.draw();

            if ((this.line_x || this.line_y) && (this.width > 1 && this.height > 1)) {
                context.setLineDash([LINE_WIDTH, 5]);
                context.lineWidth = LINE_WIDTH;
                for (let line of [this.line_x, this.line_y]) {
                    if (!line) continue;
                    context.beginPath();
                    context.moveTo(line.x1 * BLOCK_SIZE, line.y1 * BLOCK_SIZE);
                    context.lineTo(line.x2 * BLOCK_SIZE, line.y2 * BLOCK_SIZE);
                    context.stroke();
                }
                context.setLineDash([]);
            }

            if (this.item) this.item.draw();

            player.draw();

            if (this.item) this.item.draw_text();

            context.strokeStyle = "blue";

        context.restore();
    }
}

class prop {
    room;
    tiles = [];
    is_occupant = true;
    is_door = false;
    is_on_wall = false;
    rotation;

    constructor(tiles) {
        this.tiles = tiles;
    }

    draw() { }

    set_rotation() { }
}

class door extends prop {
    is_door = true;
    is_on_wall = true;
    r = BLOCK_SIZE / 1.7;
    flipped = Math.random() > .5 ? true : false;
    ccw = Math.random() > .5;
    destination;

    set_rotation() {
        this.rotation = this.tiles[0].rotation;
    }

    draw() {
        let center_x;
        let center_y;
        let radian = this.rotation;
        if (this.tiles.length > 1) {
            center_x = (this.tiles[1].x + this.tiles[0].x)/2;
            center_y = (this.tiles[1].y + this.tiles[0].y)/2;
        }

        for (let i=0; i<this.tiles.length; i++) {
            let tile = this.tiles[i];
            let x = tile.x * BLOCK_SIZE;
            let y = tile.y * BLOCK_SIZE;
            if (this.flipped) {
                if (radian == RADIAN_UP) y += BLOCK_SIZE;
                else if (radian == RADIAN_DOWN) y -= BLOCK_SIZE;
                else if (radian == RADIAN_LEFT) x += BLOCK_SIZE;
                else if (radian == RADIAN_RIGHT) x -= BLOCK_SIZE;
                radian = flip_radian(radian);
            }

            context.save();
                context.translate(x + BLOCK_SIZE/2, y + BLOCK_SIZE/2);
                context.rotate(radian);
                context.translate(this.r/2, BLOCK_SIZE/2);
                
                context.lineWidth = LINE_WIDTH;
                context.strokeStyle = palette.lines;
                context.beginPath();

                let ccw = this.ccw;
                if (this.tiles.length > 1) {
                    if (radian == RADIAN_UP) {
                        if (tile.x < center_x) ccw = i==1;
                        else ccw = i==0;
                    } else if (radian == RADIAN_DOWN) {
                        if (tile.x < center_x) ccw = i==0;
                        else ccw = i==1;
                    } else if (radian == RADIAN_LEFT) {
                        if (tile.y < center_y) ccw = i==1;
                        else ccw = i==0;
                    } else if (radian == RADIAN_RIGHT) {
                        if (tile.y < center_y) ccw = i==0;
                        else ccw = i==1;
                    }
                }

                if (ccw) {
                    context.arc(0, 0, this.r, Math.PI, Math.PI * 1.5);
                } else {
                    context.arc(-this.r, 0, this.r, Math.PI * 1.5, Math.PI * 2);
                }
                
                context.stroke();
                
                context.strokeStyle = palette.bg;
                context.lineWidth = WALL_WIDTH;
                context.beginPath();
                context.moveTo(-this.r, 0);
                context.lineTo(0, 0);
                context.stroke();

                context.lineWidth = LINE_WIDTH;
                context.strokeStyle = palette.lines;
                if (ccw) {
                    context.strokeRect(-3.5, -this.r-3, 3.5, this.r);
                } else {
                    context.strokeRect(-this.r-.5, -this.r-3, 3.5, this.r);
                }
            context.restore();
        }
    }
}

class windowprop extends prop {
    is_occupant = false;
    is_on_wall = true;
    height = WALL_WIDTH * 2.5;

    set_rotation() {
        this.rotation = this.tiles[0].rotation;
    }

    draw() {
        let radian = this.rotation;

        if (this.tiles.length > 1) {
            let dx = this.tiles[1].x - this.tiles[0].x;
            let dy = this.tiles[1].y - this.tiles[0].y;
            if (dx != 0 && this.tiles[0].y == 0) radian = RADIAN_DOWN;
            else if (dx != 0 && this.tiles[0].y == this.room.height-1) radian = RADIAN_UP;
            else if (dy != 0 && this.tiles[0].x == 0) radian = RADIAN_RIGHT;
            else if (dy != 0 && this.tiles[0].x == this.room.width-1) radian = RADIAN_LEFT;
        }

        let center_x = (this.tiles[0].x + this.tiles[this.tiles.length - 1].x)/2 + .5;
        let center_y = (this.tiles[0].y + this.tiles[this.tiles.length - 1].y)/2 + .5;

        let width = (this.tiles.length * BLOCK_SIZE) - BLOCK_SIZE/2;

        context.save();
            context.translate(center_x * BLOCK_SIZE, center_y * BLOCK_SIZE);
            context.rotate(radian);
            context.translate(0, BLOCK_SIZE/2);
            
            context.strokeStyle = palette.bg;
            context.lineWidth = WALL_WIDTH;
            context.beginPath();
            context.moveTo(-width/2, 0);
            context.lineTo(width/2, 0);
            context.stroke();

            context.lineWidth = LINE_WIDTH;
            context.strokeStyle = palette.lines;
            context.strokeRect(-width/2, -WALL_WIDTH/2 +1.25, width, WALL_WIDTH/2);
            context.strokeRect(-width/2, -WALL_WIDTH/2 +1.25, width, this.height-1);
        context.restore();
    }
}

class label extends prop {
    text = "";
    color = "blue";
    offset_x = 0;
    offset_y = 0;

    draw() {
        context.fillStyle = this.color;
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.font = "17px serif";

        for (let tile of this.tiles) {
            context.fillText(this.text, (tile.x + .5) * BLOCK_SIZE + this.offset_x, (tile.y + .5) * BLOCK_SIZE + this.offset_y);
        }
    }
}

class box extends prop {
    constructor(tiles) {
        super(tiles);
        this.size = BLOCK_SIZE;
    }

    draw() {
        context.lineWidth = LINE_WIDTH;
        context.strokeStyle = palette.lines;

        let min_x = Infinity;
        let min_y = Infinity;
        let max_x = -Infinity;
        let max_y = -Infinity;

        for (let tile of this.tiles) {
            if (tile.x < min_x) min_x = tile.x;
            if (tile.x > max_x) max_x = tile.x;
            if (tile.y < min_y) min_y = tile.y;
            if (tile.y > max_y) max_y = tile.y;

            context.save();
                context.translate((tile.x + .5) * BLOCK_SIZE, (tile.y + .5) * BLOCK_SIZE);

                var adjacent = [0, 0, 0, 0];
                var walls = [RADIAN_UP, RADIAN_RIGHT, RADIAN_DOWN, RADIAN_LEFT];
                for (let b of this.tiles) {
                    if (b == tile) continue;
                    if (tile.y - 1 == b.y) adjacent[0] = 1;
                    if (tile.x + 1 == b.x) adjacent[1] = 1;
                    if (tile.y + 1 == b.y) adjacent[2] = 1;
                    if (tile.x - 1 == b.x) adjacent[3] = 1;
                }
                
                for (let i=0; i<walls.length; i++) {
                    let wall = walls[i];
                    if (adjacent[i] == 1) continue;
                    context.save();
                        let connect_left;
                        let connect_right;

                        if (wall == RADIAN_UP) {
                            connect_left = adjacent[3] == 1;
                            connect_right = adjacent[1] == 1;
                        } else if (wall == RADIAN_RIGHT) {
                            connect_left = adjacent[0] == 1;
                            connect_right = adjacent[2] == 1;
                        } else if (wall == RADIAN_DOWN) {
                            connect_left = adjacent[1] == 1;
                            connect_right = adjacent[3] == 1;
                        } else {
                            connect_left = adjacent[2] == 1;
                            connect_right = adjacent[0] == 1;
                        }

                        let x1 = -BLOCK_SIZE/2;
                        let x2 = BLOCK_SIZE/2;

                        if (!connect_left) x1 = -this.size/2;
                        if (!connect_right) x2 = this.size/2;

                        context.rotate(wall);
                        context.beginPath();
                        context.moveTo(x1 - LINE_WIDTH, -this.size/2);
                        context.lineTo(x2 + LINE_WIDTH, -this.size/2);

                        context.stroke();
                    context.restore();
                }
            context.restore();
        }

        max_x++;
        max_y++;

        context.beginPath();
        context.moveTo(min_x * BLOCK_SIZE, min_y * BLOCK_SIZE);
        context.lineTo(max_x * BLOCK_SIZE, max_y * BLOCK_SIZE);
        context.moveTo(max_x * BLOCK_SIZE, min_y * BLOCK_SIZE);
        context.lineTo(min_x * BLOCK_SIZE, max_y * BLOCK_SIZE);
        context.stroke();
    }
}

class item {
    x; y;
    found = false;
    lines;

    line_index = 0;
    time = -1;

    width = 0;

    constructor(tile, lines) {
        this.x = tile.x;
        this.y = tile.y;
        this.lines = lines;

        context.textAlign = "left";
        context.textBaseline = "middle";
        context.font = "16px sans-serif";

        for (let line of this.lines) {
            let mm = context.measureText(line);
            if (mm.width > this.width) this.width = mm.width;
        }
    }

    draw() {
        let x = (this.x + .5) * BLOCK_SIZE;
        let y = (this.y + .5) * BLOCK_SIZE;

        context.strokeStyle = "blue";
        context.lineWidth = LINE_WIDTH;
        context.beginPath();
        context.moveTo(x - BLOCK_SIZE/8, y - BLOCK_SIZE/8);
        context.lineTo(x + BLOCK_SIZE/8, y + BLOCK_SIZE/8);
        context.moveTo(x + BLOCK_SIZE/8, y - BLOCK_SIZE/8);
        context.lineTo(x - BLOCK_SIZE/8, y + BLOCK_SIZE/8);
        context.stroke();
    }

    update(delta) {
        if (player.x == this.x && player.y == this.y) {
            if (this.time == -1) this.time = 0;
            this.time += delta;
            if (this.time >= 500) {
                this.time = 0;
                this.line_index++;
            }
        } else {
            this.time = -1;
            this.line_index = 0;
        }
    }

    draw_text() {
        if (player.x == this.x && player.y == this.y) {
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.font = "16px sans-serif";
            context.fillStyle = "blue";

            context.save();
                let x;
                if ((player.room.offset_x + player.room.width/2) * BLOCK_SIZE > player.camera.dest_x) {
                    x = -BLOCK_SIZE - this.width;
                } else {
                    x = (player.room.width + 1) * BLOCK_SIZE;
                }

                context.translate(x, (this.y + .5) * BLOCK_SIZE - ((this.lines.length - 1)/2 * 21));

                for (let i=0; i<Math.min(this.lines.length, this.line_index + 1); i++) {
                    let line = this.lines[i];
                    let y = i * 21;

                    context.fillText(line, 0, y);
                }

            context.restore();
        }
    }
}

function random_color() {
    var r = 256*Math.random()|0,
        g = 256*Math.random()|0,
        b = 256*Math.random()|0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function flip_radian(radian) {
    if (radian == RADIAN_DOWN) return RADIAN_UP;
    else if (radian == RADIAN_UP) return RADIAN_DOWN;
    else if (radian == RADIAN_LEFT) return RADIAN_RIGHT;
    else if (radian == RADIAN_RIGHT) return RADIAN_LEFT;
}

function lerp(a, b, t) {
    return b * t + a * (1 - t);
}

function move_toward(a, b, amount) {
    let dir = Math.sign(b - a);
    if (dir == 0) return a;
    if (dir < 0) return Math.max(a + amount * dir, b);
    if (dir > 0) return Math.min(a + amount * dir, b);
}

const PROPS = {
    prop: prop,
    door: door,
    windowprop: windowprop
}
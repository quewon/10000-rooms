const player = {
    room: null,
    camera: { x:0, y:0, dest_x:0, dest_y: 0 },
    audio: null,
    set_camera: function() {
        if (!this.room) return;

        if ((this.room.offset_x - 1) * BLOCK_SIZE + this.camera.dest_x < -context.canvas.width/2/devicePixelRatio)
            this.camera.dest_x = -(this.room.offset_x - 1) * BLOCK_SIZE - context.canvas.width/2/devicePixelRatio;

        else if ((this.room.offset_x + this.room.width + 1) * BLOCK_SIZE + this.camera.dest_x > context.canvas.width/2/devicePixelRatio)
            this.camera.dest_x = -(this.room.offset_x + player.room.width + 1) * BLOCK_SIZE + context.canvas.width/2/devicePixelRatio;

        if ((this.room.offset_y - 1) * BLOCK_SIZE + this.camera.dest_y < -context.canvas.height/2/devicePixelRatio)
            this.camera.dest_y = -(this.room.offset_y - 1) * BLOCK_SIZE - context.canvas.height/2/devicePixelRatio;

        else if ((this.room.offset_y + this.room.height + 1) * BLOCK_SIZE + this.camera.dest_y > context.canvas.height/2/devicePixelRatio)
            this.camera.dest_y = context.canvas.height/2/devicePixelRatio - (this.room.offset_y + this.room.height + 1) * BLOCK_SIZE;
    },
    enter_room: function(room, entrance_tile) {
        entrance_tile = entrance_tile || 0;
        this.x = room.entrance.tiles[entrance_tile].x;
        this.y = room.entrance.tiles[entrance_tile].y;
        this.room = room;

        keypress = {};
        keydown = {};

        this.set_camera();

        if (player.audio) player.audio.pause();
        player.audio = room.audio;
        player.audio.currentTime = Math.random() * player.audio.duration;
        player.audio.play();
        player.audio.volume = 0;
    },
    draw: function() {
        context.save();
            context.translate(this.x * BLOCK_SIZE + BLOCK_SIZE/2, this.y * BLOCK_SIZE);

            context.lineWidth = WALL_WIDTH;
            context.strokeStyle = "red";
            context.fillStyle = palette.bg;

            let u = BLOCK_SIZE;
            let s = u/5;

            context.beginPath();
            context.moveTo(0, s + s/2); //neck
            context.lineTo(0, s * 3); //crotch
            context.lineTo(-u/6, s * 4); //leg1
            context.moveTo(0, s * 3); //crotch
            context.lineTo(u/6, s * 4); //leg2
            context.moveTo(-u/4, u/2); //arm
            context.lineTo(u/4, u/2); //arm
            context.stroke();

            context.beginPath();
            context.arc(0, s + s/2, s/2 - context.lineWidth/2, 0, Math.PI*2);
            context.fill();
            context.stroke();
        context.restore();
    },
    update: function(delta) {
        if (player.audio.volume < 1) {
            player.audio.volume = Math.min(1, player.audio.volume + delta/3000);
        }

        this.camera.x = move_toward(this.camera.x, this.camera.dest_x, delta/2);
        this.camera.y = move_toward(this.camera.y, this.camera.dest_y, delta/2);

        context.globalAlpha = 1;
        if (this.camera.x != this.camera.dest_x || this.camera.y != this.camera.dest_y) context.globalAlpha = .2;

        //
        
        let acted_x = this.x;
        let acted_y = this.y;
        if (keypress["ArrowLeft"])
            acted_x--;
        else if (keypress["ArrowRight"])
            acted_x++;
        else if (keypress["ArrowUp"])
            acted_y--;
        else if (keypress["ArrowDown"])
            acted_y++;

        var door_tile_index;
        var door;
        door_search: for (let prop of this.room.props) {
            if (!prop.is_door) continue;
            for (let i=0; i<prop.tiles.length; i++) {
                let tile = prop.tiles[i];
                if (tile.x == this.x && tile.y == this.y) {
                    door_tile_index = i;
                    door = prop;
                    break door_search;
                }
            }
        }

        if (door) {
            if (
                door.rotation == RADIAN_DOWN && keypress["ArrowUp"] ||
                door.rotation == RADIAN_UP && keypress["ArrowDown"] ||
                door.rotation == RADIAN_RIGHT && keypress["ArrowLeft"] ||
                door.rotation == RADIAN_LEFT && keypress["ArrowRight"]
            ) {
                let previous_room = player.room;
                if (!door.destination) {
                    door.destination = new room(door, previous_room);
                }
                player.enter_room(door.destination, door_tile_index);

                for (let prop of previous_room.props) {
                    if (!prop.is_door) continue;
                    prop.destination = null;
                }
                player.room.entrance.destination = previous_room;
                previous_room.entrance = door;
                return;
            }
        }

        this.x = acted_x;
        this.y = acted_y;

        if (this.x < 0) this.x = 0;
        if (this.x >= this.room.width) this.x = this.room.width - 1;
        if (this.y < 0) this.y = 0;
        if (this.y >= this.room.height) this.y = this.room.height - 1;

        let moved = keypress["ArrowLeft"] || keypress["ArrowRight"] || keypress["ArrowUp"] || keypress["ArrowDown"];

        if (moved && acted_x == this.x && acted_y == this.y) {
            player.audio.volume = 0;
        }

        keypress = {};
    }
}

var keypress = {};
var keydown = {};
document.onkeydown = e => {
    if (e.repeat) return;
    keydown[e.key] = true;
    keypress = {};
    keypress[e.key] = true;
}
document.onkeyup = e => {
    delete keydown[e.key];
}
document.onblur = () => {
    keydown = {};
}
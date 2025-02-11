var Class = require("./jsclass.js");
var values = require("./values.js");
var wordlist = require("./wordlist.js");


var Word = new Class({
    $construct: function Word(word){
        this.string     = word;
        this.length     = word.length;
        this.chars      = word.split('');
        this.charCount  = {};

        for(var i=0;i<this.chars.length;i++){
            char = this.chars[i];
            char in this.charCount || (this.charCount[char] = 0);
            this.charCount[char]++;
        }
    },
    toString: function(){
        return this.string;
    }
});

function _clone(value){
    if (value === null || value === undefined) return value;
    switch(true){
        case (value.constructor === Array): return Array.prototype.slice.call(value);
        case (typeof value === 'object'): return JSON.parse(JSON.stringify(value));
        default: return value;
    }
}

var Board = new Class({
    values: values,
    $construct: function(data){
        if(typeof data == 'string'){
            this.data       = this.fromString(data);
        } else {
            this.data       = data;
        }
        this.charMap    = {};
        this.charList   = [];
        this.multipliers = {
            'w': {},
            'l': {},
        };

        this.mapChars();
    },
    fromString: function(str){
        var data = [];
        data.push(str.substr(0,4).split(''));
        data.push(str.substr(4,4).split(''));
        data.push(str.substr(8,4).split(''));
        data.push(str.substr(12,4).split(''));
        console.log(data);
        return data;
    },
    mapChars: function(){
        var char;
        for(var x=0;x<4;x++){
            for(var y=0;y<4;y++){
                char = this.data[x][y];
                char in this.charMap || (this.charMap[char] = []);
                this.charMap[char].push([x,y]);
                this.charList.push(char);
            }
        }
    },
    getSlug: function(c){
        return (c[0]) + ':' + (c[1]);
    },
    getWordMultiplier: function(c){
        var slug = this.getSlug(c);
        return (slug in this.multipliers['w']) ? this.multipliers['w'][slug] : 1;
    },
    getLetterMultiplier: function(c){
        var slug = this.getSlug(c);
        return (slug in this.multipliers['l']) ? this.multipliers['l'][slug] : 1;
    },
    addDoubleLetter: function(c){
        this.multipliers['l'][this.getSlug(c)] = 2;
    },
    addTrippleLetter: function(c){
        this.multipliers['l'][this.getSlug(c)] = 3;
    },
    addDoubleWord: function(c){
        this.multipliers['w'][this.getSlug(c)] = 2;
    },
    addTrippleWord: function(c){
        this.multipliers['w'][this.getSlug(c)] = 3;
    },
    isAdjecent: function(a,b){
        return Math.abs(a[0]- b[0]) <= 1 && Math.abs(a[1]- b[1]) <= 1;
    },
    checkAllChars: function(word){
        for (var i = 0; i < word.chars.length; i++) {
            var c = word.chars[i];
            if(!~this.charList.indexOf(c) || this.charMap[c].length < word.charCount[c]) return false;
        };
        return true;
    },
    getChar: function(c){
        return this.data[c[0]][c[1]];
    },
    evaluate: function(pattern){
        var lM, wM = 1,
            points = 0;

        pattern.map(function(c){
            lM = this.getLetterMultiplier(c);
            wM *= this.getWordMultiplier(c);
            points += (this.values[this.getChar(c)] * lM);
        },this);

        points = (points * wM);

        // Length bonus
        if(pattern.length > 4){
            switch(pattern.length){
                case 5: points += 5; break;
                case 6: points += 10; break;
                case 7: points += 15; break;
                case 8: points += 20; break;
                case 9:
                default: points += 25; break;
            }
        }


        return {
            pattern: pattern,
            length: pattern.length,
            points: points,
        }
    },
    iterate: function(chars,pattern,map,result){
        var e, localPattern, localMap, pos,
            char = chars.shift();

        for (var i = map[char].length - 1; i >= 0; i--) {
            localPattern    = _clone(pattern);
            localMap        = _clone(map);
            pos             = localMap[char].splice(i,1)[0];

            if(!localPattern.length || this.isAdjecent(pos,localPattern[pattern.length-1])){
                localPattern.push(pos);
                if(!chars.length){
                    e = this.evaluate(localPattern)
                    if(e.points > result.data.points) result.data = e;
                }
                else this.iterate(_clone(chars),localPattern,localMap,result);
            }
        };
    },
    find: function(word){
        var result = {
            word: word,
            data:{points:0},
        };

        if(!this.checkAllChars(word)) return false;
        this.iterate(word.chars,[],this.charMap,result);

        if(result.data.points) return result;
        else return false;
    }
});
// eeinlgaeaeslpntt

// dl 02
// dl 20
// tl 21
// dw 33
var board = new Board('eeinlgaeaeslpntt');
// var board = new Board([
//     ['n','l','i','a'],
//     ['r','k','o','n'],
//     ['t','a','m','t'],
//     ['k','e','n','s'],
// ]);

board.addTrippleLetter([2,2]);
board.addDoubleLetter([3,1]);
// board.addTrippleLetter([3,0]);
// board.addDoubleWord([2,1]);
// board.addDoubleWord([3,2]);
// board.addTrippleWord([2,3]);

var words = [];

wordlist.map(function(word){
    word = new Word(word);
    result = board.find(word);
    if(result) words.push(result);
});

words.sort(function(a,b){return a.data.points - b.data.points});


words.map(function(word){
    console.log('%s points: %s ',word.data.points,word.word);
});


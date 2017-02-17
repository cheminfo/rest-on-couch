//'use strict';
class Immutable {
    constructor() {
        this.a = 1;
        this.b = null;
        Object.preventExtensions(this);
    }
}

var a = new Immutable();
a.a = 4;
a.b = 7
console.log(a);
a.c = 4
console.log(a);
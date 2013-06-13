(function (tree) {

    tree.Comment = function (value, silent) {
        this.value = value;
        this.silent = !!silent;

        if (value.indexOf("//~") === 0)
            if (tree.preProcessor) // saving preprocessor directives to the tree.preProcessor
                tree.preProcessor.extract(value);
    };

    tree.Comment.prototype = {
    type: "Comment",
        toCSS: function (env) {
            return env.compress ? '' : this.value;
        },
        eval: function () { return this }
    };


    tree.preProcessor = new function () {
        /* version 1.21 */
        this.data = [];

        this.extract = function (value) {
            var parts = (/\/\/~\s*(\S+?)\s*(\+?=)\s*(.*?)\s*$/).exec(value);
            if (parts)
                this.add(parts[1], parts[2], parts[3]);
        };

        this.add = function (_src, _op, _dest) {
            var that = this;
            var srcs = _src.split("|").forEach(function (value, idx, array) {
                value = value.trim();
                var nid = "[^a-zA-Z0-9-_]";
                var obj = { src: value, op: _op, dest: _dest };
                obj.srcEscaped = value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&"); // escape the identifier
                obj.rplRegExp = new RegExp("(^|" + nid + ")(" + obj.srcEscaped + ")(" + nid + "|$)");
                obj.replaced = {};
                that.data.push(obj);
            });
        };

        this.process = function (selectors) {
            var that = this;
            selectors.forEach(function (value, idx, arr) {
                for (var i = 0; i < that.data.length; i++) {
                    var current = that.data[i];
                    if (value.indexOf(current.src) != -1 && current.rplRegExp.test(value)) { // doing simple indexOf test and testing the selector using regular expression
                        var replaced = that.replace(i, value);

                        if (value != replaced) {
                            switch (current.op) {
                                case "+=":
                                    arr.push(replaced);
                                    break;

                                case "=":
                                    arr[idx] = replaced;
                                    break;
                            }
                            //break; // if replacement was made successfully - stop processing rest of the rules
                        }
                    }
                }
            });
        };

        this.replace = function (idx, selector) {
            var s = this.data[idx];

            var replaced = selector.replace(s.rplRegExp, "$1" + s.dest + "$3");
            if (selector != replaced)
                s.replaced[selector] = replaced;

            return replaced;
        };

        this.dump = function () {
            for (var i = 0; i < this.data.length; i++) {
                var s = this.data[i].replaced;

                for (var key in s) {
                    console.log("replaced {%s}: %s => %s", this.data[i].src, key, s[key]);
                }
            }
        }
    };

})(require('../tree'));

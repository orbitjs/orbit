import eq from 'orbit/lib/eq';

var clone = function(obj) {
  if (obj === undefined || obj === null || typeof obj !== 'object') return obj;

  var dup,
      type = Object.prototype.toString.call(obj);

  if (type === "[object Date]") {
    dup = new Date();
    dup.setTime(obj.getTime());

  } else if (type === "[object RegExp]") {
    dup = obj.constructor(obj);

  } else if (type === "[object Array]") {
    dup = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      if (obj.hasOwnProperty(i)) {
        dup.push(clone(obj[i]));
      }
    }

  } else  {
    var val;

    dup = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
        if (typeof val === 'object') val = clone(val);
        dup[key] = val;
      }
    }
  }
  return dup;
};

export default clone;
// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(emile, container){
  var parseEl = document.createElement('div'),
    props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
    'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
    'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
    'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' '),
    special = {
      'opacity': function () {
        var div = document.createElement("div");
        div.innerHTML = "<a style='opacity:.55;'>a</a>";
        return {
          set: /^0.55$/.test( div.getElementsByTagName('a')[0].style.opacity) ?
            function (v, p, u) { return {v: p, f: interpolate, u: u} } :
            function (v, p, u) { return {v: p, f: filterOpacity, u: u} },
          prop: 'filter'
        }
      }()
    };

  function interpolate(source,target,pos){ return (source+(target-source)*pos).toFixed(3); }
  function s(str, p, c){ return str.substr(p,c||1); }
  function color(source,target,pos){
    var i = 2, j, c, tmp, v = [], r = [];
    while(j=3,c=arguments[i-1],i--)
      if(s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
        if(c.length==4) c='#'+s(c,1)+s(c,1)+s(c,2)+s(c,2)+s(c,3)+s(c,3);
        while(j--) v.push(parseInt(s(c,1+j*2,2), 16)); }
    while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
    return 'rgb('+r.join(',')+')';
  }
  function filterOpacity(source,target,pos){
    var value = interpolate(source == null || isNaN(source) ? 1 : parseFloat(source),parseFloat(target),pos);
    return "alpha(opacity=" + value * 100 + ")";
  }

  function parse(prop, name){
    var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
    return name in special ?
      special[name].set(prop, p, q) :
      (isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q });
  }

  function normalize(style){
    var css, rules = {}, i = props.length, v, p, s;
    parseEl.innerHTML = '<div style="'+style+'"></div>';
    css = parseEl.childNodes[0].style;
    while(i--) {
      s = p = props[i];
      if (p in special) { s = special[p].prop; }
      if(v = css[p]) rules[s] = parse(v, p);
    }
    return rules;
  }

  container[emile] = function(el, style, opts, after){
    el = typeof el == 'string' ? document.getElementById(el) : el;
    opts = opts || {};
    var target = normalize(style), comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
      prop, current = {}, start = +new Date, dur = opts.duration||200, finish = start+dur, interval,
      easing = opts.easing || function(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };
    for(prop in target) current[prop] = parse(comp[prop], prop);
    interval = setInterval(function(){
      var time = +new Date, pos = time>finish ? 1 : (time-start)/dur;
      for(prop in target)
        el.style[prop] = target[prop].f(current[prop].v,target[prop].v,easing(pos)) + target[prop].u;
      if(time>finish) { clearInterval(interval); opts.after && opts.after(); after && setTimeout(after,1); }
    },10);
  }
})('emile', this);
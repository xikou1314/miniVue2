var KV = (function () {
  'use strict';

  var selector = {
    s(selector = '') { //单个
      return document.querySelector(selector);
    },
    m(selector = '') {// 集合
      return document.querySelectorAll(selector);
    },
    id(id = '') {
      return document.getElementById(id);
    }

  };

  var ncname = '[a-zA-Z_][\\w\\-\\.]*';
  var qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')';
  var startTagOpen = new RegExp('^<' + qnameCapture); // 匹配开始标签的 <
  var startTagClose = /^\s*(\/?)>/; // 匹配 开始标签的 >
  var endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>'); // 匹配结束标签 </xxx>

  // Regular Expressions for parsing tags and attributes
  var singleAttrIdentifier = /([^\s"'<>/=]+)/;
  var singleAttrAssign = /(?:=)/;
  var singleAttrValues = [
    // attr value double quotes
    /"([^"]*)"+/.source,
    // attr value, single quotes
    /'([^']*)'+/.source,
    // attr value, no quotes
    /([^\s"'=<>`]+)/.source
  ];
  var attribute = new RegExp(
    '^\\s*' + singleAttrIdentifier.source +
        '(?:\\s*(' + singleAttrAssign.source + ')' +
        '\\s*(?:' + singleAttrValues.join('|') + '))?'
  );

  var defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g; // 匹配 {{xxxx}}
  function makeMap(str,
    expectsLowerCase // true
  ) {
    var map = Object.create(null); // 创建一个对象
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
      ? function(val) {
        return map[val.toLowerCase()];
      }
      : function(val) {
        return map[val];
      };
  }

  var isUnaryTag = makeMap( // 自闭合标签
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
        'link,meta,param,source,track,wbr'
  );

  function Parse(template) {
    return this._init(template);
  }
  function parseHTML(html, options) {
    var stack = [];
    var isUnaryTag$$1 = isUnaryTag; // 判断是否为自闭合标签
    var index = 0;
   var lastTag; // lastTag 为了匹配结束标签 因为执行一次后 lastTag会被赋值tagName
    while (html) {
      var textEnd = html.indexOf('<');
      if (textEnd === 0) { // 此时字符串是不是以<开头
        // End tag:
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          var curIndex = index;
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue;
        }

        // Start tag:    // 匹配起始标签
        var startTagMatch = parseStartTag(); // 处理后得到match
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          continue;
        }
      }

      // 初始化为undefined 这样安全且字符数少一点
      var text = (void 0); var rest = (void 0);    if (textEnd >= 0) { // 截取<字符索引 => </div> 这里截取到闭合的<
        rest = html.slice(textEnd); // 截取闭合标签
        // 处理文本中的<字符
        // 获取中间的字符串 => {{message}}
        text = html.substring(0, textEnd); // 截取到闭合标签前面部分
        advance(textEnd); // 切除闭合标签前面部分

      }
      // 当字符串没有<时
      if (textEnd < 0) {
        text = html;
        html = '';
      }
      // // 另外一个函数
      if (options.chars && text) {
        options.chars(text);
      }
    }

    // 该函数将函数局部变量index往前推 并切割字符串
    function advance(n) {
      index += n;
      html = html.substring(n);
    }

    function parseStartTag() { // 返回匹配对象
      var start = html.match(startTagOpen); // 正则匹配
      if (start) {
        var match = {
          tagName: start[1], // 标签名(div)
          attrs: [], // 属性
          start: index // 游标索引(初始为0)
        };
        advance(start[0].length);
        var end; var attr; // 进行属性的正则匹配
        // startTagClose匹配/>或>          attribute匹配属性 正则太长 没法讲           本例中attr匹配后 => ['id=app','id','=','app']
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) { // 如果不是 > 标签  并且是attribute 比如<div id=app> 先得到app 第二次while 的dao>
          advance(attr[0].length); // 属性加入
          match.attrs.push(attr);
        }
        if (end) { //  第一while匹配到 attr 第二次就能end到                在第二次while循环后 end匹配到结束标签 => ['>','']
          // match.unarySlash = end[1];      //如果是> end[1]就是"" 如果过 div> end[1] 就是div
          advance(end[0].length); // 标记结束位置
          match.end = index; // 这里的index 是在 parseHTML就定义 在advance里面相加
          return match; // 返回匹配对象 起始位置 结束位置 tagName attrs
        }
      }
    }

    function handleStartTag(match) {
      var tagName = match.tagName;
      // var unarySlash = match.unarySlash;
      // if (expectHTML) {
      //     if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
      //         parseEndTag(lastTag);
      //     }
      //     if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
      //         parseEndTag(tagName);
      //     }
      // }
      var unary = isUnaryTag$$1(tagName);
      var l = match.attrs.length;
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        var args = match.attrs[i];
        var value = args[3] || args[4] || args[5] || '';
        attrs[i] = {
          name: args[1],
          value: value
        };
      }
      if (!unary) {
        stack.push({tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs});
        lastTag = tagName;
      }
      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }

    function parseEndTag(tagName, start, end) {
      // 参数修正
      var pos; var lowerCasedTagName;
      if (start == null) {
        start = index;
      }
      if (end == null) {
        end = index;
      }

      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
      }

      // Find the closest opened tag of the same type
      if (tagName) { // 获取最近的匹配标签
        for (pos = stack.length - 1; pos >= 0; pos--) {
          // 提示没有匹配的标签
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break;
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0;
      }

      if (pos >= 0) {
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }

        // Remove the open elements from the stack
        stack.length = pos;
        lastTag = pos && stack[pos - 1].tag;
      } else if (lowerCasedTagName === 'br') {
        if (options.start) {
          options.start(tagName, [], true, start, end);
        }
      } else if (lowerCasedTagName === 'p') {
        if (options.start) {
          options.start(tagName, [], false, start, end);
        }
        if (options.end) { // 调用剩下的一个参数函数
          options.end(tagName, start, end);
        }
      }
    }
  }
  function parse(template) {
    var currentParent; // 当前节点的父节点
    var root; // 根节点
    var stack = []; // 辅助缓存stack
    parseHTML(template, {
      start: function start(tag, attrs, unary) {
        var element = {
          type: 1,
          tag: tag,
          attrsList: attrs,
          attrsMap: makeAttrsMap(attrs),
          parent: currentParent,
          children: []
        };
        processAttrs(element);
        if (!root) {
          root = element;
        }
        if (currentParent) {
          currentParent.children.push(element);
          element.parent = currentParent;
        }
        if (!unary) {
          currentParent = element;
          stack.push(element);
        }
      },
      end: function end() {
        // remove trailing whitespace
        var element = stack[stack.length - 1]; /* 从stack中取出最后一个ele */
        var lastNode = element.children[element.children.length - 1]; /* 获取该ele的最后一个子节点 */
        //  /*该子节点是非<pre>标签的文本*/
        if (lastNode && lastNode.type === 3 && lastNode.text === ' ' && !inPre) {
          element.children.pop();
        }
        // pop stack
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
      },
      chars: function chars(text) {
        if (!currentParent) { // 如果没有父元素 只是文本
          return;
        }

        var children = currentParent.children; // 取出children
        // text => {{message}}
        if (text) {
          var expression;
          if (text !== ' ' && (expression = parseText(text))) {
            // 将解析后的text弄进children数组

            children.push({
              type: 2,
              expression: expression,
              text: text,
              tplFn: gTplFn(expression)
            });
          } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
            children.push({
              type: 3,
              text: text
            });
          }
        }
      }
    });
    return root;
  }
  //　在最后，调用processAttrs对动态绑定的属性（v-,@,:）进行处理，代码如下：
  function processAttrs(el) {
    // {name:'id',value:'app'}
    /* 获取元素属性列表 */
    var list = el.attrsList;
    var i; var l; var name; var rawName; var value;  for (i = 0, l = list.length; i < l; i++) {
      // 属性名
      name = rawName = list[i].name;
      // 属性值
      value = list[i].value;
      addAttr(el, name, JSON.stringify(value)); // 添加了个attrs属性  /*将属性放入ele的attr属性中*/
    }
  }

  function addAttr(el, name, value) {
    (el.attrs || (el.attrs = [])).push({name: name, value: value});
  }
  function parseText(text, // 对Text进行解析
    delimiters) {
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE; // 如果delimiters为false defaultTagRE 为匹配{{xxx}}的正则
    if (!tagRE.test(text)) { // /\{\{((?:.|\n)+?)\}\}/g 在这里调用test方法后lasatIndex会变化
      return;
    }
    var tokens = [];
    var lastIndex = tagRE.lastIndex = 0;
    var match; var index;

    // 0:"{{message}}"
    // 1:"message"
    // index:0
    // input:"{{message}}"

    // 匹配到中间的文本
    while ((match = tagRE.exec(text))) {
      index = match.index;
      // push text token
      // 将{{message}}之前的文本push进去
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)));
      }
      // tag token
      // 该方法对特殊字符进行处理
      var exp = (match[1].trim());
      tokens.push((' od.' + exp + ' '));
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) { // push}}后面的文本
      tokens.push(JSON.stringify(text.slice(lastIndex)));
    }
    return tokens.join('+');
  }

  function makeAttrsMap(attrs) {
    var map = {};
    for (var i = 0, l = attrs.length; i < l; i++) {
      map[attrs[i].name] = attrs[i].value;
    }
    return map;
  }

  function gTplFn(str) {
    let $t = 'return ' + str;

    $t = $t.replace(/\n/g, '');

    let $tempFn = new Function('od', $t);

    return $tempFn;
  }

  Parse.prototype._init = function(template) {
    return parse(template);
  };

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var utils = createCommonjsModule(function (module, exports) {
  var _ = exports;

  _.type = function(obj) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '');
  };

  _.isArray = function isArray(list) {
    return _.type(list) === 'Array';
  };

  _.slice = function slice(arrayLike, index) {
    return Array.prototype.slice.call(arrayLike, index);
  };

  _.truthy = function truthy(value) {
    return !!value;
  };

  _.isString = function isString(list) {
    return _.type(list) === 'String';
  };

  _.each = function each(array, fn) {
    for (var i = 0, len = array.length; i < len; i++) {
      fn(array[i], i);
    }
  };

  _.toArray = function toArray(listLike) {
    if (!listLike) {
      return [];
    }

    var list = [];

    for (var i = 0, len = listLike.length; i < len; i++) {
      list.push(listLike[i]);
    }

    return list;
  };

  _.setAttr = function setAttr(node, key, value) {
    switch (key) {
      case 'style':
        node.style.cssText = value;
        break;
      case 'value':
        var tagName = node.tagName || '';
        tagName = tagName.toLowerCase();
        if (
          tagName === 'input' || tagName === 'textarea'
        ) {
          node.value = value;
        } else {
          node.setAttribute(key, value);
        }
        break;
      default:
        node.setAttribute(key, value);
        break;
    }
  };
  });

  function Element(tagName, props, children) {
    if (!(this instanceof Element)) {
      if (!utils.isArray(children) && children !== null) {
        children = utils.slice(arguments, 2).filter(utils.truthy);
      }
      return new Element(tagName, props, children);
    }

    if (utils.isArray(props)) {
      children = props;
      props = {};
    }

    this.tagName = tagName;
    this.props = props || {};
    this.children = children || [];
    this.key = props ? props.key : void 666;

    var count = 0;

    utils.each(this.children, function(child, i) {
      if (child instanceof Element) {
        count += child.count;
      } else {
        children[i] = '' + child;
      }
      count ++;
    });

    this.count = count;
  }

  Element.prototype.render = function() {
    var el = document.createElement(this.tagName);
    var props = this.props;

    for (var propName in props) {
      var propValue = props[propName];
      utils.setAttr(el, propName, propValue);
    }

    utils.each(this.children, function(child) {
      var childEl = (child instanceof Element) ? child.render() : document.createTextNode(child);
      el.appendChild(childEl);
    });

    return el;
  };

  var element = Element;

  function astToVm(ast, data) {
    return element(ast.tag, ast.attrsMap, handleChildren(ast.children, data));
  }

  function handleChildren(children, data) {
    var childs = [];
    for (var i = 0, len = children.length; i < len; i++) {
      var item = children[i];
      let childEl = [];
      if (children[i].children && children[i].children.length > 0) {
        childEl = handleChildren(children[i].children, data);
      }
      if (children[i].type === 1) {
        childs.push(
          element(children[i].tag || 'null', children[i].attrsMap, childEl)
        );
      } else if (children[i].type === 2) {
        childs.push(
          children[i].tplFn(data)
        );
      } else {
        childs.push(
          children[i].text
        );
      }

    }
    return childs;
  }

  const render = {

    mount($node, $dom) {

      // let $newDom = this.generalDom($node.$tplfn($data));
      

      this.replaceNode($dom, $node);

    },

    generalDom(domStr) {
      var $temp = document.createElement('div');
      $temp.innerHTML = domStr.trim(); // 不然会有多余的空格等东西
      return $temp.childNodes[0];
    },

    replaceNode(newDom, node) {
      let $el = node.$el;

      $el.parentNode.replaceChild(newDom, $el);

      node.$el = newDom;
    }


  };

  var REPLACE = 0;
  var REORDER = 1;
  var PROPS = 2;
  var TEXT = 3;

  function patch(node, patches) {
    var walker = {index: 0};
    dfsWalk(node, walker, patches);
  }

  function dfsWalk(node, walker, patches) {
    var currentPatches = patches[walker.index];

    var len = node.childNodes ? node.childNodes.length : 0;

    for (var i = 0; i < len; i++) {
      var child = node.childNodes[i];
      walker.index++;
      dfsWalk(child, walker, patches);
    }

    if (currentPatches) {
      applyPatches(node, currentPatches);
    }
  }

  function applyPatches(node, currentPatches) {
    utils.each(currentPatches, function(currentPatch) {
      switch (currentPatch.type) {
        case REPLACE:
          var newNode = (typeof currentPatch.node === 'string') ? document.createTextNode(currentPatch.node) : currentPatch.node.render();
          node.parrentNode.replaceChild(newNode, node);
          break;
        case REORDER:
          reorderChildren(node, currentPatch.moves);
          break;
        case PROPS:
          setProps(node, currentPatch.props);
          break;
        case TEXT:
          if (node.textContent) {
            node.textContent = currentPatch.content;
          } else {
            node.nodeValue = currentPatch.content;
          }
          break;
        default:
          throw new Error('Unknow patch type ' + currentPatch.type);
      }
    });
  }

  function setProps(node, props) {
    for (var key in props) {
      if (props[key] === void 666) {
        node.removeAttribute(key);
      } else {
        var value = props[key];
        utils.setAttr(node, key, value);
      }
    }
  }

  function reorderChildren(node, moves) {
    var staticNodeList = utils.toArray(node.childNodes);
    var maps = {};

    utils.each(staticNodeList, function(node) {
      if (node.nodeType === 1) {
        var key = node.getAttribute('key');
        if (key) {
          maps[key] = node;
        }
      }
    });

    utils.each(moves, function(move) {
      var index = move.index;
      if (move.type === 0) {
        if (staticNodeList[index] === node.childNodes[index]) {
          node.removeChild(node.childNodes[index]);
        }
        staticNodeList.splice(index, 1);
      } else if (move.type === 1) {
        var insertNode = maps[move.item.key] 
          ? maps[move.item.key].cloneNode(true) 
          : (typeof move.item === 'object')
            ? move.item.render()
            : document.createTextNode(move.item);
        staticNodeList.splice(index, 0, insertNode);
        node.insertBefore(insertNode, node.childNodes[index] || null);
      }
    });
  }

  patch.REPLACE = REPLACE;
  patch.REORDER = REORDER;
  patch.PROS = PROPS;
  patch.TEXT = TEXT;

  var patch_1 = patch;

  /**
   * Diff two list in O(N).
   * @param {Array} oldList - Original List
   * @param {Array} newList - List After certain insertions, removes, or moves
   * @return {Object} - {moves: <Array>}
   *                  - moves is a list of actions that telling how to remove and insert
   */
  function diff (oldList, newList, key) {
    var oldMap = makeKeyIndexAndFree(oldList, key);
    var newMap = makeKeyIndexAndFree(newList, key);

    var newFree = newMap.free;

    var oldKeyIndex = oldMap.keyIndex;
    var newKeyIndex = newMap.keyIndex;

    var moves = [];

    // a simulate list to manipulate
    var children = [];
    var i = 0;
    var item;
    var itemKey;
    var freeIndex = 0;

    // fist pass to check item in old list: if it's removed or not
    while (i < oldList.length) {
      item = oldList[i];
      itemKey = getItemKey(item, key);
      if (itemKey) {
        if (!newKeyIndex.hasOwnProperty(itemKey)) {
          children.push(null);
        } else {
          var newItemIndex = newKeyIndex[itemKey];
          children.push(newList[newItemIndex]);
        }
      } else {
        var freeItem = newFree[freeIndex++];
        children.push(freeItem || null);
      }
      i++;
    }

    var simulateList = children.slice(0);

    // remove items no longer exist
    i = 0;
    while (i < simulateList.length) {
      if (simulateList[i] === null) {
        remove(i);
        removeSimulate(i);
      } else {
        i++;
      }
    }

    // i is cursor pointing to a item in new list
    // j is cursor pointing to a item in simulateList
    var j = i = 0;
    while (i < newList.length) {
      item = newList[i];
      itemKey = getItemKey(item, key);

      var simulateItem = simulateList[j];
      var simulateItemKey = getItemKey(simulateItem, key);

      if (simulateItem) {
        if (itemKey === simulateItemKey) {
          j++;
        } else {
          // new item, just inesrt it
          if (!oldKeyIndex.hasOwnProperty(itemKey)) {
            insert(i, item);
          } else {
            // if remove current simulateItem make item in right place
            // then just remove it
            var nextItemKey = getItemKey(simulateList[j + 1], key);
            if (nextItemKey === itemKey) {
              remove(i);
              removeSimulate(j);
              j++; // after removing, current j is right, just jump to next one
            } else {
              // else insert item
              insert(i, item);
            }
          }
        }
      } else {
        insert(i, item);
      }

      i++;
    }

    function remove (index) {
      var move = {index: index, type: 0};
      moves.push(move);
    }

    function insert (index, item) {
      var move = {index: index, item: item, type: 1};
      moves.push(move);
    }

    function removeSimulate (index) {
      simulateList.splice(index, 1);
    }

    return {
      moves: moves,
      children: children
    }
  }

  /**
   * Convert list to key-item keyIndex object.
   * @param {Array} list
   * @param {String|Function} key
   */
  function makeKeyIndexAndFree (list, key) {
    var keyIndex = {};
    var free = [];
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      var itemKey = getItemKey(item, key);
      if (itemKey) {
        keyIndex[itemKey] = i;
      } else {
        free.push(item);
      }
    }
    return {
      keyIndex: keyIndex,
      free: free
    }
  }

  function getItemKey (item, key) {
    if (!item || !key) return void 666
    return typeof key === 'string'
      ? item[key]
      : key(item)
  }

  var makeKeyIndexAndFree_1 = makeKeyIndexAndFree; // exports for test
  var diff_2 = diff;

  var diff_1 = {
  	makeKeyIndexAndFree: makeKeyIndexAndFree_1,
  	diff: diff_2
  };

  var listDiff2 = diff_1.diff;

  function diff$1(oldTree, newTree) {
    var index = 0;
    var patches = {};
    dfsWalk$1(oldTree, newTree, index, patches);
    return patches;
  }

  function dfsWalk$1(oldNode, newNode, index, patches) {
    var currentPatch = [];

    // Node is removed.
    if (newNode === null) ; else if (utils.isString(oldNode) && utils.isString(newNode)) {
      if (newNode !== oldNode) {
        currentPatch.push({ type: patch_1.TEXT, content: newNode });
      }
    // Nodes are the same, diff old node's props and children
    } else if (
      oldNode.tagName === newNode.tagName &&
        oldNode.key === newNode.key
    ) {
      // Diff props
      var propsPatches = diffProps(oldNode, newNode);
      if (propsPatches) {
        currentPatch.push({ type: patch_1.PROPS, props: propsPatches });
      }
      // Diff children. If the node has a `ignore` property, do not diff children
      if (!isIgnoreChildren(newNode)) {
        diffChildren(
          oldNode.children,
          newNode.children,
          index,
          patches,
          currentPatch
        );
      }
    // Nodes are not the same, replace the old node with new node
    } else {
      currentPatch.push({ type: patch_1.REPLACE, node: newNode });
    }

    if (currentPatch.length) {
      patches[index] = currentPatch;
    }
  }

  function diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
    var diffs = listDiff2(oldChildren, newChildren, 'key');

    newChildren = diffs.children;

    if (diffs.moves.length) {
      var reorderPatch = { type: patch_1.REORDER, moves: diffs.moves };
      currentPatch.push(reorderPatch);
    }

    var leftNode = null;
    var currentNodeIndex = index;

    utils.each(oldChildren, function(child, i) {
      var newChild = newChildren[i];
   
      currentNodeIndex = (leftNode && leftNode.count)
        ? currentNodeIndex + leftNode.count + 1
        : currentNodeIndex + 1;

      dfsWalk$1(child, newChild, currentNodeIndex, patches);
      leftNode = child;
    });
  }
  // 比较prop的不同
  function diffProps(oldNode, newNode) {
    var count = 0;
    var oldProps = oldNode.props;
    var newProps = newNode.props;

    var key; var value;
    var propsPatches = {};

    // Find out different properties
    for (key in oldProps) {
      value = oldProps[key];
      if (newProps[key] !== value) {
        count++;
        propsPatches[key] = newProps[key];
      }
    }

    // Find out new property
    for (key in newProps) {
      value = newProps[key];
      if (!oldProps.hasOwnProperty(key)) {
        count++;
        propsPatches[key] = newProps[key];
      }
    }

    // If properties all are identical
    if (count === 0) {
      return null;
    }

    return propsPatches;
  }

  function isIgnoreChildren(node) {
    return (node.props && node.props.hasOwnProperty('ignore'));
  }

  var diff_1$1 = diff$1;

  class Node {

    constructor({el, template, data}) {
      this.$data = data;
      this.el = el;
      this.template = template;
      this.$el = selector.s(this.el);

      let $t = selector.s(this.template);
      if ($t) {
        this.$template = $t.innerHTML.trim();
      }
      // ast
      this.$ast = new Parse(this.$template);
   
      // // virtualDom 但是不挂载数据
      this.$vm = astToVm(this.$ast, this.$data);
      this.$dom = this.$vm.render();

    }

    update() {
      // 构造新的vm 使用diff算法进行比较 再调用patch方法
      // EventLoop.d_o(Render.mount.bind(Render, this, this.$data));
      console.log('更新');
      let $newVm = astToVm(this.$ast, this.$data);
      console.log($newVm);
      console.log(diff_1$1(this.$vm, $newVm));
      let patches = diff_1$1(this.$vm, $newVm);
      patch_1(this.$dom, patches);

    }

  }

  class Watcher {
    constructor(data) {
      this.$data = data;
      this.mountWatcher();
    }

    mountWatcher() {
      let od = this.$data._od_;

      for (let key in this.$data) {
        (function(key) {
          let timeoutHandler = null;

          if (key !== '_od_' && !od[key].mounted) {
            if (!od[key]) {
              throw new Error(`data: ${key} is init`);
            }
            Object.defineProperty(this.$data, key, {
              get() {
                return od[key].value;
              },
              set(value) {
                clearTimeout(timeoutHandler);
                setTimeout(() => {
                  if (value !== od[key].value) {
                    var $n = od[key].linkNodes;
                    od[key].value = value;
                    for (var i = 0, n; n = $n[i]; i++) {
                      n.update();
                    }
                  }
                }, 1000 / 60);
              }
            });
            od[key].mounted = true;
          }

        }.bind(this))(key);
      }
    }

    linkNode($node) {
      // for (let i = 0, n; n = $node.$args[i]; i++) {
      //   if (this.$data[n] && this.$data._od_[n] && this.$data._od_[n].linkNodes.indexOf($node) === -1) {
      //     this.$data._od_[n].linkNodes.push($node);
      //   }
      // }
      for (var i in this.$data) {
        if (this.$data._od_[i] && this.$data._od_[i].linkNodes.indexOf($node) === -1) {
          this.$data._od_[i].linkNodes.push($node);
        }
      }
    }

    updateData() {

    }
  }

  const helper = {
    insertOD($targetData, $data) {
      
      !$targetData && ($targetData = {});

      for (var key in $data) {
        $targetData[key] = {
          value: $data[key],
          linkNodes: [],
          mounted: false
        };
      }
      return $targetData;
    }
  };

  class Data {
    static formatData(data = {}) {
      data._od_ = helper.insertOD(data._od_, data);
      return data;
    }
  }

  class KV {
    constructor(opt = {}) {
      this._$opt = opt;

      this.formatOption(opt);

      // // 挂载元素
      this.mountRoot();

    }

    formatOption(opt) {

      this.$data = Data.formatData(opt.data);

      // 获得ast

      this.$root = new Node(opt);

      this.$watcher = new Watcher(this.$data);

      console.log(this.$watcher);
      this.$watcher.linkNode(this.$root);

   
    }

    mountRoot() {
      render.mount(this.$root, this.$root.$dom);
    }

  }

  return KV;

}());

import el from '../vm/element';

function astToVm(ast, data) {
  return el(ast.tag, ast.attrsMap, handleChildren(ast.children, data));
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
        el(children[i].tag || 'null', children[i].attrsMap, childEl)
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

function insertData(expression, data) {

}

export default astToVm;
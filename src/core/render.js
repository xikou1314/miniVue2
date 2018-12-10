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


export default render;
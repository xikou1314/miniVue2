import selector from '../common/selector';

import EventLoop from './event-loop';

import Parse from '../parse/parse'; 

import astToVm from '../parse/astToVm';

import diff from '../vm/diff';

import patch from '../vm/patch';

class Node {

  constructor({el, template, data}) {
    this.$data = data;
    this.el = el;
    this.template = template;
    this.$el = selector.s(this.el);

    let $t = selector.s(this.template);
    if ($t) {
      this.$template = $t.innerHTML.trim();
    } else {
      // error
    }
    // ast
    let $parse = new Parse(this.$template);
    this.$ast = $parse.root;
    this.$args = $parse.args;
    // // virtualDom 
    this.$vm = astToVm(this.$ast, this.$data);
    this.$dom = this.$vm.render();

  }

  update() {
    // 构造新的vm 使用diff算法进行比较 再调用patch方法
    EventLoop.d_o(function() {
      let $newVm = astToVm(this.$ast, this.$data);
      let patches = diff(this.$vm, $newVm);
      patch(this.$dom, patches);
    }.bind(this));
  }

}

export default Node;
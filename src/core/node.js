import selector from '../common/selector';

import Compiler from './compiler';

import Render from './render';

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
    console.log(diff(this.$vm, $newVm));
    let patches = diff(this.$vm, $newVm);
    patch(this.$dom, patches);

  }

}

export default Node;
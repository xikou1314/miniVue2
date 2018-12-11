import Node from './node';
import Watcher from './watcher';
import Data from './data';
import render from './render';
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

    this.$watcher.linkNode(this.$root);

 
  }

  mountRoot() {
    render.mount(this.$root, this.$root.$dom);
  }

}

export default KV;
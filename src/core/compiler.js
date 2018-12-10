import Parse from '../parse/parse';
import astToVm from '../parse/astToVm';


const compiler_helper = {
  generaltplFn(tpl) {

    // 得到ast抽象语法树
    // let ast = new Parse(tpl); 
    // console.log('ast');
    // console.log(ast);


    // // 数据绑定


    // // 将ast转换为vm

    // let vm = astToVm(ast);
    // console.log('虚拟dom');
    // console.log(vm);
    // console.log(vm.render());
    // let patt = /\{\{((?:.|\n)+?)\}\}/g; // 双花括号语法
    // let result;

    // let tempStrFn = '';
    // let fnArgs = [];
    // let cursor = 0;

    // while ((result = patt.exec(tpl)) !== null) {
    //   var $temp1 = tpl.slice(cursor, result.index);
    //   cursor += $temp1.length;

    //   tempStrFn += this.wrapStaticBlock($temp1);

    //   fnArgs.push(result[1]);
    //   tempStrFn += this.wrapDynamicBlock(result);
    //   cursor += result[0].length;
    // }

    // let tempLast = tpl.slice(cursor, tpl.length);

    // tempStrFn += this.wrapStaticBlock(tempLast);

    // let tplFn = this.gTplFn(tempStrFn);

    // return {
    //   tplFn: tplFn,
    //   linkArgs: fnArgs
    // };
  },
  wrapStaticBlock: function(str) {
    return "\'" + str + "\'";
  },
  wrapDynamicBlock: function(result) {
    return ' + od.' + result[1] + ' + ';
  },
  gTplFn: function(str) {
    let $t = 'return ' + str;

    $t = $t.replace(/\n/g, '');

    let $tempFn = new Function('od', $t);

    return $tempFn;
  }

};

class Compiler {
  constructor(tpl) {
    this.tpl = tpl;
    this.init(compiler_helper.generaltplFn(this.tpl));
  }

  init({tplFn, linkArgs}) {
    this.tplFn = tplFn;
    this.linkArgs = linkArgs;
  }
}
export default Compiler;
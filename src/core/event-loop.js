let EventLoop = {
  d_o(fn) {
    let p = Promise.resolve();
    p.then(fn).catch((e) => {
      console.log(e);
    });
  }
};

export default EventLoop;
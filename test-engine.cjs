// Run the actual engine and worker embedded in the deployed single-file app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].split('\n(() => {')[0];
const context = {module: {exports: {}}};
vm.runInNewContext(source, context);
const M = context.module.exports;
const near = (a,b,t=1e-12) => assert.ok(Math.abs(a-b)<t, `${a} differs from ${b}`);
const cfg = (n,r,mode,error=.25) => ({n,r,mode,error});
const informed = M.doorConfigs(cfg(3,1,'informed'),true);
assert.equal(informed.length,98);
for (const c of informed) {
  assert.equal(c.r,c.n-2);
  near(M.theory(c).stay,1/c.n);
  near(M.theory(c).switch,1-1/c.n);
}
for (const c of M.doorConfigs(cfg(3,1,'uninformed'),true)) {
  near(M.theory(c).stay,.5);near(M.theory(c).switch,.5);near(M.theory(c).eligible,2/c.n);
}
const fixed=M.doorConfigs(cfg(8,5,'uninformed'),false);
assert.equal(fixed[0].n,7);assert.equal(fixed.length,94);
for (const c of fixed) {assert.equal(c.r,5);near(M.theory(c).switch,1/(c.n-5));}
assert.equal(M.doorConfigs(cfg(100,98,'informed'),false).length,1);
for (const n of [3,10,100]) for(const r of [1,n-2]) for(const error of [0,.25,.7,1]) {
  const c=cfg(n,r,'fallible',error), t=M.theory(c);
  near(t.stay+(n-r-1)*t.switch,1);
  if(error===0)near(t.switch,M.theory({...c,mode:'informed'}).switch);
  if(error===1)near(t.switch,M.theory({...c,mode:'uninformed'}).switch);
}
// Exercise the exact worker protocol used for both the curve and normal runs.
function runWorker(configs,count,sweep) {
  const messages=[], worker={postMessage:m=>messages.push(m)};
  vm.runInNewContext(M.workerSource,worker);
  worker.onmessage({data:{configs,count,sweep,seed:'curve-check'}});
  assert.equal(messages.at(-1).type,'done');
  assert.equal(messages.filter(m=>m.type==='progress').at(-1).value,1);
  return messages.at(-1).results;
}
const results=runWorker(informed,1234,true);
assert.equal(results.length,98);
for(const r of results){assert.equal(r.trials,1234);assert.equal(r.eligible,1234);assert.equal(r.points.length,0);assert.equal(r.stayWins+r.switchWins,1234);assert.equal(r.seed,`curve-check|doors|${r.config.n}`);}
for(const c of [cfg(3,1,'informed'),cfg(3,1,'uninformed'),cfg(8,3,'fallible',.45),cfg(100,98,'uninformed')]) {
  const a=M.batch(c,50000,'test-seed'),b=M.batch(c,50000,'test-seed');
  assert.deepEqual(a,b);assert.equal(a.eligible+a.carReveals,a.trials);
  near(a.stayWins/a.eligible,a.theory.stay,.025);
  near(a.switchWins/a.eligible,a.theory.switch,.025);
  near(a.eligible/a.trials,a.theory.eligible,.01);
}
const normal=runWorker([cfg(3,1,'informed')],1,false)[0];
assert.equal(normal.trials,1);assert.equal(normal.points.length,1);assert.equal(normal.seed,'curve-check');
assert.equal(M.batch(cfg(3,1,'informed'),1000000,'limit').trials,1000000);
for(const count of [0,-1,1.5,1000001,NaN]) assert.throws(()=>M.batch(cfg(3,1,'informed'),count,'invalid'));
console.log('Passed: all door counts, both opening policies, host models, worker curve protocol, seeded simulations and trial input limits.');

export const LESSON_CORPUS = [
  'the cat sat on the mat',
  'the cat ate the fish',
  'the dog sat on the mat',
  'the dog chased the cat',
];

export const EXERCISE_CORPUS = [
  'i like natural language',
  'i like machine learning',
  'you like natural language',
  'you study machine learning',
  'we study natural language processing',
];

export function words(text, {lower = true, punctuation = false, normalize = false} = {}) {
  const input = normalize ? text.normalize('NFKC') : text;
  const source = lower ? input.toLocaleLowerCase() : input;
  return source.match(punctuation ? /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu : /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

export function bpe(text, merges = 4, options = {}) {
  const sequence = words(text,{lower:options.lower??true,normalize:options.normalize??false});
  let units = sequence.map(word => [...word]);
  const history = [];
  for (let step = 0; step < merges; step++) {
    const counts = new Map();
    for (const pieces of units) for (let i = 0; i < pieces.length - 1; i++) {
      const key = JSON.stringify([pieces[i], pieces[i+1]]);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
    if (!ranked.length) break;
    const [key, count] = ranked[0];
    const [left, right] = JSON.parse(key);
    units = units.map(parts => {
      const next = [];
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === left && parts[i+1] === right) { next.push(left+right); i++; }
        else next.push(parts[i]);
      }
      return next;
    });
    history.push({left, right, count, units: units.map(x => [...x])});
  }
  return {sequence, units, history};
}

export function editDistance(source, target, costs = {insert:1, delete:1, substitute:1}) {
  const a = [...source], b = [...target];
  const grid = Array.from({length:a.length+1}, () => Array(b.length+1).fill(0));
  const candidates = Array.from({length:a.length+1}, () => Array(b.length+1).fill(null));
  for (let i=1;i<=a.length;i++) grid[i][0] = grid[i-1][0] + costs.delete;
  for (let j=1;j<=b.length;j++) grid[0][j] = grid[0][j-1] + costs.insert;
  for (let i=1;i<=a.length;i++) for (let j=1;j<=b.length;j++) {
    const options = [
      {op:'delete', value:grid[i-1][j]+costs.delete, from:[i-1,j]},
      {op:'insert', value:grid[i][j-1]+costs.insert, from:[i,j-1]},
      {op:a[i-1]===b[j-1]?'match':'substitute', value:grid[i-1][j-1]+(a[i-1]===b[j-1]?0:costs.substitute), from:[i-1,j-1]},
    ];
    grid[i][j] = Math.min(...options.map(x=>x.value));
    candidates[i][j] = options;
  }
  const path = [[a.length,b.length]];
  const operations = [];
  let i=a.length,j=b.length;
  while (i || j) {
    if (!i) {operations.push({op:'insert', from:'', to:b[j-1]});j--;}
    else if (!j) {operations.push({op:'delete', from:a[i-1], to:''});i--;}
    else {
      const option = [...candidates[i][j]].sort((x,y)=>x.value-y.value || ({match:0,substitute:1,delete:2,insert:3}[x.op]-{match:0,substitute:1,delete:2,insert:3}[y.op]))[0];
      operations.push({op:option.op,from:option.op==='insert'?'':a[i-1],to:option.op==='delete'?'':b[j-1]});
      [i,j]=option.from;
    }
    path.push([i,j]);
  }
  return {a,b,grid,candidates,path,operations:operations.reverse(),distance:grid[a.length][b.length]};
}

export function cooccurrence(lines, radius=1) {
  const sentences = lines.map(line=>words(line)).filter(x=>x.length);
  const vocab=[...new Set(sentences.flat())].sort();
  const counts=Object.fromEntries(vocab.map(w=>[w,Object.fromEntries(vocab.map(c=>[c,0]))]));
  for (const tokens of sentences) for (let i=0;i<tokens.length;i++) for (let j=Math.max(0,i-radius);j<=Math.min(tokens.length-1,i+radius);j++) {
    if (i!==j) counts[tokens[i]][tokens[j]]++;
  }
  return {sentences,vocab,counts};
}

export function cosine(v,w) {
  const dot=v.reduce((sum,x,i)=>sum+x*w[i],0);
  const left=Math.hypot(...v),right=Math.hypot(...w);
  return {dot,left,right,value:left&&right?dot/(left*right):null};
}

export function ngramModel(lines) {
  const sentences=lines.map(line=>words(line)).filter(x=>x.length);
  const vocab=[...new Set([...sentences.flat(),'</s>'])].sort((a,b)=>a==='</s>'?1:b==='</s>'?-1:a.localeCompare(b));
  const maps={1:new Map(),2:new Map(),3:new Map()};
  const totals={1:new Map(),2:new Map(),3:new Map()};
  let total=0;
  for (const tokens of sentences) {
    const outputs=[...tokens,'</s>'];total+=outputs.length;
    for (let order=1;order<=3;order++) {
      const padded=[...Array(order-1).fill('<s>'),...outputs];
      for (let i=order-1;i<padded.length;i++) {
        const history=padded.slice(i-order+1,i);
        const key=JSON.stringify(history), token=padded[i];
        if (!maps[order].has(key)) maps[order].set(key,new Map());
        maps[order].get(key).set(token,(maps[order].get(key).get(token)||0)+1);
        totals[order].set(key,(totals[order].get(key)||0)+1);
      }
    }
  }
  return {sentences,vocab,maps,totals,total};
}

export function conditional(model, history, token, order=2, method='mle', k=0.3) {
  const h=order===1 ? [] : history.slice(-(order-1));
  while(h.length<order-1)h.unshift('<s>');
  const key=JSON.stringify(h), count=model.maps[order].get(key)?.get(token)||0;
  const denominator=model.totals[order].get(key)||0;
  if (!model.vocab.includes(token)) return {count,denominator,value:0};
  if (method==='addk') return {count,denominator,value:(count+k)/(denominator+k*model.vocab.length)};
  if (method==='laplace') return {count,denominator,value:(count+1)/(denominator+model.vocab.length)};
  return {count,denominator,value:denominator?count/denominator:null};
}

export function interpolation(model, history, token, weights=[0.15,0.25,0.6]) {
  const parts=[1,2,3].map((order,i)=>({order,weight:weights[i],result:conditional(model,history,token,order)}));
  const active=parts.filter(p=>p.result.value!==null);
  const divisor=active.reduce((sum,p)=>sum+p.weight,0);
  return {parts,value:divisor?active.reduce((sum,p)=>sum+p.weight*p.result.value,0)/divisor:null,divisor};
}

export function stupidBackoff(model, history, token, order=3, alpha=0.4) {
  const result=conditional(model,history,token,order);
  if (result.count || order===1) return {value:result.value || 0,used:order};
  const lower=stupidBackoff(model,history,token,order-1,alpha);
  return {value:alpha*lower.value,used:lower.used};
}

export function scoreSentence(model, sentence, order=2, method='addk', k=0.3) {
  const tokens=[...words(sentence),'</s>'];
  const history=Array(order-1).fill('<s>');
  let logProbability=0;
  const steps=tokens.map(token=>{
    const current=[...history];
    const result=conditional(model,current,token,order,method,k);
    const value=result.value ?? 0;
    if (!value)logProbability=-Infinity;
    else if (Number.isFinite(logProbability))logProbability+=Math.log(value);
    history.push(token);if(history.length>order-1)history.shift();
    return {token,history:current,...result,value};
  });
  return {steps,logProbability,perplexity:tokens.length?(Number.isFinite(logProbability)?Math.exp(-logProbability/tokens.length):Infinity):null};
}

export function softmax(scores) {
  const max=Math.max(...scores), exps=scores.map(x=>Math.exp(x-max));
  const sum=exps.reduce((a,b)=>a+b,0);
  return exps.map(x=>x/sum);
}

const EMBED_LINES=['cats chase mice','dogs chase balls','cats like milk','dogs like bones'];
export function makeTrainer(mode='skipgram') {
  const corpus=EMBED_LINES.map(line=>words(line));
  const vocab=[...new Set(corpus.flat())].sort();
  let seed=173;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const E=vocab.map(()=>[(random()-0.5)*0.8,(random()-0.5)*0.8]);
  const U=vocab.map(()=>[(random()-0.5)*0.8,(random()-0.5)*0.8]);
  const pairs=[];
  for(const sentence of corpus) for(let i=0;i<sentence.length;i++){
    const context=[i-1,i+1].filter(j=>j>=0&&j<sentence.length).map(j=>vocab.indexOf(sentence[j]));
    if(mode==='cbow')pairs.push({inputs:context,target:vocab.indexOf(sentence[i]),sentence});
    else for(const target of context)pairs.push({inputs:[vocab.indexOf(sentence[i])],target,sentence});
  }
  return {mode,vocab,E,U,pairs,step:0,last:null};
}

export function trainerForward(trainer,pair=trainer.pairs[trainer.step%trainer.pairs.length]) {
  const hidden=[0,0];
  for(const index of pair.inputs){hidden[0]+=trainer.E[index][0]/pair.inputs.length;hidden[1]+=trainer.E[index][1]/pair.inputs.length;}
  const logits=trainer.U.map(row=>row[0]*hidden[0]+row[1]*hidden[1]);
  const probabilities=softmax(logits);
  return {hidden,logits,probabilities,loss:-Math.log(probabilities[pair.target])};
}

export function trainStep(trainer,rate=0.45) {
  const pair=trainer.pairs[trainer.step%trainer.pairs.length];
  const before=trainerForward(trainer,pair);
  const dlogits=before.probabilities.map((p,i)=>p-(i===pair.target?1:0));
  const dh=[0,0];
  for(let j=0;j<trainer.vocab.length;j++)for(let d=0;d<2;d++)dh[d]+=dlogits[j]*trainer.U[j][d];
  for(let j=0;j<trainer.vocab.length;j++)for(let d=0;d<2;d++)trainer.U[j][d]-=rate*dlogits[j]*before.hidden[d];
  for(const index of pair.inputs)for(let d=0;d<2;d++)trainer.E[index][d]-=rate*dh[d]/pair.inputs.length;
  trainer.step++;
  trainer.last={pair,before,after:trainerForward(trainer,pair),rate};
  return trainer.last;
}

export function makeNetwork() {
  return {x:[1,0],W:[[0.8,-0.5],[-0.4,0.9]],b:[0.1,0.1],U:[[0.7,-0.2],[-0.3,0.8]],c:[0.1,-0.1],target:0,rate:0.2,last:null};
}

export function networkForward(net) {
  const z=net.W.map((row,j)=>row.reduce((sum,w,i)=>sum+w*net.x[i],net.b[j]));
  const a=z.map(v=>Math.max(0,v));
  const logits=net.U.map((row,j)=>row.reduce((sum,w,i)=>sum+w*a[i],net.c[j]));
  const probabilities=softmax(logits);
  return {z,a,logits,probabilities,loss:-Math.log(probabilities[net.target])};
}

export function networkStep(net) {
  const before=networkForward(net);
  const dlogits=before.probabilities.map((p,j)=>p-(j===net.target?1:0));
  const da=before.a.map((_,i)=>net.U.reduce((sum,row,j)=>sum+dlogits[j]*row[i],0));
  const dz=da.map((v,i)=>before.z[i]>0?v:0);
  for(let j=0;j<2;j++){
    for(let i=0;i<2;i++)net.U[j][i]-=net.rate*dlogits[j]*before.a[i];
    net.c[j]-=net.rate*dlogits[j];
  }
  for(let j=0;j<2;j++){
    for(let i=0;i<2;i++)net.W[j][i]-=net.rate*dz[j]*net.x[i];
    net.b[j]-=net.rate*dz[j];
  }
  net.last={before,after:networkForward(net)};
  return net.last;
}

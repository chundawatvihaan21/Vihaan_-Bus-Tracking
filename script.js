const STORAGE_KEY = 'busEntries_v1';

function todayISO(){ return new Date().toISOString().slice(0,10); }

function loadEntries(){
  const raw = localStorage.getItem(STORAGE_KEY);
  try{ return raw ? JSON.parse(raw) : []; }catch(e){return [];}
}
function saveEntries(entries){ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }

const entryForm = document.getElementById('entryForm');
const tbody = document.querySelector('#entriesTable tbody');
const seedBtn = document.getElementById('seedBtn');
const exportBtn = document.getElementById('exportCsv');
const resetBtn = document.getElementById('resetBtn');

document.getElementById('date').value = todayISO();

let barChart, lineChart, pieChart;
function initCharts(){
  barChart = new Chart(document.getElementById('barChart'), {
    type:'bar',
    data:{labels:[],datasets:[{label:'Students Present',data:[]}]},
    options:{responsive:true,maintainAspectRatio:false}
  });

  lineChart = new Chart(document.getElementById('lineChart'), {
    type:'line',
    data:{labels:[],datasets:[]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false}}
  });

  pieChart = new Chart(document.getElementById('pieChart'), {
    type:'pie',
    data:{labels:['Present','Absent'],datasets:[{data:[0,0]}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

function renderTable(entries){
  tbody.innerHTML='';
  const list = entries.slice().reverse();
  list.forEach(entry=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${entry.busNo}</td>
      <td>${entry.date}</td>
      <td>${entry.present}</td>
      <td>${entry.absent}</td>
      <td>${entry.distance}</td>
      <td><button data-id="${entry.id}" class="del">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

function computeBar(entries){
  const map={};
  entries.forEach(e=>{
    if(!map[e.busNo]||new Date(e.date)>=new Date(map[e.busNo].date)) map[e.busNo]=e;
  });
  const labels=Object.keys(map).sort();
  const data=labels.map(b=>map[b].present);
  return {labels,data};
}

function computeLine(entries){
  const days=[],today=new Date();
  for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);days.push(d.toISOString().slice(0,10));}
  const buses=[...new Set(entries.map(e=>e.busNo))].sort();
  const datasets=buses.map(bus=>{
    const data=days.map(day=>entries.filter(e=>e.busNo===bus&&e.date===day).reduce((s,it)=>s+Number(it.distance||0),0));
    return {label:bus,data};
  });
  return {days,datasets};
}

function computePie(entries){
  const totalPresent=entries.reduce((s,e)=>s+Number(e.present||0),0);
  const totalAbsent=entries.reduce((s,e)=>s+Number(e.absent||0),0);
  return {data:[totalPresent,totalAbsent]};
}

function updateCharts(entries){
  const bar=computeBar(entries);
  barChart.data.labels=bar.labels;
  barChart.data.datasets[0].data=bar.data;
  barChart.update();

  const line=computeLine(entries);
  lineChart.data.labels=line.days;
  lineChart.data.datasets=line.datasets.map(ds=>({label:ds.label,data:ds.data,fill:false,tension:0.2}));
  lineChart.update();

  const pie=computePie(entries);
  pieChart.data.datasets[0].data=pie.data;
  pieChart.update();
}

entryForm.addEventListener('submit',e=>{
  e.preventDefault();
  const busNo=document.getElementById('busNo').value.trim();
  const date=document.getElementById('date').value||todayISO();
  const present=parseInt(document.getElementById('present').value)||0;
  const absent=parseInt(document.getElementById('absent').value)||0;
  const distance=parseFloat(document.getElementById('distance').value)||0;
  if(!busNo){alert('Enter Bus No.');return;}
  const entries=loadEntries();
  entries.push({id:Date.now(),busNo,date,present,absent,distance});
  saveEntries(entries);
  renderAll();
  e.target.reset();
  document.getElementById('date').value=todayISO();
});

tbody.addEventListener('click',e=>{
  if(e.target.classList.contains('del')){
    const id=Number(e.target.dataset.id);
    let entries=loadEntries();
    entries=entries.filter(x=>x.id!==id);
    saveEntries(entries);
    renderAll();
  }
});

seedBtn.addEventListener('click',()=>{
  const sample=[];
  const today=new Date();
  const buses=['Bus 1','Bus 2','Bus 3','Bus 4'];
  for(let d=0;d<5;d++){
    const date=new Date();date.setDate(today.getDate()-d);
    const iso=date.toISOString().slice(0,10);
    buses.forEach((b,i)=>{
      sample.push({id:Date.now()+Math.random()*10000,busNo:b,date:iso,present:40+i+d,absent:2+i%3,distance:25+i+d});
    });
  }
  const entries=loadEntries().concat(sample);
  saveEntries(entries);
  renderAll();
});

exportBtn.addEventListener('click',()=>{
  const entries=loadEntries();
  if(entries.length===0){alert('No data to export');return;}
  const header=['id','busNo','date','present','absent','distance'];
  const csv=[header.join(',')].concat(entries.map(e=>[e.id,e.busNo,e.date,e.present,e.absent,e.distance].join(','))).join('\\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='bus_entries.csv';a.click();URL.revokeObjectURL(url);
});

resetBtn.addEventListener('click',()=>{
  if(confirm('This will remove all saved data. Continue?')){
    localStorage.removeItem(STORAGE_KEY);
    renderAll();
  }
});

function renderAll(){
  const entries=loadEntries();
  renderTable(entries);
  updateCharts(entries);
}

initCharts();
renderAll();

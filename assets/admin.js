const $ = (sel) => document.querySelector(sel);

function clean(s){ return (s||"").toString().trim(); }

function driveToDirect(url){
  url = clean(url);
  if(!url) return "";
  const m = url.match(/\/d\/([^/]+)\//);
  if(m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return url;
}

function parsePrice(raw, cur){
  raw = clean(raw);
  const currency = cur || "ARS";
  const nums = (raw.match(/[\d\.,]+/g) || []).map(n => parseInt(n.replace(/\./g,"").replace(/,/g,""),10)).filter(n=>Number.isFinite(n));
  const min = nums.length ? Math.min(...nums) : null;
  const max = nums.length ? Math.max(...nums) : null;
  return { raw, currency, values: nums, min, max };
}

const STORAGE_KEY = "nueve_car_inventory_override";

let BASE = null;
let DATA = null;

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

function loadOverride(){
  const s = localStorage.getItem(STORAGE_KEY);
  if(!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function renderList(filter=""){
  const list = $("#list");
  const f = clean(filter).toLowerCase();
  const items = DATA.items.filter(i => {
    if(!f) return true;
    return JSON.stringify(i).toLowerCase().includes(f);
  });

  list.innerHTML = "";
  items.forEach(item=>{
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.alignItems = "center";
    row.style.padding = "10px 0";
    row.style.borderBottom = "1px solid rgba(31,41,55,.8)";

    const left = document.createElement("div");
    left.style.flex = "1";
    left.innerHTML = `<strong>${item.name}</strong><div class="small">${item.category} · ${item.price?.raw || "—"} ${item.price?.currency==="USD"?"(USD)":""}</div>`;

    const edit = document.createElement("button");
    edit.textContent = "Editar";
    edit.onclick = ()=>{
      const name = prompt("Nombre:", item.name) ?? item.name;
      const cat = prompt("Categoría:", item.category) ?? item.category;
      const price = prompt("Precio (texto):", item.price?.raw || "") ?? (item.price?.raw||"");
      const cur = prompt("Moneda (ARS/USD):", item.price?.currency || "ARS") ?? (item.price?.currency||"ARS");
      const photo = prompt("Foto (URL/Drive):", item.photo || "") ?? (item.photo||"");
      const model = prompt("Modelo/Año (opcional):", item.Modelo || "") ?? (item.Modelo||"");
      item.name = clean(name);
      item.category = clean(cat);
      item.price = parsePrice(price, clean(cur).toUpperCase()==="USD" ? "USD" : "ARS");
      item.photo = driveToDirect(photo);
      if(clean(model)) item.Modelo = clean(model);
      save();
      renderList($("#q").value);
    };

    const del = document.createElement("button");
    del.textContent = "Borrar";
    del.onclick = ()=>{
      if(!confirm(`¿Borrar "${item.name}"?`)) return;
      DATA.items = DATA.items.filter(x=>x.id!==item.id);
      save();
      renderList($("#q").value);
    };

    row.appendChild(left);
    row.appendChild(edit);
    row.appendChild(del);
    list.appendChild(row);
  });

  if(!items.length){
    list.innerHTML = `<div class="small">No hay resultados.</div>`;
  }
}

function exportJson(){
  const blob = new Blob([JSON.stringify(DATA, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function init(){
  const res = await fetch("data/inventory.json", {cache:"no-store"});
  BASE = await res.json();

  DATA = loadOverride() || structuredClone(BASE);

  $("#add").onclick = ()=>{
    const name = clean($("#name").value);
    const cat = clean($("#category").value);
    const priceRaw = clean($("#price").value);
    const cur = $("#currency").value;
    const photo = driveToDirect($("#photo").value);
    const model = clean($("#model").value);
    const extra1 = clean($("#extra1").value);

    if(!name || !cat){
      alert("Falta Nombre o Categoría.");
      return;
    }

    const id = `item-${Date.now()}`;
    const item = { id, name, category: cat, photo, price: parsePrice(priceRaw, cur) };
    if(model) item.Modelo = model;

    if(extra1){
      // very simple: try "key value" format
      const m = extra1.split(":");
      if(m.length>=2){
        item[clean(m[0])] = clean(m.slice(1).join(":"));
      }else{
        item.Extra = extra1;
      }
    }

    DATA.items.unshift(item);
    save();
    ["name","category","price","photo","model","extra1"].forEach(id=>$("#"+id).value="");
    renderList($("#q").value);
  };

  $("#export").onclick = exportJson;
  $("#reset").onclick = ()=>{
    if(!confirm("¿Resetear y volver a los datos originales del repo?")) return;
    localStorage.removeItem(STORAGE_KEY);
    DATA = structuredClone(BASE);
    renderList($("#q").value);
  };

  $("#q").addEventListener("input", (e)=>renderList(e.target.value));

  renderList();
}
init();
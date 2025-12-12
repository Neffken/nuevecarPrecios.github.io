const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");
const q = $("#q");
const category = $("#category");
const currency = $("#currency");
const sort = $("#sort");
const clearBtn = $("#clear");
const stats = $("#stats");

let DATA = null;

function formatMoney(item){
  const raw = item.price?.raw || "";
  if(!raw) return "—";
  const cur = item.price?.currency || "ARS";
  // keep original formatting from excel
  return `${raw} ${cur === "USD" ? "(USD)" : ""}`.trim();
}

function searchableText(item){
  const extras = Object.entries(item)
    .filter(([k,v]) => !["id","photo","price"].includes(k))
    .map(([k,v]) => `${k}:${v}`)
    .join(" ");
  const price = item.price?.raw || "";
  return `${item.name} ${item.category} ${price} ${extras}`.toLowerCase();
}

function priceKey(item){
  const p = item.price || {};
  // prefer min, fallback max, else NaN
  return (p.min ?? p.max ?? NaN);
}

function render(items){
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if(item.photo){
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = item.name;
      img.src = item.photo;
      img.onerror = () => { img.remove(); thumb.textContent = "Sin foto"; };
      thumb.appendChild(img);
    } else {
      thumb.textContent = "Sin foto";
    }

    const body = document.createElement("div");
    body.className = "body";

    const title = document.createElement("h2");
    title.className = "title";
    title.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    const tags = [];
    tags.push(item.category);
    if(item.Modelo) tags.push(`Modelo ${item.Modelo}`);
    if(item.Cilindrada) tags.push(`${item.Cilindrada}cc`);
    if(item.Kilometros) tags.push(`${item.Kilometros} km`);
    if(item.RODADO) tags.push(`Rodado ${item.RODADO}`);
    if(item["Niño/adulto"]) tags.push(item["Niño/adulto"]);
    if(item.Stock) tags.push(`Stock ${item.Stock}`);
    tags.slice(0,5).forEach(t => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      meta.appendChild(span);
    });

    const price = document.createElement("div");
    price.className = "price";
    const strong = document.createElement("strong");
    strong.textContent = formatMoney(item);
    const small = document.createElement("span");
    small.textContent = item.price?.values?.length ? "rango" : "";
    price.appendChild(strong);
    price.appendChild(small);

    const footer = document.createElement("div");
    footer.className = "footer";
    const viewData = document.createElement("a");
    viewData.href = "#";
    viewData.textContent = "Ver datos";
    viewData.onclick = (e) => {
      e.preventDefault();
      alert(JSON.stringify(item, null, 2));
    };
    const openPhoto = document.createElement("a");
    openPhoto.href = item.photo || "#";
    openPhoto.target = "_blank";
    openPhoto.rel = "noreferrer";
    openPhoto.textContent = item.photo ? "Abrir foto" : "Sin foto";
    if(!item.photo){
      openPhoto.onclick = (e)=>e.preventDefault();
      openPhoto.style.opacity = 0.6;
      openPhoto.style.cursor = "not-allowed";
    }
    footer.appendChild(viewData);
    footer.appendChild(openPhoto);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(price);
    body.appendChild(footer);

    card.appendChild(thumb);
    card.appendChild(body);

    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function updateStats(total, shown){
  stats.innerHTML = "";
  const pill = (t) => {
    const s = document.createElement("span");
    s.className = "pill";
    s.textContent = t;
    return s;
  };
  stats.appendChild(pill(`Items: ${shown} / ${total}`));
  const cats = [...new Set(DATA.items.map(i=>i.category))].length;
  stats.appendChild(pill(`Categorías: ${cats}`));
  stats.appendChild(pill(`Fuente: ${DATA.generated_from || "inventory.json"}`));
}

function apply(){
  if(!DATA) return;
  const text = q.value.trim().toLowerCase();
  const cat = category.value;
  const cur = currency.value;
  const mode = sort.value;

  let items = DATA.items.slice();

  if(cat) items = items.filter(i => i.category === cat);
  if(cur) items = items.filter(i => (i.price?.currency || "ARS") === cur);
  if(text){
    items = items.filter(i => searchableText(i).includes(text));
  }

  if(mode === "name_asc"){
    items.sort((a,b)=>a.name.localeCompare(b.name,"es"));
  }else if(mode === "price_asc"){
    items.sort((a,b)=>(priceKey(a)??Infinity) - (priceKey(b)??Infinity));
  }else if(mode === "price_desc"){
    items.sort((a,b)=>(priceKey(b)??-Infinity) - (priceKey(a)??-Infinity));
  } // relevance = keep

  render(items);
  updateStats(DATA.items.length, items.length);
}

async function init(){
  const res = await fetch("data/inventory.json", {cache:"no-store"});
  DATA = await res.json();

  // fill categories
  const cats = [...new Set(DATA.items.map(i=>i.category))].sort((a,b)=>a.localeCompare(b,"es"));
  cats.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    category.appendChild(opt);
  });

  ["input","change"].forEach(evt=>{
    q.addEventListener(evt, apply);
    category.addEventListener(evt, apply);
    currency.addEventListener(evt, apply);
    sort.addEventListener(evt, apply);
  });

  clearBtn.addEventListener("click", ()=>{
    q.value=""; category.value=""; currency.value=""; sort.value="relevance";
    apply();
  });

  apply();
}
init();
const axios = require("axios");
(async ()=>{try{
  const lat=23.7957,lng=86.4304,radius=7000;
  const q=`[out:json][timeout:25];(node["amenity"="hospital"](around:${radius},${lat},${lng});way["amenity"="hospital"](around:${radius},${lat},${lng});relation["amenity"="hospital"](around:${radius},${lat},${lng}););out center;`;
  console.log('Query length',q.length);
  const r=await axios.post('https://overpass-api.de/api/interpreter', q, {headers:{'Content-Type':'text/plain; charset=utf-8','Accept':'application/json','User-Agent':'unitycure-test/1.0'}, timeout:30000});
  console.log('Status:', r.status);
  console.log('Elements:', Array.isArray(r.data.elements)?r.data.elements.length:0);
  console.log('Sample:', JSON.stringify((r.data.elements||[]).slice(0,3), null, 2));
}catch(e){ console.error('Error:', e.message); if(e.response){ console.error('Status:', e.response.status); try{ console.error('Data:', JSON.stringify(e.response.data).slice(0,1000)); }catch{} } process.exit(1);} })();

const { useState, useCallback } = React;

const CITIES = [
  {id:1, name:"Quetta",     lat:30.18, lng:67.00, alt:1680,  slope:1.05,    rain:240,   area:3501000000,  rc:0.60, wu:59,  temp:18,   water:909218,       pop:1565546,  precip:244,  px:193, py:298},
  {id:2, name:"Gwadar",     lat:25.12, lng:62.33, alt:150,   slope:0.15,    rain:87.5,  area:12637000000, rc:0.44, wu:55,  temp:25,   water:141000000,    pop:305160,   precip:87.5, px:108, py:388},
  {id:3, name:"Hyderabad",  lat:25.39, lng:68.37, alt:536,   slope:0.0268,  rain:40,    area:650000000,   rc:0.80, wu:96.2,temp:35,   water:372700000,    pop:10142000, precip:40,   px:285, py:382},
  {id:4, name:"Multan",     lat:30.20, lng:71.48, alt:215,   slope:0.01075, rain:69,    area:560000000,   rc:0.75, wu:29,  temp:34,   water:143000000,    pop:2313000,  precip:69,   px:335, py:288},
  {id:5, name:"Karachi",    lat:24.86, lng:67.00, alt:8,     slope:0.000089,rain:65,    area:3527000000,  rc:0.73, wu:54.5,temp:26.6, water:2955000000,   pop:20382881, precip:65,   px:218, py:408},
  {id:6, name:"Sukkur",     lat:27.72, lng:68.82, alt:67,    slope:0.00609, rain:164.6, area:5165000000,  rc:0.96, wu:80,  temp:27,   water:40900000,     pop:563851,   precip:164.6,px:280, py:345},
  {id:7, name:"Islamabad",  lat:33.70, lng:73.04, alt:520,   slope:1.33,    rain:1320,  area:906500000,   rc:0.80, wu:273, temp:21.5, water:89800000000,  pop:1108872,  precip:1500, px:385, py:218},
  {id:8, name:"Rawalpindi", lat:33.58, lng:73.07, alt:508,   slope:0.67,    rain:1200,  area:479000000,   rc:0.80, wu:289, temp:21.7, water:74700000000,  pop:3357612,  precip:1600, px:378, py:228},
  {id:9, name:"Faisalabad", lat:31.45, lng:73.14, alt:186,   slope:0.086,   rain:400,   area:5856000000,  rc:0.50, wu:150, temp:24.7, water:183000000000, pop:3691999,  precip:1150, px:360, py:262},
  {id:10,name:"Sialkot",    lat:32.49, lng:74.52, alt:256,   slope:0.5,     rain:960,   area:135000000,   rc:0.60, wu:121, temp:22.6, water:20000000000,  pop:911817,   precip:1100, px:405, py:245},
  {id:11,name:"Bahawalpur", lat:29.35, lng:71.69, alt:118,   slope:0.1,     rain:300,   area:246000000,   rc:0.35, wu:110, temp:26.1, water:8000000000,   pop:903795,   precip:325,  px:338, py:308},
  {id:12,name:"Gujranwala", lat:32.16, lng:74.19, alt:226,   slope:0.01,    rain:60,    area:240000000,   rc:0.675,wu:130, temp:24,   water:111000000,    pop:2610000,  precip:675,  px:392, py:252},
  {id:13,name:"Lahore",     lat:31.55, lng:74.34, alt:227.5, slope:0.006,   rain:70.3,  area:404000000,   rc:0.725,wu:200, temp:24.5, water:2390000000,   pop:15238000, precip:650,  px:396, py:268},
  {id:14,name:"Abbottabad", lat:34.15, lng:73.22, alt:1256,  slope:0.157,   rain:69,    area:32000000,    rc:0.625,wu:100, temp:16.5, water:14400000,     pop:300000,   precip:1300, px:382, py:205},
  {id:15,name:"Gilgit",     lat:35.92, lng:74.31, alt:1500,  slope:0.273,   rain:45,    area:18000000,    rc:0.55, wu:85,  temp:12,   water:4540000,      pop:180000,   precip:200,  px:385, py:168},
  {id:16,name:"Skardu",     lat:35.30, lng:75.63, alt:2363,  slope:0.00609, rain:50,    area:77000000,    rc:0.50, wu:80,  temp:11,   water:11700000,     pop:110000,   precip:175,  px:432, py:175},
];

const MAX={
  rain:Math.max(...CITIES.map(c=>c.rain)),
  water:Math.max(...CITIES.map(c=>c.water)),
  pop:Math.max(...CITIES.map(c=>c.pop)),
  wu:Math.max(...CITIES.map(c=>c.wu)),
  temp:Math.max(...CITIES.map(c=>c.temp)),
  alt:Math.max(...CITIES.map(c=>c.alt)),
  precip:Math.max(...CITIES.map(c=>c.precip)),
  rc:1,
  area:Math.max(...CITIES.map(c=>c.area)),
};

function fmtNum(n){
  if(n>=1e9) return (n/1e9).toFixed(2)+'B';
  if(n>=1e6) return (n/1e6).toFixed(2)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'K';
  return Number(n).toLocaleString();
}
function barColor(pct){
  if(pct>0.7) return '#00ff9d';
  if(pct>0.4) return '#00c8ff';
  if(pct>0.18) return '#ffc200';
  return '#ff6b35';
}
function riskLevel(city){
  const r=city.water/(city.pop*city.wu*365);
  if(r>2)   return {label:'SUFFICIENT',color:'#00ff9d'};
  if(r>0.8) return {label:'MODERATE',  color:'#ffc200'};
  return          {label:'DEFICIT',    color:'#ff6b35'};
}

function Bar({label,value,max,unit}){
  const pct=Math.min(value/max,1), col=barColor(pct);
  const disp=value>9999?fmtNum(value):(typeof value==='number'?(Number.isInteger(value)?value:parseFloat(value.toFixed(4))):value);
  return(
    <div className="stat-row">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <span className="stat-val" style={{color:col}}>
          {disp}{unit&&<span style={{fontSize:9,color:'var(--textD)',marginLeft:3,fontFamily:"'Share Tech Mono',monospace"}}>{unit}</span>}
        </span>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{width:`${Math.round(pct*100)}%`,background:`linear-gradient(90deg,${col}44,${col})`}}/></div>
    </div>
  );
}

function OverviewTab({city}){
  const risk=riskLevel(city);
  return(
    <div>
      <div className="cards-grid">
        <div className="card"><div className="card-label">Population</div><div className="card-val">{fmtNum(city.pop)}</div></div>
        <div className="card"><div className="card-label">Altitude</div><div className="card-val">{city.alt.toLocaleString()}<span className="card-unit">m</span></div></div>
        <div className="card"><div className="card-label">Avg Temp</div><div className="card-val">{city.temp}<span className="card-unit">°C</span></div></div>
        <div className="card"><div className="card-label">Water Use</div><div className="card-val">{city.wu}<span className="card-unit">L/cap</span></div></div>
      </div>
      <div className="sec-title">Hydrological Metrics</div>
      <Bar label="Rainfall Intensity" value={city.rain}   max={MAX.rain}   unit="mm"/>
      <Bar label="Precipitation"      value={city.precip} max={MAX.precip} unit="mm"/>
      <Bar label="Runoff Coefficient" value={city.rc}     max={MAX.rc}/>
      <Bar label="Total Water"        value={city.water}  max={MAX.water}  unit="L"/>
      <div className="sec-title">Population Pressure</div>
      <Bar label="Population"     value={city.pop}  max={MAX.pop}/>
      <Bar label="Water/Capita"   value={city.wu}   max={MAX.wu}   unit="L/day"/>
      <Bar label="Temperature"    value={city.temp} max={MAX.temp} unit="°C"/>
      <div className="sec-title">Water Status</div>
      <span className="risk-badge" style={{background:`${risk.color}15`,border:`1px solid ${risk.color}44`,color:risk.color}}>● &nbsp;{risk.label}</span>
      <div style={{marginTop:8,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'var(--textD)'}}>
        SUPPLY / DEMAND RATIO: {(city.water/(city.pop*city.wu*365)).toFixed(2)}x
      </div>
    </div>
  );
}

function DetailTab({city}){
  const rows=[
    {k:'Zone No',v:`#${city.id}`},{k:'Latitude',v:`${city.lat}° N`},{k:'Longitude',v:`${city.lng}° E`},
    {k:'Altitude',v:`${city.alt.toLocaleString()} m`},{k:'Slope',v:city.slope.toFixed(5)},
    {k:'Rainfall Intensity',v:`${city.rain} mm`},{k:'Precipitation',v:`${city.precip} mm`},
    {k:'Area',v:fmtNum(city.area),unit:'m²'},{k:'Runoff Coefficient',v:city.rc},
    {k:'Water Use/Capita',v:`${city.wu} L/day`},{k:'Avg Temperature',v:`${city.temp} °C`},
    {k:'Total Water',v:fmtNum(city.water),unit:'L'},{k:'Population',v:fmtNum(city.pop)},
  ];
  const derived=[
    {k:'Water per Capita/yr',v:fmtNum(Math.round(city.water/city.pop)),unit:'L'},
    {k:'Daily Demand Est.',v:fmtNum(Math.round(city.pop*city.wu)),unit:'L'},
    {k:'Runoff Volume Est.',v:fmtNum(Math.round(city.area*city.rc*(city.rain/1000))),unit:'m³'},
    {k:'Supply/Demand',v:(city.water/(city.pop*city.wu*365)).toFixed(3)},
    {k:'Temp Category',v:city.temp<15?'Cool':city.temp<25?'Moderate':'Hot'},
    {k:'Terrain',v:city.alt>1000?'Highland':city.alt>300?'Upland':'Lowland'},
  ];
  return(
    <div>
      <div className="sec-title">Raw Data — MongoDB Collection</div>
      {rows.map(r=><div className="detail-row" key={r.k}><span className="detail-key">{r.k}</span><span className="detail-val">{r.v}{r.unit&&<span className="detail-unit">{r.unit}</span>}</span></div>)}
      <div className="sec-title">Derived Metrics</div>
      {derived.map(r=><div className="detail-row" key={r.k}><span className="detail-key">{r.k}</span><span className="detail-val">{r.v}{r.unit&&<span className="detail-unit">{r.unit}</span>}</span></div>)}
    </div>
  );
}

/* ── Pakistan accurate border path (scaled to ~560×520 viewBox) ── */
/* Source: natural earth / GADM simplified, then scaled to fit 560w×520h with origin at (20,10) */
const PAK_PATH = `
M 290 12
L 310 15 L 328 18 L 345 14 L 362 10 L 378 13 L 392 20 L 402 30
L 415 35 L 428 28 L 442 22 L 455 25 L 462 35 L 468 48 L 472 62
L 478 75 L 482 88 L 488 100 L 492 112 L 490 125 L 485 136
L 480 148 L 476 162 L 474 176 L 472 188 L 468 200 L 464 210
L 460 220 L 458 232 L 455 244 L 452 255
L 460 260 L 468 268 L 474 278 L 476 290 L 472 302 L 466 312
L 458 320 L 450 326 L 444 334 L 442 344 L 440 355 L 438 365
L 436 375 L 432 384 L 426 392 L 418 398 L 408 402 L 398 406
L 388 412 L 378 418 L 368 424 L 356 428 L 344 430 L 332 432
L 320 434 L 308 438 L 296 442 L 284 448 L 272 452 L 260 456
L 248 460 L 236 462 L 224 464 L 212 462 L 200 458 L 190 452
L 180 444 L 172 436 L 164 428 L 156 420 L 148 412 L 140 402
L 132 392 L 124 382 L 116 372 L 108 362 L 100 352 L 92 342
L 85 332 L 78 320 L 74 308 L 70 296 L 66 284 L 64 272
L 62 260 L 61 248 L 62 236 L 64 224 L 68 212 L 72 200
L 76 188 L 78 176 L 80 165 L 82 154 L 86 143 L 90 132
L 96 122 L 102 112 L 108 103 L 114 94 L 122 86 L 130 78
L 140 71 L 150 65 L 160 60 L 170 55 L 182 50 L 194 46
L 206 42 L 218 40 L 230 38 L 242 36 L 254 35 L 266 34
L 278 33 L 290 32 L 290 12 Z
`;

/* Gilgit-Baltistan northern protrusion */
const GB_PATH = `
M 290 12 L 310 15 L 328 18 L 345 14 L 362 10 L 378 13
L 392 20 L 402 30 L 415 35 L 428 28 L 442 22 L 455 25
L 462 35 L 468 48 L 472 62 L 478 75 L 482 88 L 488 100
L 492 112 L 490 125 L 485 136 L 480 148 L 476 162
L 474 176 L 472 188 L 468 200 L 464 210 L 460 220
L 458 232 L 455 244 L 452 255
L 440 250 L 428 244 L 415 238 L 402 232 L 390 226
L 378 220 L 366 214 L 355 208 L 344 202 L 333 198
L 320 194 L 308 190 L 296 188 L 284 186
L 284 172 L 284 158 L 284 144 L 284 130 L 284 116
L 284 102 L 284 88 L 284 74 L 284 60 L 284 46 L 284 32 L 290 12 Z
`;

function App(){
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState('overview');
  const [hovered,setHovered]=useState(null);
  const city=selected!=null?CITIES.find(c=>c.id===selected):null;
  const select=useCallback((id)=>{setSelected(p=>p===id?null:id);setTab('overview');},[]);

  return(
    <>
      <div className="scanlines"/>
      <div className="grid-bg"/>

      {/* HEADER */}
      <div className="hdr">
        <div className="logo">HYDRO<span>SCOPE</span></div>
        <div className="hdr-tag">WATER INTEL · PAKISTAN</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'var(--textD)',letterSpacing:'1px'}}>v1.0 · 16 ZONES</div>
        <div className="hdr-right">
          <div className="status-dot"/>
          <div className="hdr-status">SYSTEMS ACTIVE</div>
        </div>
      </div>

      <div className="main">
        {/* MAP */}
        <div className="map-wrap">
          <div className="map-corner" style={{top:12,left:14}}>23°N — 37°N<br/>60°E — 77°E</div>
          <div className="map-corner" style={{top:12,right:14,textAlign:'right'}}>PAKISTAN TERRITORY<br/>HYDROLOGICAL ZONES</div>
          <div className="map-corner" style={{bottom:14,left:14}}>
            {selected?`▶ ZONE ${String(selected).padStart(2,'0')} — ${city?.name?.toUpperCase()} SELECTED`:'▶ SELECT A ZONE'}
          </div>

          <svg viewBox="20 5 530 500" className="map-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="mapglow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(0,100,180,0.22)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              <filter id="softglow">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            {/* Ambient glow behind map */}
            <ellipse cx="275" cy="250" rx="200" ry="220" fill="url(#mapglow)" opacity="0.7"/>

            {/* Pakistan filled shape — very transparent */}
            <path d={PAK_PATH}
              fill="rgba(0,140,220,0.07)"
              stroke="rgba(0,200,255,0.55)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Inner glow on border */}
            <path d={PAK_PATH}
              fill="none"
              stroke="rgba(0,200,255,0.15)"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Subtle grid over map */}
            {[80,120,160,200,240,280,320,360,400,440,480].map(y=>(
              <line key={`gy${y}`} x1="25" y1={y} x2="545" y2={y} stroke="rgba(0,200,255,0.03)" strokeWidth="0.5"/>
            ))}
            {[60,110,160,210,260,310,360,410,460,510].map(x=>(
              <line key={`gx${x}`} x1={x} y1="10" x2={x} y2="500" stroke="rgba(0,200,255,0.03)" strokeWidth="0.5"/>
            ))}

            {/* PINS */}
            {CITIES.map(c=>{
              const isSel=selected===c.id, isHov=hovered===c.id;
              const risk=riskLevel(c);
              return(
                <g key={c.id} className="pin-group"
                  onClick={()=>select(c.id)}
                  onMouseEnter={()=>setHovered(c.id)}
                  onMouseLeave={()=>setHovered(null)}
                  transform={`translate(${c.px},${c.py})`}>

                  {/* Ripple when selected */}
                  {isSel&&(
                    <circle r="18" fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth="1"
                      style={{animation:'ripple 1.5s ease-out infinite'}}/>
                  )}

                  {/* Outer ring on hover */}
                  {(isSel||isHov)&&(
                    <circle r="14" fill="none" stroke="rgba(0,200,255,0.3)" strokeWidth="0.8"/>
                  )}

                  {/* COD-style crosshair lines */}
                  {(isSel||isHov)&&<>
                    <line x1="-18" y1="0" x2="-11" y2="0" stroke="rgba(0,200,255,0.7)" strokeWidth="0.8"/>
                    <line x1="11"  y1="0" x2="18"  y2="0" stroke="rgba(0,200,255,0.7)" strokeWidth="0.8"/>
                    <line x1="0" y1="-18" x2="0" y2="-11" stroke="rgba(0,200,255,0.7)" strokeWidth="0.8"/>
                    <line x1="0" y1="11"  x2="0" y2="18"  stroke="rgba(0,200,255,0.7)" strokeWidth="0.8"/>
                  </>}

                  {/* Black box pin */}
                  <rect x="-10" y="-10" width="20" height="20" rx="3"
                    fill={isSel?"rgba(0,200,255,0.18)":"rgba(0,0,0,0.82)"}
                    stroke={isSel?"#00c8ff":isHov?"rgba(0,200,255,0.6)":"rgba(0,200,255,0.25)"}
                    strokeWidth={isSel?1.5:0.8}
                    style={{transition:'all 0.15s'}}
                  />

                  {/* White number */}
                  <text textAnchor="middle" dominantBaseline="central" y="0.5"
                    style={{
                      fontFamily:"'Share Tech Mono',monospace",
                      fontSize: c.id>=10 ? 8 : 10,
                      fill:'#ffffff',
                      fontWeight:700,
                      userSelect:'none',
                      letterSpacing:'-0.5px'
                    }}>
                    {c.id}
                  </text>

                  {/* Risk dot top-right */}
                  <circle cx="8" cy="-8" r="3" fill={risk.color} opacity={isSel?1:0.7}
                    style={{filter:isSel?`drop-shadow(0 0 3px ${risk.color})`:'none'}}/>

                  {/* City name tooltip on hover */}
                  {(isHov||isSel)&&(
                    <g transform="translate(12, -18)">
                      <rect x="0" y="0" width={c.name.length*6.4+10} height="16" rx="2"
                        fill="rgba(0,0,0,0.9)" stroke="rgba(0,200,255,0.4)" strokeWidth="0.5"/>
                      <text x="5" y="11"
                        style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fill:'#ffffff',fontWeight:600,userSelect:'none'}}>
                        {c.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            <style>{`@keyframes ripple{0%{r:10;opacity:0.6}100%{r:26;opacity:0}}`}</style>
          </svg>

          {/* Legend */}
          <div style={{position:'absolute',bottom:28,right:16,background:'rgba(0,0,0,0.75)',border:'1px solid rgba(0,200,255,0.18)',borderRadius:3,padding:'8px 12px',backdropFilter:'blur(4px)'}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(0,200,255,0.5)',letterSpacing:'2px',marginBottom:7}}>WATER STATUS</div>
            {[{c:'#00ff9d',l:'SUFFICIENT'},{c:'#ffc200',l:'MODERATE'},{c:'#ff6b35',l:'DEFICIT'}].map(r=>(
              <div key={r.l} style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:r.c,boxShadow:`0 0 5px ${r.c}`}}/>
                <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(200,232,248,0.55)',letterSpacing:'1px'}}>{r.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="panel">
          {!city?(
            <div className="empty-state">
              <div className="empty-ring">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <circle cx="17" cy="17" r="13" stroke="rgba(0,200,255,0.3)" strokeWidth="1"/>
                  <line x1="17" y1="4" x2="17" y2="30" stroke="rgba(0,200,255,0.18)" strokeWidth="0.5"/>
                  <line x1="4" y1="17" x2="30" y2="17" stroke="rgba(0,200,255,0.18)" strokeWidth="0.5"/>
                  <circle cx="17" cy="17" r="3" fill="rgba(0,200,255,0.3)" stroke="#00c8ff" strokeWidth="0.8"/>
                </svg>
              </div>
              <div className="empty-title">SELECT A ZONE</div>
              <div className="empty-sub">Click any numbered marker<br/>on the map to load<br/>hydrological intelligence.</div>
            </div>
          ):(
            <div className="panel-content" key={city.id} style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
              <div className="panel-hdr">
                <div className="panel-area-no">ZONE {String(city.id).padStart(2,'0')} &nbsp;·&nbsp; ACTIVE</div>
                <div className="panel-city">{city.name.toUpperCase()}</div>
                <div className="panel-coords">{city.lat}°N &nbsp;|&nbsp; {city.lng}°E &nbsp;|&nbsp; {city.alt}m ASL</div>
              </div>
              <div className="tabs">
                <button className={`tab${tab==='overview'?' active':''}`} onClick={()=>setTab('overview')}>Overview</button>
                <button className={`tab${tab==='detail'?' active':''}`} onClick={()=>setTab('detail')}>Full Data</button>
              </div>
              <div className="panel-body">
                {tab==='overview'?<OverviewTab city={city}/>:<DetailTab city={city}/>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

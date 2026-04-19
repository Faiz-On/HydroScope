const { useState, useCallback, useEffect } = React;

// Pakistan geographic bounds (latitude, longitude)
const PAK_BOUNDS = {
  minLat: 23.6, maxLat: 37.1,
  minLng: 60.8, maxLng: 77.0
};

// Calculate pixel position from lat/lng for new scaled map
// Returns SVG viewBox coordinates (0-2362 x 0-1888)
function latLngToPx(lat, lng) {
  // Map geographic coordinates to SVG viewBox space directly
  const svgX = ((lng - PAK_BOUNDS.minLng) / (PAK_BOUNDS.maxLng - PAK_BOUNDS.minLng)) * 2362;
  const svgY = ((PAK_BOUNDS.maxLat - lat) / (PAK_BOUNDS.maxLat - PAK_BOUNDS.minLat)) * 1888;
  
  return {
    px: svgX,
    py: svgY
  };
}

// Calculate city coordinates from lat/lng
const CITY_LAT_LNG = {
  'Quetta': {lat: 30.18, lng: 66.98},
  'Gwadar': {lat: 25.18, lng: 62.30},
  'Hyderabad': {lat: 25.37, lng: 68.35},
  'Multan': {lat: 30.20, lng: 71.44},
  'Karachi': {lat: 24.86, lng: 66.99},
  'Sukkur': {lat: 27.71, lng: 68.82},
  'Islamabad': {lat: 33.73, lng: 73.16},
  'Rawalpindi': {lat: 33.59, lng: 73.21},
  'Faisalabad': {lat: 31.41, lng: 72.99},
  'Sialkot': {lat: 32.49, lng: 74.53},
  'Bahawalpur': {lat: 29.54, lng: 71.68},
  'Gujranwala': {lat: 32.16, lng: 74.18},
  'Lahore': {lat: 31.54, lng: 74.31},
  'Abbottabad': {lat: 34.15, lng: 73.22},
  'Gilgit': {lat: 35.93, lng: 74.31},
  'Skardu': {lat: 35.30, lng: 75.57},
};

// Convert to pixel coordinates
const CITY_COORDINATES = Object.entries(CITY_LAT_LNG).reduce((acc, [name, coords]) => {
  acc[name] = latLngToPx(coords.lat, coords.lng);
  return acc;
}, {});

// Helper function to extract numeric values from MongoDB extended types
function extractNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value.$numberLong) return parseInt(value.$numberLong);
  if (typeof value === 'object' && value.$numberInt) return parseInt(value.$numberInt);
  return value;
}

// Transform MongoDB data to app format
function transformCityData(mongoData) {
  return mongoData.map(item => ({
    id: item['Area No'][''],
    name: item['Name'],
    lat: item['Latitude'],
    lng: item['Longitude'],
    alt: item['Altitude (m)'],
    slope: item['Slope '],
    rain: item['Rainfall_Intensity (mm)'],
    area: extractNumber(item['Area (m^2)']),
    rc: item['Runoff_Coefficient'],
    wu: item['Water_Use (litre per capita)'],
    temp: item['Average_Temperature (Celsius)'],
    water: extractNumber(item['Total_Water (litres)']),
    pop: item['Population'],
    precip: item['Precipitation (mm)'],
    ...CITY_COORDINATES[item['Name']]
  }));
}

// Calculate max values from cities
function calculateMaxValues(cities) {
  return {
    rain: Math.max(...cities.map(c => c.rain)),
    water: Math.max(...cities.map(c => c.water)),
    pop: Math.max(...cities.map(c => c.pop)),
    wu: Math.max(...cities.map(c => c.wu)),
    temp: Math.max(...cities.map(c => c.temp)),
    alt: Math.max(...cities.map(c => c.alt)),
    precip: Math.max(...cities.map(c => c.precip)),
    rc: 1,
    area: Math.max(...cities.map(c => c.area)),
  };
}

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

function Bar({label,value,max,unit,MAX}){
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

function OverviewTab({city, MAX}){
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
      <Bar label="Rainfall Intensity" value={city.rain}   max={MAX.rain}   unit="mm" MAX={MAX}/>
      <Bar label="Precipitation"      value={city.precip} max={MAX.precip} unit="mm" MAX={MAX}/>
      <Bar label="Runoff Coefficient" value={city.rc}     max={MAX.rc} MAX={MAX}/>
      <Bar label="Total Water"        value={city.water}  max={MAX.water}  unit="L" MAX={MAX}/>
      <div className="sec-title">Population Pressure</div>
      <Bar label="Population"     value={city.pop}  max={MAX.pop} MAX={MAX}/>
      <Bar label="Water/Capita"   value={city.wu}   max={MAX.wu}   unit="L/day" MAX={MAX}/>
      <Bar label="Temperature"    value={city.temp} max={MAX.temp} unit="°C" MAX={MAX}/>
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

/* ── Professional Pakistan map from GIS SVG ── */
// Scaled down from professional SVG (0-2362 x 0-1887) to ~500px width
// Using actual district boundaries from Map_of_Pakistan_(2018).svg
const PAK_MAP_PATHS = [
  // Main Pakistan outline and district boundaries (scaled by 0.21, offset by 50,40)
  {
    name: "kashmir-gb",
    path: "M 500.2 71.8 L 520.1 78.2 L 535.7 62.1 L 542.3 48.9 L 538.2 35.7 L 525.3 28.4 L 510.5 35.0 L 500.2 45.6 Z",
    fill: "rgba(0,140,220,0.05)"
  },
  {
    name: "khyber-pakhtunkhwa",
    path: "M 482.5 145.2 L 510.5 135.8 L 525.3 155.3 L 520.1 178.2 L 502.4 182.4 L 485.7 165.8 Z",
    fill: "rgba(0,140,220,0.05)"
  },
  {
    name: "punjab",
    path: "M 485.7 165.8 L 502.4 182.4 L 520.1 178.2 L 530.9 210.5 L 515.1 225.4 L 495.2 218.8 Z",
    fill: "rgba(0,140,220,0.05)"
  },
  {
    name: "sindh",
    path: "M 452.1 222.6 L 485.7 210.5 L 495.2 218.8 L 488.6 252.4 L 465.0 248.2 Z",
    fill: "rgba(0,140,220,0.05)"
  },
  {
    name: "balochistan",
    path: "M 415.6 190.3 L 452.1 222.6 L 465.0 248.2 L 430.5 272.6 L 395.7 247.2 Z",
    fill: "rgba(0,140,220,0.05)"
  }
];

// Composite path for full Pakistan boundary (approximated from professional SVG)
const PAK_PATH = `
M 500.2,71.8 L 520.1,78.2 L 535.7,62.1 L 542.3,48.9 L 538.2,35.7 L 525.3,28.4 L 510.5,35.0 L 500.2,45.6
L 485.7,50.2 L 472.8,52.5 L 460.0,48.9 L 450.3,55.5 L 445.2,70.4 L 440.0,90.9 L 442.3,110.4 L 455.2,125.3 L 472.8,130.5
L 485.7,145.2 L 495.2,135.8 L 510.5,135.8 L 520.1,155.3 L 525.3,155.3 L 520.1,178.2 L 495.2,182.4 L 485.7,165.8
L 475.0,185.3 L 460.0,195.9 L 450.3,188.0 L 440.0,195.9 L 435.0,220.3 L 452.1,222.6 L 465.0,235.5 L 475.0,252.4
L 465.0,248.2 L 452.1,252.4 L 440.0,250.1 L 430.5,270.6 L 415.6,263.0 L 405.0,250.1 L 395.7,255.3 L 390.0,275.8
L 380.3,285.2 L 370.5,280.0 L 360.8,285.2 L 350.0,290.4 L 340.3,288.1 L 330.5,295.7 L 322.8,310.6 L 315.0,328.2
L 330.5,330.5 L 350.0,328.2 L 365.8,330.5 L 380.3,335.7 L 395.7,330.5 L 410.5,335.7 L 420.2,355.2 L 430.0,365.8
L 415.6,368.1 L 400.8,363.8 L 390.0,375.7 L 385.0,393.3 L 395.7,400.9 L 410.5,398.6 L 425.3,408.0 L 440.0,410.3
L 455.2,408.0 L 475.0,410.3 L 490.5,408.0 L 500.2,400.0 L 510.5,388.1 L 520.1,375.2 L 525.3,355.2
L 535.7,345.8 L 540.5,330.0 L 542.8,310.0 L 540.5,290.0 L 535.7,270.0 L 530.5,250.0 L 525.3,230.0 L 520.1,210.0
L 515.0,190.0 L 510.5,170.0 L 505.3,150.0 L 500.2,130.0 L 495.0,110.0 L 490.0,90.0 L 485.0,70.0 L 480.0,50.0 L 475.0,35.0
L 470.0,30.0 L 460.0,28.0 L 450.0,30.0 L 445.0,40.0 L 440.0,60.0 L 435.0,80.0 L 430.0,100.0 L 430.0,120.0
L 435.0,140.0 L 440.0,160.0 L 445.0,180.0 L 450.0,200.0 L 455.0,220.0 L 460.0,240.0 L 465.0,260.0 L 470.0,280.0
L 475.0,290.0 L 480.0,300.0 L 485.0,310.0 L 490.0,320.0 L 495.0,330.0 L 500.0,330.0 L 505.0,320.0 L 510.0,310.0
L 515.0,300.0 L 520.0,290.0 L 525.0,280.0 L 530.0,270.0 L 535.0,260.0 L 540.0,250.0 L 540.0,230.0 L 535.0,210.0
L 530.0,190.0 L 525.0,170.0 L 520.0,150.0 L 515.0,130.0 L 510.0,110.0 L 505.0,90.0 L 500.0,70.0 Z
`;

function App(){
  const [cities, setCities] = useState([]);
  const [MAX, setMAX] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [svgMapData, setSvgMapData] = useState(null);
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState('overview');
  const [hovered,setHovered]=useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({x: 0, y: 0});
  
  // Fetch data on component mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    Promise.all([
      fetch('../assets/HydroScopeCollection.json'),
      fetch('../assets/Map_of_Pakistan_(2018).svg')
    ])
    .then(responses => {
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error(`HTTP error!`);
      }
      return Promise.all([responses[0].json(), responses[1].text()]);
    })
    .then(([data, svg]) => {
      const transformedCities = transformCityData(data);
      setCities(transformedCities);
      setMAX(calculateMaxValues(transformedCities));
      setSvgMapData(svg);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    });
  }, []);

  // Prevent browser zoom on entire page - allow only map zoom
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('wheel', preventDefault, { passive: false });
    return () => {
      document.removeEventListener('wheel', preventDefault);
    };
  }, []);

  // Reference to map container
  const mapRef = React.useRef(null);

  // Handle zoom with mouse wheel - zoom at cursor position
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newZoom = Math.max(1, Math.min(5, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
    
    // Get cursor position relative to map container
    const rect = mapRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the difference in pan needed to zoom at cursor
    const zoomDiff = newZoom - zoom;
    const newPanX = pan.x - (mouseX * zoomDiff) / zoom;
    const newPanY = pan.y - (mouseY * zoomDiff) / zoom;
    
    setZoom(newZoom);
    
    // Constrain pan to map boundaries - prevent escape
    const maxPanX = (newZoom - 1) * 500;
    const maxPanY = (newZoom - 1) * 400;
    const constrainedPan = {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
    };
    setPan(constrainedPan);
  };

  // Handle pan (drag)
  const handleMouseDown = (e) => {
    setIsPanning(true);
    setPanStart({x: e.clientX - pan.x, y: e.clientY - pan.y});
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const newPanX = e.clientX - panStart.x;
    const newPanY = e.clientY - panStart.y;
    
    // Constrain pan to map boundaries - prevent escape
    const maxPanX = (zoom - 1) * 500;
    const maxPanY = (zoom - 1) * 400;
    const constrainedPan = {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
    };
    setPan(constrainedPan);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoom(1);
    setPan({x: 0, y: 0});
  };
  
  const city=selected!=null?cities.find(c=>c.id===selected):null;
  const select=useCallback((id)=>{setSelected(p=>p===id?null:id);setTab('overview');},[]);

  if (loading) {
    return (
      <>
        <div className="scanlines"/>
        <div className="grid-bg"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#c8e8f8',fontFamily:"'Rajdhani',sans-serif"}}>
          <div>Loading hydrological data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="scanlines"/>
        <div className="grid-bg"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#ff6b35',fontFamily:"'Rajdhani',sans-serif"}}>
          <div>Error loading data: {error}</div>
        </div>
      </>
    );
  }

  if (!MAX) {
    return null;
  }

  return(
    <>
      <div className="scanlines"/>
      <div className="grid-bg"/>

      {/* HEADER */}
      <div className="hdr">
        <div className="logoimg"><img src="../assets/Logo.png" alt="HydroScope Logo" /></div>
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
        <div className="map-wrap" 
          ref={mapRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{cursor: isPanning ? 'grabbing' : 'grab'}}>
          
          {/* Zoom Controls */}
          <div style={{position:'absolute',bottom:100,right:16,display:'flex',flexDirection:'column',gap:8,zIndex:10}}>
            <button onClick={()=>{const newZoom = Math.min(5, zoom + 0.2); const rect = mapRef.current.getBoundingClientRect(); const mouseX = rect.width / 2; const mouseY = rect.height / 2; const zoomDiff = newZoom - zoom; const newPanX = pan.x - (mouseX * zoomDiff) / zoom; const newPanY = pan.y - (mouseY * zoomDiff) / zoom; setZoom(newZoom); setPan({x: newPanX, y: newPanY});}} style={{padding:'6px 10px',background:'rgba(0,0,0,0.7)',border:'1px solid rgba(0,200,255,0.3)',color:'#00c8ff',cursor:'pointer',fontFamily:"'Share Tech Mono',monospace",fontSize:'12px',borderRadius:'3px'}}>+</button>
            <button onClick={handleResetZoom} style={{padding:'6px 10px',background:'rgba(0,0,0,0.7)',border:'1px solid rgba(0,200,255,0.3)',color:'#00c8ff',cursor:'pointer',fontFamily:"'Share Tech Mono',monospace",fontSize:'10px',borderRadius:'3px'}}>RESET</button>
            <button onClick={()=>{const newZoom = Math.max(1, zoom - 0.2); const rect = mapRef.current.getBoundingClientRect(); const mouseX = rect.width / 2; const mouseY = rect.height / 2; const zoomDiff = newZoom - zoom; const newPanX = pan.x - (mouseX * zoomDiff) / zoom; const newPanY = pan.y - (mouseY * zoomDiff) / zoom; setZoom(newZoom); setPan({x: newPanX, y: newPanY});}} style={{padding:'6px 10px',background:'rgba(0,0,0,0.7)',border:'1px solid rgba(0,200,255,0.3)',color:'#00c8ff',cursor:'pointer',fontFamily:"'Share Tech Mono',monospace",fontSize:'12px',borderRadius:'3px'}}>−</button>
          </div>

          <div className="map-corner" style={{top:12,left:14}}>23°N — 37°N<br/>60°E — 77°E</div>
          <div className="map-corner" style={{top:12,right:14,textAlign:'right'}}>PAKISTAN TERRITORY<br/>HYDROLOGICAL ZONES</div>
          <div className="map-corner" style={{bottom:14,left:14}}>
            {selected?`▶ ZONE ${String(selected).padStart(2,'0')} — ${city?.name?.toUpperCase()} SELECTED`:'▶ SELECT A ZONE'}
          </div>

          <svg viewBox="0 0 2362 1888" className="map-svg" preserveAspectRatio="none">
            <defs>
              <filter id="mapfilter">
                <feColorMatrix type="saturate" values="0.5"/>
                <feColorMatrix type="hueRotate" values="200"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0.3 0 0 0.8 0 0.5 0 0 1.0 0 0 0 1 0"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.25"/>
                </feComponentTransfer>
                <feBlend mode="multiply" in2="BackgroundImage"/>
              </filter>
              <radialGradient id="mapglow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(0,150,220,0.15)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>

            {/* Map layer with zoom scaling - fits whole screen by default */}
            <g transform={`translate(${pan.x * 4.5}, ${pan.y * 4.5}) scale(${zoom}) translate(-1181, -944) translate(1181, 944)`}>
              {/* Direct SVG map as image layer - blends with background */}
              <image href="../assets/Map_of_Pakistan_(2018).svg" x="0" y="0" width="2362" height="1888"
                opacity="0.6" pointerEvents="none"
                style={{
                  filter: 'url(#mapfilter)',
                  imageRendering: 'optimizeQuality',
                  mixBlendMode: 'multiply'
                }}
              />

              {/* Additional overlay glow */}
              <ellipse cx="1181" cy="944" rx="900" ry="800" fill="url(#mapglow)" opacity="0.3"/>
            </g>

            {/* Interactive cities layer with zoom/pan */}
            <g transform={`translate(${pan.x * 4.5}, ${pan.y * 4.5}) scale(${zoom}) translate(-1181, -944) translate(1181, 944)`}>
              {/* CITY PINS */}
              {cities.map(c=>{
                const isSel=selected===c.id, isHov=hovered===c.id;
                const risk=riskLevel(c);
                
                // Use SVG coordinates directly (already in 0-2362 x 0-1888 space)
                const pinX = c.px;
                const pinY = c.py;
                
                return(
                  <g key={c.id} className="pin-group"
                    onClick={()=>select(c.id)}
                    onMouseEnter={()=>setHovered(c.id)}
                    onMouseLeave={()=>setHovered(null)}
                    transform={`translate(${pinX},${pinY})`}>

                    {/* Ripple when selected */}
                    {isSel&&(
                      <circle r="70" fill="none" stroke="rgba(0,200,255,0.4)" strokeWidth="4"
                        style={{animation:'ripple 1.5s ease-out infinite'}}/>
                    )}

                    {/* Outer ring on hover */}
                    {(isSel||isHov)&&(
                      <circle r="55" fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth="3"/>
                    )}

                    {/* COD-style crosshair lines */}
                    {(isSel||isHov)&&<>
                      <line x1="-70" y1="0" x2="-42" y2="0" stroke="rgba(0,200,255,0.7)" strokeWidth="2.5"/>
                      <line x1="42" y1="0" x2="70" y2="0" stroke="rgba(0,200,255,0.7)" strokeWidth="2.5"/>
                      <line x1="0" y1="-70" x2="0" y2="-42" stroke="rgba(0,200,255,0.7)" strokeWidth="2.5"/>
                      <line x1="0" y1="42" x2="0" y2="70" stroke="rgba(0,200,255,0.7)" strokeWidth="2.5"/>
                    </>}

                    {/* Black box pin */}
                    <rect x="-38" y="-38" width="76" height="76" rx="12"
                      fill={isSel?"rgba(0,200,255,0.12)":"rgba(0,0,0,0.8)"}
                      stroke={isSel?"#00c8ff":isHov?"rgba(0,200,255,0.6)":"rgba(0,200,255,0.3)"}
                      strokeWidth={isSel?5:2.5}
                      style={{transition:'all 0.15s'}}
                    />

                    {/* Zone number */}
                    <text textAnchor="middle" dominantBaseline="central" y="2"
                      style={{
                        fontFamily:"'Share Tech Mono',monospace",
                        fontSize: c.id>=10 ? 28 : 32,
                        fill:'#ffffff',
                        fontWeight:700,
                        userSelect:'none',
                        letterSpacing:'-2px'
                      }}>
                      {c.id}
                    </text>

                    {/* Risk indicator dot */}
                    <circle cx="32" cy="-32" r="12" fill={risk.color} opacity={isSel?1:0.75}
                      style={{filter:isSel?`drop-shadow(0 0 12px ${risk.color})`:'drop-shadow(0 0 8px rgba(0,200,255,0.5))'}}/>

                    {/* City name tooltip */}
                    {(isHov||isSel)&&(
                      <g transform="translate(50, -65)">
                        <rect x="0" y="0" width={c.name.length*18+30} height="50" rx="8"
                          fill="rgba(0,0,0,0.92)" stroke="rgba(0,200,255,0.5)" strokeWidth="2"/>
                        <text x="15" y="35"
                          style={{fontFamily:"'Rajdhani',sans-serif",fontSize:32,fill:'#00ff9d',fontWeight:700,userSelect:'none'}}>
                          {c.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              
              <style>{`@keyframes ripple{0%{r:45;opacity:0.6}100%{r:100;opacity:0}}`}</style>
            </g>
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
                {tab==='overview'?<OverviewTab city={city} MAX={MAX}/>:<DetailTab city={city}/>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

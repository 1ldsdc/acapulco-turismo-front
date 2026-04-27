// ==========================================
// EL CADENERO INVISIBLE (NIVEL DIOS)
// ==========================================
(function protegerAccesoSecreto() {
    const token = localStorage.getItem('token_turismo');
    const urlParams = new URLSearchParams(window.location.search);
    const llaveSecreta = urlParams.get('llave');

    // Si ya tienes sesión iniciada, te deja pasar sin pedirte la llave de la URL
    if (token) return;

    // Si NO tienes sesión y NO pones la llave secreta correcta en el link... ¡PA' FUERA!
    if (llaveSecreta !== 'gobierno26') {
        window.location.replace("index.html");
    }
})();
// ==========================================

const IMGBB_API_KEY = "0878e4ef020fee53d05316fed95cf25b";

let allLugares = []; 
let editando = false;
let map, marker;
const defaultLat = 16.8531; 
const defaultLng = -99.8237;
let galeriaURLs = [];

const catNames = { 1: "Naturaleza", 2: "Playas", 3: "Cultura", 4: "Gastronomía", 5: "Atractivos", 6: "Beach Clubs", 7: "Vida Nocturna", 8: "Náuticos", 9: "Hoteles", 10: "Iglesias" };
const catColors = { 1: "#27ae60", 2: "#2980b9", 3: "#8e44ad", 4: "#d35400", 5: "#c0392b", 6: "#16a085", 7: "#2c3e50", 8: "#2980b9", 9: "#f1c40f", 10: "#7f8c8d" };

// --- SISTEMA DE PESTAÑAS ---
function cambiarPestana(tipo, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.form-card').forEach(c => c.classList.remove('visible'));
    document.getElementById(`form-${tipo}`).classList.add('visible');
    
    if(tipo === 'usuarios') cargarUsuariosList(); 
}

async function crearCategoriaManual(e) {
    e.preventDefault();
    const token = localStorage.getItem('token_turismo');
    const name = document.getElementById('cat-name-manual').value;

    try {
        const resGet = await fetch(`${API_URL}/categories/`);
        const categorias = await resGet.json();
        
        const maxId = categorias.length > 0 ? Math.max(...categorias.map(c => c.id)) : 0;
        const nuevoId = maxId + 1;

        const resPost = await fetch(`${API_URL}/categories/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id: nuevoId, name: name })
        });

        if (resPost.ok) {
            alert(`✅ Categoría "${name}" creada con éxito (ID: ${nuevoId})`);
            document.getElementById('cat-name-manual').value = ""; 
            location.reload(); 
        } else {
            alert("❌ Error al crear la categoría en el servidor.");
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error de conexión al intentar autogenerar el ID.");
    }
}

// --- FUNCIONES DE USUARIOS ---
async function cargarUsuariosList() {
    const token = localStorage.getItem('token_turismo');
    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const container = document.getElementById('lista-cuentas-admin');
        
        if (res.ok) {
            const usuarios = await res.json();
            container.innerHTML = usuarios.map(u => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 0.9rem;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${u.id === 1 ? '👑' : '👤'} <strong style="font-weight: 700;">${u.email}</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="color: ${u.is_active ? 'green' : 'red'}; font-weight: bold;">${u.is_active ? 'Activo' : 'Inactivo'}</span>
                        
                        ${u.id !== 1 ? `<button onclick="borrarUsuario(${u.id})" style="background:#dc2626; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;" title="Eliminar usuario"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p style="color:red; text-align:center; font-weight:bold;">🚫 Bloqueado: Solo el Admin puede ver esto.</p>`;
        }
    } catch (e) { console.error("Error al cargar usuarios"); }
}

async function crearNuevoUsuario(e) {
    e.preventDefault();
    const token = localStorage.getItem('token_turismo');
    const email = document.getElementById('nuevo-email').value;
    const password = document.getElementById('nuevo-password').value;
    
    try {
        const res = await fetch(`${API_URL}/crear_usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email: email, password: password })
        });
        
        if (res.ok) {
            alert(`✅ ¡Usuario ${email} registrado con éxito!`);
            document.getElementById('nuevo-email').value = "";
            document.getElementById('nuevo-password').value = "";
            cargarUsuariosList(); 
        } else {
            const errorData = await res.json();
            alert(`❌ Error: ${errorData.detail || 'Sin permisos o correo repetido.'}`);
        }
    } catch (error) { alert("❌ Error de red."); }
}

async function borrarUsuario(id) {
    if(!confirm("⚠️ ¿Estás seguro de que quieres eliminar a este usuario? Ya no podrá entrar al panel.")) return;
    
    const token = localStorage.getItem('token_turismo');
    try {
        const res = await fetch(`${API_URL}/usuarios/${id}`, { 
            method: 'DELETE', 
            headers: {'Authorization': `Bearer ${token}`} 
        });
        
        if(res.ok) {
            alert("🗑️ ¡Usuario eliminado del sistema!");
            cargarUsuariosList(); 
        } else {
            const errorData = await res.json();
            alert(`❌ Error: ${errorData.detail}`);
        }
    } catch(e) { 
        alert("Error de red al intentar borrar."); 
    }
}

// --- SUBIDA IMÁGENES ---
async function subirImagen(origen) {
    let inputId = 'file-portada';
    if(origen === 'galeria') inputId = 'file-galeria';
    if(origen === 'design') inputId = 'file-design';

    const input = document.getElementById(inputId);
    const statusEl = origen === 'design' ? document.getElementById('status-design') : document.getElementById('status-portada');

    if (input.files && input.files[0]) {
        const file = input.files[0];
        if(statusEl) { statusEl.innerText = "⏳ Subiendo..."; statusEl.style.color = "orange"; }

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const data = await res.json();

            if (data.success) {
                const url = data.data.url;
                if(origen === 'portada') {
                    document.getElementById('url-portada').value = url;
                    actualizarPreview('portada');
                } else if (origen === 'galeria') {
                    galeriaURLs.push(url);
                    renderGaleria();
                } else if (origen === 'design') {
                    document.getElementById('url-design').value = url;
                }
                if(statusEl) { statusEl.innerText = "✅ Listo"; statusEl.style.color="green"; }
            } else { alert("Error API Imagen"); }
        } catch (error) { alert("Error Red Imagen"); }
    }
}

// --- SUBIDA IMÁGENES EXTRA (INICIO) ---
async function subirImagenExtra(origen) {
    const input = document.getElementById(`file-${origen}`);
    const urlField = document.getElementById(`url-${origen}`);
    const statusEl = document.getElementById(`status-${origen}`);

    if (input.files && input.files[0]) {
        const file = input.files[0];
        statusEl.innerText = "⏳ Subiendo a ImgBB..."; 
        statusEl.style.color = "orange";

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const data = await res.json();

            if (data.success) {
                urlField.value = data.data.url; 
                statusEl.innerText = "✅ Listo"; 
                statusEl.style.color = "green";
            } else { 
                alert("Error API Imagen"); 
                statusEl.innerText = "❌ Error";
            }
        } catch (error) { 
            alert("Error Red Imagen"); 
            statusEl.innerText = "❌ Error";
        }
    }
}

// --- PROCESAR LUGAR ---
async function procesarLugar(e) {
    e.preventDefault();
    const token = localStorage.getItem('token_turismo');
    if(!token) return location.reload();

    const latVal = parseFloat(document.getElementById('lat').value);
    const lngVal = parseFloat(document.getElementById('lng').value);
    
    if (isNaN(latVal) || isNaN(lngVal)) {
        alert("⚠️ ¡Toca el mapa para establecer ubicación!");
        return;
    }

    let imgFinal = document.getElementById('url-portada').value;
    if(!imgFinal) { alert("Falta foto portada"); return; }
    if(galeriaURLs.length > 0) imgFinal += "," + galeriaURLs.join(",");

    const data = {
        name: document.getElementById('nombre').value,
        description: document.getElementById('descripcion').value,
        category_id: parseInt(document.getElementById('categoria').value),
        image_url: imgFinal, 
        latitude: latVal,
        longitude: lngVal
    };

    const id = document.getElementById('id-lugar').value;
    const url = editando ? `${API_URL}/places/${id}` : `${API_URL}/places/`;
    const metodo = editando ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert(editando ? "✅ Actualizado" : "✅ Guardado");
            cargarInventario();
            cancelarEdicion();
        } else { 
            alert("❌ Error al guardar. Verifica si la categoría existe en la pestaña 'Categorías'.");
        }
    } catch(err) { alert("Error de conexión"); }
}

// --- PROCESAR DISEÑO ---
async function procesarDiseno(e) {
    e.preventDefault();
    const token = localStorage.getItem('token_turismo');
    const targetName = document.getElementById('design-target').value;
    const nuevaFoto = document.getElementById('url-design').value;

    if(!targetName || !nuevaFoto) return alert("Faltan datos");

    const existente = allLugares.find(l => l.name === targetName);
    let imgFinal = nuevaFoto;
    if (targetName === "BANNER_HOME" && existente) {
        const fotosActuales = existente.image_url.split(',');
        if(fotosActuales.length > 1) imgFinal = nuevaFoto + "," + fotosActuales.slice(1).join(',');
    }

    const data = {
        name: targetName,
        description: "REGISTRO SISTEMA",
        category_id: 1, 
        image_url: imgFinal,
        latitude: 0, longitude: 0
    };

    let url, metodo;
    if (existente) {
        url = `${API_URL}/places/${existente.id}`;
        metodo = 'PUT';
    } else {
        url = `${API_URL}/places/`;
        metodo = 'POST';
    }

    await enviarDatos(url, metodo, data, token, true);
}

// --- PROCESAR CONFIGURACIÓN DE INICIO ---
async function procesarInicio(e) {
    e.preventDefault();
    const token = localStorage.getItem('token_turismo');
    
    const data = {
        texto_bienvenida: document.getElementById('inicio-bienvenida').value,
        texto_presidenta: document.getElementById('inicio-subtitulo').value, 
        ocupacion_hotelera: parseInt(document.getElementById('inicio-ocupacion').value) || 0,
        ruta_fondo: document.getElementById('url-inicio-fondo').value,
        ruta_logo: document.getElementById('url-inicio-logo').value,
        ruta_oferta: document.getElementById('url-inicio-oferta').value
    };

    try {
        const res = await fetch(`${API_URL}/configuracion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("✅ ¡Configuración de Inicio actualizada con éxito!");
        } else { 
            alert("❌ Error al guardar en la base de datos."); 
        }
    } catch(err) { 
        alert("Error de red al conectar con FastAPI."); 
    }
}

async function cargarConfiguracionInicio() {
    try {
        const res = await fetch(`${API_URL}/configuracion`);
        if (res.ok) {
            const config = await res.json();
            if(config) {
                document.getElementById('inicio-bienvenida').value = config.texto_bienvenida || "";
                document.getElementById('inicio-subtitulo').value = config.texto_presidenta || ""; 
                document.getElementById('inicio-ocupacion').value = config.ocupacion_hotelera || "";
                document.getElementById('url-inicio-fondo').value = config.ruta_fondo || "";
                document.getElementById('url-inicio-logo').value = config.ruta_logo || "";
                document.getElementById('url-inicio-oferta').value = config.ruta_oferta || "";
            }
        }
    } catch(e) { console.log("Aún no hay configuración de inicio en la BD"); }
}

async function enviarDatos(url, metodo, data, token, esDiseno = false) {
    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert(esDiseno ? "✅ ¡Diseño Actualizado!" : "✅ Guardado");
            location.reload();
        } else { alert("Error al guardar"); }
    } catch(e) { alert("Error de conexión"); }
}

// --- EDITAR ---
function editarLugar(lugar) {
    cancelarEdicion();
    editando = true;
    document.getElementById('tab-lugares').click(); 
    
    document.getElementById('id-lugar').value = lugar.id;
    document.getElementById('nombre').value = lugar.name;
    document.getElementById('categoria').value = lugar.category_id;
    document.getElementById('descripcion').value = lugar.description;
    document.getElementById('lat').value = lugar.latitude;
    document.getElementById('lng').value = lugar.longitude;
    
    if(lugar.image_url) {
        const todas = lugar.image_url.split(',');
        document.getElementById('url-portada').value = todas[0];
        actualizarPreview('portada');
        if(todas.length > 1) { galeriaURLs = todas.slice(1); renderGaleria(); }
    }

    const match = lugar.description.match(/^\[(.*?)\]/);
    const subSelector = document.getElementById('subcategoria');
    if(match) subSelector.value = match[1]; else subSelector.value = "";

    verificarGastronomia();
    if(map) {
        const pos = [lugar.latitude, lugar.longitude];
        marker.setLatLng(pos);
        map.setView(pos, 15);
    }

    document.getElementById('form-lugares').classList.add('modo-edicion');
    document.getElementById('aviso-edicion').style.display = 'block';
    document.getElementById('form-title').innerText = "EDITANDO: " + lugar.name;
    document.getElementById('btn-cancel').style.display = 'block';
    document.getElementById('btn-submit').innerText = "ACTUALIZAR CAMBIOS";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
    editando = false;
    document.querySelector('#form-lugares form').reset();
    galeriaURLs = []; renderGaleria();
    document.getElementById('preview-portada').style.display = 'none';
    document.getElementById('bloque-subcategoria').style.display = 'none';
    
    document.getElementById('form-lugares').classList.remove('modo-edicion');
    document.getElementById('aviso-edicion').style.display = 'none';
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Destino';
    document.getElementById('btn-cancel').style.display = 'none';
    document.getElementById('btn-submit').innerText = 'GUARDAR LUGAR';
    
    if(map) {
        const defPos = [defaultLat, defaultLng];
        marker.setLatLng(defPos);
        map.setView(defPos, 12);
        updateCoords(marker.getLatLng());
    }
}

// --- MAPA ---
function initMap() {
    if(map) return;
    map = L.map('mapa-selector').setView([defaultLat, defaultLng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([defaultLat, defaultLng], {draggable:true}).addTo(map);
    updateCoords(marker.getLatLng()); 
    marker.on('dragend', function(e) { updateCoords(marker.getLatLng()); });
    map.on('click', function(e) { marker.setLatLng(e.latlng); updateCoords(e.latlng); });
}
function updateCoords(pos) { 
    document.getElementById('lat').value = pos.lat.toFixed(6); 
    document.getElementById('lng').value = pos.lng.toFixed(6); 
}

// --- INVENTARIO ---
async function cargarInventario() {
    try {
        const res = await fetch(`${API_URL}/places/`);
        allLugares = await res.json();
        const container = document.getElementById('lista-lugares');
        container.innerHTML = "";

        const cleanLugares = allLugares.filter(l => !l.name.startsWith("CAT_") && l.name !== "BANNER_HOME");

        for (let i = 1; i <= 10; i++) {
            const items = cleanLugares.filter(l => l.category_id === i);
            if (items.length > 0) {
                const section = document.createElement('div');
                section.className = "category-section";
                section.id = `cat-section-${i}`;
                section.innerHTML = `
                    <div class="section-header" style="border-color:${catColors[i]}">
                        <h3 class="section-title" style="color:${catColors[i]}">${catNames[i]}</h3>
                        <span class="section-count">${items.length}</span>
                    </div>
                    <div class="items-grid" id="grid-${i}"></div>
                `;
                container.appendChild(section);
                const grid = section.querySelector(`#grid-${i}`);
                
                items.forEach(lugar => {
                    const safeLugar = JSON.stringify(lugar).replace(/"/g, '&quot;');
                    const portada = lugar.image_url.split(',')[0].trim();
                    const card = document.createElement('div');
                    card.className = "item-card";
                    card.innerHTML = `
                        <div class="item-img-box"><img src="${portada}" class="item-img" onerror="this.src='https://via.placeholder.com/300'"></div>
                        <div class="item-content">
                            <h4 class="item-title">${lugar.name}</h4>
                            <div class="item-actions">
                                <button class="action-btn btn-edit-card" onclick='editarLugar(${safeLugar})'><i class="fas fa-pen"></i></button>
                                <button class="action-btn btn-delete-card" onclick="borrarLugar(${lugar.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
        }
        generarFiltros();
        restaurarFiltro();
    } catch(e) { console.error(e); }
}

function generarFiltros() {
    const bar = document.getElementById('filter-bar');
    bar.innerHTML = '<button class="filter-btn active" onclick="filtrarVista(\'all\', this)">Todo</button>';
    for(let i=1; i<=10; i++) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = catNames[i];
        btn.onclick = function() { filtrarVista(i, this); };
        bar.appendChild(btn);
    }
}

function filtrarVista(catId, btnElement) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    const secciones = document.querySelectorAll('.category-section');
    secciones.forEach(sec => {
        if(catId === 'all') sec.style.display = 'block';
        else sec.style.display = (sec.id === `cat-section-${catId}`) ? 'block' : 'none';
    });
}

function restaurarFiltro() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if(activeBtn && activeBtn.innerText === "Todo") {
        document.querySelectorAll('.category-section').forEach(s => s.style.display = 'block');
    }
}

// --- UTILS ---
function renderGaleria() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = galeriaURLs.map((u, i) => `<div class="thumb-box"><img src="${u}"><button type="button" class="btn-remove" onclick="galeriaURLs.splice(${i},1);renderGaleria()">X</button></div>`).join('');
}
function agregarUrlManual() {
    const val = document.getElementById('url-galeria-temp').value;
    if(val) { galeriaURLs.push(val); renderGaleria(); document.getElementById('url-galeria-temp').value=""; }
}
function actualizarPreview(tipo) {
    if(tipo === 'portada') {
        const url = document.getElementById('url-portada').value;
        const img = document.getElementById('preview-portada');
        if(url) { img.src = url; img.style.display='block'; }
    }
}
function verificarGastronomia() {
    const cat = document.getElementById('categoria').value;
    document.getElementById('bloque-subcategoria').style.display = (cat === "4") ? "block" : "none";
}
function agregarTipo() {
    const tipo = document.getElementById('subcategoria').value;
    const desc = document.getElementById('descripcion');
    if(tipo && !desc.value.includes(tipo)) desc.value = `[${tipo}] ` + desc.value;
}

async function borrarLugar(id) {
    if(!confirm("¿Borrar?")) return;
    const token = localStorage.getItem('token_turismo');
    try {
        await fetch(`${API_URL}/places/${id}`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} });
        cargarInventario();
    } catch(e) { alert("Error al borrar"); }
}

async function hacerLogin(e) {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('username', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);
    try {
        const res = await fetch(`${API_URL}/token`, { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token_turismo', data.access_token);
            
            // 💡 MEJORA: Cuando hace login, reescribimos la URL para limpiarla y que no quede el "secreto" expuesto
            window.history.replaceState({}, document.title, window.location.pathname);
            
            entrarAlPanel();
        } else { document.getElementById('error-msg').style.display = 'block'; }
    } catch(err) { alert("Error de conexión"); }
}

function entrarAlPanel() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    setTimeout(initMap, 500);
    cargarInventario();
    generarFiltros();
    cargarConfiguracionInicio(); 
}

function cerrarSesion() { localStorage.removeItem('token_turismo'); location.reload(); }
if(localStorage.getItem('token_turismo')) entrarAlPanel();
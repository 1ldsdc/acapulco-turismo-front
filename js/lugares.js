const params = new URLSearchParams(window.location.search);
const catId = params.get('cat');
const subCat = params.get('sub'); 

const categoryNames = {
    1: "Naturaleza y Ecoturismo", 2: "Playas y Bahía", 3: "Cultura e Historia",
    4: "Gastronomía Guerrerense", 5: "Atractivos Turísticos", 6: "Beach Clubs",
    7: "Vida Nocturna", 8: "Servicios Náuticos", 9: "Hotel Boutique", 10: "Iglesias"
};

const mapaEtiquetas = {
    'restaurantes': 'Restaurante',
    'cafeterias': 'Cafetería',
    'brunch': 'Brunch'
};

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('active'); }

function initPage() {
    let titulo = categoryNames[catId] || "Destinos Turísticos";

    if (catId === '4' && !subCat) {
        document.getElementById('catTitle').innerText = "GASTRONOMÍA";
        document.getElementById('catSubtitle').innerText = "¿Qué se te antoja hoy?";
        document.getElementById('placesGrid').style.display = 'none';
        document.getElementById('subcat-menu').style.display = 'grid';
        return; 
    }

    if (subCat) { titulo = subCat.toUpperCase(); }
    document.getElementById('catTitle').innerText = titulo;
    loadPlaces();
}

async function loadPlaces() {
    const grid = document.getElementById('placesGrid');
    try {
        const response = await fetch(`${API_URL}/places/`);
        if (!response.ok) throw new Error("Error servidor");
        const allPlaces = await response.json();

        // 🔥 FILTRO MÁGICO: OCULTA CATEGORÍAS DE SISTEMA (CAT_*) 🔥
        const realPlaces = allPlaces.filter(lugar => 
            !lugar.name.startsWith("CAT_") && 
            lugar.name !== "BANNER_HOME"
        );

        // FILTRAR POR CATEGORÍA SELECCIONADA
        let filteredPlaces = catId 
            ? realPlaces.filter(lugar => lugar.category_id == catId)
            : realPlaces;

        // FILTRAR POR SUBCATEGORÍA
        if (subCat) {
            const termino = (mapaEtiquetas[subCat] || subCat).toLowerCase();
            filteredPlaces = filteredPlaces.filter(lugar => 
                lugar.description.toLowerCase().includes(termino)
            );
        }

        grid.innerHTML = '';

        if (filteredPlaces.length === 0) {
            grid.innerHTML = '<div class="loading">No hay lugares registrados aquí aún.</div>';
            return;
        }

        filteredPlaces.forEach(place => {
            const imagenes = place.image_url ? place.image_url.split(',') : [];
            const img = imagenes.length > 0 ? imagenes[0].trim() : 'img/default.jpg';
            const mapLink = `mapa.html?id=${place.id}`;

            // 🔥 MEJORA APLICADA: Se agregó loading="lazy" a la etiqueta img
            const html = `
                <div class="place-card">
                    <div class="place-img-container">
                        <img src="${img}" class="place-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Turismo'">
                    </div>
                    <div class="place-content">
                        <h3 class="place-title">${place.name}</h3>
                        <p class="place-desc">${place.description}</p>
                        <a href="${mapLink}" class="btn-ruta">
                            <i class="fas fa-map-marked-alt"></i> Ver Detalles
                        </a>
                    </div>
                </div>
            `;
            grid.innerHTML += html;
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="loading" style="color:red">Error de conexión.</div>';
    }
}

initPage();

// ==========================================
// LÓGICA DEL BOTÓN VOLVER ARRIBA
// ==========================================
window.addEventListener('scroll', function() {
    const btnUp = document.getElementById('btn-volver-arriba');
    if (window.scrollY > 400) {
        btnUp.classList.add('show');
    } else {
        btnUp.classList.remove('show');
    }
});

function volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
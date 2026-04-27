function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('active'); }
var swiper = new Swiper(".mySwiper", { loop: true, effect: "fade", speed: 1200, autoplay: { delay: 4500, disableOnInteraction: false }, navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" } });

// --- CLIMA ---
fetch('https://api.open-meteo.com/v1/forecast?latitude=16.8531&longitude=-99.8237&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto')
    .then(r=>r.json()).then(d=>{
        document.getElementById('temp-actual').innerText = Math.round(d.current_weather.temperature) + "°C";
        document.getElementById('temp-desc').innerText = `(Máx ${Math.round(d.daily.temperature_2m_max[0])}° / Mín ${Math.round(d.daily.temperature_2m_min[0])}°)`;
    });

// --- LÓGICA MAESTRA (BÚSQUEDA + BANNER + CATEGORÍAS) ---
let allPlaces = [];

// Cargar Lugares al inicio
fetch(`${API_URL}/places/`).then(r => r.json()).then(data => { 
    allPlaces = data; 
    cargarContenidoDinamico(data);
});

// Cargar Configuración de Inicio (NUEVO)
cargarConfiguracionPublica();

function cargarContenidoDinamico(lugares) {
    // 1. CARGAR SLIDER (BANNER_HOME)
    const bannerData = lugares.find(l => l.name === "BANNER_HOME");
    if (bannerData && bannerData.image_url) {
        const imagenes = bannerData.image_url.split(',').filter(u => u.trim() !== "");
        const wrapper = document.getElementById('slider-wrapper');
        if (imagenes.length > 0) {
            wrapper.innerHTML = ""; 
            imagenes.forEach(url => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.style.backgroundImage = `url('${url.trim()}')`;
                wrapper.appendChild(slide);
            });
            swiper.update();
        }
    }

    // 2. CARGAR FOTOS DE CATEGORÍAS
    for(let i=1; i<=10; i++) {
        const catData = lugares.find(l => l.name === `CAT_${i}`);
        if (catData && catData.image_url) {
            const fotoCat = catData.image_url.split(',')[0].trim(); 
            const imgElement = document.getElementById(`img-cat-${i}`);
            if(imgElement) {
                imgElement.src = fotoCat;
            }
        }
    }
}

// ==========================================
// CARGAR DATOS DINÁMICOS DEL INICIO
// ==========================================
async function cargarConfiguracionPublica() {
    try {
        const res = await fetch(`${API_URL}/configuracion`);
        
        if (res.ok) {
            const config = await res.json();
            
            const elementoOcupacion = document.getElementById('vista-ocupacion');
            if (elementoOcupacion && config.ocupacion_hotelera > 0) {
                elementoOcupacion.innerHTML = `| 🏨 Ocupación: ${config.ocupacion_hotelera}%`;
            }

            const elementoBienvenida = document.getElementById('vista-bienvenida');
            if (elementoBienvenida && config.texto_bienvenida) {
                elementoBienvenida.innerText = config.texto_bienvenida;
            }

            if (config.ruta_fondo) {
                const wrapper = document.getElementById('slider-wrapper');
                wrapper.innerHTML = `<div class="swiper-slide" style="background-image: url('${config.ruta_fondo}');"></div>`;
                swiper.update();
            }

            const elementoLogo = document.getElementById('vista-logo-gobierno');
            if (elementoLogo && config.ruta_logo) {
                elementoLogo.src = config.ruta_logo;
            }

            const elementoOferta = document.getElementById('vista-oferta');
            if (elementoOferta && config.ruta_oferta) {
                elementoOferta.src = config.ruta_oferta;
            }
            
            const elementoSubtitulo = document.getElementById('vista-subtitulo');
            if (elementoSubtitulo && config.texto_presidenta) {
                elementoSubtitulo.innerText = config.texto_presidenta;
            }
        }
    } catch (error) {
        console.error("Error al cargar la configuración:", error);
    }
}

// --- LÓGICA BÚSQUEDA ---
function abrirBusqueda() {
    document.getElementById('search-overlay').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function cerrarBusqueda() {
    document.getElementById('search-overlay').style.display = 'none';
    document.getElementById('search-input').value = "";
    document.getElementById('search-results').innerHTML = "";
}

document.getElementById('search-input').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const container = document.getElementById('search-results');
    container.innerHTML = "";

    if (term.length < 2) return; 

    const resultados = allPlaces.filter(l => 
        !l.name.startsWith("CAT_") && l.name !== "BANNER_HOME" &&
        (l.name.toLowerCase().includes(term) || l.description.toLowerCase().includes(term))
    );

    if (resultados.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No se encontraron resultados.</p>';
    } else {
        resultados.forEach(lugar => {
            const foto = lugar.image_url ? lugar.image_url.split(',')[0].trim() : 'img/default.jpg';
            // 💡 MEJORA APLICADA: loading="lazy" en los resultados de búsqueda
            const item = `
                <a href="mapa.html?id=${lugar.id}" class="result-item">
                    <img src="${foto}" class="result-img" loading="lazy">
                    <div class="result-info">
                        <h4>${lugar.name}</h4>
                        <p>Ver detalles...</p>
                    </div>
                </a>
            `;
            container.innerHTML += item;
        });
    }
});

document.addEventListener('keydown', function(e) {
    if(e.key === "Escape") cerrarBusqueda();
});

// ==========================================
// MOTOR DE ANIMACIONES (SCROLL REVEAL)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); 
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
});

// ==========================================
// LÓGICA DEL POPUP NEWSLETTER (SALE SIEMPRE)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        document.getElementById('newsletter-modal').style.display = 'flex'; 
        setTimeout(() => {
            document.getElementById('newsletter-modal').classList.add('show');
        }, 50);
    }, 4000); 
});

function cerrarNewsletter() {
    document.getElementById('newsletter-modal').classList.remove('show');
    setTimeout(() => {
        document.getElementById('newsletter-modal').style.display = 'none';
    }, 400); 
}

function suscribirNewsletter(e) {
    e.preventDefault(); 
    
    document.querySelector('#newsletter-modal form').style.display = 'none';
    document.getElementById('news-exito').style.display = 'block';
    
    setTimeout(() => {
        cerrarNewsletter();
        
        setTimeout(() => {
            document.querySelector('#newsletter-modal form').style.display = 'flex';
            document.getElementById('news-exito').style.display = 'none';
            document.getElementById('email-news').value = '';
        }, 500);
    }, 3000);
}

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
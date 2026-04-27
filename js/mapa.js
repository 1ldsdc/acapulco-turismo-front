

        const params = new URLSearchParams(window.location.search);
        const lugarId = params.get('id');
        let latDestino, lngDestino, map, controlRuta;

        // Función para abrir/cerrar menú móvil
        function toggleMenu() { 
            document.getElementById('mobileMenu').classList.toggle('active'); 
        }

        var swiper = new Swiper(".mySwiper", {
            loop: true,
            pagination: { el: ".swiper-pagination", clickable: true },
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            autoplay: { delay: 3500, disableOnInteraction: false }
        });

        async function cargarDetalle() {
            if (!lugarId) { alert("Sin ID de lugar"); return; }

            try {
                const response = await fetch(`${API_URL}/places/`);
                const lugares = await response.json();
                const lugar = lugares.find(l => l.id == lugarId);

                if (lugar) {
                    document.getElementById('titulo-lugar').innerText = lugar.name;
                    document.getElementById('desc-lugar').innerText = lugar.description;
                    
                    const imagenes = lugar.image_url ? lugar.image_url.split(',').filter(u => u.trim() !== "") : [];
                    
                    if(imagenes.length > 0) {
                        document.getElementById('bg-header').style.backgroundImage = `url('${imagenes[0].trim()}')`;
                    }

                    if (imagenes.length > 1) {
                        document.getElementById('galeria-container').style.display = 'block';
                        const wrapper = document.getElementById('swiper-wrapper');
                        for(let i = 1; i < imagenes.length; i++) {
                            const slide = document.createElement('div');
                            slide.className = 'swiper-slide';
                            slide.innerHTML = `<img src="${imagenes[i].trim()}" alt="Foto ${i}">`;
                            wrapper.appendChild(slide);
                        }
                        swiper.update();
                    }

                    latDestino = lugar.latitude;
                    lngDestino = lugar.longitude;
                    iniciarMapa(latDestino, lngDestino, lugar.name);
                    document.getElementById('loader').style.display = 'none';
                }

            } catch (error) {
                console.error(error);
                document.getElementById('loader').innerHTML = "Error de conexión.";
            }
        }

        function iniciarMapa(lat, lng, titulo) {
            map = L.map('map').setView([lat, lng], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
            L.marker([lat, lng]).addTo(map).bindPopup(`<b>${titulo}</b>`).openPopup();
        }

        function trazarRuta() {
            const status = document.getElementById('status-ruta');
            status.innerText = "⏳ Obteniendo ubicación...";
            if (!navigator.geolocation) { status.innerText = "❌ GPS no soportado"; return; }

            navigator.geolocation.getCurrentPosition(pos => {
                status.innerText = "✅ Calculando ruta...";
                if (controlRuta) map.removeControl(controlRuta);
                
                controlRuta = L.Routing.control({
                    waypoints: [L.latLng(pos.coords.latitude, pos.coords.longitude), L.latLng(latDestino, lngDestino)],
                    language: 'es',
                    lineOptions: { styles: [{color: '#9D2449', opacity: 0.8, weight: 6}] },
                    createMarker: function(i, wp) { return i===0 ? L.marker(wp.latLng).bindPopup("Tú") : null; } 
                }).addTo(map);
                status.innerText = "";
            }, () => status.innerText = "❌ Activa tu ubicación para ver la ruta.");
        }

        cargarDetalle();
    
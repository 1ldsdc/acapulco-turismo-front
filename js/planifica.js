
     

        async function generarRuta(categoriaId, titulo, cardElement) {
            // Estilos selección
            document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
            cardElement.classList.add('active');

            const container = document.getElementById('timeline-container');
            const section = document.getElementById('resultados');
            const tituloEl = document.getElementById('titulo-ruta');
            
            section.style.display = 'block';
            tituloEl.innerText = titulo;
            container.innerHTML = '<p style="text-align:center; padding:20px;">Consultando base de datos...</p>';
            
            section.scrollIntoView({ behavior: 'smooth' });

            try {
                // LLAMADA AUTOMÁTICA A TU BASE DE DATOS
                const res = await fetch(`${API_URL}/places/`);
                const todosLosLugares = await res.json();

                // 🔥 FILTRO MÁGICO: OCULTAR REGISTROS DE SISTEMA 🔥
                const lugaresReales = todosLosLugares.filter(lugar => 
                    !lugar.name.startsWith("CAT_") && 
                    lugar.name !== "BANNER_HOME"
                );

                // LÓGICA AUTOMÁTICA DE FILTRADO (Sobre los reales)
                let filtrados = [];
                if(categoriaId === 1) { // Relax
                    filtrados = lugaresReales.filter(l => l.category_id === 1 || l.category_id === 2 || l.category_id === 6 || l.category_id === 9);
                } else if (categoriaId === 3) { // Cultura
                    filtrados = lugaresReales.filter(l => l.category_id === 3 || l.category_id === 10 || l.category_id === 5);
                } else if (categoriaId === 4) { // Sabor
                    filtrados = lugaresReales.filter(l => l.category_id === 4);
                } else { // Fiesta
                    filtrados = lugaresReales.filter(l => l.category_id === 7 || l.category_id === 8);
                }

                // Barajar y tomar 4
                const sugeridos = filtrados.sort(() => 0.5 - Math.random()).slice(0, 4);

                container.innerHTML = "";
                
                if(sugeridos.length === 0) {
                    container.innerHTML = '<p style="text-align:center;">No hay lugares registrados en esta categoría aún.</p>';
                    return;
                }

                sugeridos.forEach((lugar, index) => {
                    const foto = lugar.image_url ? lugar.image_url.split(',')[0].trim() : 'img/default.jpg';
                    const delay = index * 0.2; 

                    const html = `
                        <div class="timeline-item" style="animation-delay: ${delay}s">
                            <div class="timeline-dot"></div>
                            <a href="mapa.html?id=${lugar.id}" class="card-lugar">
                                <img src="${foto}" class="card-img" alt="${lugar.name}" onerror="this.src='https://via.placeholder.com/400'">
                                <div class="card-body">
                                    <h4 class="card-title">${lugar.name}</h4>
                                    <p class="card-desc">${lugar.description}</p>
                                    <span class="btn-ver-mapa">Ver ubicación <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </a>
                        </div>
                    `;
                    container.innerHTML += html;
                });

            } catch (error) {
                console.error(error);
                container.innerHTML = '<p style="text-align:center; color:red;">Error de conexión.</p>';
            }
        }
   

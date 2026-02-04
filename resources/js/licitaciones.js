const Licitaciones = {
    data() {
        return {
            licitaciones: [],
            loading: false,
            error: null,

            // Paginación
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 0,
            totalRecords: 0,

            // Filtros
            searchQuery: '',
            searchField: 'todos', // 'todos', 'consecutivo', 'objeto', 'descripcion'
            searchTimeout: null
        };
    },
    async created() {
        await this.load();
    },
    methods: {
        async load(page = 1) {
            this.loading = true;
            this.error = null;
            this.currentPage = page;
            try {
                // Construir query string con filtros
                const params = new URLSearchParams();
                if (this.searchQuery.trim()) {
                    params.append('search', this.searchQuery.trim());
                    params.append('field', this.searchField);
                }
                params.append('page', page);
                params.append('limit', this.itemsPerPage);

                const res = await fetch(`/api/licitaciones?${params.toString()}`);
                const json = await res.json();

                if (json.success === false) {
                    this.error = json.message || 'Error al cargar licitaciones';
                    this.licitaciones = [];
                    return;
                }

                this.licitaciones = json.data || [];

                // Actualizar información de paginación
                if (json.pagination) {
                    this.currentPage = json.pagination.page;
                    this.totalRecords = json.pagination.total;
                    this.totalPages = json.pagination.last_page;
                }
            } catch (e) {
                console.error(e);
                this.error = 'No se pudieron cargar las licitaciones.';
                this.licitaciones = [];
            } finally {
                this.loading = false;
            }
        },

        onSearchChange() {
            // Debounce: esperar 500ms después de que el usuario deja de escribir
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(async () => {
                await this.load(1);
            }, 500);
        },

        async goToPage(page) {
            if (page < 1 || page > this.totalPages) return;
            await this.load(page);
        },

        async downloadReport() {
            try {
                // Reutilizar misma lógica de filtros que en load()
                const params = new URLSearchParams();
                if (this.searchQuery.trim()) {
                    params.append('search', this.searchQuery.trim());
                    params.append('field', this.searchField);
                }

                const res = await fetch(`/api/licitaciones/export?${params.toString()}`);

                if (!res.ok) {
                    this.error = 'Error al descargar el reporte';
                    return;
                }

                // Obtener nombre del archivo del header Content-Disposition
                const contentDisposition = res.headers.get('content-disposition');
                let fileName = 'licitaciones-reporte.xlsx';

                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="?([^"\n]+)"?/);
                    if (fileNameMatch) fileName = fileNameMatch[1];
                }

                // Descargar el archivo
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (e) {
                console.error(e);
                this.error = 'No se pudo descargar el reporte';
            }
        },

        viewDetail(id) {
            window.location.href = `/licitaciones/${id}`;
        },

        getEstadoClass(estado) {
            const estadoMap = {
                'ACTIVO': 'success',
                'CERRADO': 'danger',
                'CANCELADO': 'secondary',
                'PAUSADO': 'warning'
            };
            return estadoMap[estado] || 'secondary';
        },

        formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
        },

        truncateText(text, maxLength = 50) {
            if (!text) return '-';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }
    },
    mounted() {
        // Agregar estilos CSS globales
        if (!document.getElementById('licitaciones-styles')) {
            const style = document.createElement('style');
            style.id = 'licitaciones-styles';
            style.textContent = `
                .pagination .page-link {
                    color: #495057;
                }
                .pagination .page-item.active .page-link {
                    background: #b7b6b6;
                    border-color: #9e9e9e;
                }
                .pagination .page-link:hover:not(.disabled) {
                    color: #212529;
                    background-color: #e9ecef;
                    border-color: #dee2e6;
                }
                .btn-view-detail {
                    transition: all 0.2s ease-in-out;
                }
                .btn-view-detail:hover {
                    background-color: rgba(108, 117, 125, 0.5);
                    border-color: #6c757d;
                    color: #6c757d;
                }
            `;
            document.head.appendChild(style);
        }
    },
    template: `
        <div class="container-fluid mt-4">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="mb-0" style="font-weight:400">Licitaciones</h2>
                    <small class="text-muted" v-if="totalRecords > 0">{{ totalRecords }} resultado(s) encontrado(s)</small>
                </div>
                <div class="d-flex gap-2">
                    <button @click="downloadReport" class="btn btn-success border border-dark" title="Descargar reporte en Excel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-spreadsheet me-2" viewBox="0 0 16 16">
                            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                            <path d="M3 7a1 1 0 0 1 1-1h2v2H4V7zm2 3H4v2h2v-2zm3-3a1 1 0 0 1 1-1h2v2H9V7zm2 3H9v2h2v-2z"/>
                        </svg>
                        Reporte
                    </button>
                    <a href="/licitaciones/create" class="btn btn-warning border border-dark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle me-2" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        Crear licitación
                    </a>
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle me-2" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                {{ error }}
            </div>

            <!-- Filtros -->
            <div class="card mb-4 border-1">
                <div class="card-body">
                    <h6 class="card-title mb-3 text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-search me-2" viewBox="0 0 16 16" style="vertical-align: -2px;">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                        Filtros de búsqueda
                    </h6>
                    <div class="row g-2">
                        <div class="col-md-6">
                            <label class="form-label small text-muted d-block mb-2">Término de búsqueda</label>
                            <input type="text" class="form-control form-control-sm" placeholder="Escribe para buscar..." v-model="searchQuery" @input="onSearchChange">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small text-muted d-block mb-2">Campo</label>
                            <select class="form-select form-select-sm" v-model="searchField" @change="onSearchChange">
                                <option value="todos">Todos los campos</option>
                                <option value="consecutivo">Consecutivo</option>
                                <option value="objeto">Objeto</option>
                                <option value="descripcion">Descripción</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando licitaciones...</p>
            </div>

            <!-- Table -->
            <div v-else class="table-container">
                <div class="table-responsive">
                    <table v-if="licitaciones.length > 0" class="table table-hover table-bordered">
                        <thead>
                            <tr>
                                <th style="font-weight:600; background: #efefef;">Consecutivo</th>
                                <th style="font-weight:600; background: #efefef;">Objeto</th>
                                <th style="font-weight:600; background: #efefef;">Descripción</th>
                                <th style="font-weight:600; background: #efefef;">Fecha Inicio</th>
                                <th style="font-weight:600; background: #efefef;">Fecha Cierre</th>
                                <th style="font-weight:600; background: #efefef;" class="text-center">Estado</th>
                                <th style="font-weight:600; background: #efefef;" class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="lic in licitaciones" :key="lic.id" class="align-middle">
                                <td>
                                    <span class="badge bg-light text-dark">{{ lic.consecutivo }}</span>
                                </td>
                                <td class="fw-500" :title="lic.objeto">{{ truncateText(lic.objeto, 40) }}</td>
                                <td class="text-muted small" :title="lic.descripcion">{{ truncateText(lic.descripcion, 50) }}</td>
                                <td>
                                    <small>{{ formatDate(lic.fecha_inicio) }}</small>
                                </td>
                                <td>
                                    <small>{{ formatDate(lic.fecha_cierre) }}</small>
                                </td>
                                <td class="text-center">
                                    <span :class="['badge', 'bg-' + getEstadoClass(lic.estado)]">
                                        {{ lic.estado || 'ACTIVO' }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <button @click="viewDetail(lic.id)" class="btn btn-sm btn-outline-secondary btn-view-detail" title="Ver detalle">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="border rounded-2 p-5 text-center" style="background-color: #f8f9fa; border-color: #dee2e6 !important;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="#6c757d" class="mb-3" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>
                        <h6 class="text-muted mb-1">Sin resultados</h6>
                        <p class="text-muted mb-0 small">No hay licitaciones que coincidan con tu búsqueda.</p>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <nav v-if="!loading && licitaciones.length > 0 && totalPages > 1" class="mt-4" aria-label="Paginación">
                <ul class="pagination justify-content-center">
                    <li :class="['page-item', currentPage === 1 ? 'disabled' : '']">
                        <button class="page-link" @click="goToPage(1)" :disabled="currentPage === 1">Primera</button>
                    </li>
                    <li :class="['page-item', currentPage === 1 ? 'disabled' : '']">
                        <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Anterior</button>
                    </li>
                    <li v-for="page in totalPages" :key="page" :class="['page-item', currentPage === page ? 'active' : '']">
                        <button class="page-link" @click="goToPage(page)">{{ page }}</button>
                    </li>
                    <li :class="['page-item', currentPage === totalPages ? 'disabled' : '']">
                        <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">Siguiente</button>
                    </li>
                    <li :class="['page-item', currentPage === totalPages ? 'disabled' : '']">
                        <button class="page-link" @click="goToPage(totalPages)" :disabled="currentPage === totalPages">Última</button>
                    </li>
                </ul>
                <div class="text-center text-muted small mt-2">
                    Página {{ currentPage }} de {{ totalPages }}
                </div>
            </nav>
        </div>
    `
};

export default Licitaciones;
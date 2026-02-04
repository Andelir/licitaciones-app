export default {
    data() {
        return {
            licitacion: null,
            loading: true,
            error: null,
            activeTab: 'general',
            showConfirmDelete: false,
            deletingId: null
        };
    },
    computed: {
        licitacionId() {
            // Extraer ID de la URL actual
            const match = window.location.pathname.match(/\/licitaciones\/(\d+)/);
            return match ? parseInt(match[1]) : null;
        },
        formattedFechaInicio() {
            return this.licitacion?.fecha_inicio ? new Date(this.licitacion.fecha_inicio).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
        },
        formattedFechaCierre() {
            return this.licitacion?.fecha_cierre ? new Date(this.licitacion.fecha_cierre).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
        },
        formattedCreado() {
            if (!this.licitacion?.creado_en) return '-';
            const date = new Date(this.licitacion.creado_en);
            return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        },
        estadoBadgeClass() {
            const estadoMap = {
                'ACTIVO': 'success',
                'CERRADO': 'danger',
                'CANCELADO': 'secondary',
                'PAUSADO': 'warning'
            };
            return 'bg-' + (estadoMap[this.licitacion?.estado] || 'secondary');
        }
    },
    async created() {
        await this.loadLicitacion();
    },
    methods: {
        async loadLicitacion() {
            if (!this.licitacionId) {
                this.error = 'ID de licitación no válido';
                this.loading = false;
                return;
            }

            try {
                const res = await fetch(`/api/licitaciones/${this.licitacionId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        this.error = 'Licitación no encontrada';
                    } else {
                        this.error = 'Error al cargar la licitación';
                    }
                    this.loading = false;
                    return;
                }

                const json = await res.json();
                this.licitacion = json.data || null;

                if (!this.licitacion) {
                    this.error = 'No se pudo cargar la información';
                }
            } catch (e) {
                console.error(e);
                this.error = 'Error de conexión al servidor';
            } finally {
                this.loading = false;
            }
        },

        goToEdit() {
            if (this.licitacionId) {
                window.location.href = `/licitaciones/${this.licitacionId}/edit`;
            }
        },

        switchTab(tab) {
            this.activeTab = tab;
        }
    },
    template: `
    <div class="container-fluid mt-4">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando información de la licitación...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle me-2" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
        {{ error }}
        <a href="/licitaciones" class="alert-link ms-2">Volver al listado</a>
      </div>

      <!-- Content -->
      <div v-else-if="licitacion">
        <!-- Botón Volver al listado -->
        <div class="mb-3">
          <a href="/licitaciones" class="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-arrow-left me-2" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Volver al listado
          </a>
        </div>

        <div class="card">
          <!-- Header con título y acciones -->
          <div class="card-header bg-light d-flex justify-content-between align-items-start">
            <div>
              <h5 class="mb-1">{{ licitacion.consecutivo }}</h5>
              <p class="mb-0 text-muted small">{{ licitacion.objeto }}</p>
            </div>
            <div class="d-flex gap-2">
              <span :class="['badge', estadoBadgeClass, 'fs-6']">
                {{ licitacion.estado || 'ACTIVO' }}
              </span>
            </div>
          </div>

          <!-- Tabs -->
          <div class="card-body">
            <ul class="nav nav-tabs mb-4" role="tablist">
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  :class="{ active: activeTab === 'general' }"
                  @click="switchTab('general')"
                  type="button" 
                  role="tab">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-text me-1" viewBox="0 0 16 16">
                    <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
                  </svg>
                  Información General
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  :class="{ active: activeTab === 'cronograma' }"
                  @click="switchTab('cronograma')"
                  type="button" 
                  role="tab">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar me-2" viewBox="0 0 16 16">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                  </svg>
                  Cronograma
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  :class="{ active: activeTab === 'documentos' }"
                  @click="switchTab('documentos')"
                  type="button"
                  role="tab">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder2 me-2" viewBox="0 0 16 16">
                    <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.586a1.5 1.5 0 0 1 1.06.44l.914.914A1.5 1.5 0 0 0 9.12 3.5H13.5A1.5 1.5 0 0 1 15 5v6.5A1.5 1.5 0 0 1 13.5 13h-11A1.5 1.5 0 0 1 1 11.5v-8z"/>
                  </svg>
                  Documentos
                </button>
              </li>
            </ul>

            <!-- Tab: Información General -->
            <div v-if="activeTab === 'general'">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Objeto</label>
                    <p class="mb-0 fs-5">{{ licitacion.objeto }}</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Consecutivo</label>
                    <p class="mb-0 fs-5"><span class="badge bg-light text-dark">{{ licitacion.consecutivo }}</span></p>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-12">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Descripción</label>
                    <p class="mb-0 text-muted" style="line-height: 1.6;">{{ licitacion.descripcion }}</p>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Presupuesto</label>
                    <p class="mb-0 fs-5">{{ new Intl.NumberFormat('es-CO', { style: 'currency', currency: licitacion.moneda || 'COP' }).format(licitacion.presupuesto) }}</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Moneda</label>
                    <p class="mb-0 fs-5">{{ licitacion.moneda }}</p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Estado</label>
                    <p class="mb-0"><span :class="['badge', estadoBadgeClass]">{{ licitacion.estado || 'ACTIVO' }}</span></p>
                  </div>
                </div>
              </div>

              <div class="row mt-4 pt-3 border-top">
                <div class="col-12">
                  <small class="text-muted">
                    <strong>Creado:</strong> {{ formattedCreado }}
                  </small>
                </div>
              </div>
            </div>

            <!-- Tab: Cronograma -->
            <div v-if="activeTab === 'cronograma'">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Fecha de Inicio</label>
                    <p class="mb-0 fs-5">{{ formattedFechaInicio }}</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Hora de Inicio</label>
                    <p class="mb-0 fs-5">{{ licitacion.hora_inicio || '-' }}</p>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Fecha de Cierre</label>
                    <p class="mb-0 fs-5">{{ formattedFechaCierre }}</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label text-muted small fw-600">Hora de Cierre</label>
                    <p class="mb-0 fs-5">{{ licitacion.hora_cierre || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Timeline visual -->
              <div class="mt-4 pt-3 border-top">
                <div class="timeline-item d-flex">
                  <div class="timeline-marker bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; flex-shrink: 0; margin-right: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
                      <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="mb-0 fw-600">Inicia</p>
                    <p class="mb-0 text-muted small">{{ formattedFechaInicio }} a las {{ licitacion.hora_inicio }}</p>
                  </div>
                </div>
                <div class="timeline-item d-flex mt-3">
                  <div class="timeline-marker bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; flex-shrink: 0; margin-right: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-calendar-x" viewBox="0 0 16 16">
                      <path d="M6.146 7.354l.646.646.646-.646a.5.5 0 1 1 .708.708l-.647.646.647.646a.5.5 0 1 1-.708.708l-.646-.647-.646.647a.5.5 0 1 1-.708-.708l.647-.646-.647-.646a.5.5 0 1 1 .708-.708zM3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="mb-0 fw-600">Cierra</p>
                    <p class="mb-0 text-muted small">{{ formattedFechaCierre }} a las {{ licitacion.hora_cierre }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Documentos -->
            <div v-if="activeTab === 'documentos'">
              <div v-if="Array.isArray(licitacion.documentos) && licitacion.documentos.length > 0" class="border rounded p-3 bg-light">
                <h6 class="mb-3">Documentos cargados</h6>
                <div class="list-group">
                  <div v-for="doc in licitacion.documentos" :key="doc.id" class="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-600">{{ doc.titulo }}</div>
                      <div class="text-muted small">{{ doc.descripcion }}</div>
                      <div class="text-muted small">
                        Archivo:
                        <a :href="'/api/licitaciones/' + licitacionId + '/documentos/' + doc.id + '/download'" class="text-decoration-none" target="_blank">
                          {{ (doc.archivo || '').split('/').pop() }}
                        </a>
                      </div>
                    </div>
                    <a :href="'/api/licitaciones/' + licitacionId + '/documentos/' + doc.id + '/download'" class="btn btn-sm btn-outline-secondary">Descargar</a>
                  </div>
                </div>
              </div>

              <div v-else class="text-muted small">
                No hay documentos cargados para esta licitación.
              </div>
            </div>
          </div>

          <!-- Footer con acciones -->
          <div class="card-footer bg-light d-flex justify-content-between align-items-center">
            <div class="d-flex gap-2">
              <button @click="goToEdit" class="btn btn-warning btn-sm border border-dark">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pencil me-1" viewBox="0 0 16 16">
                  <path d="M12.146.292a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5z"/>
                </svg>
                Editar
              </button>
            </div>
          </div>
      </div>
    </div>`
};

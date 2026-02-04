export default {
    data() {
        return {
            activeTab: 'general', // control de tabs
            form: {
                id: null,
                consecutivo: '',
                objeto: '',
                descripcion: '', // nuevo campo (máx 400)
                presupuesto: '',
                moneda: '',
                actividad_id: null,
                actividad_name: '',
                // cronograma
                fecha_inicio: '',
                hora_inicio: '',
                fecha_cierre: '',
                hora_cierre: ''
            },
              documents: [],
              newDocument: {
                titulo: '',
                descripcion: '',
                file: null
              },
              documentErrors: {},
            errors: {},
            submitError: null,
            successMessage: null,
            loading: false,

            // actividad modal/search
            showActividadModal: false,
            actividadQuery: '',
            actividadResults: [],
            searchLoading: false,
            searchTimeout: null
        };
    },
    computed: {
        objetoRemaining() {
            return 150 - (this.form.objeto ? this.form.objeto.length : 0);
        },
        descripcionRemaining() {
            return 400 - (this.form.descripcion ? this.form.descripcion.length : 0);
        },
        minFechaCierre() {
            return this.form.fecha_inicio || '';
        },
        licitacionId() {
            // Extraer ID de la URL actual
            const match = window.location.pathname.match(/\/licitaciones\/(\d+)/);
            return match ? parseInt(match[1]) : null;
        },
    },
    methods: {
        validateAll() {
            this.errors = {};
            // objeto required as "objeto" and max 150
            const desc = this.form.objeto || '';
            if (!desc.trim()) {
                this.errors.objeto = 'El objeto es obligatorio.';
            } else if (desc.length > 150) {
                this.errors.objeto = 'El objeto no puede exceder 150 caracteres.';
            }

            // descripcion (nuevo) required, max 400
            const descripcion = this.form.descripcion || '';
            if (!descripcion.trim()) {
                this.errors.descripcion = 'La descripción es obligatoria.';
            } else if (descripcion.length > 400) {
                this.errors.descripcion = 'La descripción no puede exceder 400 caracteres.';
            }

            // moneda es obligatorio
            if (!(this.form.moneda || '').trim()) {
                this.errors.moneda = 'La moneda es obligatoria.';
            }

            // presupuesto: required, numeric > 0, max 2 decimales
            const pRaw = (this.form.presupuesto || '').toString().trim();
            const pSan = pRaw.replace(',', '.');
            if (!pSan) {
                this.errors.presupuesto = 'El presupuesto es obligatorio.';
            } else if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(pSan)) {
                this.errors.presupuesto = 'El presupuesto debe ser un número con hasta 2 decimales.';
            } else {
                const pVal = parseFloat(pSan);
                if (!(pVal > 0)) {
                    this.errors.presupuesto = 'El presupuesto debe ser mayor que 0.';
                }
            }

            // For other fields ensure they are not only spaces when filled
            ['actividad_name'].forEach(k => {
                const v = this.form[k] ?? '';
                if (typeof v === 'string' && v.length > 0 && v.trim().length === 0) {
                    this.errors[k] = 'No se permiten solo espacios.';
                }
            });

            // CRONOGRAMA validations
            // Fecha de inicio: obligatorio y formato válido
            if (!this.form.fecha_inicio) {
                this.errors.fecha_inicio = 'La fecha de inicio es obligatoria.';
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(this.form.fecha_inicio)) {
                this.errors.fecha_inicio = 'Formato de fecha inválido (YYYY-MM-DD).';
            }

            // Hora de inicio: obligatorio y formato HH:mm
            if (!this.form.hora_inicio) {
                this.errors.hora_inicio = 'La hora de inicio es obligatoria.';
            } else if (!/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(this.form.hora_inicio)) {
                this.errors.hora_inicio = 'Formato de hora inválido (HH:mm 24h).';
            }

            // Fecha de cierre: obligatorio, no puede ser menor a fecha inicio
            if (!this.form.fecha_cierre) {
                this.errors.fecha_cierre = 'La fecha de cierre es obligatoria.';
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(this.form.fecha_cierre)) {
                this.errors.fecha_cierre = 'Formato de fecha inválido (YYYY-MM-DD).';
            } else if (this.form.fecha_inicio && this.form.fecha_cierre < this.form.fecha_inicio) {
                this.errors.fecha_cierre = 'La fecha de cierre no puede ser menor a la fecha de inicio.';
            }

            // Hora de cierre: obligatorio, validación cruzada
            if (!this.form.hora_cierre) {
                this.errors.hora_cierre = 'La hora de cierre es obligatoria.';
            } else if (!/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(this.form.hora_cierre)) {
                this.errors.hora_cierre = 'Formato de hora inválido (HH:mm 24h).';
            } else if (this.form.fecha_inicio && this.form.fecha_cierre && 
                       this.form.fecha_inicio === this.form.fecha_cierre &&
                       this.form.hora_inicio && this.form.hora_cierre <= this.form.hora_inicio) {
                this.errors.hora_cierre = 'La hora de cierre debe ser mayor a la hora de inicio cuando las fechas son iguales.';
            }

            return Object.keys(this.errors).length === 0;
        },

        // formato y control de presupuesto en input
        onPresupuestoInput(e) {
            // allow digits, dot and comma
            const value = e.target.value.replace(/[^0-9.,]/g, '');
            this.form.presupuesto = value;
        },
        formatPresupuesto() {
            const v = (this.form.presupuesto || '').toString().trim().replace(',', '.');
            if (!v) return;
            if (/^[0-9]+(\.[0-9]{1,2})?$/.test(v)) {
                this.form.presupuesto = parseFloat(v).toFixed(2);
            }
        },

        openActividadModal() {
            this.showActividadModal = true;
            this.actividadQuery = '';
            this.actividadResults = [];
            this.$nextTick(() => {
                const input = document.getElementById('actividadSearchInput');
                if (input) input.focus();
            });
        },
        closeActividadModal() {
            this.showActividadModal = false;
        },
        onActividadSearchInput() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(this.searchActividades, 300);
        },
        async searchActividades() {
            const q = (this.actividadQuery || '').trim();
            if (!q) { this.actividadResults = []; return; }
            this.searchLoading = true;
            try {
                const res = await fetch('/api/actividades?search=' + encodeURIComponent(q));
                if (res.ok) {
                    const json = await res.json();
                    // expect array of {id, nombre}
                    this.actividadResults = Array.isArray(json.data) ? json.data : json;
                } else {
                    // fallback sample results
                    this.actividadResults = this.fallbackActividades(q);
                }
            } catch (e) {
                // network / no endpoint -> fallback
                this.actividadResults = this.fallbackActividades(q);
            } finally {
                this.searchLoading = false;
            }
        },
        fallbackActividades(q) {
            const samples = [
                { id: 1, nombre: 'Construcción' },
                { id: 2, nombre: 'Suministros' },
                { id: 3, nombre: 'Servicios profesionales' },
                { id: 4, nombre: 'Mantenimiento' }
            ];
            return samples.filter(s => s.nombre.toLowerCase().includes(q.toLowerCase()));
        },
        selectActividad(act) {
            this.form.actividad_id = act.id;
            this.form.actividad_name = act.nombre;
            this.errors.actividad_name = null;
            this.closeActividadModal();
        },
        clearActividad() {
            this.form.actividad_id = null;
            this.form.actividad_name = '';
        },

        setTab(tab) {
            this.activeTab = tab;
        },

        onDocumentFileChange(e) {
          const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
          this.newDocument.file = file;
          if (this.documentErrors.file) {
            this.documentErrors.file = null;
          }
        },
        validateDocument() {
          this.documentErrors = {};
          if (!this.newDocument.titulo.trim()) {
            this.documentErrors.titulo = 'El título es obligatorio.';
          }
          if (!this.newDocument.descripcion.trim()) {
            this.documentErrors.descripcion = 'La descripción es obligatoria.';
          }
          if (!this.newDocument.file) {
            this.documentErrors.file = 'El archivo es obligatorio.';
          } else {
            const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
            const fileName = (this.newDocument.file.name || '').toLowerCase();
            const hasValidExtension = fileName.endsWith('.pdf') || fileName.endsWith('.zip');
            if (!allowedTypes.includes(this.newDocument.file.type) && !hasValidExtension) {
              this.documentErrors.file = 'Solo se permiten archivos PDF o ZIP.';
            }
          }
          return Object.keys(this.documentErrors).length === 0;
        },
        addDocument() {
          if (!this.validateDocument()) return;
          this.uploadDocument();
        },
        removeDocument(index) {
          const doc = this.documents[index];
          if (!doc || !doc.id) {
            this.documents.splice(index, 1);
            return;
          }
          this.deleteDocument(doc.id, index);
        },
        async uploadDocument() {
          const id = this.form.id || this.licitacionId;
          if (!id) {
            this.submitError = 'ID de licitación no encontrado.';
            return;
          }
          try {
            const formData = new FormData();
            formData.append('titulo', this.newDocument.titulo.trim());
            formData.append('descripcion', this.newDocument.descripcion.trim());
            formData.append('archivo', this.newDocument.file);

            const res = await fetch(`/api/licitaciones/${id}/documentos`, {
              method: 'POST',
              body: formData
            });

            if (!res.ok) {
              const json = await res.json().catch(() => ({}));
              if (json.errors) {
                this.documentErrors = json.errors;
              } else {
                this.submitError = json.error || 'Error al cargar el documento.';
              }
              return;
            }

            const json = await res.json();
            if (json.data) {
              this.documents.push(json.data);
            }

            this.newDocument.titulo = '';
            this.newDocument.descripcion = '';
            this.newDocument.file = null;
            const input = document.getElementById('documentoFileInput');
            if (input) input.value = '';
          } catch (e) {
            this.submitError = 'Error de red al cargar el documento.';
          }
        },
        async deleteDocument(documentoId, index) {
          const id = this.form.id || this.licitacionId;
          if (!id) return;
          try {
            const res = await fetch(`/api/licitaciones/${id}/documentos/${documentoId}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              this.documents.splice(index, 1);
            } else {
              const json = await res.json().catch(() => ({}));
              this.submitError = json.error || 'Error al eliminar el documento.';
            }
          } catch (e) {
            this.submitError = 'Error de red al eliminar el documento.';
          }
        },

        async submit() {
            this.submitError = null;
            this.successMessage = null;
            // Limpiar errores previos
            this.errors = {};
          if (this.documents.length === 0) {
            this.submitError = 'Debes cargar al menos un documento.';
            this.activeTab = 'documentos';
            return;
          }
            
            if (!this.validateAll()) {
                this.submitError = 'Corrige los errores del formulario.';
                return;
            }
            this.submitError = null;
            this.loading = true;
            try {
                const payload = {
                    objeto: this.form.objeto.trim(),
                    descripcion: this.form.descripcion.trim(),
                    presupuesto: parseFloat((this.form.presupuesto || '').toString().replace(',', '.')).toFixed(2),
                    moneda: this.form.moneda || '',
                    actividad_id: this.form.actividad_id || null,
                    fecha_inicio: this.form.fecha_inicio,
                    hora_inicio: this.form.hora_inicio,
                    fecha_cierre: this.form.fecha_cierre,
                    hora_cierre: this.form.hora_cierre
                };
                const id = this.form.id || this.licitacionId ;
                const res = await fetch(`/api/licitaciones/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.status === 200) {
                    const json = await res.json();
                    const consecutivo = this.form.consecutivo || 'la licitación';
                    
                    // Mostrar toast de éxito
                    this.successMessage = `¡Licitación ${consecutivo} editada exitosamente!`;
                    
                    // Redirigir después de 2 segundos para que vea el mensaje
                    setTimeout(() => {
                        window.location.href = '/licitaciones';
                    }, 2000);
                } else {
                    const json = await res.json().catch(() => ({}));
                    
                    // Si el backend devolvió errores de validación específicos, mostrarlos
                    if (json.errors && typeof json.errors === 'object') {
                        this.errors = json.errors;
                        this.submitError = 'Errores de validación del servidor. Revisa los campos marcados.';
                    } else {
                        this.submitError = json.error || 'Error al editar la licitación.';
                    }
                }
            } catch (e) {
                this.submitError = 'Error de red al editar la licitación.';
            } finally {
                this.loading = false;
            }
        },
        async loadLicitacionData() {
            const id = this.licitacionId;
            if (!id) {
                this.submitError = 'ID de licitación no encontrado en la URL.';
                return;
            }
            try {
                const res = await fetch(`/api/licitaciones/${id}`);
                if (res.ok) {
                    const json = await res.json();
                    const data = json.data || {};
                    this.form.id = data.id || null;
                    this.form.consecutivo = data.consecutivo || '';
                    this.form.objeto = data.objeto || '';
                    this.form.descripcion = data.descripcion || '';
                    this.form.presupuesto = data.presupuesto ? parseFloat(data.presupuesto).toFixed(2) : '';
                    this.form.moneda = data.moneda || '';
                    this.form.actividad_id = data.actividad_id || null;
                    this.form.actividad_name = data.actividad_name || '';
                    this.form.fecha_inicio = data.fecha_inicio || '';
                    this.form.hora_inicio = data.hora_inicio || '';
                    this.form.fecha_cierre = data.fecha_cierre || '';
                    this.form.hora_cierre = data.hora_cierre || '';
                    this.documents = Array.isArray(data.documentos) ? data.documentos : [];
                } else {
                    this.submitError = 'No se pudo cargar la licitación.';
                }
            } catch (e) {
                this.submitError = 'Error de red al cargar la licitación.';
            }
        }
    },
    mounted() {
        // Cargar datos iniciales de la licitación a editar
        this.loadLicitacionData();
    },
    template: `
    <div class="container-fluid mt-4">
      <!-- Botón Volver al listado -->
      <div class="mb-3">
        <a href="/licitaciones" class="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-arrow-left me-2" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Volver al listado
        </a>
      </div>

      <div class="card p-3">
      <h5 class="mb-3">Editar licitación {{this.form.consecutivo}}</h5>

      <!-- Toast de éxito -->
      <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle me-2" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m10.97 4.97-.02.02-3.6 3.85-1.74-1.885a.5.5 0 0 0-.712.712l2.55 2.675a.5.5 0 0 0 .74-.037l4.005-4.287a.5.5 0 0 0-.738-.847z"/>
        </svg>
        {{ successMessage }}
      </div>

      <!-- Alert de error -->
      <div v-if="submitError" class="alert alert-danger alert-dismissible fade show" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle me-2" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
        {{ submitError }}
      </div>

      <!-- Tabs Navigation -->
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button :class="['nav-link', activeTab === 'general' ? 'active' : '']" @click="setTab('general')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-text me-1" viewBox="0 0 16 16">
              <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
            </svg>
            General
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button :class="['nav-link', activeTab === 'cronograma' ? 'active' : '']" @click="setTab('cronograma')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock me-1" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            Cronograma
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button :class="['nav-link', activeTab === 'documentos' ? 'active' : '']" @click="setTab('documentos')" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder2 me-1" viewBox="0 0 16 16">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.586a1.5 1.5 0 0 1 1.06.44l.914.914A1.5 1.5 0 0 0 9.12 3.5H13.5A1.5 1.5 0 0 1 15 5v6.5A1.5 1.5 0 0 1 13.5 13h-11A1.5 1.5 0 0 1 1 11.5v-8z"/>
            </svg>
            Documentos
          </button>
        </li>
      </ul>

      <!-- Tab Content: General -->
      <div v-show="activeTab === 'general'">
        <div class="mb-3">
          <label for="objetoInput" class="form-label">Objeto (máx. 150) <span class="text-danger">*</span></label>
          <textarea id="objetoInput" v-model="form.objeto" :class="['form-control', errors.objeto ? 'is-invalid' : '']" rows="2" maxlength="150" placeholder="Describe el objeto de la licitación"></textarea>
          <div class="form-text">Caracteres restantes: {{ objetoRemaining }}</div>
          <div v-if="errors.objeto" class="invalid-feedback d-block">{{ errors.objeto }}</div>
        </div>

        <div class="mb-3">
          <label for="descripcionInput" class="form-label">Descripción (máx. 400) <span class="text-danger">*</span></label>
          <textarea id="descripcionInput" v-model="form.descripcion" :class="['form-control', errors.descripcion ? 'is-invalid' : '']" rows="5" maxlength="400" placeholder="Descripción detallada de la licitación"></textarea>
          <div class="form-text">Caracteres restantes: {{ descripcionRemaining }}</div>
          <div v-if="errors.descripcion" class="invalid-feedback d-block">{{ errors.descripcion }}</div>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-md-6">
            <label for="presupuestoInput" class="form-label">Presupuesto <span class="text-danger">*</span></label>
            <input id="presupuestoInput" inputmode="decimal" v-model="form.presupuesto" @input="onPresupuestoInput" @blur="formatPresupuesto" :class="['form-control', errors.presupuesto ? 'is-invalid' : '']" placeholder="0.00">
            <div v-if="errors.presupuesto" class="invalid-feedback">{{ errors.presupuesto }}</div>
          </div>
          <div class="col-md-6">
            <label for="monedaSelect" class="form-label">Moneda <span class="text-danger">*</span></label>
            <select id="monedaSelect" v-model="form.moneda" :class="['form-select', errors.moneda ? 'is-invalid' : '']">
                <option value="">Selecciona moneda</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="COP">COP</option>
            </select>
            <div v-if="errors.moneda" class="invalid-feedback">{{ errors.moneda }}</div>
          </div>
        </div>

        <div class="mb-3">
          <label for="actividadSelectedInput" class="form-label">Actividad</label>
          <div class="d-flex gap-2">
            <input id="actividadSelectedInput" class="form-control" readonly :value="form.actividad_name || 'Ninguna seleccionada'">
            <button type="button" class="btn btn-outline-secondary" @click="openActividadModal">Buscar</button>
            <button v-if="form.actividad_name" type="button" class="btn btn-outline-danger" @click="clearActividad">Quitar</button>
          </div>
          <div v-if="errors.actividad_name" class="form-text text-danger">{{ errors.actividad_name }}</div>
        </div>
      </div>

      <!-- Tab Content: Cronograma -->
      <div v-show="activeTab === 'cronograma'">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="fechaInicioInput" class="form-label">Fecha de inicio <span class="text-danger">*</span></label>
            <input id="fechaInicioInput" type="date" v-model="form.fecha_inicio" :class="['form-control', errors.fecha_inicio ? 'is-invalid' : '']">
            <div v-if="errors.fecha_inicio" class="invalid-feedback">{{ errors.fecha_inicio }}</div>
          </div>
          <div class="col-md-6">
            <label for="horaInicioInput" class="form-label">Hora de inicio <span class="text-danger">*</span></label>
            <input id="horaInicioInput" type="time" v-model="form.hora_inicio" :class="['form-control', errors.hora_inicio ? 'is-invalid' : '']">
            <div v-if="errors.hora_inicio" class="invalid-feedback">{{ errors.hora_inicio }}</div>
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="fechaCierreInput" class="form-label">Fecha de cierre <span class="text-danger">*</span></label>
            <input id="fechaCierreInput" type="date" v-model="form.fecha_cierre" :min="minFechaCierre" :class="['form-control', errors.fecha_cierre ? 'is-invalid' : '']">
            <div v-if="errors.fecha_cierre" class="invalid-feedback">{{ errors.fecha_cierre }}</div>
          </div>
          <div class="col-md-6">
            <label for="horaCierreInput" class="form-label">Hora de cierre <span class="text-danger">*</span></label>
            <input id="horaCierreInput" type="time" v-model="form.hora_cierre" :class="['form-control', errors.hora_cierre ? 'is-invalid' : '']">
            <div v-if="errors.hora_cierre" class="invalid-feedback">{{ errors.hora_cierre }}</div>
          </div>
        </div>

        <div class="alert alert-info">
          <small>
            <strong>Nota:</strong> La fecha y hora de cierre deben ser posteriores a la fecha y hora de inicio.
          </small>
        </div>
      </div>

      <!-- Tab Content: Documentos -->
      <div v-show="activeTab === 'documentos'">
        <div class="mb-3">
          <label for="documentoTitulo" class="form-label">Título del documento <span class="text-danger">*</span></label>
          <input id="documentoTitulo" v-model="newDocument.titulo" :class="['form-control', documentErrors.titulo ? 'is-invalid' : '']" placeholder="Ej. Certificado de experiencia">
          <div v-if="documentErrors.titulo" class="invalid-feedback">{{ documentErrors.titulo }}</div>
        </div>

        <div class="mb-3">
          <label for="documentoDescripcion" class="form-label">Descripción <span class="text-danger">*</span></label>
          <textarea id="documentoDescripcion" v-model="newDocument.descripcion" :class="['form-control', documentErrors.descripcion ? 'is-invalid' : '']" rows="3" placeholder="Describe el documento"></textarea>
          <div v-if="documentErrors.descripcion" class="invalid-feedback">{{ documentErrors.descripcion }}</div>
        </div>

        <div class="mb-3">
          <label for="documentoFileInput" class="form-label">Archivo <span class="text-danger">*</span></label>
          <input id="documentoFileInput" type="file" class="form-control" @change="onDocumentFileChange" :class="{ 'is-invalid': documentErrors.file }">
          <div v-if="documentErrors.file" class="invalid-feedback">{{ documentErrors.file }}</div>
          <div class="form-text">Formatos permitidos: PDF, ZIP.</div>
        </div>

        <div class="d-flex gap-2 mb-4">
          <button class="btn btn-primary" type="button" @click="addDocument">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle me-1" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Agregar documento
          </button>
        </div>

        <div class="border rounded p-3 bg-light" v-if="documents.length > 0">
          <h6 class="mb-3">Documentos agregados</h6>
          <div class="list-group">
            <div v-for="(doc, index) in documents" :key="index" class="list-group-item d-flex justify-content-between align-items-start">
              <div>
                <div class="fw-600">{{ doc.titulo }}</div>
                <div class="text-muted small">{{ doc.descripcion }}</div>
                <div class="text-muted small">
                  Archivo:
                  <a v-if="doc.id" :href="'/api/licitaciones/' + licitacionId + '/documentos/' + doc.id + '/download'" class="text-decoration-none" target="_blank">
                    {{ (doc.archivo || '').split('/').pop() }}
                  </a>
                  <span v-else>{{ doc.file?.name }}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-outline-danger" type="button" @click="removeDocument(index)">
                Quitar
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-muted small">
          Aún no has agregado documentos.
        </div>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-warning border border-dark" :disabled="loading" @click="submit">Editar</button>
        <a href="/licitaciones" class="btn btn-outline-secondary">Cancelar</a>
      </div>

      <!-- Modal simple -->
      <div v-if="showActividadModal" class="modal-backdrop d-flex align-items-center justify-content-center" style="position:fixed;inset:0;z-index:1050;">
        <div class="bg-white rounded shadow p-3" style="width:520px;max-width:95%;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="m-0">Buscar actividad</h6>
            <button class="btn btn-sm btn-outline-secondary" @click="closeActividadModal">Cerrar</button>
          </div>
          <div class="mb-2">
            <input id="actividadSearchInput" v-model="actividadQuery" @input="onActividadSearchInput" class="form-control" placeholder="Buscar por nombre">
          </div>
          <div class="mb-2">
            <div v-if="searchLoading" class="text-muted">Buscando…</div>
            <ul class="list-group">
              <li v-for="act in actividadResults" :key="act.id" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" @click="selectActividad(act)" style="cursor:pointer;">
                <span>{{ act.nombre }}</span>
                <small class="text-muted">ID: {{ act.id }}</small>
              </li>
              <li v-if="!searchLoading && actividadResults.length===0" class="list-group-item text-muted">Sin resultados</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
    </div>`
};
import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

if (document.getElementById('licitaciones-list')) {
    import('./licitaciones').then(({ default: Licitaciones }) => {
        createApp(Licitaciones).mount('#licitaciones-list');
    });
}

// Mount create form if present
if (document.getElementById('licitacion-create')) {
    import('./components/LicitacionCreate').then(({ default: C }) => {
        createApp(C).mount('#licitacion-create');
    });
}

// Mount edit form if present
if (document.getElementById('licitacion-edit')) {
    const el = document.getElementById('licitacion-edit');
    const id = el.dataset.id;
    import('./components/LicitacionEdit').then(({ default: E }) => {
        createApp(E, { id }).mount('#licitacion-edit');
    });
}

if (document.getElementById('licitacion-view')) {
    const el = document.getElementById('licitacion-view');
    const id = el.dataset.id;
    import('./components/LicitacionView').then(({ default: V }) => {
        createApp(V, { id }).mount('#licitacion-view');
    });
}

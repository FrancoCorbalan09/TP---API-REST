const API_BASE_URL = 'https://rickandmortyapi.com/api/character';
const elements = {
    getAllBtn: document.getElementById('getAllBtn'),
    filterBtn: document.getElementById('filterBtn'),
    charactersGrid: document.getElementById('charactersGrid'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage'),
    loading: document.getElementById('loading'),
    resultsCount: document.getElementById('resultsCount'),
    nameFilter: document.getElementById('nameFilter'),
    statusFilter: document.getElementById('statusFilter'),
    speciesFilter: document.getElementById('speciesFilter'),
    typeFilter: document.getElementById('typeFilter'),
    genderFilter: document.getElementById('genderFilter')
};
function showLoading() {
    elements.loading.style.display = 'flex';
    elements.charactersGrid.innerHTML = '';
    elements.errorMessage.style.display = 'none';
    elements.successMessage.style.display = 'none';
    elements.resultsCount.textContent = '';
}
function hideLoading() {
    elements.loading.style.display = 'none';
}
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.successMessage.style.display = 'none';
    hideLoading();
}
function showSuccess(message) {
    elements.successMessage.textContent = message;
    elements.successMessage.style.display = 'block';
    elements.errorMessage.style.display = 'none';
}
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'alive') return 'status-alive';
    if (statusLower === 'dead') return 'status-dead';
    return 'status-unknown';
}
function translateStatus(status) {
    const translations = {
        'alive': 'Vivo',
        'dead': 'Muerto',
        'unknown': 'Desconocido'
    };
    return translations[status.toLowerCase()] || status;
}
function translateGender(gender) {
    const translations = {
        'male': 'Masculino',
        'female': 'Femenino',
        'genderless': 'Sin género',
        'unknown': 'Desconocido'
    };
    return translations[gender.toLowerCase()] || gender;
}
function createCharacterCard(character) {
    return `
        <div class="character-card">
            <img src="${character.image}" alt="${character.name}">
            <div class="character-info">
                <div class="character-name">${character.name}</div>
                <div class="character-detail"><strong>Especie:</strong> ${character.species}</div>
                <div class="character-detail"><strong>Género:</strong> ${translateGender(character.gender)}</div>
                ${character.type ? `<div class="character-detail"><strong>Tipo:</strong> ${character.type}</div>` : ''}
                <div class="character-detail"><strong>Origen:</strong> ${character.origin.name}</div>
                <div class="status-badge-container">
                    <span class="status-badge ${getStatusClass(character.status)}">${translateStatus(character.status)}</span>
                </div>
            </div>
        </div>
    `;
}
function displayCharacters(characters) {
    if (!characters || characters.length === 0) {
        elements.charactersGrid.innerHTML = '<div class="no-results">No se encontraron personajes.</div>';
        elements.resultsCount.textContent = 'No se encontraron resultados';
        return;
    }
    elements.charactersGrid.innerHTML = characters.map(createCharacterCard).join('');
    elements.resultsCount.textContent = `Se encontraron ${characters.length} personaje(s)`;
    showSuccess(`¡Se cargaron ${characters.length} personajes exitosamente!`);
}
async function getAllCharacters() {
    showLoading();
    try {
        let allCharacters = [];
        let page = 1;
        let totalPages = 1;
        const firstResponse = await fetch(`${API_BASE_URL}?page=${page}`);
        if (!firstResponse.ok) {
            throw new Error(`Error HTTP: ${firstResponse.status}`);
        }
        const firstData = await firstResponse.json();
        allCharacters = [...firstData.results];
        totalPages = firstData.info.pages;
        elements.loading.setAttribute('data-text', `Cargando página ${page} de ${totalPages}...`);
        const promises = [];
        for (page = 2; page <= totalPages; page++) {
            promises.push(
                fetch(`${API_BASE_URL}?page=${page}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error HTTP: ${response.status}`);
                        }
                        return response.json();
                    })
            );
        }
        const results = await Promise.all(promises);
        results.forEach(data => {
            allCharacters = [...allCharacters, ...data.results];
        });
        hideLoading();
        displayCharacters(allCharacters);
    } catch (error) {
        showError(`Error al obtener los personajes: ${error.message}`);
        console.error('Error:', error);
    }
}
async function getFilteredCharacters() {
    showLoading();
    const filters = {};
    if (elements.nameFilter.value.trim()) {
        filters.name = elements.nameFilter.value.trim();
    }
    if (elements.statusFilter.value.trim()) {
        filters.status = elements.statusFilter.value.trim();
    }
    if (elements.speciesFilter.value.trim()) {
        filters.species = elements.speciesFilter.value.trim();
    }
    if (elements.typeFilter.value.trim()) {
        filters.type = elements.typeFilter.value.trim();
    }
    if (elements.genderFilter.value.trim()) {
        filters.gender = elements.genderFilter.value.trim();
    }
    if (Object.keys(filters).length === 0) {
        showError('Por favor, ingresa al menos un filtro para realizar la búsqueda.');
        return;
    }
    const queryString = new URLSearchParams(filters).toString();
    try {
        let allCharacters = [];
        let page = 1;
        let hasMorePages = true;
        while (hasMorePages) {
            const url = `${API_BASE_URL}?${queryString}&page=${page}`;
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    if (page === 1) {
                        throw new Error('No se encontraron personajes con los filtros especificados');
                    }
                    break;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            allCharacters = [...allCharacters, ...data.results];
            hasMorePages = data.info.next !== null;
            page++;
        }
        hideLoading();
        displayCharacters(allCharacters);
    } catch (error) {
        showError(`Error al buscar personajes: ${error.message}`);
        console.error('Error:', error);
    }
}
elements.getAllBtn.addEventListener('click', getAllCharacters);
elements.filterBtn.addEventListener('click', getFilteredCharacters);
document.querySelectorAll('.filter-group input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getFilteredCharacters();
        }
    });
});
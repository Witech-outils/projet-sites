document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION ---
    const owner = 'Witech-outils';
    const repo = 'projet-sites';
    const siteUrlBase = `https://${owner}.github.io/${repo}/`;
    const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`; // Cette variable n'est plus utilisée pour récupérer les dates, mais peut l'être pour d'autres usages futurs.
    const mainContainer = document.getElementById('project-list');
    
    // Chemin vers votre fichier de données de projets
    const projectsDataFile = `${siteUrlBase}projects_data.json`; // Assurez-vous que ce chemin est correct

    // --- GESTION DES PARAMÈTRES URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const personName = urlParams.get('name');
    const projectFilter = urlParams.get('projects');

    // --- LOGIQUE PRINCIPALE ---
    if (personName && projectFilter) {
        displayFilteredProjects();
    } else {
        displayAllProjectsBySession();
    }

    // --- FONCTION POUR LA VUE FILTRÉE ---
    async function displayFilteredProjects() {
        const headerTitle = document.querySelector('header h1');
        const headerParagraph = document.querySelector('header p');
        headerTitle.textContent = `Portfolio de ${personName}`;
        headerParagraph.textContent = `Voici une sélection des projets auxquels ${personName} a participé.`;

        mainContainer.innerHTML = '<p class="loading-message">Chargement des projets sélectionnés...</p>';

        try {
            const allProjects = await fetchAllProjects();
            const projectsToShowNames = projectFilter.split(',');
            
            const filteredProjects = allProjects.filter(project => projectsToShowNames.includes(project.name));
            
            const sessions = groupProjectsBySession(filteredProjects);
            
            renderSessions(sessions);

        } catch (error) {
            handleError(error);
        }
    }

    // --- FONCTION POUR LA VUE PAR DÉFAUT ---
    async function displayAllProjectsBySession() {
        mainContainer.innerHTML = '<p class="loading-message">Chargement des projets...</p>';
        try {
            const allProjects = await fetchAllProjects();
            const sessions = groupProjectsBySession(allProjects);
            renderSessions(sessions);
        } catch(error) {
            handleError(error);
        }
    }

    // --- FONCTIONS UTILITAIRES ---

    // Récupère la liste de tous les projets avec leur date de publication (maintenant nommée creationDate) depuis un fichier JSON
    async function fetchAllProjects() {
        try {
            const response = await fetch(projectsDataFile);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const projectsData = await response.json();

            // Transforme les dates string en objets Date
            return projectsData.map(project => ({
                name: project.name,
                creationDate: new Date(project.publicationDate) // Utilise publicationDate du JSON, mais le nomme creationDate ici
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des données des projets:', error);
            throw new Error('Impossible de charger les données des projets. Vérifiez le fichier projects_data.json.');
        }
    }
    
    // Regroupe une liste de projets donnée dans un objet de sessions
    function groupProjectsBySession(projects) {
        const sessions = {};
        projects.forEach(project => {
            // S'assurer que la date est valide
            if (project.creationDate && !isNaN(project.creationDate)) {
                const sessionName = getAcademicSession(project.creationDate);
                if (!sessions[sessionName]) {
                    sessions[sessionName] = [];
                }
                sessions[sessionName].push(project);
            } else {
                console.warn(`Projet ${project.name} a une date de création invalide et sera ignoré pour le regroupement par session.`);
            }
        });
        return sessions;
    }

    // Affiche les projets à partir d'un objet de sessions
    function renderSessions(sessions) {
        mainContainer.innerHTML = '';
        const sortedSessionNames = Object.keys(sessions).sort((a, b) => {
            const yearA = parseInt(a.split('-')[0]);
            const yearB = parseInt(b.split('-')[0]);
            return yearB - yearA;
        });

        if (sortedSessionNames.length === 0) {
             mainContainer.innerHTML = "<p class='loading-message'>Aucun projet à afficher.</p>";
             return;
        }

        sortedSessionNames.forEach(sessionName => {
            const sessionSection = document.createElement('section');
            sessionSection.className = 'session-section';
            const sessionTitle = document.createElement('h2');
            sessionTitle.className = 'session-title';
            sessionTitle.textContent = `Session ${sessionName}`;
            const projectGrid = document.createElement('div');
            projectGrid.className = 'project-grid';

            sessionSection.appendChild(sessionTitle);
            sessionSection.appendChild(projectGrid);
            mainContainer.appendChild(sessionSection);

            const projectsInSession = sessions[sessionName].sort((a,b) => a.name.localeCompare(b.name));
            projectsInSession.forEach(project => {
                const card = createProjectCard(project);
                projectGrid.appendChild(card);
            });
        });
    }

    // Crée le HTML pour une carte de projet
    function createProjectCard(project) {
        const projectUrl = `${siteUrlBase}${project.name}/`;
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h2>${project.name.replace(/-/g, ' ')}</h2>
            <div class="project-description">
                <p>Projet créé le ${project.creationDate ? project.creationDate.toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
            </div>
            <a href="${projectUrl}" class="project-link" target="_blank">
                Visiter le site
            </a>
        `;
        return card;
    }

    // Calcule l'année scolaire à partir d'une date
    function getAcademicSession(date) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0 = Janvier, 8 = Septembre
        return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }

    // Gère les erreurs d'affichage
    function handleError(error) {
        console.error('Erreur lors de la construction de la page:', error);
        mainContainer.innerHTML = `<p class="loading-message">Impossible de charger les projets. ${error.message || 'Une erreur inconnue est survenue.'}</p>`;
    }
});

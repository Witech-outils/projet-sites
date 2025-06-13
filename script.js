document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION ---
    const owner = 'Witech-outils';
    const repo = 'projet-sites';
    const siteUrlBase = `https://${owner}.github.io/${repo}/`;
    const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const mainContainer = document.getElementById('project-list');

    // --- GESTION DES PARAMÈTRES URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const personName = urlParams.get('name');
    const projectFilter = urlParams.get('projects');

    // --- LOGIQUE PRINCIPALE ---
    // Si des paramètres sont présents, on active le mode filtré.
    if (personName && projectFilter) {
        displayFilteredProjects();
    } else {
        // Sinon, on affiche la vue par défaut.
        displayAllProjectsBySession();
    }

    // --- FONCTION POUR LA VUE FILTRÉE ---
    async function displayFilteredProjects() {
        // Personnalise le titre de la page
        const headerTitle = document.querySelector('header h1');
        const headerParagraph = document.querySelector('header p');
        headerTitle.textContent = `Portfolio de ${personName}`;
        headerParagraph.textContent = `Voici une sélection des projets auxquels ${personName} a participé.`;

        mainContainer.innerHTML = '<p class="loading-message">Chargement des projets sélectionnés...</p>';

        try {
            const allProjects = await fetchAllProjects();
            const projectsToShowNames = projectFilter.split(',');
            
            // On ne garde que les projets dont le nom est dans notre liste de l'URL
            const filteredProjects = allProjects.filter(project => projectsToShowNames.includes(project.name));
            
            // MODIFICATION : On regroupe les projets filtrés par session, comme pour la vue normale
            const sessions = groupProjectsBySession(filteredProjects);
            
            // On utilise la même fonction d'affichage que la vue normale
            renderSessions(sessions);

        } catch (error) {
            handleError(error);
        }
    }

    // --- FONCTION POUR LA VUE PAR DÉFAUT ---
    async function displayAllProjectsBySession() {
        mainContainer.innerHTML = '<p class="loading-message">Analyse de l\'historique des projets depuis GitHub...</p>';
        try {
            const allProjects = await fetchAllProjects();
            const sessions = groupProjectsBySession(allProjects);
            renderSessions(sessions);
        } catch(error) {
            handleError(error);
        }
    }

    // --- FONCTIONS UTILITAIRES ---

    // Récupère la liste de tous les projets avec leur date de création
    async function fetchAllProjects() {
        const contentsResponse = await fetch(`${apiBaseUrl}/contents`);
        const contents = await contentsResponse.json();
        const rootFoldersToIgnore = ['.git', 'qrcodes'];

        const projectFolders = contents.filter(item => 
            item.type === 'dir' && !rootFoldersToIgnore.includes(item.name)
        );

        const projectsWithDatesPromises = projectFolders.map(async (folder) => {
            const commitsResponse = await fetch(`${apiBaseUrl}/commits?path=${folder.path}`);
            const commits = await commitsResponse.json();
            const firstCommit = commits[commits.length - 1];
            const creationDate = new Date(firstCommit.commit.author.date);
            return { name: folder.name, creationDate: creationDate };
        });

        return Promise.all(projectsWithDatesPromises);
    }
    
    // NOUVEAU : Regroupe une liste de projets donnée dans un objet de sessions
    function groupProjectsBySession(projects) {
        const sessions = {};
        projects.forEach(project => {
            const sessionName = getAcademicSession(project.creationDate);
            if (!sessions[sessionName]) {
                sessions[sessionName] = [];
            }
            sessions[sessionName].push(project);
        });
        return sessions;
    }

    // NOUVEAU : Affiche les projets à partir d'un objet de sessions
    function renderSessions(sessions) {
        mainContainer.innerHTML = '';
        const sortedSessionNames = Object.keys(sessions).sort().reverse();

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
                <p>Projet créé le ${project.creationDate.toLocaleDateString('fr-FR')}</p>
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
        mainContainer.innerHTML = '<p class="loading-message">Impossible de charger les projets. L\'API de GitHub a peut-être atteint sa limite. Réessayez dans quelques minutes.</p>';
    }
});

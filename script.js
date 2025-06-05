document.addEventListener('DOMContentLoaded', async () => {
    const owner = 'Witech-outils';
    const repo = 'projet-sites';
    const siteUrlBase = `https://${owner}.github.io/${repo}/`;
    const apiBaseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const mainContainer = document.getElementById('project-list');
    mainContainer.innerHTML = '<p class="loading-message">Analyse de l\'historique des projets depuis GitHub...</p>';

    const rootFoldersToIgnore = ['.git'];

    function getAcademicSession(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }

    try {
        const contentsResponse = await fetch(`${apiBaseUrl}/contents`);
        const contents = await contentsResponse.json();

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

        const projectsWithDates = await Promise.all(projectsWithDatesPromises);

        const sessions = {};
        projectsWithDates.forEach(project => {
            const sessionName = getAcademicSession(project.creationDate);
            if (!sessions[sessionName]) {
                sessions[sessionName] = [];
            }
            sessions[sessionName].push(project);
        });
        
        mainContainer.innerHTML = '';
        const sortedSessionNames = Object.keys(sessions).sort().reverse();

        if (sortedSessionNames.length === 0) {
             mainContainer.innerHTML = "<p class='loading-message'>Aucun projet trouvé.</p>";
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
                projectGrid.appendChild(card);
            });
        });
    } catch (error) {
        console.error('Erreur:', error);
        mainContainer.innerHTML = '<p class="loading-message">Impossible de charger les projets. L\'API de GitHub a peut-être atteint sa limite.</p>';
    }
});

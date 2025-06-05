document.addEventListener('DOMContentLoaded', async () => {
    const owner = 'Witech-outils';
    const repo = 'projet-sites';
    const siteUrlBase = `https://<span class="math-inline">\{owner\}\.github\.io/</span>{repo}/`;
    const apiBaseUrl = `https://api.github.com/repos/<span class="math-inline">\{owner\}/</span>{repo}/contents/`;

    const mainContainer = document.getElementById('project-list');
    mainContainer.innerHTML = '<p class="loading-message">Chargement des sessions depuis GitHub...</p>';

    const rootFoldersToIgnore = ['qrcodes', '.git'];

    try {
        const rootResponse = await fetch(apiBaseUrl);
        const rootItems = await rootResponse.json();

        let sessionFolders = rootItems.filter(item => 
            item.type === 'dir' && !rootFoldersToIgnore.includes(item.name)
        );
        
        sessionFolders.sort((a, b) => b.name.localeCompare(a.name));

        if (sessionFolders.length === 0) {
            mainContainer.innerHTML = '<p class="loading-message">Aucune session de projets trouvée.</p>';
            return;
        }

        mainContainer.innerHTML = ''; 

        for (const session of sessionFolders) {
            const sessionName = session.name;

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

            const projectsResponse = await fetch(apiBaseUrl + sessionName);
            const projectItems = await projectsResponse.json();

            const projects = projectItems.filter(item => item.type === 'dir');
            projects.sort((a, b) => a.name.localeCompare(b.name));

            if (projects.length === 0) {
                projectGrid.innerHTML = '<p>Aucun projet dans cette session.</p>';
            } else {
                projects.forEach(project => {
                    const projectName = project.name;
                    const projectUrl = `<span class="math-inline">\{siteUrlBase\}</span>{sessionName}/${projectName}/`;
                    
                    const

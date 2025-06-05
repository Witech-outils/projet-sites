document.addEventListener('DOMContentLoaded', () => {
    const owner = 'Witech-outils';
    const repo = 'projet-sites';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/`;
    const siteUrlBase = `https://${owner}.github.io/${repo}/`;

    const projectListContainer = document.getElementById('project-list');
    const loadingMessage = document.querySelector('.loading-message');

    // Dossiers à ignorer
    const foldersToIgnore = ['qrcodes', '.git'];

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau ou le dépôt est introuvable.');
            }
            return response.json();
        })
        .then(data => {
            // Filtre pour ne garder que les dossiers qui ne sont pas dans la liste d'ignorés
            const projectFolders = data.filter(item => 
                item.type === 'dir' && !foldersToIgnore.includes(item.name)
            );

            if (projectFolders.length === 0) {
                 loadingMessage.textContent = "Aucun projet trouvé. Ajoutez un dossier de projet et un QR code correspondant.";
                 return;
            }
            
            // On vide le message de chargement
            projectListContainer.innerHTML = ''; 

            // On trie les projets par ordre alphabétique
            projectFolders.sort((a, b) => a.name.localeCompare(b.name));
            
            projectFolders.forEach(folder => {
                const projectName = folder.name;
                const projectUrl = `${siteUrlBase}${projectName}/`;
                const qrCodeUrl = `qrcodes/qrcode-${projectName}.png`;

                // Création de la carte du projet
                const card = document.createElement('div');
                card.className = 'project-card';

                card.innerHTML = `
                    <h2>${projectName.replace(/-/g, ' ')}</h2>
                    <div class="qr-code">
                        <a href="${projectUrl}" target="_blank">
                            <img src="${qrCodeUrl}" alt="QR Code pour ${projectName}">
                        </a>
                    </div>
                    <a href="${projectUrl}" class="project-link" target="_blank">
                        Visiter le site
                    </a>
                `;
                
                projectListContainer.appendChild(card);
            });

        })
        .catch(error => {
            console.error('Erreur lors de la récupération des projets:', error);
            loadingMessage.textContent = "Impossible de charger les projets. Vérifiez la console pour plus de détails.";
        });
});

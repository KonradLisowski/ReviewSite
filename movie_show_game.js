
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        window.location.href = "index.html";
        return;
    }
    window.currentUser = JSON.parse(storedUser);

    // Auto display on page load
    if (document.getElementById('movieList')) displayMovies();
    if (document.getElementById('tvShowList')) displayTvShows();
    if (document.getElementById('videoGameList')) displayVideoGames();
});

// Search function for movie,show and games pages
window.searchItems = async function(type) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let listElement, collectionName, displayFn;
    if (type === 'movies') {
        listElement = document.getElementById('movieList');
        collectionName = 'movies';
        displayFn = window.displayMovieItem;
    } else if (type === 'tvShows') {
        listElement = document.getElementById('tvShowList');
        collectionName = 'tvShows';
        displayFn = window.displayTvShowItem;
    } else {
        listElement = document.getElementById('videoGameList');
        collectionName = 'videoGames';
        displayFn = window.displayVideoGameItem;
    }
    if (!listElement) return;
    listElement.innerHTML = "";
    const querySnapshot = await window.firestoreExports.getDocs(window.firestoreExports.collection(window.db, collectionName));
    querySnapshot.forEach(docSnap => {
        const item = docSnap.data();
        if (item.title && item.title.toLowerCase().includes(searchTerm)) {
            displayFn(docSnap.id, item, listElement);
        }
    });
};
// Function to clear the search input and reload the full list of entries
window.clearSearch = function(type) {
    document.getElementById('searchInput').value = "";
    if (type === 'movies') displayMovies();
    else if (type === 'tvShows') displayTvShows();
    else displayVideoGames();
};
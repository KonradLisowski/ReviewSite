// load current user information to check if they are the admin
const storedUser = localStorage.getItem("currentUser");
if (storedUser) {
    window.currentUser = JSON.parse(storedUser);
}
// Search for movies, Shows, Games by title
window.adminSearchItems = async function() {
    const searchTerm = document.getElementById('adminSearchInput').value.toLowerCase();
    const movieList = document.getElementById('movieList');
    const tvShowList = document.getElementById('tvShowList');
    const videoGameList = document.getElementById('videoGameList');
    movieList.innerHTML = "";
    tvShowList.innerHTML = "";
    videoGameList.innerHTML = "";
  
    // Movies
    const movieSnapshot = await window.firestoreExports.getDocs(window.firestoreExports.collection(window.db, "movies"));
    movieSnapshot.forEach(docSnap => {
      const movie = docSnap.data();
      if (movie.title && movie.title.toLowerCase().includes(searchTerm)) {
        window.displayMovieItem(docSnap.id, movie, movieList);
      }
    });
  
    // Shows
    const showSnapshot = await window.firestoreExports.getDocs(window.firestoreExports.collection(window.db, "tvShows"));
    showSnapshot.forEach(docSnap => {
      const show = docSnap.data();
      if (show.title && show.title.toLowerCase().includes(searchTerm)) {
        window.displayTvShowItem(docSnap.id, show, tvShowList);
      }
    });
  
    // Games
    const gameSnapshot = await window.firestoreExports.getDocs(window.firestoreExports.collection(window.db, "videoGames"));
    gameSnapshot.forEach(docSnap => {
      const game = docSnap.data();
      if (game.title && game.title.toLowerCase().includes(searchTerm)) {
        window.displayVideoGameItem(docSnap.id, game, videoGameList);
      }
    });
  };

  // Clear the search input and reload all entries
  window.clearAdminSearch = function() {
    document.getElementById('adminSearchInput').value = "";
    if (window.displayMovies) window.displayMovies();
    if (window.displayTvShows) window.displayTvShows();
    if (window.displayVideoGames) window.displayVideoGames();
  };
// On page load, display all Movies, Shows, and Games
document.addEventListener('DOMContentLoaded', () => {
    if (window.displayMovies) window.displayMovies();
    if (window.displayTvShows) window.displayTvShows();
    if (window.displayVideoGames) window.displayVideoGames();
});
